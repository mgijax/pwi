(function() {
	'use strict';
	angular.module('pwi.triage')
		.factory('TriageSearchAPI', TriageSearchAPIResource);


	function TriageSearchAPIResource($resource, API_PATH) {
		return $resource(API_PATH + 'reference/search', {}, {
			'search': { method: 'POST' }
		});
	}

	
})();
