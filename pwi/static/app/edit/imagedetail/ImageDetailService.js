(function() {
	'use strict';
	angular.module('pwi.imagedetail')
		.factory('ImageSearchAPI',	        ImageSearchAPIResource)
		.factory('ImageGetAPI',		        ImageGetAPIResource)
		.factory('ImageSearchAssayAPI',		ImageSearchAssayAPIResource)
		;

	// object summary search
	function ImageSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'image/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function ImageGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'image/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// search assays by image key
	function ImageSearchAssayAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'image/searchAssayPanesByImage', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

})();

