(function() {
	'use strict';
	angular.module('pwi.goannot')
		.factory('GOAnnotSearchAPI',		GOAnnotSearchAPIResource)
		.factory('GOAnnotGetAPI',		GOAnnotGetAPIResource)
		.factory('GOAnnotUpdateAPI',		GOAnnotUpdateAPIResource)
		.factory('GOAnnotTotalCountAPI',	GOAnnotTotalCountAPIResource)
		.factory('GOAnnotGetReferencesAPI',	GOAnnotGetReferencesAPIResource)
		.factory('GOAnnotOrderByAPI',	        GOAnnotOrderByAPIResource)
		//.factory('MarkerStatusSearchAPI',	MarkerStatusSearchAPIResource)
		//.factory('MarkerTypeSearchAPI',		MarkerTypeSearchAPIResource)
		;

	// object summary search
	function GOAnnotSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'markerGOannot/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function GOAnnotGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'markerGOannot/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// object modification
	function GOAnnotUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'markerGOannot', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// total number of records
	function GOAnnotTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'markerGOannot/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	
	
	// markerGOAnnot/getReferences
	function GOAnnotGetReferencesAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'markerGOannot/getReferences/:key', {}, {
			'': { method: 'JSONP' , isArray: true}
		});
	}

	// order by search results
	function GOAnnotOrderByAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'markerGOannot/getOrderBy', {}, {
			'search': { method: 'POST'}
		});
	}

	//function MarkerStatusSearchAPIResource($resource, JAVA_API_URL) {
	//	return $resource(JAVA_API_URL + 'markerStatus/search', {}, {
	//		'search': { method: 'POST', isArray: true }
	//	});
	//}

	//function MarkerTypeSearchAPIResource($resource, JAVA_API_URL) {
	//	return $resource(JAVA_API_URL + 'markerType/search', {}, {
	//		'search': { method: 'POST', isArray: true }
	//	});
	//}

})();

