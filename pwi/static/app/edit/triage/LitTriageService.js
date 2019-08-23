(function() {
	'use strict';
	angular.module('pwi.triage')
		.factory('TriageSearchAPI', TriageSearchAPIResource)
		.factory('ReferenceSearchAPI', ReferenceAPIResource)
		.factory('ReferenceCreateAPI', ReferenceCreateAPIResource)
		.factory('ReferenceUpdateAPI', ReferenceUpdateAPIResource)
		.factory('ReferenceDeleteAPI', ReferenceDeleteAPIResource)
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

	function ReferenceCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'reference', {},
				{'create': { method: 'POST', 
				 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	

	function ReferenceUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'littriage', {},
				{'update': { method: 'PUT', 
				 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}
	
	function ReferenceDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'reference/:key', {},
				{'delete': { method: 'DELETE', 
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

