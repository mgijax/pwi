(function() {
	'use strict';
	angular.module('pwi.assaysummary')
		.factory('AssayGetByRefAPI', AssayGetByRefAPIResource)
		.factory('AssayGetByMarkerAPI', AssayGetByMarkerAPIResource)
		.factory('AssayGetByAlleleAPI', AssayGetByAlleleAPIResource)
		.factory('AssayGetByAntibodyAPI', AssayGetByAntibodyAPIResource)
		.factory('AssayGetByProbeAPI', AssayGetByProbeAPIResource)
		;

	//
	function AssayGetByRefAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/getAssayByRef', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}
	//
	function AssayGetByMarkerAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/getAssayByMarker', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}
	//
	function AssayGetByAlleleAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/getAssayByAllele', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}
	//
	function AssayGetByAntibodyAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/getAssayByAntibody', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}
	//
	function AssayGetByProbeAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/getAssayByProbe', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}
})();

