(function() {
	'use strict';
	angular.module('pwi.marker')
		.factory('MarkerSearchAPI',    MarkerSearchAPIResource)
		.factory('MarkerKeySearchAPI', MarkerKeySearchAPIResource)
		.factory('MarkerCreateAPI', MarkerCreateAPIResource)
		.factory('MarkerUpdateAPI', MarkerUpdateAPIResource)
		.factory('MarkerDeleteAPI', MarkerDeleteAPIResource);


	// currently broken
	function MarkerSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'marker/eiSearch', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	function MarkerKeySearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'marker/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	function MarkerCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'marker', {},
				{'create': { method: 'POST', 
							 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	
	
	function MarkerUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'marker', {},
				{'update': { method: 'PUT', 
							 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	

	function MarkerDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'marker/:key', {},
				{'delete': { method: 'DELETE', 
							 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	
	
})();


