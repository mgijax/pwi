(function() {
	'use strict';
	angular.module('pwi.mpannot')
		.factory('MPAnnotSearchAPI',		MPAnnotSearchAPIResource)
		.factory('MPAnnotGetAPI',		MPAnnotGetAPIResource)
		.factory('MPAnnotUpdateAPI',		MPAnnotUpdateAPIResource)
		.factory('MPAnnotTotalCountAPI',	MPAnnotTotalCountAPIResource)
		.factory('MPAnnotValidateAlleleReferenceAPI',	MPAnnotValidateAlleleReferenceAPIResource)
		.factory('MPAnnotCreateReferenceAPI', 		MPAnnotCreateReferenceAPIResource)
		;

	// object summary search
	function MPAnnotSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'mpannot/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function MPAnnotGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'mpannot/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// object modification
	function MPAnnotUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'mpannot', {},
				{'update': { method: 'PUT', 
				 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	

	// total number of records
	function MPAnnotTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'mpannot/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	
	
	// validate allele/reference
	function MPAnnotValidateAlleleReferenceAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'mpannot/validateAlleleReference', {}, {
			'validate': { method: 'POST', isArray: true }
		});
	}

	// object/reference creation 
	function MPAnnotCreateReferenceAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'mgireferenceassoc', {},
				{'create': { method: 'POST', 
				 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	
	
})();

