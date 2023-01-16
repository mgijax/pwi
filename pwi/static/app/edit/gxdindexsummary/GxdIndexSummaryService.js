(function() {
	'use strict';
	angular.module('pwi.gxdindexsummary')
		.factory('GxdIndexGetByJnumAPI', GxdIndexGetByJnumAPIResource)
		.factory('GxdIndexGetByMarkerAPI', GxdIndexGetByMarkerAPIResource)
		.factory('GxdIndexValidJnumAPI', GxdIndexValidJnumAPIResource)
		;

	//
	function GxdIndexGetByJnumAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'gxdindex/getIndexByRef', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	//
	function GxdIndexGetByMarkerAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'gxdindex/getIndexByMarker', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}
        //
        function GxdIndexValidJnumAPIResource($resource, JAVA_API_URL) {
            return $resource(JAVA_API_URL + 'reference/validJnum/:key', {}, {
                'get': { method: 'GET', isArray: true }
                });
        }
})();

