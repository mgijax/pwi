(function() {
	'use strict';
	angular.module('pwi.gxd')
		.factory('GxdExperimentAPI', GxdExperimentAPIResource)
		.factory('GxdExperimentSearchAPI', GxdExperimentSearchAPIResource)
		.factory('GxdExperimentSummarySearchAPI', GxdExperimentSummarySearchAPIResource)
		.factory('GxdExperimentTotalCountAPI', GxdExperimentTotalCountAPIResource)
		.factory('GxdGenotypeGetAPI', GxdGenotypeGetAPIResource)
		.factory('GxdGenotypeSearchAPI', GxdGenotypeSearchAPIResource)
		.factory('GxdExperimentSampleAPI', GxdExperimentSampleAPIResource)
		.factory('GxdHTSampleOrganismSearchAPI', GxdHTSampleOrganismSearchAPIResource)
		.factory('CellTypeHTSampleBySetUserAPI', CellTypeHTSampleBySetUserAPIResource)
		.factory('EmapaHTSampleBySetUserAPI', EmapaHTSampleBySetUserAPIResource)
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


	// total number of records
	function GxdExperimentTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'ht/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	

	function GxdGenotypeGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotype/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	function GxdGenotypeSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotype/search', {}, {
			'search': { method: 'POST', isArray: true } 
		});
	}

	function GxdHTSampleOrganismSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'organism/searchGXDHTSample', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// get celltype clipboard members
	function CellTypeHTSampleBySetUserAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'htsample/getCellTypeHTSampleBySetUser', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// get emapa clipboard members
	function EmapaHTSampleBySetUserAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'htsample/getEmapaHTSampleBySetUser', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

})();
