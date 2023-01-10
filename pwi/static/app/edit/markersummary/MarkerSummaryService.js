(function() {
	'use strict';
	angular.module('pwi.markersummary')
		.factory('MarkerGetByJnumAPI', MarkerGetByJnumAPIResource)
		;

	//
	function MarkerGetByJnumAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'marker/getMarkerByRef', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

})();

