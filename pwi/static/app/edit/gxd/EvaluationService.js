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

	function GxdExperimentAPIResource($resource) {
		return $resource('/pwi/api/gxdhtexperiment/:key', {key: '@key'}, {
			update: { method: 'PUT' }
		});
	}

	function GxdExperimentSampleAPIResource($resource, JAVA_API_URL) {

		return $resource(JAVA_API_URL + 'htrawsample/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

//	function GxdExperimentSampleAPIResource($resource) {
//		return $resource('/pwi/api/gxdhtexperiment/:_experiment_key/samples', {_experiment_key: '@_experiment_key'});
//	}


//	function GxdExperimentSearchAPIResource($resource) {
//		return $resource('/pwi/api/gxdhtexperiment/search', {}, {
//			'search': { method: 'POST' }
//		});
//	}

	// object retrieval by key
	function GxdExperimentSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'ht/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	function GxdExperimentCountAPIResource($resource) {
		return $resource('/pwi/api/gxdhtexperiment/count');
	}
	function GxdExperimentSummarySearchAPIResource($resource, JAVA_API_URL) {

		return $resource(JAVA_API_URL + 'ht/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
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
