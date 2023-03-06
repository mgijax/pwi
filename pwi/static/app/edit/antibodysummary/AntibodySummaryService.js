(function() {
	'use strict';
	angular.module('pwi.antibodysummary')
		.factory('AntibodyGetByMarkerAPI', AntibodyGetByMarkerAPIResource)
		.factory('AntibodyGetByRefAPI', AntibodyGetByRefAPIResource)
		;

	//
	function AntibodyGetByMarkerAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'antibody/getAntibodyByMarker', {}, {
			'search': { method: 'GET', isArray: false }
		});
	}
	//
	function AntibodyGetByRefAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'antibody/getAntibodyByRef', {}, {
			'search': { method: 'GET', isArray: false }
		});
	}

})();

