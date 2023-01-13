(function() {
	'use strict';
	angular.module('pwi.probesummary')
		.factory('ProbeGetByMarkerAPI', ProbeGetByMarkerAPIResource)
		.factory('ProbeGetByJnumAPI', ProbeGetByJnumAPIResource)
		.factory('ProbeGetBySearchAPI', ProbeGetBySearchAPIResource)
		;

	//
	function ProbeGetByMarkerAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'probe/getProbeByMarker', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}
	//
	function ProbeGetByJnumAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'probe/getProbeByRef', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}
	//
	function ProbeGetBySearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'probe/getProbeBySearch', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

})();

