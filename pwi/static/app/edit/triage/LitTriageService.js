(function() {
	'use strict';
	angular.module('pwi.triage')
		.factory('TriageSearchAPI', TriageSearchAPIResource)
		.factory('ReferenceSearchAPI', ReferenceAPIResource)
		.factory('ActualDbSearchAPI', ActualDbSearchAPIResource);


	function TriageSearchAPIResource($resource, API_PATH) {
		return $resource(API_PATH + 'reference/search', {}, {
			'search': { method: 'POST' }
		});
	}

	function ReferenceAPIResource($resource, API_PATH) {
		return $resource(API_PATH + 'reference/:key', {}, {
			'': { method: 'GET' }
		});
	}

	function ActualDbSearchAPIResource($resource, API_PATH) {
		return $resource(API_PATH + 'actualdb/search', {}, {
			'search': { method: 'POST' }
		});
	}

	
})();


