(function() {
	'use strict';
	angular.module('pwi.mpannot')
		.factory('DOAnnotSearchAPI',		DOAnnotSearchAPIResource)
		.factory('DOAnnotGetAPI',		DOAnnotGetAPIResource)
		.factory('DOAnnotUpdateAPI',		DOAnnotUpdateAPIResource)
		.factory('DOAnnotTotalCountAPI',	DOAnnotTotalCountAPIResource)
		.factory('DOAnnotValidateAlleleReferenceAPI',	DOAnnotValidateAlleleReferenceAPIResource)
		;

	// object summary search
	function DOAnnotSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'mpannot/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function DOAnnotGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'mpannot/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// object modification
	function DOAnnotUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'mpannot', {},
				{'update': { method: 'PUT', 
				 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	

	// total number of records
	function DOAnnotTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'mpannot/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	
	
	// validate allele/reference
	function DOAnnotValidateAlleleReferenceAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'mpannot/validateAlleleReference', {}, {
			'validate': { method: 'POST', isArray: true }
		});
	}

})();

