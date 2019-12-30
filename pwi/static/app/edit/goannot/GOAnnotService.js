(function() {
	'use strict';
	angular.module('pwi.goannot')
		.factory('GOAnnotSearchAPI',		GOAnnotSearchAPIResource)
		.factory('GOAnnotSearchByKeysAPI',	GOAnnotSearchByKeysAPIResource)
		.factory('GOAnnotGetAPI',		GOAnnotGetAPIResource)
		.factory('GOAnnotUpdateAPI',		GOAnnotUpdateAPIResource)
		.factory('GOAnnotTotalCountAPI',	GOAnnotTotalCountAPIResource)
		.factory('GOAnnotValidateAlleleReferenceAPI',	GOAnnotValidateAlleleReferenceAPIResource)
		.factory('GOAnnotCreateReferenceAPI', 		GOAnnotCreateReferenceAPIResource)
		;

	// object summary search
	function GOAnnotSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotypeDOannot/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// search by genotype keys
	function GOAnnotSearchByKeysAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotypeDOannot/searchByKeys', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function GOAnnotGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotypeDOannot/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// object modification
	function GOAnnotUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'genotypeDOannot', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// total number of records
	function GOAnnotTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotypeDOannot/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	
	
	// validate allele/reference
	function GOAnnotValidateAlleleReferenceAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotypeDOannot/validateAlleleReference', {}, {
			'validate': { method: 'POST', isArray: true }
		});
	}

	// object/reference creation 
	function GOAnnotCreateReferenceAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'mgireferenceassoc', {},
			{'create': { method: 'POST', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

})();

