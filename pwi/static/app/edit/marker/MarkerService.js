(function() {
	'use strict';
	angular.module('pwi.marker')
		.factory('MarkerSearchAPI',    MarkerSearchAPIResource)
		.factory('AccIdSearchAPI',    AccIdSearchAPIResource)
		.factory('MarkerKeySearchAPI', MarkerKeySearchAPIResource)
		.factory('MarkerCreateAPI', MarkerCreateAPIResource);


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

	function AccIdSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'accession/search', {}, {
			'search': { method: 'POST' }
		});
	}

	function MarkerCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'marker', {},
				{'create': { method: 'POST', 
							 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	
	
	
})();


