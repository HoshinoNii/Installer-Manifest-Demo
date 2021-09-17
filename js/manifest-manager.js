const manifestManagerPath = "../manifests/manifest-archive.json"
const manifestPath = "../manifests/manifest.5.3.1.json"

const MANIFEST = "manifest"

let manifest_manager

async function getManifestManager() {
    try {
        let res = await (await fetch(manifestManagerPath)).json()
        return res
    } catch (err) {
        console.error(err)
    }
}

// insert specified manifest as the latest entry
async function updateLatest(url) {
    try {

        let credentials = await getKeys() // <--- Belongs to JWS.js using for tesing purposes for now
        let JWSlib = new JWSsignatureLib("ES256", true)
        let entry = await (await fetch(url)).json()
        let latest = manifest_manager.latest
        let archive = [latest, ...manifest_manager.archive]
        let manifest_entry = {
            version: entry.version,
            manifest: MANIFEST+"-"+entry.version+".json",
            dir: entry.path
        }
        let res = {
            name: manifest_manager.name,
            latest: manifest_entry,
            archive: archive
        }

        let signedManifest_manager = await JWSlib.generateJWS_manifest(res, credentials.privateKey, credentials.certifcate_chain, false)
        
        manifest_manager = signedManifest_manager // DEMO PURPOSES ONLY!
        if(await JWSlib.verifyManifest(manifest_manager) ) {
            output(syntaxHighlight(JSON.stringify(signedManifest_manager, undefined, 4)))
            return manifest_manager
        } else {
            throw "Signature Verification Failed!"
        }// Final Check ) 
        
        
    } catch (error) {
        console.log(error)
    }

}
// get latest
function getLatestFallback() {
    output(syntaxHighlight(JSON.stringify(manifest_manager.archive[0], undefined, 4))) 
    return manifest_manager.archive[0] 
}

// get based on version number
function getManifestVersion(versionNo) {
    if(manifest_manager.latest.version === versionNo) {
        return manifest_manager.latest
    }
    return manifest_manager.archive.find((manifest) => manifest.version === versionNo)
}

// return fetched latest manifest
function getLatest() {
    output(syntaxHighlight(JSON.stringify(manifest_manager.latest, undefined, 4))) 
    return manifest_manager.latest
}

async function fetchManifest(url) {
    try {
        let res = await (await fetch(url)).json()
        return res
    } catch (err) {
        console.error(err)
    }
}

// initialization for demo purposes
async function init() {
    let JWSlib = new JWSsignatureLib("ES256", true)
    manifest_manager = await getManifestManager()
    JWSlib.verifyManifest(manifest_manager)
    output(syntaxHighlight(JSON.stringify(manifest_manager, undefined, 4))) 
}


init()