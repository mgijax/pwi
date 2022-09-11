(function() {
	'use strict';
	angular.module('pwi.markerdetail')
		.factory('MarkerSearchAPI',	        MarkerSearchAPIResource)
		.factory('MarkerGetAPI',	        MarkerGetAPIResource)
		;

	//
	function MarkerSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'marker/validateMarker', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	//
	function MarkerGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'marker/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}
})();

