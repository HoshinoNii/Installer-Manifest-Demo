1.0
unregister supports multiple registrations.

window.close will work if opened by window.open()

window.close will not work if opened from address bar

2.0
update service worker with different scope

supports broadcast message and post message

activate page, but got "DOMException: Not allowed to focus a window"
need to click notification, then can call focus()

3.0
Add list_clients
  allow user to get full list of clients, includes {url, id, type}

Add custom header to bypass service worker without change fetch request
  X-Custom-Header: bypass-cache
  installer.html is revised

4.0
(a). get cache name from url

(b). if not find in cache, then broadcast repair message and fall back to network


option 1 : wait fetch promise to be settled, send 503 if rejected
NOTE: await before fetch(request)

      // fetch from network
      return await fetch(request);
    } catch (error) {
      console.log(version, "Service Worker Thread onfetch exception: ", error);

      var init = { "status" : 503 , "statusText" : error };
      var errorResponse = new Response(null,init);
      return errorResponse;
    }
  })());

option 2 : return fetch promise to event.respondWith even if not settled
NOTE: nothing before fetch(request)

      // fetch from network
      return fetch(request);
    } catch (error) {
      console.log(version, "Service Worker Thread onfetch exception: ", error);

      var init = { "status" : 503 , "statusText" : error };
      var errorResponse = new Response(null,init);
      return errorResponse;
    }
  })());

The FetchEvent for "http://localhost/show_ugly.html" resulted in a network error response: the promise was rejected

above error will be thrown when shutdown server

both options are working well.

NOTE: do NOT set break point in service worker onfetch, otherwise
Microsoft Edge stops functioning
  1. can NOT load new page from service_worker_unregister.html
    nothing happened when window.open any page

  2. can NOT call window.updateServiceWorker() from service_worker_update.html
    window undefined

solution: do NOT set break point on service worker onfetch if it will throw exception

(c). tested URL with query string, for example containerId=1
   works with following options (ignoreSearch: true)
     const options = { ignoreSearch: true, ignoreMethod: true, ignoreVary: true };

   failed with  (ignoreSearch: false)

5.0
(a). move installation to onactive in index.html
   abort skip waiting did not happen so far

(b). added serviceworker_onunregistered handler for installer.html
   can unregister service worker even if installer.html is shown

(c). added navigation_error support for navigation page
   support navigation error page if exception occurs

(d). added retryUpdate for service_worker_update.html
   retry update after exception, cap at 2 minutes interval

(e). rename sw.js to simple_service_worker.js

6.0 clean up
