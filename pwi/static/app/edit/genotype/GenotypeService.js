(function() {
	'use strict';
	angular.module('pwi.genotype')
		.factory('GenotypeSearchAPI',		GenotypeSearchAPIResource)
		.factory('GenotypeGetAPI',		GenotypeGetAPIResource)
		.factory('GenotypeCreateAPI',		GenotypeCreateAPIResource)
		.factory('GenotypeCreateStrainAPI',	GenotypeCreateStrainAPIResource)
		.factory('GenotypeUpdateAPI',		GenotypeUpdateAPIResource)
		.factory('GenotypeDeleteAPI',		GenotypeDeleteAPIResource)
		.factory('GenotypeTotalCountAPI',	GenotypeTotalCountAPIResource)
		.factory('GenotypeGetDataSetsAPI',	GenotypeGetDataSetsAPIResource)
		.factory('GenotypeSearchDataSetsAPI',	GenotypeSearchDataSetsAPIResource)
		.factory('ValidateAlleleStateAPI',	ValidateAlleleStateAPIResource)
		.factory('ValidateMutantCellLinesAPI',	ValidateMutantCellLinesAPIResource)
		;

	// summary search
	function GenotypeSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotype/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// retrieval by key
	function GenotypeGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotype/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// create
	function GenotypeCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'genotype', {},
			{'create': { method: 'POST', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// create strain
	function GenotypeCreateStrainAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'strain', {},
				{'create': { method: 'POST', 
				 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	

	// modification
	function GenotypeUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'genotype', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// delete
	function GenotypeDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'genotype/:key', {},
			{'delete': { method: 'DELETE', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// total number of records
	function GenotypeTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotype/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	
	
	// genotype/getDataSets
	function GenotypeGetDataSetsAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotype/getDataSets/:key', {}, {
			'': { method: 'JSONP' , isArray: true}
		});
	}

	// genotype/searchDataSets
	function GenotypeSearchDataSetsAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotype/searchDataSets/:key', {}, {
			'': { method: 'JSONP' , isArray: true}
		});
	}

	// allele pair state
	function ValidateAlleleStateAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allelepair/validateAlleleState', {}, {
			'validate': { method: 'POST'}
		});
	}

	// mutant cell lines
	function ValidateMutantCellLinesAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allelepair/validateMutantCellLines', {}, {
			'validate': { method: 'POST'}
		});
	}

})();

