(function() {
	'use strict';
	angular.module('pwi.mappingsummary')
		.factory('MappingGetByMarkerAPI', MappingGetByMarkerAPIResource)
		.factory('MappingGetByJnumAPI', MappingGetByJnumAPIResource)
		;

	//
	function MappingGetByMarkerAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'mapping/getExptsByMarker', {}, {
			'search': { method: 'GET', isArray: false }
		});
	}
	//
	function MappingGetByJnumAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'mapping/getExptsByRef', {}, {
			'search': { method: 'GET', isArray: false }
		});
	}

})();

