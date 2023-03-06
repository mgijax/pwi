(function() {
	'use strict';
	angular.module('pwi.antibodysummary')
		.factory('AntibodyGetByMarkerAPI', AntibodyGetByMarkerAPIResource)
		.factory('AntibodyGetByJnumAPI', AntibodyGetByJnumAPIResource)
		;

	//
	function AntibodyGetByMarkerAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'antibody/getAntibodyByMarker', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}
	//
	function AntibodyGetByJnumAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'antibody/getAntibodyByRef', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

})();

