(function() {
	'use strict';
	angular.module('pwi.gxd')
		.factory('GxdIndexAPI', GxdIndexAPIResource)
		.factory('GxdIndexCountAPI', GxdIndexCountAPIResource)
		.factory('GxdIndexSearchAPI', GxdIndexSearchAPIResource)
		.factory('ValidMarkerAPI', ValidMarkerResource)
		.factory('ValidReferenceAPI', ValidReferenceResource);

	function GxdIndexAPIResource($resource, API_PATH) {
		return $resource(API_PATH + 'gxdindex/:key', null, {
			'update': { method: 'PUT' }
		});
	}
	function GxdIndexCountAPIResource($resource, API_PATH) {
		return $resource(API_PATH + 'gxdindex/count');
	}
	function GxdIndexSearchAPIResource($resource, API_PATH) {
		return $resource(API_PATH + 'gxdindex/search', {}, {
			'search': { method: 'POST' }
		});
	}
	/*
	 * Validating Marker symbol
	 */
	function ValidMarkerResource($resource, API_PATH) {
		return $resource(API_PATH + 'marker/valid');
	}
	
	/*
	 * Validating Reference J-Number
	 */
	function ValidReferenceResource($resource, API_PATH) {
		return $resource(API_PATH + 'reference/valid');
	}

})();
