(function() {
	'use strict';
	angular.module('pwi.resultsummary')
		.factory('ResultGetByRefAPI',       ResultGetByRefAPIResource)
		.factory('ResultGetByMarkerAPI',    ResultGetByMarkerAPIResource)
		.factory('ResultGetByStructureAPI', ResultGetByStructureAPIResource)
		.factory('ResultGetByCellTypeAPI',  ResultGetByCellTypeAPIResource)
		;

	//
	function ResultGetByRefAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/getResultByRef', {}, {
			'search': { method: 'POST', isArray: false }
		});
	}
	//
	function ResultGetByMarkerAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/getResultByMarker', {}, {
			'search': { method: 'POST', isArray: false }
		});
	}
	//
	function ResultGetByStructureAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/getResultByStructure', {}, {
			'search': { method: 'POST', isArray: false }
		});
	}
	//
	function ResultGetByCellTypeAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/getResultByCellType', {}, {
			'search': { method: 'POST', isArray: false }
		});
	}

})();

