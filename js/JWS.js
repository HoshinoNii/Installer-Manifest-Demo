'use strict';

class JWSsignatureLib {
    // Note: Make sure you have jsrasign-latest-all-min loaded before using any
    // of the library's functions below, this class relies on SHAHash class 
    // to use some of its functions
    constructor(algorithm, logging = false) {
        this.jws = KJUR.jws.JWS
        this.logging = logging;
        this.oHeader = {alg: algorithm}  //signing algorithm
        this.JWTFullregex = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/
        this.RemoveCertHeaderRegex = /(-+BEGIN CERTIFICATE-+)(.*?)(-+END CERTIFICATE-+)/s
        this.certhead = '-----BEGIN CERTIFICATE-----'
        this.endcerthead = '-----END CERTIFICATE-----' 
    }

    
    async get_cert_chain(urls) {
        let chain = []
        for(let i = 0; i < urls.length; i++) {
            chain.push(await this.getKey(cert_chain[i]))
        }
        return chain
    }

    // fetches the certificate/private key data
    async getKey(url) {
        let res = await (await fetch(url)).text()
        return await res
    }

    // reverses the generation process to get the result
    async verifySignature(signature, payload, key) {
        return key === "developer" ? //Key is DEV? 
                    await this.verify(signature, payload, payload.jws.developer.date) : 
                    await this.verify(signature, payload, payload.jws.quality.date) //If not verify for quality assurance
    }

    // generate the signature based on the payload with included privateKey
    async createSignature(privatekey, certificates, payload) {

        let header = {...this.oHeader}
        let x5c = []
        
        for(let i = 0; i < certificates.length; i++) {
            let res = this.RemoveCertHeaderRegex.exec(certificates[i])[2] //clear spacing
            res =  res.replace(/(\r\n|\n|\r)/gm, "")
            x5c.push(res)
        }   

        header.x5c = x5c
        let res = this.jws.sign(null, header, payload, privatekey)
        let output = res.split('.')

        if(this.logging) {
            console.log(certificates)
            console.log('result', res, 'x5c', header)
        }
        return output[0]+'..'+output[2]
    }



    // Verifies the integrity is correct returns true if valid
    async verify(integrity, payload, date) {

        let integrity_ = integrity.split('.')
        let Header_ = integrity_[0]
        let Signature_ = integrity_[2]

        let payload_ = {integrity: payload.jws.integrity, date: date}
        let b64uPayload = utf8tob64u(JSON.stringify(payload_))

        let integrityOutput= Header_+"."+b64uPayload+"."+Signature_
        let payloadHeader = this.jws.parse(integrityOutput)

        let sig = this.certhead+payloadHeader.headerObj.x5c[0]+this.endcerthead

        let publicKey_ = KEYUTIL.getKey(sig)
        let x5c = payloadHeader.headerObj.x5c
        for(let i=0; i < x5c.length; i++) {
            x5c[i] = this.certhead+x5c[i]+this.endcerthead
        }

        let chainVerification = this.verifyCertificateChain(x5c)
        let isValid = this.jws.verify(integrityOutput, publicKey_)

        if(this.logging) {
            console.log("Decoded Signature", sig, " \nchain verification ", chainVerification, "\nx5c", x5c)
        }
       

        return isValid && chainVerification ? true : false
    }
    
    
    /**
     * Takes a PEM encoded certificate chain array and verifies it
     * @param  {String[]} certificates - PEM certificate chain
     * @return {Boolean}               - Returns if certificate chain can be validated
    */
    verifyCertificateChain = (certificates) => {
        let valid = true;

        for(let i = 0; i < certificates.length; i++) {
            let Cert        = certificates[i];
            let certificate = new X509();
            certificate.readCertPEM(Cert);

            let CACert = '';
            if(i + 1 >= certificates.length) {
                CACert = Cert;
            } else {
                CACert = certificates[i + 1];
            }

            let certStruct   = ASN1HEX.getTLVbyList(certificate.hex, 0, [0]);
            let algorithm    = certificate.getSignatureAlgorithmField();
            let signatureHex = certificate.getSignatureValueHex()

            if(this.logging) {
                console.log("Certificates:", certificates)
                console.log("Algorithm:", algorithm)
            }
            

            // Verify against CA
            let Signature = new KJUR.crypto.Signature({alg: algorithm});
            Signature.init(CACert);
            Signature.updateHex(certStruct);
            valid = valid && Signature.verify(signatureHex); // true if CA signed the certificate       
        }

        return valid
    }

    async generateJWS_manifest(payload, privateKeys, cert_chains, htmlOutput = false) {

        let alg = new SHAHash(this.logging)
        let json = payload
        if(json.resources) { //if the manifest is a resource manifest and not archive 
            for( let resource of json.resources) { //generate a sha384 hash for Subresource Integrity
                resource.integrity = await alg.startHash(resource.url)
            }    
        }
        let integrity = await alg.startHashWithText(this.serialize(payload))//hash the payload
        let date_ = new Date().toISOString().slice(0, 10)
        let payload_ = { integrity: integrity, date: date_ }
        let devSignature = await this.createSignature(privateKeys, cert_chains, payload_)
        let qcSignature = await this.createSignature(privateKeys, cert_chains, payload_)
        
        json.jws = {
            integrity: integrity
        }
        json.jws.developer = {
            date: date_,
            signature: devSignature,
        }
        json.jws.quality = {
            date: date_,
            signature: qcSignature
        }
        if(this.logging) {
            console.log("==============================================================");
            console.log("[ES256 FINAL MANIFEST]")
            console.log(json)
            console.log("==============================================================");
            
            let str = JSON.stringify(json, undefined, 4)
            if(htmlOutput) {
                output(syntaxHighlight(str))
            } 
        }
        //#endregion
        return json
    }

    serialize (object) {
        if (object === null || typeof object !== 'object' || object.toJSON != null) {
          return JSON.stringify(object);
        }
      
        if (Array.isArray(object)) {
          return '[' + object.reduce((t, cv, ci) => {
            const comma = ci === 0 ? '' : ',';
            const value = cv === undefined || typeof cv === 'symbol' ? null : cv;
            return t + comma + this.serialize(value);
          }, '') + ']';
        }
      
        return '{' + Object.keys(object).sort().reduce((t, cv, ci) => {
          if (object[cv] === undefined ||
              typeof object[cv] === 'symbol') {
            return t;
          }
          const comma = t.length === 0 ? '' : ',';
          return t + comma + this.serialize(cv) + ':' + this.serialize(object[cv]);
        }, '') + '}';
    };
    
}

//#region Initialization Scripts ment for demo purposes only
const dir = 'certificates/'
const jwsLib = new JWSsignatureLib("ES256", true)

const cert_chain = [ 
    dir+"ca-chain/host.crt",
    dir+"ca-chain/ca.crt"
]

// simple function to retrieve the keys from directory for now..
async function getKeys() {
    let chain_privateKey_ = await jwsLib.getKey(dir+"ca-chain/host_pkcs8.key")
    let cert_chain_arr = []
    for(let i = 0; i < cert_chain.length; i++) {
        cert_chain_arr.push(await jwsLib.getKey(cert_chain[i]))
    }
    console.log("chain private key", chain_privateKey_, "cert chain", cert_chain_arr)
    return {
        privateKey: chain_privateKey_,
        certifcate_chain: cert_chain_arr
    }
}



// initalization for demo purposes
async function init() { 

    let credentials = await getKeys()
    let res = await fetch('manifests/manifest-archive.json') //fetch the manifest.json
    let sPayload = await res.json()
    console.log(sPayload, credentials)
    let manifest = await jwsLib.generateJWS_manifest(sPayload, credentials.privateKey, credentials.certifcate_chain, true)
    let devSig = await jwsLib.verifySignature(manifest.jws.developer.signature, manifest, "developer")
    let qcSig = await jwsLib.verifySignature(manifest.jws.developer.signature, manifest, "quality")

    console.log("Developer Certificate Chain Verification: ", devSig)
    console.log("Quality Control Certificate Chain Verification: ", qcSig)
}

//#endregion




