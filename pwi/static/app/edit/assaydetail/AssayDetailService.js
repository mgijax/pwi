(function() {
	'use strict';
	angular.module('pwi.assaydetail')
		.factory('AssaySearchAPI',	        AssaySearchAPIResource)
		.factory('AssayGetAPI',		        AssayGetAPIResource)
		;

	// object summary search
	function AssaySearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function AssayGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'assay/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

})();

