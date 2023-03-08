(function() {
	'use strict';
	angular.module('pwi.allelesummary')
		.factory('AlleleGetByMarkerAPI', AlleleGetByMarkerAPIResource)
		.factory('AlleleGetByRefAPI', AlleleGetByRefAPIResource)
		;

	//
	function AlleleGetByMarkerAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/getAlleleByMarker', {}, {
                        'search': { method: 'GET', isArray: false }
		});
	}
	//
	function AlleleGetByRefAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/getAlleleByRef', {}, {
			'search': { method: 'GET', isArray: false }
		});
	}

})();

