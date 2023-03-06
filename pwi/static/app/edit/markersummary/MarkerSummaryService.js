(function() {
	'use strict';
	angular.module('pwi.markersummary')
		.factory('MarkerGetByRefAPI', MarkerGetByRefAPIResource)
		;

	//
	function MarkerGetByRefAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'marker/getMarkerByRef', {}, {
                        'search': { method: 'GET', isArray: false }
		});
	}

})();

