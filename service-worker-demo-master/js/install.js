
//accept headers
const ACCEPT_HTML = "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3"
const ACCEPT_IMAGE = "image/webp, image/apng, image/svg+xml, image/*,*/*;q=0.8"
const ACCEPT_CSS = "text/css,*/*;q=0.1"

// Note: this can be used as the installer's manifest may need to resolve CORS if planning to install online 
// the urls var will probably be dynamic in a more advanced implementation for react case
let urls = [
    { 
        url: 'img/nanashi.jpg', 
        init: { method: 'INSTALL', cache: 'no-store', mode: 'same-origin', headers: {'accept': ACCEPT_IMAGE} },
    },
    { 
        url: 'img/hutao.jpg', 
        init: { method: 'INSTALL', cache: 'no-store', mode: 'same-origin', headers: {'accept': ACCEPT_IMAGE} },
    },
    { 
        url: 'img/lamy.png', 
        init: { method: 'INSTALL', cache: 'no-store', mode: 'same-origin', headers: {'accept': ACCEPT_IMAGE} },
    },
    {
        url: 'img/kanata.jpg',
        init: { method: 'INSTALL', cache: 'no-store', mode: 'same-origin', headers: {'accept': ACCEPT_IMAGE} },
    },
    {   
        url: 'abcdadasd.html', 
        init: { method: 'INSTALL', cache: 'no-store', mode: 'same-origin', headers: {'accept': ACCEPT_HTML} },
    },
    {
        url: 'sri-test.html', 
        init: { method: 'INSTALL', cache: 'no-store', mode: 'same-origin', headers: {'accept': ACCEPT_HTML} },
    }
]

//call install func from service worker
async function fetchRes(url, init) {
    try {
        let req = new Request(url, init)
        const networkRes = await fetch(req)

        // do something if status is 404 NotFound
        if(networkRes.status === 404) console.log('FILE NOT FOUND', networkRes.url)
        
        return networkRes
    } catch (error) {
        throw console.error(error)
    }
}

function install () {
    try {
        //process through the urls
        urls.forEach((value, index, array) => {
            console.log('installer input', value, ' index ', index, ' array ', array)
            let res = fetchRes(value.url, value.init)
            console.log('installer response:', res)
        })

        console.log('success!')
    } catch (error) { 
        console.error(error)
    }  
}
