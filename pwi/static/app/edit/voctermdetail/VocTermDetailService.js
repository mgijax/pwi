(function() {
	'use strict';
	angular.module('pwi.voctermdetail')
		.factory('VocTermSearchAPI',	        VocTermSearchAPIResource)
		.factory('VocTermGetAPI',	        VocTermGetAPIResource)
                .factory('AccessionSearchAPI',          AccessionSearchAPIResource)        
                .factory('VocTermFamilyAPI',            VocTermFamilyAPIResource)
                .factory('VocTermFamilyEdgesAPI',       VocTermFamilyEdgesAPIResource)
		;

	//
	function VocTermSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'term/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	//
	function VocTermGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'term/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	//
	function AccessionSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'accession/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	//
	function VocTermFamilyAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'term/getTermFamilyByAccId', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}
	//
	function VocTermFamilyEdgesAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'term/getTermFamilyEdgesByAccId', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}
})();

