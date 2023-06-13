(function() {
	'use strict';
	angular.module('pwi.assay')
		.factory('AssaySearchAPI',	        AssaySearchAPIResource)
		.factory('AssayGetAPI',		        AssayGetAPIResource)
                .factory('AssayCreateAPI',              AssayCreateAPIResource)
		.factory('AssayUpdateAPI',	        AssayUpdateAPIResource)
		.factory('AssayDeleteAPI',	        AssayDeleteAPIResource)
		.factory('AssayTotalCountAPI',	        AssayTotalCountAPIResource)
		.factory('GenotypeBySetUserAPI',	GenotypeBySetUserAPIResource)
		.factory('ImagePaneByReferenceAPI',	ImagePaneByReferenceAPIResource)
		.factory('EmapaInSituBySetUserAPI',	EmapaInSituBySetUserAPIResource)
		.factory('EmapaGelBySetUserAPI',	EmapaGelBySetUserAPIResource)
		.factory('AddToEmapaClipboardAPI',	AddToEmapaClipboardAPIResource)
		.factory('AddToCellTypeClipboardAPI',	AddToCellTypeClipboardAPIResource)
		.factory('AddToGenotypeClipboardAPI',	AddToGenotypeClipboardAPIResource)
		.factory('CellTypeInSituBySetUserAPI',	CellTypeInSituBySetUserAPIResource)
		.factory('ReplaceGenotypeAPI',	        ReplaceGenotypeAPIResource)
		.factory('AssayGetDLByKeyAPI',	        AssayGetDLByKeyAPIResource)
		;

	// object summary search
	function AssaySearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function AssayGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// create
	function AssayCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'assay', {},
			{'create': { method: 'POST', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// update
	function AssayUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'assay', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// delete
	function AssayDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'assay/:key', {},
			{'delete': { method: 'DELETE', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// total number of records
	function AssayTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	
	
	// get genotype clipboard members
	function GenotypeBySetUserAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/getGenotypeBySetUser', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// get gxd image pane by reference
	function ImagePaneByReferenceAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'imagepane/getGXDByReference', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// get emapa clipboard members
	function EmapaInSituBySetUserAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/getEmapaInSituBySetUser', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// get emapa clipboard members
	function EmapaGelBySetUserAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/getEmapaGelBySetUser', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// add to Emapa clipboard
	function AddToEmapaClipboardAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/addToEmapaClipboard', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// add to Cell Type clipboard
	function AddToCellTypeClipboardAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/addToCellTypeClipboard', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// add to Genotype clipboard
	function AddToGenotypeClipboardAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/addToGenotypeClipboard', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// get celltype clipboard members
	function CellTypeInSituBySetUserAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/getCellTypeInSituBySetUser', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// replace genotype
	function ReplaceGenotypeAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/processReplaceGenotype', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// get assays by reference
	function AssayGetDLByKeyAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/getAssayDLByKey', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}
							          
})();

