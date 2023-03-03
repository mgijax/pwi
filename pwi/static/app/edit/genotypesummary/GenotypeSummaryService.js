(function() {
	'use strict';
	angular.module('pwi.genotypesummary')
		.factory('GenotypeGetByJnumAPI', GenotypeGetByJnumAPIResource)
		;

	//
	function GenotypeGetByJnumAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotype/getGenotypeByRef', {}, {
			'search': { method: 'GET', isArray: false }
		});
	}

})();

