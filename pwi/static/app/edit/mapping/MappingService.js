(function() {
	'use strict';
	angular.module('pwi.mappingexpts')
		.factory('MappingSearchAPI',	        MappingSearchAPIResource)
		.factory('MappingGetAPI',		MappingGetAPIResource)
                .factory('MappingCreateAPI',           MappingCreateAPIResource)
		.factory('MappingUpdateAPI',	        MappingUpdateAPIResource)
		.factory('MappingDeleteAPI',	        MappingDeleteAPIResource)
		.factory('MappingTotalCountAPI',	MappingTotalCountAPIResource)
		.factory('ExptTypeSearchAPI',	        ExptTypeSearchAPIResource)
		;

	// object summary search
	function MappingSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'mappingexpts/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function MappingGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'mappingexpts/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// create
	function MappingCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'mappingexpts', {},
			{'create': { method: 'POST', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// update
	function MappingUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'mappingexpts', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// delete
	function MappingDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'mappingexpts/:key', {},
			{'delete': { method: 'DELETE', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// total number of records
	function MappingTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'mappingexpts/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	
	
        // mgi types
        function ExptTypeSearchAPIResource($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'mappingexts/searchExptType', {}, {
	                'search': { method: 'POST', isArray: true }
                });
        }

})();

