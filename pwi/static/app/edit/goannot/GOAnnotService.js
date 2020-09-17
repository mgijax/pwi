(function() {
	'use strict';
	angular.module('pwi.goannot')
		.factory('GOAnnotSearchAPI',		GOAnnotSearchAPIResource)
		.factory('GOAnnotGetAPI',		GOAnnotGetAPIResource)
		.factory('GOAnnotUpdateAPI',		GOAnnotUpdateAPIResource)
		.factory('GOAnnotTotalCountAPI',	GOAnnotTotalCountAPIResource)
		.factory('GOAnnotGetReferencesAPI',	GOAnnotGetReferencesAPIResource)
		.factory('GOAnnotOrderByAPI',	        GOAnnotOrderByAPIResource)
		.factory('GOAnnotReferenceReportAPI',	GOAnnotReferenceReportAPIResource)
		.factory('GOAnnotIsoformAPI',	        GOAnnotIsoformAPIResource)
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

	// reference report
	function GOAnnotReferenceReportAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'markerGOannot/getReferenceReport', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// validate GO-Isform
	function GOAnnotIsoformAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'accession/validateGOIsoform', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

})();

