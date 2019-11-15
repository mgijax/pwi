(function() {
	'use strict';
	angular.module('pwi.doannot')
		.factory('FooSearchAPI',		FooSearchAPIResource)
		.factory('FooGetAPI',		FooGetAPIResource)
		.factory('FooUpdateAPI',		FooUpdateAPIResource)
		.factory('FooTotalCountAPI',	FooTotalCountAPIResource)
		;

	// object summary search
	function FooSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotypeDOannot/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function FooGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotypeDOannot/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// object modification
	function FooUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'genotypeDOannot', {},
				{'update': { method: 'PUT', 
				 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	

	// total number of records
	function FooTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotypeDOannot/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	
	
})();

