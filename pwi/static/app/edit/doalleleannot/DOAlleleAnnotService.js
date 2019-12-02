(function() {
	'use strict';
	angular.module('pwi.doalleleannot')
		.factory('DOAlleleAnnotSearchAPI',		DOAlleleAnnotSearchAPIResource)
		.factory('DOAlleleAnnotGetAPI',		DOAlleleAnnotGetAPIResource)
		.factory('DOAlleleAnnotUpdateAPI',		DOAlleleAnnotUpdateAPIResource)
		.factory('DOAlleleAnnotTotalCountAPI',	DOAlleleAnnotTotalCountAPIResource)
		;

	// object summary search
	function DOAlleleAnnotSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'alleleDOannot/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function DOAlleleAnnotGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'alleleDOannot/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// object modification
	function DOAlleleAnnotUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'alleleDOannot', {},
				{'update': { method: 'PUT', 
				 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	

	// total number of records
	function DOAlleleAnnotTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'alleleDOannot/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	
	
})();

