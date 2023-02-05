(function() {
	'use strict';
	angular.module('pwi.referencesummary')
		.factory('ReferenceGetByMarkerAPI', ReferenceGetByMarkerAPIResource)
		.factory('ReferenceGetByAlleleAPI', ReferenceGetByAlleleAPIResource)
		.factory('ReferenceGetByJnumsAPI',  ReferenceGetByJnumsAPIResource)
		.factory('ReferenceGetBySearchAPI',  ReferenceGetBySearchAPIResource)
		;

	//
	function ReferenceGetByMarkerAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'reference/getRefByMarker', {}, {
			'search': { method: 'GET', isArray: false }
		});
	}
	//
	function ReferenceGetByAlleleAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'reference/getRefByAllele', {}, {
			'search': { method: 'GET', isArray: false }
		});
	}
	//
	function ReferenceGetByJnumsAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'reference/getRefByJnums', {}, {
			'search': { method: 'GET', isArray: false }
		});
	}
	//
	function ReferenceGetBySearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'reference/getRefBySearch', {}, {
			'search': { method: 'POST', isArray: false }
		});
	}

})();

