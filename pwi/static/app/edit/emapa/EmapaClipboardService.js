(function() {
	'use strict';
	angular.module('pwi.gxd')
		.factory('EMAPASearchAPI', EMAPASearchAPIResource)
		.factory('EMAPAClipboardAPI', EMAPAClipboardAPIResource)
		.factory('EMAPAClipboardSortAPI', EMAPAClipboardSortAPIResource)
		.factory('EMAPADetailAPI', EMAPADetailAPIResource);


	function EMAPASearchAPIResource($resource, API_PATH) {
		return $resource(API_PATH + 'EMAPA/search', {}, {
			'search': { method: 'POST' }
		});
	}
	
	function EMAPAClipboardAPIResource($resource, API_PATH) {
		return $resource(API_PATH + 'EMAPA/emapaClipboard/:key');
	}
	
	function EMAPAClipboardSortAPIResource($resource, API_PATH) {
		return $resource(API_PATH + 'EMAPA/emapaClipboard/sort');
	}
	
	function EMAPADetailAPIResource($resource, API_PATH) {
		return $resource(API_PATH + 'EMAPA/detail/:id');
	}
	
	

})();
