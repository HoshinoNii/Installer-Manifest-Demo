// On install, cache some stuff
addEventListener('install', function (event) {

	console.log('service worker demo service worker thread oninstall')

	event.waitUntil(caches.open('core').then(function (cache) {
		cache.add(new Request('offline.html'));
		return;
	}));
});

self.addEventListener('message', (event) => {
	if(event.data === 'SKIP_WAITING')
		self.skipWaiting()
})


addEventListener('fetch', (e) => {
	console.log('V3 Service Worker Demo Service Worker Thread onfetch Method', 
	e.request.method, e.request.url, ' event ', e, 
	' headers ', new Map(e.request.clone().headers)
	, ' time ', performance.now()
	)

	// grab the request
	let request = e.request
	console.log('res', request, e.request.cache)

	if(e.request.cache === 'only-if-cached' && e.request.mode !== 'same-origin') return

	//Process the files and upload them to cache
	if(request.method === 'INSTALL') {
		let installReq = new Request(request.url)
		e.respondWith(
			fetch(installReq).then( async (res) => {
				//save response to cache
				if(res.type !== 'opaque') {
					let copy = res.clone()
					let cacheName = 'pages'
					let contentType = copy.headers.get('Content-Type')
					console.log(' contenttype', contentType)
					if(contentType.includes('image'))
						cacheName = 'images'
					switch(contentType) {
						case contentType.includes('image'):
							cacheName = 'images'
							break;
						case contentType.includes('font'):
							cacheName = 'fonts'
							break;
						case contentType.includes('stylesheet'):
							cacheName = 'stylesheets'
							break;
					}	
					e.waitUntil(caches.open(cacheName).then( (cache) => {
						if(cacheName = 'images') {
							console.log('Service Worker Demo Service Worker Thread onFetch',
							e.request.url, ' INSTALL save to images ', copy.clone().arrayBuffer(), ' time '	, performance.now())
						} else {
							console.log('Service Worker Demo Service Worker Thread onFetch',
							e.request.url, ' INSTALL save to pages ', copy.clone().arrayBuffer(), ' time '	, performance.now())
						}

						return cache.put(installReq, copy)
					}))
				}

				return res
			}).catch( (err) => { console.log(err) })
		)
		
		// return if responded
		return
	}

	//HTML FILES
	//OFFLINE FIRST
	if (request.headers.get('Accept').includes('text/html')) {
		e.respondWith(
			caches.match(request).then((res) => {
				if(res !== undefined) {
					console.log('Service Worker Demo Service Worker Thread onFetch',
							e.request.url, ' read from pages ', res.clone().arrayBuffer(), ' time '	, performance.now())
				} else {
					console.log('Service Worker Demo Service Worker Thread onFetch',
							e.request.url, ' read from network ')
				}

				return res || fetch(request).then((res) => {
					// stash a copy of this image in the images cache
					let copy = res.clone()
					e.waitUntil(caches.open('pages').then((cache) => {
						console.log('Service Worker Demo Service Worker Thread onFetch',
							e.request.url, ' save to pages ', copy.clone().arrayBuffer(), ' time '	, performance.now())
						return cache.put(request, copy)
					}))

					return res
				})
			})
		)

		// just return if already responded
		return
	}
})