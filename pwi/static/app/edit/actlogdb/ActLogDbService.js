(function() {
	'use strict';
	angular.module('pwi.actlogdb')
		.factory('LDBSearchAPI',		LDBSearchAPIResource)
		.factory('LDBGetAPI',		LDBGetAPIResource)
		.factory('LDBUpdateAPI',		LDBUpdateAPIResource)
		.factory('LDBTotalCountAPI',	LDBTotalCountAPIResource)
		;

	// object summary search
	function LDBSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'logicaldb/search', {}, {
			'search': { method: 'POST' }
		});
	}

	// object retrieval by key
	function LDBGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'logicaldb/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// object modification
	function LDBUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'logicaldb', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// total number of records
	function LDBTotalCountAPIResource($resource, JAVA_API_URL) {
		console.log(JAVA_API_URL + 'logicaldb/getObjectCount', {}, {
                        'getObjectCount': { method: 'JSONP' }
                });
		return $resource(JAVA_API_URL + 'logicaldb/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	
	
})();

