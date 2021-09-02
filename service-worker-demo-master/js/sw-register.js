function invokeServiceWorkerUpdateFlow(registration) {
    
    //New Service Worker Version Available. Refresh Now?
    const update = new Notification('New Service Worker Version Available. Refresh Now?');
    update.addEventListener('click', () => {
        if(registration.waiting) {
            registration.waiting.postMessage('SKIP_WAITING')
        }
    })
}

// Initialize the service worker
if (navigator && navigator.serviceWorker) {
    Notification.requestPermission();
	navigator.serviceWorker.register('sw.js');

    window.addEventListener('load', async () => {
        //register the service worker
        const registration = await navigator.serviceWorker.register('sw.js');

        if(registration.waiting) {
            invokeServiceWorkerUpdateFlow(registration)
        }

        registration.addEventListener('updatefound', () => {
            if(registration.installing) {
                registration.installing.addEventListener('statechange', () => {
                    if(registration.waiting)
                        invokeServiceWorkerUpdateFlow(registration)
                    else
                        console.log('Service Worker Initial Initilization')
                })
            }
        })
    })

    let refreshing = false

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            window.location.reload()
            refreshing = true
        }
    })
}