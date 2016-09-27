(function() {
	'use strict';
	angular.module('pwi.gxd')
		.factory('GxdExperimentAPI', GxdExperimentAPIResource)
		.factory('GxdExperimentSearchAPI', GxdExperimentSearchAPIResource)
		.factory('GxdExperimentSummarySearchAPI', GxdExperimentSummarySearchAPIResource)
		.factory('GxdExperimentCountAPI', GxdExperimentCountAPIResource)
		.factory('GxdExperimentSampleAPI', GxdExperimentSampleAPIResource);

	function GxdExperimentAPIResource($resource) {
		return $resource('/pwi/api/gxdhtexperiment/:key', {key: '@key'}, {
			update: { method: 'PUT' }
		});
	}
	function GxdExperimentSampleAPIResource($resource) {
		return $resource('/pwi/api/gxdhtexperiment/:_experiment_key/samples', {_experiment_key: '@_experiment_key'});
	}
	function GxdExperimentSearchAPIResource($resource) {
		return $resource('/pwi/api/gxdhtexperiment/search', {}, {
			'search': { method: 'POST' }
		});
	}
	function GxdExperimentCountAPIResource($resource) {
		return $resource('/pwi/api/gxdhtexperiment/count');
	}
	function GxdExperimentSummarySearchAPIResource($resource) {
		return $resource('/pwi/api/gxdhtexperiment/summary', {}, {
			'search': { method: 'POST' }
		});
	}

})();
