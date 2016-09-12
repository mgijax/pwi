(function() {
	'use strict';
	angular.module('pwi.gxd')
		.factory('GxdIndexAPI', GxdIndexAPIResource)
		.factory('GxdIndexCountAPI', GxdIndexCountAPIResource)
		.factory('GxdIndexSearchAPI', GxdIndexSearchAPIResource)
		.factory('ValidMarkerAPI', ValidMarkerResource)
		.factory('ValidReferenceAPI', ValidReferenceResource);

	function GxdIndexAPIResource($resource) {
		return $resource('/pwi/api/gxdindex/:key', null, {
			'update': { method: 'PUT' }
		});
	}
	function GxdIndexCountAPIResource($resource) {
		return $resource('/pwi/api/gxdindex/count');
	}
	function GxdIndexSearchAPIResource($resource) {
		return $resource('/pwi/api/gxdindex/search', {}, {
			'search': { method: 'POST' }
		});
	}
	/*
	 * Validating Marker symbol
	 */
	function ValidMarkerResource($resource) {
		return $resource('/pwi/api/marker/valid');
	}
	
	/*
	 * Validating Reference J-Number
	 */
	function ValidReferenceResource($resource) {
		return $resource('/pwi/api/reference/valid');
	}

})();
