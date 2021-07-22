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
		.factory('EmapaBySetUserAPI',	        EmapaBySetUserAPIResource)
		.factory('ReplaceGenotypeAPI',	        ReplaceGenotypeAPIResource)
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
	function EmapaBySetUserAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/getEmapaBySetUser', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// replace genotype
	function ReplaceGenotypeAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/processReplaceGenotype', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

})();

