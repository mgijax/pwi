(function() {
	'use strict';
	angular.module('pwi.mappingdetail')
		.factory('MappingSearchAPI',	        MappingSearchAPIResource)
		.factory('MappingGetAPI',	        MappingGetAPIResource)
		;

	//
	function MappingSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'mapping/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	//
	function MappingGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'mapping/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}
})();

