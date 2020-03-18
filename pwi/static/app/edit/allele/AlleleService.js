(function() {
	'use strict';
	angular.module('pwi.goannot')
		.factory('AlleleSearchAPI',		AlleleSearchAPIResource)
		.factory('AlleleGetAPI',		AlleleGetAPIResource)
		.factory('AlleleUpdateAPI',		AlleleUpdateAPIResource)
		.factory('AlleleTotalCountAPI',	AlleleTotalCountAPIResource)
		.factory('AlleleGetReferencesAPI',	AlleleGetReferencesAPIResource)
		.factory('AlleleOrderByAPI',	        AlleleOrderByAPIResource)
		.factory('AlleleReferenceReportAPI',	AlleleReferenceReportAPIResource)
		//.factory('MarkerStatusSearchAPI',	MarkerStatusSearchAPIResource)
		//.factory('MarkerTypeSearchAPI',	MarkerTypeSearchAPIResource)
		;

	// object summary search
	function AlleleSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'markerGOannot/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function AlleleGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'markerGOannot/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// object modification
	function AlleleUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'markerGOannot', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// total number of records
	function AlleleTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'markerGOannot/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	
	
	// markerAllele/getReferences
	function AlleleGetReferencesAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'markerGOannot/getReferences/:key', {}, {
			'': { method: 'JSONP' , isArray: true}
		});
	}

	// order by search results
	function AlleleOrderByAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'markerGOannot/getOrderBy', {}, {
			'search': { method: 'POST'}
		});
	}

	// reference report
	function AlleleReferenceReportAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'markerGOannot/getReferenceReport', {}, {
			'search': { method: 'POST', isArray: true }
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

