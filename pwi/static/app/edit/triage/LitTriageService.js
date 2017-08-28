(function() {
	'use strict';
	angular.module('pwi.triage')
		.factory('TriageSearchAPI', TriageSearchAPIResource)
		.factory('ReferenceSearchAPI', ReferenceAPIResource)
		.factory('ReferenceUpdateAPI', ReferenceUpdateAPIResource)
		.factory('ReferenceBatchRefUpdateTagAPI', ReferenceBatchRefUpdateTagAPIResource)
		.factory('ActualDbSearchAPI', ActualDbSearchAPIResource);


	function TriageSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'reference/search', {}, {
			'search': { method: 'GET' }
		});
	}

	function ReferenceAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'reference/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	function ActualDbSearchAPIResource($resource, API_PATH) {
		return $resource(API_PATH + 'actualdb/search', {}, {
			'search': { method: 'POST' }
		});
	}

	function ReferenceUpdateAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'reference', {},
				{'update': { method: 'PUT', 
							 headers: { 'api_access_token': access_token } 
				}
		});
	}
	
	function ReferenceBatchRefUpdateTagAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'reference/bulkUpdate', null, {
			'update': { method: 'PUT' }
		});
	}
	
})();


