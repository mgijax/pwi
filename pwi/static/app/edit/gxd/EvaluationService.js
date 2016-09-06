(function() {
	'use strict';
	angular.module('pwi.gxd')
		.factory('GxdExperimentAPI', GxdExperimentAPIResource)
		.factory('GxdExperimentSearchAPI', GxdExperimentSearchAPIResource)
		.factory('GxdRawSampleAPI', GxdRawSampleAPIResource);

	function GxdExperimentAPIResource($resource) {
		return $resource('/pwi/api/gxdhtexperiment/:key');
	}
	function GxdExperimentSearchAPIResource($resource) {
		return $resource('/pwi/api/gxdhtexperiment/search', {}, {
			'search': { method: 'POST' }
		});
	}
	function GxdRawSampleAPIResource($resource) {
		return $resource('/pwi/api/gxdhtsample/search_raw', {}, {
			'search': { method: 'POST' }
		});
	}

})();
