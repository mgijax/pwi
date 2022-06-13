(function() {
	'use strict';
	angular.module('pwi.alleledetail')
		.factory('AlleleSearchAPI',	        AlleleSearchAPIResource)
		.factory('AlleleGetAPI',	        AlleleGetAPIResource)
		;

	// object summary search
	function AlleleSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function AlleleGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

})();

