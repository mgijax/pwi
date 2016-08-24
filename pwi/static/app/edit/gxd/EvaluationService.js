(function() {
	'use strict';
	angular.module('pwi.gxd')
		.factory('GxdExperimentAPI', GxdExperimentAPIResource)
		.factory('GxdExperimentSearchAPI', GxdExperimentSearchAPIResource);

	function GxdExperimentAPIResource($resource) {
		return $resource('/pwi/api/gxdhtexperiment/:key');
	}
	function GxdExperimentSearchAPIResource($resource) {
		return $resource('/pwi/api/gxdhtexperiment/search', {}, {
			'search': { method: 'POST' }
		});
	}

})();
