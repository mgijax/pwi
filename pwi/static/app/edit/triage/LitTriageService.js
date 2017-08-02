(function() {
	'use strict';
	angular.module('pwi.triage')
		.factory('TriageSearchAPI', TriageSearchAPIResource)
		.factory('ReferenceSearchAPI', ReferenceAPIResource)
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

	
})();


