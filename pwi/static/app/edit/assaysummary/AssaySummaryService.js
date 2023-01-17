(function() {
	'use strict';
	angular.module('pwi.assaysummary')
		.factory('AssayGetByRefAPI', AssayGetByRefAPIResource)
		.factory('AssayGetByMarkerAPI', AssayGetByMarkerAPIResource)
		.factory('AssayGetByAlleleAPI', AssayGetByAlleleAPIResource)
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

})();

