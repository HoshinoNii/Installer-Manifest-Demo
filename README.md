# Installer Demo

**Proposed Manifest Setup**
---
The Manifest will now consist of 2 parts
1. Manifest-Archive
2. Manifest-Resources

**Manifest-Archive:**
---
This will handle the fetching and loading of the installer page (index.html)
and it will be the one to decide what version of the manifest-resources to use
this Archive will also have its own JWS attached with the Developer and Quality
Objects with integrity every time it is updated.

```
//Proposed Manifest-Archive JSON Layout example
{
	"Name": "Naga Trinity",
	"Path": "./../",
	"InstallerPath": "index.html", <---- Installer
	"Latest": { <---- Latest Updated Manifest
		"version": "5.3.1",
		"url": "Manifest-5.3.1.json",
		"dir": "/" <---- Directory of the file
	},
	"Archive": [ <---- We Store the previous versions over here if we need a fallback.
		{
            "version": "5.3.0",
            "url": "manifests/manifest-5.3.0.json",
            "dir": "/"
        },
		{
            "version": "5.2.9",
            "url": "manifests/manifest-5.2.9.json",
            "dir": "/"
        },
	],
	"jws": { <---- Generated with the jsrsasign library 
		"integrity": "sha384-...", 
		"developer": {
            "date": "2021-09-17",
			"signature": "eyJhbGciOiJFUzI1NiIsIng1YyI6..ewunefef"
		},
		"quality": {
            "date": "2021-10-01",
			"signature": "eyJhbGciOiJFUzI1NiIsIng1YyI6..ewunefef"
		}	
	}
}
``` 
**Manifest-Resource**
----
The main purpose of the Manifest-Resource now in my proposal is to store all
the resources that need to be fetched and retrieved by the installer and nothing else
```
// Example Manifest-Resouce.json
{
    "version": "5.3.0",
    "path": "/",
    "resources": [
        {
            "url": "img/Anya_Melfissa_-_Profile_Picture.png",
            "type": "image",
            "integrity": "sha384-hyEb8dOtgWzOfqKowbmEEUm/Aa5lEF1TodB/aZHJbrDtCJNNUUtyGjIF6QeIIvZ1"
        },
        {
            "url": "img/kanata.jpg",
            "type": "image",
            "integrity": "sha384-HT3/jIg55VEqNRfho4vxBFMI35L7xr2vC3QJG6NRq5fgPPsRA5NGLvr/B5QlB+lM"
        },
        {
            "url": "img/illust_84719630_20201020_033955.jpg",
            "type": "image",
            "integrity": "sha384-hz8VzQgFH+jkDcMi0YB9yM7G9FiEzoDPjZSsq3lGigKvjZAFMrjjgjcFOzrDfrne"
        }
    ],
    "jws": {
        "integrity": "sha384-BlyUBGiU5Cl6+BoV+fPP8BUpyQp3xOE6T0dvcQRyts6xJaIln3JJmneyKmD8MjS0",
        "developer": {
            "date": "2021-09-17",
            "signature": "eyJhbGciOiJFUzI1NiIsIng1YyI6..ewunefef"
        },
        "quality": {
            "date": "2021-09-30",
            "signature": "eyJhbGciOiJFUzI1NiIsIng1YyI6..ewunefef"
        }
    }
}
```

**So How will the installer be in play for this?**
-----------
This is my proposed new process for the installer to handle these manifests

1. Loading of the Manifest-Archive
2. Use the InstallerPath to perhaps determine where to do the installation
3. Verifying the JWS of the JSON if true proceed, else throw an error
4. Once the Manifest-Archive have been verified, retrieve the latest Manifest-Resource stated in the Latest Object of Manifest-Archive
5. Verify the JWS of the Manifest-Resource if true proceed, else perhaps use a fallback from the Archive?
6. Once everything checks out, do the installation.
7. Once the installation has concluded gather up all the failed installs
8. Perhaps do a repair operation in the background to try and fetch them once more? or refer to fallback's resources


**How to Generate a Signed Manifest for use in the installer.**
-----------
1. Open jws.html and JWS.js
2. Modify the Init() Function in JWS.js and change the fetch URL to the raw manifest.json file you want to sign
    2.1. NOTE: the raw manifest data MUST not include a jws object within or it may produce Issues
         When using the installer.
3. Refresh jws.html and the updated Manifest will be outputted 
4. Note: this process is the same for the Manifest-Archive or Manifest-Resource.

Putting the new manifest into the archive
1. Open manifest-manager.html and manifest-manager.js
2. Change the values of the constants manifestManagerPath and manifestPath to the path of the Manifest-Archive and Manifest-Resource
3. Load manifest-manager.html, open the console (F12) and execute updateLatest(manifestPath) to set the new manifest as the latest
4. Afterwards Generate a Signed Manifest Again using the steps above for it to be used in the installer.


Function List and their actions

[JWS.js]
=======
[Prerequisites]
-----------
1. Jsrsasign Library linked
2. SHAhash Class linked
3. A good understanding of JSON web tokens ref: https://datatracker.ietf.org/doc/html/rfc7515

[Classes]
-----------
**JWSsignatureLib**
1. Main class that is used for signing and verifying Signed Manifests
2. Constructor accepts in 2 Arguments, Algorithm and Logging 
2. Algorithm it is recommended to use "ES256"
2. Set Logging to false if you are not debugging

**[JWSsignatureLib Functions]**
-----------
**ASYNC - createSignature (privateKey, certificates, payload)**
-----------
1. Main function for generating new signatures
1. Accepts in 3 Arguments, PrivateKey, Certificate Chain & Payload 
1. Output -> header.payload.signature encoded in base64url format.

**[Function Operations are as shown]**
1. Define the header taking in the algorithm from the class 
1. Payload structure should be: { integrity: "sha384-...", date: "..." }
1. Loop through the Certificate Chain and create an array object to send to the header 
1. Use Jsrsasign's sign function to sign the header, payload and private key 
1. split the header.payload.signature and return header..signature instead.

**ASYNC - verify (integrity, payload, date)**
-----------
1. Use this to verify any signatures created by createSignature
1. Accepts 3 arguments
1. integrity <--- Signature generated from ASYNC createSignature()
1. payload <--- Payload of the JWS 
1. date <--- Date of the jws object signed

**[Function Operations are as shown]**
1. First Rebuild the original signature structure of Header.payload.signature.
1. This is done by retrieving the integrity and relevant date from the payload
1. And then subsequently reconstructed giving { integrity: "sha384-...", date: "..." }
1. Before it is encoded into base64url.
1. Next Retrieve the client certificate from the certificate chain 
1. THIS MUST BE THE FIRST OBJECT OF THE CHAIN 

1. Afterwards Obtain the Public key from the certificate using jsrsasign 
1. Next Verify the certificate chain checking if it is valid
1. And After verify the reconstructed JWS Signature using jsrsasign
1. Finally Compare Both booleans from the certificate chain and jsrsasign verify
1. If both are true, signature is verified and is valid, else reject

**ASYNC - verifyManifest(JSON)**
-----------
1. Main function to handle the verification of a generated manifest
1. Accepts 1 argument, the manifest JSON generated from the class.

**ASYNC - verifySignature(signature, payload, key)**
-----------
1. Just a simple function to help execute the verify function on the correct resources.
2. Takes in 3 Arguments, Signature, Payload and Key.

**[Function Operations are as shown]**
1. Firstly Create a seperate JSON object and store the main payload within without the jws key 
2. Compare the computated SHA384 hash with the provided integrity from the original json
3. We do this by using the SHAhash class to hash the payload and then do the comparison.
4. Afterwards, call verifySiganture functionality to start the signature and certificate verification process for the developer and quality key.
5. Finally do a check to see if all 3 results are true, if so return true, else return false.

**ASYNC - generateJWS_manifest(payload, privateKeys, cert_chains, htmlOutput = false)**
-----------
1. The core functionality of this class.
2. This function is responsible for generating the Signed Manifest-Resource and Manifest-Archive.
2. Takes in 4 Arguments, Payload, privatekeys, certificate chain, and htmlOutput for logging.

**[Function Operations are as shown]**
1. Define the result as a const called json.
2. Check if there is a resources array, if so use the SHAhash class to hash all the resources to generate its own integrity.
3. Next, serialize the payload object (Canonicalization).
4. Afterwards use the SHAhash class to hash the serialized payload
5. Next Generate the developer and quality signatures using createSignature.
6. Finally Construct the jws key.
7. Add it to the json const
8. return the json object.

**serialize(object)**
-----------
1. Helper function that converts a json data into a standard and normal or canonical form.

**verifyCertificateChain(certificates)**
-----------
1. Helper function to verify the certificate chain.