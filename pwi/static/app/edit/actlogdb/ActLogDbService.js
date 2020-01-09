(function() {
	'use strict';
	angular.module('pwi.actlogdb')
		.factory('LDBSearchAPI',	LDBSearchAPIResource)
		.factory('LDBGetAPI',		LDBGetAPIResource)
		.factory('LDBCreateAPI',        LDBCreateAPIResource)
		.factory('LDBUpdateAPI',	LDBUpdateAPIResource)
		.factory('LDBDeleteAPI',	LDBDeleteAPIResource)
		.factory('LDBTotalCountAPI',	LDBTotalCountAPIResource)
		.factory('OrganismSearchAPI',   OrganismSearchAPIResource)
		;

	// object summary search
	function LDBSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'logicaldb/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function LDBGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'logicaldb/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// object create
        function LDBCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
                return $resource(JAVA_API_URL + 'logicaldb', {},
                                {'create': { method: 'POST',
                                headers: { 'api_access_token': access_token, 'username': USERNAME }
                                }
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

	// object deletion	
	function LDBDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
                return $resource(JAVA_API_URL + 'logicaldb/:key', {},
                        {'delete': { method: 'DELETE',
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
	// all organisms
	function OrganismSearchAPIResource($resource, JAVA_API_URL) {
	         return $resource(JAVA_API_URL + 'organism/search', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }

	
})();

