class ErrorHandler {

	constructor() {

		this.installed = 0
		this.errors = 0
		this.installerErrors = []
		this.expectedInstalls = 0

		this.ErrorType = Object.freeze({
			FILE_NOT_FOUND: "404",
			FAILED_TO_FETCH: "Failed To Fetch",
			TYPE_ERROR: "Type Error",
			MISSING_INTEGRITY: "Missing Integrity",
			INVALID_INTEGRITY: "Invalid Integrity",
			CORRUPTED_FILE: "Corrupted File",
			BAD_MANIFEST: "Bad Manifest"
		})

		this.ErrorSeverity = Object.freeze({
			Low: "Low",
			Medium: "Medium",
			High: "High",
			Critical: "Critical"
		})
	}

	async createManifestResponse(message, manifest) {
		let res = {}
		res.type = this.ErrorType.BAD_MANIFEST
		res.severity = this.ErrorSeverity.Critical
		res.message = message.message
		res.manifest = manifest

		return res
	}

	async createResponse2(err, url, init) {
		let errType = err.type, message_ = err.message,
			severity = err.severity, status = err.status
		let Algorithm = new SHAHash()
		if (!err.status) {
			if (init.integrity) {
				let computatedHash = await Algorithm.startHash(url)
				if (Algorithm.compareHash(init.integrity, computatedHash)) {
					errType = this.ErrorType.TYPE_ERROR
					severity = this.ErrorSeverity.Medium
				} else {
					errType = this.ErrorType.INVALID_INTEGRITY
					severity = this.ErrorSeverity.High
					message_ = "Computated Integrity Error: " + init.integrity + " Computated Integrity: " + computatedHash
				}
			} else {
				if(message_ === "Failed to fetch") errType = this.ErrorType.FAILED_TO_FETCH
				else errType = this.ErrorType.MISSING_INTEGRITY
				severity = this.ErrorSeverity.High
			}
			status = "failed"
		}
		return {
			type: errType,
			severity: severity,
			status: status,
			message: message_,
			url: url,
			init: init,
		}
	}


	async catchBrokenResource(obj) { //we can use this to repair any issues or use it as a console logging
		this.installerErrors.push(obj)
		console.log('Installer Errors', this.installerErrors)
	}

	mapErrors() {
		this.installerErrors.forEach((err) => {
			let str = JSON.stringify(err, undefined, 4)
			output(syntaxHighlight(str))
		})
		if (this.installed !== this.expectedInstalls) {
			console.info("[error handler] Installation concluded with issues (" + this.installed + "/" + this.expectedInstalls + ") Installed \nErrors (" + this.errors + "/" + this.expectedInstalls + "): ", this.installerErrors)
			repair(this.installerErrors)
		} else {
			console.info("[error handler] Installation concluded witout issues (" + this.installed + "/" + this.expectedInstalls + ") Installed")
		}
	}

	error_handler_init(expectedInstalls_) {
		this.expectedInstalls = expectedInstalls_
		this.installed = 0
		this.errors = 0
		this.installerErrors = [] //simple clearing function
		console.info("[error handler] Init: ExpectedInstalls", this.expectedInstalls, " installerErrors", this.installerErrors, " Installed:", this.installed)
	}

	async updateInstalled(isInstalled) {
		if (isInstalled) {
			this.installed++
		} else {
			this.errors++
		}
		//console.log("installed", installed, "errors", errors, "total", (installed+errors), " expected Installed", expectedInstalls)
		if (this.errors + this.installed >= this.expectedInstalls) {
			this.mapErrors()
		}
	}
}