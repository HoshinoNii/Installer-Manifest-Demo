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
4. json-beautifier.js

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
1. If both are true, a signature is verified and is valid, else reject

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
2. Compare the computated SHA384 hash with the provided integrity from the original JSON
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
7. Add it to the JSON const
8. return the JSON object.

**serialize(object)**
-----------
1. Helper function that converts a json data into a standard and normal or canonical form.

**verifyCertificateChain(certificates)**
-----------
1. Helper function to verify the certificate chain.


[SHAHashingAlgorithm.js]
=======
[Prerequisites]
-----------
1. A decent understanding of how SHA hashing algorithms work

[Classes]
-----------
**SHAhash**
1. The main hashing helper class used by this installer Demo

**[SHAhash Functions]**
-----------
**ASYNC - startHash(url, algorithm)**
-----------
1. The main hashing function used to hash resources such as images, HTML files etc..
2. Accepts in 2 Arguments, URL and Algorithm Type (Default: SHA384)

**[Function Operations are as shown]**
1. Create a new request with the URL and set the response as an arrayBuffer.
2. send a fetch Request with the request
3. Take the returned arrayBuffer and execute the function generateBase64String.
4. Once generateBase64String has returned the hash string, return this as the output.

**ASYNC - startHashWithText(stringArr, algorithm)**
-----------
1. The main hashing function is used to hash text and string resources.
2. Accepts in 2 Arguments, stringArr and Algorithm Type (Default: SHA384)

**[Function Operations are as shown]**
1. Create a new TextEncoder() Instance.
2. encode the stringArr
3. Execute the generateBase64String function and return the result.

**compareHash(hash1, hash2)**
-----------
1. The main function to compare and verify if the hash is valid.
2. Takes in 2 arguments, which are the hashes to be compared.

**[Function Operations are as shown]**
1. Takes in both hashes and check if they are the same.


**ASYNC - generateBase64String(buffer, algorithm)**
-----------
1. the main hashing process.
2. Takes in 2 arguments, the arrayBuffer and the algorithm.

**[Function Operations are as shown]**
1. Start by executing the hash() function using the given buffer.
2. Afterwards take the output and convert it into a base64 string
3. Finally Add in the algorithm type and the string together so it would look like "sha384-..."


**ASYNC - hash(file, algorithm)**
-----------
1. Helper function that hashes an arrayBuffer with the given algorithm.
2. Accepts in 2 arguments, the arrayBuffer and the algorithm 

**[Function Operations are as shown]**
1. Executes crypto.subtle.digest with the given arguments and return the arrayBuffer result.

[installer.js]
=======
[Prerequisites]
-----------
1. json-beautifier.js
2. Jsrsasign
3. JWS.js
4. SHAHashingAlgorithm.js 
5. error-handler.js 

[Functions]
-----------

**ASYNC - generateManifest(manifest)**
-----------
1. Takes in the signed manifest and outputs an JSON data that the installer can use
2. Accepts in 1 argument, the signed manifest.

**[Function Operations are as shown]**
1. Verify the manifest using the verifyManifest() function if it is invalid, throw an error and stop the function there.
2. Create an array to store the data
3. Parse through the manifest's resources and generate their own individual init data based on their data type and store them into the array.
4. return the array result once it has been done.

**ASYNC - verifyManifest(json)**
-----------
1. Takes in the signed manifest and verify its JWS signature.
2. Takes in 1 argument, the manifest JSON itself.

**[Function Operations are as shown]**
1. Start by verifying its integrity from the jws key
2. Next using the JWSsignatureLib, verify the developer and quality keys
3. if all 3 outputs are true, return true else false.

**ASYNC - install(manifest)**
-----------
1. Reads the manifest and starts the installation process.
2. Takes in 1 argument, the manifest JSON itself.

**[Function Operations are as shown]**
1. Generate the manifest using generateManifest() function
2. if the result is undefined throw and error.
3. call the error_handler class's error_handler_init() with the generated Manifest's array length 
4. Loop through all the resources and call fetchResource() from installer-core.js.
5. Update the error_handler when the result is a PASS or FAIL.

[manifest-manager.js]
=======
[Prerequisites]
-----------
1. json-beautifier.js
2. Jsrsasign
3. JWS.js
4. SHAHashingAlgorithm.js 
5. error-handler.js 

[Functions]
-----------

**ASYNC - updateLatest(url)**
-----------
1. Takes in a JSON string of a Manifest-Resource Entry and Updates it as the latest and Signs it
2. Accepts in 1 argument, the JSON entry 
``` 
    // EXAMPLE ENTRY
    {
        "version": "5.3.1",
        "url": "manifests/manifest-5.3.1.json",
        "dir": "/"
    }
```

**[Function Operations are as shown]**
1. Grab the crednetial details from JWS.js using getKeys()
2. Create a new instance of JWSsignatureLib for Signing
3. Assign the JSON argument into a variable
4. Store the latest Entry of the manifest-archive into a variable
5. Use the Spread Operator to store the latest and the old archive into the new archive list
6. Create the new entry using the JSON data provided in the argument
7. Finally Construct the new Manifest Entry and Sign it using the JWSsignatureLib Class.

**ASYNC - getLatestFallback()**
-----------
1. Gets the first element of the manifest-Archive's archive key array

**[Function Operations are as shown]**
1. returns the first item in the archive array of the Manifest-Archive.

**ASYNC - getManifestVersion(versionNo)**
-----------
1. Finds the specific entry of a manifest-archive resource based on version number.
2. Accepts in 1 Argument, the Version Number

**[Function Operations are as shown]**
1. First Check if the version number in the argument is the latest, if so return that entry. 
2. Otherwise, do a find operation to search for the entry in the archive array and returns it if it is found.


**ASYNC - getLatest()**
-----------
1. Gets the latest entry of the manifest.

**[Function Operations are as shown]**
1. returns latest entry of the manifest.

**ASYNC - init()**
-----------
1. Initilization mainly used for demo purposes.

**[Function Operations are as shown]**
1. Create an instance of JWSsignatureLib.
2. Retrieve the latest Manifest-Archive from path.
3. Verify its integrity using JWSsignatureLib.
4. Print out the JSON as HTML.