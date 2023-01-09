(function() {
	'use strict';
	angular.module('pwi.allelesummary')
		.factory('AlleleGetByMarkerAPI',        AlleleGetByMarkerAPIResource)
		.factory('AlleleGetByJnumAPI',          AlleleGetByJnumAPIResource)
		;

	//
	function AlleleGetByMarkerAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/getAlleleByMarker', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}
	//
	function AlleleGetByJnumAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/getAlleleByRef', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

})();

