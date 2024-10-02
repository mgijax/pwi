(function() {
	'use strict';
	angular.module('pwi.markerfear')
		.factory('MarkerFearSearchAPI',		MarkerFearSearchAPIResource)
		.factory('MarkerFearGetAPI',		MarkerFearGetAPIResource)
		.factory('MarkerFearUpdateAPI',		MarkerFearUpdateAPIResource)
		.factory('MarkerFearTotalCountAPI',	MarkerFearTotalCountAPIResource)
		;

	// object summary search
	function MarkerFearSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'markerfear/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function MarkerFearGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'markerfear/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// object modification
	function MarkerFearUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'markerfear', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// total number of records
	function MarkerFearTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'markerfear/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	
	
})();

