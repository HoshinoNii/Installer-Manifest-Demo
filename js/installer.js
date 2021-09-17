const AllowLogging = true //Change this to true if u want the helper classes to output console logs 

let Algorithm = new SHAHash(AllowLogging)
let JWSlib = new JWSsignatureLib("ES256", AllowLogging)
let error_handler = new ErrorHandler()

let generatedManifest

//dummy urls for testing purposes
var urls = [
    {url: "show_ugly.html",          init: {method: 'GET', cache: "no-store", mode: "same-origin", headers: {'Accept': ACCEPT_HTML, "X-Custom-Header": 'bypass-cache'}, integrity: 'sha384-MQQUmF2BGT2RtYoK9JtToOF9OhVMmaimRf6dm38iIZkd1oAbZTrw59oLp0ICdJMG'}},
    {url: "profile.jpg",             init: {method: 'GET', cache: "no-store", mode: "same-origin", headers: {'Accept': ACCEPT_IMAGE,"X-Custom-Header": 'bypass-cache'}, integrity: 'sha384-H5IUwW9WX4khl1l53fMukWw4OKN428pFSYW+jjyCYdLFNk3N7wQEx2UQ95MmtLNK'}},
    {url: "navigation_error.html",   init: {method: 'GET', cache: "no-store", mode: "same-origin", headers: {'Accept': ACCEPT_HTML, "X-Custom-Header": 'bypass-cache'}, integrity: 'sha384-iib1BYKutSbiqvbyMRk9xs4W2jhq1LfpWIdTn5o652ZL5dvEJc9yFZeTjyiCpOT7'}},
    {url: "mogumogu.mp4",            init: {method: 'GET', cache: "no-store", mode: "same-origin", headers: {'Accept': ACCEPT_HTML, "X-Custom-Header": 'bypass-cache'}, integrity: 'sha384-0nJZLfyh0QFDux9Dkd7wqBpi8qaqmx3Kczjge8FpLsPxpvpnXVRCR4Eg8j14l86+'}},
    {url: "mogumogu.mp3",            init: {method: 'GET', cache: "no-store", mode: "same-origin", headers: {'Accept': ACCEPT_HTML, "X-Custom-Header": 'bypass-cache'}, integrity: 'sha384-IH6vW6u39h8T3W60Z9XVR1v2lAVRg+7JUazjAfYrkHNzHG1tkr+F8izIufr/d8ct'}},
    {url: "js/SHAHashingAlgorithm.js",  init: {method: 'GET', cache: "no-store", mode: "same-origin", headers: {'Accept': ACCEPT_JAVASCRIPT, "X-Custom-Header": 'bypass-cache'}, integrity: 'sha384-MQy3tGwJMPnqw2RkWUES6I3St/tDufNSovh/bKYIqT5nCUqDr0h5qfsvhVcRuMzB'}},
    {url: "main.css",                init: {method: 'GET', cache: "no-store", mode: "same-origin", headers: {'Accept': ACCEPT_CSS, "X-Custom-Header": 'bypass-cache'}, integrity: 'sha384-6DH3PYX9f5P+M0Dxq6TyRrJTcK+65H3cE9jRbnWGd4EcuK4cpCcMZigYtO6Cplm5'}},
    {url: "モグモグ.mp4",              init: {method: 'GET', cache: "no-store", mode: "same-origin", headers: {'Accept': ACCEPT_HTML, "X-Custom-Header": 'bypass-cache', }}},
    {url: "js/abcd.js",                 init: {method: 'GET', cache: "no-store", mode: "same-origin", headers: {'Accept': ACCEPT_JAVASCRIPT, "X-Custom-Header": 'bypass-cache'},}},
];

//#region Normal Manifest Method

async function generateManifest(manifest) {
    try {
        if(!await verifyManifest(manifest)) throw "invalid manifest"
        let result = []
        let dataArr = manifest.resources
        for( {url, type, integrity} of dataArr) {
            let res = {}
            let init = {}
            let headers = {}
            init.method = 'GET'
            init.cache = 'no-store'
            init.mode = 'same-origin' // this might be better to be cors
            res.url = url            
            switch(type.toLowerCase()) {
                case 'html':
                    headers = { 'Accept': ACCEPT_HTML, "X-Custom-Header": 'bypass-cache' }
                    break;
                case 'image':
                    headers = { 'Accept': ACCEPT_IMAGE, "X-Custom-Header": 'bypass-cache', }
                    break;
                case 'javascript':
                    headers = { 'Accept': ACCEPT_JAVASCRIPT, "X-Custom-Header": 'bypass-cache', }
                    break;
                case 'css':
                    headers = { 'Accept': ACCEPT_CSS, "X-Custom-Header": 'bypass-cache', }
                    break;
                default: 
                headers = { 'Accept': ACCEPT_DEFAULT, "X-Custom-Header": 'bypass-cache', }
                break;
            }
            init.integrity = integrity
            init.headers = headers
            res.init = init
            
            result.push(res)
        }
        console.log('[FINAL RESULT]', result)
        return await result
    } catch (err) {
        catchBrokenResource(err)
        console.log('[FAIL]', err)
    }
}


async function verifyManifest(json) {

    // Production side will only have access to the public keys and nothing else
    try {
        console.log('input', json)
        let key = 'jws';
        let manifestPayload = {...json} //get a copy of the json
        delete manifestPayload[key] //remove the jws object to get the payload
        let result = //Verification only returns true when all 3 signatures are verified and is valid 
            Algorithm.compareHash(json.jws.integrity, await Algorithm.startHashWithText(JWSlib.serialize(manifestPayload))) && 
            await JWSlib.verifySignature(json.jws.quality.signature, json, "quality") &&
            await JWSlib.verifySignature(json.jws.developer.signature, json, "developer") ? true : false
        if(result) {
            console.info('[Manifest Verification] Valid Signature Values result:', result, 'Manifest Accepted')
            return true
        } else {
            console.error('[Manifest Verification] Valid Signature Values result:', result, 'Manifest Rejected')
            return false
        }
    } catch (err) {
        let res = await createManifestResponse(err, json)
        throw res
    }
}

async function install(manifest) {
    try {
        let res = await generateManifest(manifest)
        if(!res) throw "Manifest Undefined"
           
        error_handler.error_handler_init(res.length)

        res.forEach(async (value, index, array) => {            
            console.log("installer value ", value, " index ", index, " array ", array);
            await fetchResoure(value.url, value.init).then( (response) => {
                    console.log("installer response [PASS] :", response);
                    error_handler.updateInstalled(true)
                }, (error) => {
                    console.error("installer response [FAIL]:", error);
                    error_handler.updateInstalled(false)
                })
            
        })

        return error_handler.installerErrors
    } catch (err) {
        console.error("[Install()] Rejected", err)
    }
}


async function installManifest(manifest_manager) {

    let url = manifest_manager.latest.url //get the latest url path
    await install(await fetchManifest(url))
    if(error_handler.installerErrors) {
        // Attempt to install the fallback manifest to check if all the installs can be met
    }

}