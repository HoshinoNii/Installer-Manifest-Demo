# Installer Demo

Proposed Manifest Setup

The Manifest will now consist of 2 parts
1. Manifest-Archive
2. Manifest-Resources

Manifest-Archive:
This will handle the fetching and loading of the installer page (index.html)
and it will be the one to decide what version of the manifest-resources to use
this Archive will also have its own JWS attached with the Developer and Quality
Objects with integrity everytime it is updated.

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

Manifest-Resource
The main purpose of the Manifest-Resource now in my proposal is to store all
the resources that needs to be fetched and retrieved by the installer and nothing else

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


So How will the installer be in play for this?
This is my proposed new process for the installer to handle these manifests

1. Loading of the Manifest-Archive
2. Use the InstallerPath to perhaps determine where to do the installation
3. Verifiying the JWS of the JSON if true proceed, else throw error
4. Once the Manifest-Archive have been verified, retrieve the latest Manifest-Resource stated in the Latest Object of Manifest-Archive
5. Verify the JWS of the Manifest-Resource if true proceed, else perhaps use a fallback from the Archive?
6. Once everything checkes out, do the installation.
7. Once the installation has concluded gather up all the failed installs
8. Perhaps do a repair operation in the background to try and fetch them once more? or refer to fallback's resources


How to Generate a Signed Manifest for use in the installer.
1. Open jws.html and JWS.js
2. Modify the Init() Function in JWS.js and change the fetch url to the raw manifest.json file you want to sign
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
[Prerequisites]
> Jsrsasign Library linked
> SHAhash Class linked
> A good understanding of JSON web tokens ref: https://datatracker.ietf.org/doc/html/rfc7515

[Classes]
JWSsignatureLib
> Main class that is used for signing and verifying Signed Manifests
> Constructor accepts in 2 Arguments, Algorithm and Logging 
> > Algorithm it is recommended to use "ES256"
> > Set Logging to false if you are not debugging

[JWSsignatureLib Functions]
=================================================================================
> ASYNC - createSignature (privateKey, certificates, payload)
> > Main function for generating new signatures
> > Accepts in 3 Arguments, PrivateKey, Certificate Chain & Payload 
> > Output -> header.payload.signature encoded in base64url format.

> > [Function Operations are as shown]
> > > Define the header taking in the algorithm from the class 
> > > Payload structure should be: { integrity: "sha384-...", date: "..." }
> > > Loop through the Certificate Chain and create an array object to send to the header 
> > > Use Jsrsasign's sign function to sign the header, payload and privatekey 
> > > split the header.payload.signature and return header..signature instead.
==================================================================================
> ASYNC - verify (integrity, payload, date)
> > Use this to verify any signatures created by createSignature
> > Accepts 3 arguments
> > > integirty <--- Signature generated from ASYNC createSignature()
> > > payload <--- Payload of the JWS 
> > > date <--- Date of the jws object signed

> > [Function Operations are as shown]
> > > First Rebuild the original signature structure of Header.payload.signature.
> > > > This is done by retrieving the integrity and revelant date from the payload
> > > > And then subsequently reconstructed giving { integrity: "sha384-...", date: "..." }
> > > > Before it is encoded into base64url.

> > > Next Retrive the client certificate from the certificate chain 
> > > > THIS MUST BE THE FIRST OBJECT OF THE CHAIN 

> > > Afterwards Obtain the Public key from the certifcate using jsrsasign 
> > > Next Verify the certificate chain checking if it is valid
> > > And After verify the reconstructed JWS Signature using jsrsasign
> > > Finally Compare Both booleans form the certificate chain and jsrsasign verify
> > > If both are true, signature is verified and is valid, else reject
==================================================================================
> ASYNC - verifyManifest(json)
> > Main function to handle the verification of a generated manifest
> > Accepts 1 argument, the manifest json generated from the class.

> > [Function Operations are as shown]
> > > 