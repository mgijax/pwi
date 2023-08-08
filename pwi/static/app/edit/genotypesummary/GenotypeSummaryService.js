(function() {
	'use strict';
	angular.module('pwi.genotypesummary')
		.factory('GenotypeGetByRefAPI', GenotypeGetByRefAPIResource)
		.factory('GenotypeGetByClipboardAPI', GenotypeGetByClipboardAPIResource)
		;

	// get genotype by ref id
	function GenotypeGetByRefAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotype/getGenotypeByRef', {}, {
			'search': { method: 'GET', isArray: false }
		});
	}

	// get genotype by clipboard/user
	function GenotypeGetByClipboardAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotype/getGenotypeByClipboard', {}, {
			'search': { method: 'GET', isArray: false }
		});
	}

})();

