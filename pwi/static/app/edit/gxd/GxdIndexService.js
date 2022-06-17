(function() {
	'use strict';
	angular.module('pwi.gxd')
		.factory('GxdIndexSearchAPI',	        GxdIndexSearchAPIResource)
		.factory('GxdIndexGetAPI',		GxdIndexGetAPIResource)
                .factory('GxdIndexCreateAPI',           GxdIndexCreateAPIResource)
		.factory('GxdIndexUpdateAPI',	        GxdIndexUpdateAPIResource)
		.factory('GxdIndexDeleteAPI',	        GxdIndexDeleteAPIResource)
		.factory('GxdIndexTotalCountAPI',	GxdIndexTotalCountAPIResource)
		;

	// object summary search
	function GxdIndexSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'gxdindex/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function GxdIndexGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'gxdindex/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// create
	function GxdIndexCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'gxdindex', {},
			{'create': { method: 'POST', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// update
	function GxdIndexUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'gxdindex', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// delete
	function GxdIndexDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'gxdindex/:key', {},
			{'delete': { method: 'DELETE', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// total number of records
	function GxdIndexTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'gxdindex/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	
	
})();

