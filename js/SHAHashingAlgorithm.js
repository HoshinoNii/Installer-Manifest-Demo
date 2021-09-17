//#region shaclass
class SHAHash {

    constructor(logging = false) {
        this.logging = logging;
    }

    AlgorithmType(hashAlgorithm) {
        switch(hashAlgorithm) {
            case "sha256": return "SHA-256";
            case "sha384": return "SHA-384";
            case "sha512": return "SHA-512";
            default: return "SHA-384";
        }
    }

    async generateBase64String(buffer, algorithm) {
        if(algorithm === undefined) algorithm = "sha384";
        const hashBuffer = await this.hash(buffer, algorithm)
        const base64string = btoa (
            String.fromCharCode(...new Uint8Array(hashBuffer))
        )
        if(this.logging === true) {
            console.log('[Hashing...]')
            console.log('[base64string]', base64string)
        }
        return `${algorithm}-${base64string}`
    }

    async hash(file, algorithm) {
        const digest = await crypto.subtle.digest(this.AlgorithmType(algorithm), file)
        return digest
    }

    // Use this to produce the hash taking in the URL and making a fetch request
    async startHash(url, algorithm) {
        try {
            const request = new Request(url)
            request.type = 'arrayBuffer'
            let res = await (await fetch(request)).arrayBuffer()
            const integrity = await this.generateBase64String(res, algorithm)
            if(this.logging) {
                console.info("[Response Integrity]", integrity)
            }
            return integrity
        } catch (err) {
            console.error('Non-Ok HTTP response Error', err)
        }
    }
    // Use this to produce the hash instead of url, it takes in text
    async startHashWithText(stringArr, algorithm) {
        try {

            let encoder = new TextEncoder()
            let data = encoder.encode(stringArr)
            const integrity = await this.generateBase64String(data, algorithm)
            if(this.logging) {
                console.log('[stringArr]', stringArr)
                console.log('result text encoder', data)
                console.info("[Response Integrity] With String Request", integrity)
            }
            return integrity
        } catch (err) {
            console.error('Non-Ok HTTP response Error', err)
        }
    }


    // Use this to verify the hash is correct experimental for now has room for improvement
    compareHash(hash1, hash2) {
        if((!hash1 || !hash2) && this.logging) 
            return console.error("[MISSING HASH!] hash 1: ", hash1, ",  hash 2: ", hash2, " Time ", performance.now())
        if(this.logging) console.log('[hash inputs] \nHash 1:', hash1, "\nHash 2:",hash2) 
        if(hash1 === hash2) {
            return true
        } else {
            return false
        }
    }
}


