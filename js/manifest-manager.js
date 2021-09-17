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
        console.log("UpdateLatest() Result:", res, " Old Manifest: ", manifest_manager)
        output(syntaxHighlight(JSON.stringify(res, undefined, 4))) 
        manifest_manager = res // DEMO PURPOSES ONLY!
        return res
        
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
    manifest_manager = await getManifestManager()
    output(syntaxHighlight(JSON.stringify(manifest_manager, undefined, 4))) 
}

init()