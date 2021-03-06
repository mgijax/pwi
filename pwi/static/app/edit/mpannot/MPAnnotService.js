(function() {
	'use strict';
	angular.module('pwi.mpannot')
		.factory('MPAnnotSearchAPI',		MPAnnotSearchAPIResource)
		.factory('MPAnnotSearchByKeysAPI',	MPAnnotSearchByKeysAPIResource)
		.factory('MPAnnotGetAPI',		MPAnnotGetAPIResource)
		.factory('MPAnnotUpdateAPI',		MPAnnotUpdateAPIResource)
		.factory('MPAnnotTotalCountAPI',	MPAnnotTotalCountAPIResource)
		.factory('MPAnnotValidateAlleleReferenceAPI',	MPAnnotValidateAlleleReferenceAPIResource)
		.factory('MPAnnotCreateReferenceAPI', 	MPAnnotCreateReferenceAPIResource)
		;

	// object summary search
	function MPAnnotSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotypeMPannot/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// search by genotype keys
	function MPAnnotSearchByKeysAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotypeMPannot/searchByKeys', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function MPAnnotGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotypeMPannot/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// object modification
	function MPAnnotUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'genotypeMPannot', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// total number of records
	function MPAnnotTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotypeMPannot/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	
	
	// validate allele/reference
	function MPAnnotValidateAlleleReferenceAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotypeMPannot/validateAlleleReference', {}, {
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

