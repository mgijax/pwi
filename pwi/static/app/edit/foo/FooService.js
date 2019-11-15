(function() {
	'use strict';
	angular.module('pwi.doannot')
		.factory('DOAnnotSearchAPI',		DOAnnotSearchAPIResource)
		.factory('DOAnnotGetAPI',		DOAnnotGetAPIResource)
		.factory('DOAnnotUpdateAPI',		DOAnnotUpdateAPIResource)
		.factory('DOAnnotTotalCountAPI',	DOAnnotTotalCountAPIResource)
		.factory('DOAnnotValidateAlleleReferenceAPI',	DOAnnotValidateAlleleReferenceAPIResource)
		.factory('DOAnnotCreateReferenceAPI', 		DOAnnotCreateReferenceAPIResource)
		;

	// object summary search
	function DOAnnotSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotypeDOannot/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function DOAnnotGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotypeDOannot/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// object modification
	function DOAnnotUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'genotypeDOannot', {},
				{'update': { method: 'PUT', 
				 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	

	// total number of records
	function DOAnnotTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotypeDOannot/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	
	
	// validate allele/reference
	function DOAnnotValidateAlleleReferenceAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotypeDOannot/validateAlleleReference', {}, {
			'validate': { method: 'POST', isArray: true }
		});
	}

	// object/reference creation 
	function DOAnnotCreateReferenceAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'mgireferenceassoc', {},
				{'create': { method: 'POST', 
				 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	
})();

