(function() {
	'use strict';
	angular.module('pwi.triage')
		.factory('TriageSearchAPI', TriageSearchAPIResource)
		.factory('ReferenceSearchAPI', ReferenceAPIResource)
		.factory('ReferenceUpdateAPI', ReferenceUpdateAPIResource)
		.factory('ReferenceBatchRefUpdateTagAPI', ReferenceBatchRefUpdateTagAPIResource)
		.factory('ActualDbSearchAPI', ActualDbSearchAPIResource);


	function TriageSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'littriage/search', {}, {
			'search': { method: 'POST' }
		});
	}

	function ReferenceAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'littriage/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	function ActualDbSearchAPIResource($resource, API_PATH) {
		return $resource(API_PATH + 'actualdb/search', {}, {
			'search': { method: 'POST' }
		});
	}

	function ReferenceUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'littriage', {},
				{'update': { method: 'PUT', 
							 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}
	
	function ReferenceBatchRefUpdateTagAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'littriage/bulkUpdate', {}, 
			{'update': { method: 'PUT',
						 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}
	
})();


