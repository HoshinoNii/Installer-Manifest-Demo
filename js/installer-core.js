// Accept Headers
const ACCEPT_HTML = "text/html,charset=UTF-8,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9";
const ACCEPT_IMAGE = "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8";
const ACCEPT_CSS = "text/css,*/*;q=0.1"
const ACCEPT_JAVASCRIPT = "text/javascript,*/*;q=0.1"
const ACCEPT_DEFAULT = "*/*"



// register onMessage for service worker
if (navigator && navigator.serviceWorker) {
	//reload if page does not register service worker
	navigator.serviceWorker.onmessage = async (event) => {
		console.log("Main Thread onmessage ", event.data.type, " clientId ", event.data.clientId, " event ", event);

		if (event.data.type === "serviceworker_onunregistered") {
			window.location.reload();
		}
	}
}

const version = "V5.0";
const cacheVersionRegExp = /\/(?<version>ver_[^\/]+)\//i;
const directoryNameRegExp = /\/(?<directory>.*)\//i;

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

async function fetchResoure(url, init) {
	try {
		if (!init.integrity) {
			throw {
				message: "Missing Integrity hash: " + init.integrity
			}
		}
		console.log('URL: ', decodeURI(url))
		var thisRequest = new Request(url, init);
		thisRequest.url = decodeURI(url);
		const networkResponse = await fetch(thisRequest).catch(err => {
			throw err
		})
		if (networkResponse.ok) {
			var cacheName = getCacheNameFromURL(thisRequest.url)
			let cache = await caches.open(cacheName);
			await cache.put(thisRequest, networkResponse.clone());

			return networkResponse;
		} else {
			let err = {
				type: error_handler.ErrorType.FAILED_TO_FETCH,
				severity: error_handler.ErrorSeverity.High,
				message: 'response status ' + networkResponse.status + " error " + networkResponse.statusText + " url: " + networkResponse.url,
				status: networkResponse
			}
			console.log('err network', err)
			throw err
		}
	} catch (error) {
		let errorRes = {
            type: error_handler.ErrorType.FAILED_TO_FETCH,
            severity: error_handler.ErrorSeverity.High,
            message: error.message,
        }
        let err = await error_handler.createResponse2(errorRes, url, init)
        error_handler.catchBrokenResource(err)
        throw err;
	}
}