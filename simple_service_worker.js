const version = "V6.2";
const cacheVersionRegExp  = /\/(?<version>ver_[^\/]+)\//i;
const directoryNameRegExp = /\/(?<directory>.*)\//i;
const NAVIGATION_ERROR_URL = "navigation_error.html";

self.oninstall = async (event) => {
  //event.target.registration is same object as registration, tested by Object.is
  console.log(version, "Service Worker Thread oninstall ", registration.scope,  event, " registration ", registration);

  const allClients = await clients.matchAll({ includeUncontrolled: true });

  for (const client of allClients) {
    client.postMessage({type: "serviceworker_oninstall", scope: registration.scope, clientId: client.id});
  }
}

self.onactivate = async (event) => {
  //event.target.registration is same object as registration, tested by Object.is
  console.log(version, "Service Worker Thread onactivate ", registration.scope, event, " registration ", registration);

  const origin = self.location.origin;

  const allClients = await clients.matchAll({ includeUncontrolled: true });
  const clientsControlled = await clients.matchAll({ includeUncontrolled: false });

  const clientsControlledLen = clientsControlled.length;

  let allClientsLen = 0;
  if (registration.scope === origin + "/") {
    console.log(version, "Service Worker Thread onactivate root scope");

    allClientsLen = allClients.length;
  } else {
    console.log(version, "Service Worker Thread onactivate scope ", registration.scope);

    for (const client of allClients) {
      if (client.url.startsWith(registration.scope)) {
        allClientsLen++; 
      }
    }
  }

  for (const client of allClients) {
    client.postMessage({type: "serviceworker_onactivate", scope: registration.scope, totalClients: allClientsLen, controlledClients: clientsControlledLen, clientId: client.id});
  }
}

self.onmessage = async (event) => {
  console.log(version, "Service Worker Thread onmessage ", registration.scope, event.data.type, event);

  if (event.data.type === 'skip_waiting') {
    if (event.data.scope === registration.scope) {
      await skipWaiting();
    } else {
      console.log(version, "Service Worker Thread onmessage skip_waiting with wrong scope ", event.data.scope);
    }
  } else if (event.data.type === 'clients_claim') {
    if (event.data.scope === registration.scope) {
      await clients.claim();
    } else {
      console.log(version, "Service Worker Thread onmessage clients_claim with wrong scope ", event.data.scope);
    }
  } else if (event.data.type === 'hello_client') {
    if (event.source instanceof WindowClient) {
      event.source.postMessage({type: "serviceworker_onclienthello", clientId: event.source.id});
    }
  } else if (event.data.type === 'list_clients') {
    if (event.source instanceof WindowClient) {
      const allClients = await clients.matchAll({ includeUncontrolled: true });

      let clientsList = [];
      for (const client of allClients) {
        clientsList.push({url: client.url, id: client.id, type: client.type});
      }

      event.source.postMessage({type: "serviceworker_onclientslist", clients: clientsList, clientId: event.source.id});
    }
  } else if (event.data.type === 'show_clients') {
    const allClients = await clients.matchAll({ includeUncontrolled: true });
    console.log(version, "clients ", allClients);
  } else if (event.data.type === 'notify_unregsiter') {
    const allClients = await clients.matchAll({ includeUncontrolled: false });

    for (const client of allClients) {
      client.postMessage({type: "serviceworker_onunregistered", clientId: client.id});
    }
  } else if (event.data.type === 'broadcast_message') {
    let broadcastScope = event.data.scope;

    if (broadcastScope == null) {
      broadcastScope = origin + "/";
    }

    let senderId = "";
    if (event.source instanceof WindowClient) {
      senderId = event.source.id;
    }

    const allClients = await clients.matchAll({ includeUncontrolled: true });

    if (event.data.hasOwnProperty('payload')) {
      for (const client of allClients) {
        if (client.id !== senderId) {
          if (client.url.startsWith(broadcastScope)) {
            client.postMessage({type: "serviceworker_onbroadcastmessage", from: senderId, payload: event.data.payload, clientId: client.id});
          }
        }
      }
    } else {
      if (senderId.length > 0) {
        event.source.postMessage({type: "serviceworker_onbroadcastmessage_error", reason: "no payload is provided", clientId: senderId});
      }
    }
  } else if (event.data.type === 'post_message') {
    let senderId = "";
    if (event.source instanceof WindowClient) {
      senderId = event.source.id;
    }

    let receiverId = "";
    if (event.data.hasOwnProperty('to')) {
      receiverId = event.data.to;
    }

    // invalid to
    if (receiverId.length == 0) {
      event.source.postMessage({type: "serviceworker_onpostmessage_error", reason: "to address is not provided", clientId: senderId});
      return -1;
    }

    const targetClient = await clients.get(receiverId);

    if (targetClient) {
      if (event.data.hasOwnProperty('payload')) {
        if (targetClient.id !== senderId) {
          targetClient.postMessage({type: "serviceworker_onpostmessage", from: senderId, payload: event.data.payload, clientId: targetClient.id});
        } else {
          event.source.postMessage({type: "serviceworker_onpostmessage_error", reason: "can not post message to itself", clientId: event.source.id});
        }
      } else {
        if (senderId.length > 0) {
          event.source.postMessage({type: "serviceworker_onpostmessage_error", reason: "no payload is provided", clientId: senderId});
        }
      }
    } else {
      if (senderId.length > 0) {
        event.source.postMessage({type: "serviceworker_onpostmessage_error", reason: "to client is not found", clientId: senderId});
      }
    }
  }
}

function getCacheNameFromURL(url) {
  if (url) {
    var cacheName = null;
    let versionFound = url.match(cacheVersionRegExp);

    if (versionFound) {
      cacheName = versionFound.groups.version;
      console.log(version, "Service Worker Thread getCacheNameFromURL version found : ", versionFound);
      console.log(version, "Service Worker Thread getCacheNameFromURL version found cache name : ", cacheName);
      return cacheName;
    } else {
      const resourceURL = new URL(url);
      const pathName = resourceURL.pathname;
      const directoryName = pathName.match(directoryNameRegExp);

      if (directoryName) {
        cacheName = directoryName.groups.directory.replaceAll('/', '_');
        console.log(version, "Service Worker Thread getCacheNameFromURL url path : ", pathName, " cache name : ", cacheName);
        return cacheName;
      } else {
        cacheName = "RzAppEngine";
        console.log(version, "Service Worker Thread getCacheNameFromURL url path : ", pathName, " cache name : ", cacheName);
        return cacheName;
      }
    }
  }

  return "RzAppEngine";
}

self.onfetch = (event) => {
  console.log(version, "Service Worker Thread onfetch method ", event.request.method, event.request.url, " event ", event, " headers ", new Map(event.request.clone().headers), " time ", performance.now());

  // Get the request
  var request = event.request;

  // X-Custom-Header
  const hasX_Custom_Header = event.request.headers.has("X-Custom-Header");
  if (hasX_Custom_Header) {
    const customValue = event.request.headers.get("X-Custom-Header");

    console.log(version, "Service Worker Thread onfetch has X-Custom-Header: ", customValue);

    if (customValue === "bypass-cache") {
      // just return to bypass service worker
      console.log(version, "Service Worker Thread onfetch X-Custom-Header: bypass-cache returned");
      return;
    }
  }

  // cache name resolver
  const cacheName = getCacheNameFromURL(request.url);

  event.respondWith((async () => {
    try {
      const hascache = await caches.has(cacheName);

      // fetch from cache
      if (hascache) {
        const cache = await caches.open(cacheName);

        const options = { ignoreSearch: true, ignoreMethod: true, ignoreVary: true };
        const cachedResponse = await cache.match(request, options);

        if (cachedResponse !== undefined) {
          return cachedResponse;
        }
      }

      // broadcast repair message
      if (hascache) {
        let fromClientId = event.clientId;

        if (event.resultingClientId) {
          fromClientId = event.resultingClientId;
        }

        const allClients = await clients.matchAll({ includeUncontrolled: true });
        for (const client of allClients) {
          client.postMessage({type: "serviceworker_onresourcerepair", from: fromClientId, payload: {url: request.url, integrity: request.integrity, cache: cacheName}, clientId: client.id});
        }
      }

      // fetch from network
      if (event.request.mode === "navigate") {
        // main page
        const networkResponse = await fetch(event.request);

        if (networkResponse.ok) {
          return networkResponse;
        } else {
          throw new Error('response status ' + networkResponse.status + " error " + networkResponse.statusText);
        }
      } else {
        // sub resource
        return fetch(request);
      }
    } catch (error) {
      console.log(version, "Service Worker Thread onfetch exception: ", error);

      if (event.request.mode === "navigate") {
        const hasRootcache = await caches.has("RzAppEngine");

        if (hasRootcache) {
          const rootCache = await caches.open("RzAppEngine");
          const cachedResponse = await rootCache.match(NAVIGATION_ERROR_URL);

          if (cachedResponse !== undefined) {
            return cachedResponse;
          }
        }

        // last try
        console.log(version, "Service Worker Thread onfetch last try");
        return fetch(event.request);
      }

      var init = { "status" : 503 , "statusText" : error };
      var errorResponse = new Response(null,init);
      return errorResponse;
    }
  })());
}
