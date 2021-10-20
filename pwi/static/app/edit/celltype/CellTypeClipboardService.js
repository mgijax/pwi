(function() {
	'use strict';
	angular.module('pwi.gxd')
		.factory('TermSearchAPI', TermSearchAPIResource)
		.factory('EMAPAClipboardSortAPI', EMAPAClipboardSortAPIResource)
		.factory('EMAPADetailAPI', EMAPADetailAPIResource);


	function TermSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'term/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}
	
	function EMAPAClipboardSortAPIResource($resource, API_PATH) {
		return $resource(API_PATH + 'EMAPA/emapaClipboard/sort');
	}
	
	function EMAPADetailAPIResource($resource, API_PATH) {
		return $resource(API_PATH + 'EMAPA/detail/:id');
	}
	
	

})();
