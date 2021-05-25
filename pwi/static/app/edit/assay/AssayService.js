(function() {
	'use strict';
	angular.module('pwi.assay')
		.factory('AssaySearchAPI',	        AssaySearchAPIResource)
		.factory('AssayGetAPI',		        AssayGetAPIResource)
                .factory('AssayCreateAPI',              AssayCreateAPIResource)
		.factory('AssayUpdateAPI',	        AssayUpdateAPIResource)
		.factory('AssayDeleteAPI',	        AssayDeleteAPIResource)
		.factory('AssayTotalCountAPI',	        AssayTotalCountAPIResource)
		.factory('MGIGenotypeSetGetAPI',	MGIGenotypeSetGetAPIResource)
		.factory('ImagePaneByReferenceAPI',	ImagePaneByReferenceAPIResource)
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
	
	// get clipboard members
	function MGIGenotypeSetGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/getGenotypesBySetUser', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// get gxd image pane by reference
	function ImagePaneByReferenceAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'imagepane/getGXDByReference', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

})();

