(function() {
	'use strict';
	angular.module('pwi.mpannot')
		.factory('MPAnnotSearchAPI',		MPAnnotSearchAPIResource)
		.factory('MPAnnotGetAPI',	MPAnnotGetAPIResource)
		.factory('MPAnnotCreateAPI', 		MPAnnotCreateAPIResource)
		.factory('MPAnnotUpdateAPI',		MPAnnotUpdateAPIResource)
		.factory('MPAnnotDeleteAPI',		MPAnnotDeleteAPIResource)
		.factory('MPAnnotTotalCountAPI',	MPAnnotTotalCountAPIResource)
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

	// object creation
	function MPAnnotCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'mpannot', {},
				{'create': { method: 'POST', 
				 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
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

	// object deletion
	function MPAnnotDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'mpannot/:key', {},
				{'delete': { method: 'DELETE', 
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
	
})();

