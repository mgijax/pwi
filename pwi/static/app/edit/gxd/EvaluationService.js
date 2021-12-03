(function() {
	'use strict';
	angular.module('pwi.gxd')
		.factory('GxdExperimentAPI', GxdExperimentAPIResource)
		.factory('GxdExperimentSearchAPI', GxdExperimentSearchAPIResource)
		.factory('GxdExperimentSummarySearchAPI', GxdExperimentSummarySearchAPIResource)
		.factory('GxdExperimentCountAPI', GxdExperimentCountAPIResource)
		.factory('GxdGenotypeSearchAPI', GxdGenotypeSearchAPIResource)
		.factory('GxdExperimentSampleAPI', GxdExperimentSampleAPIResource)
		.factory('GxdHTSampleOrganismSearchAPI', GxdHTSampleOrganismSearchAPIResource)
		;

	// search
	function GxdExperimentSummarySearchAPIResource($resource, JAVA_API_URL) {

		return $resource(JAVA_API_URL + 'ht/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// experiment retrieval by key
	function GxdExperimentSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'ht/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// update
	function GxdExperimentAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'ht', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// raw sample search
	function GxdExperimentSampleAPIResource($resource, JAVA_API_URL) {

		return $resource(JAVA_API_URL + 'htrawsample/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}


	function GxdExperimentCountAPIResource($resource) {
		return $resource('/pwi/api/gxdhtexperiment/count');
	}

	function GxdGenotypeSearchAPIResource($resource) {
		return $resource('/pwi/api/gxdgenotype/search', {}, {
			'search': { method: 'POST' }
		});
	}

	function GxdHTSampleOrganismSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'organism/searchGXDHTSample', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

})();
