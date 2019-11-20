(function() {
	'use strict';
	angular.module('pwi.genotype')
		.factory('GenotypeSearchAPI',		GenotypeSearchAPIResource)
		.factory('GenotypeGetAPI',		GenotypeGetAPIResource)
		.factory('GenotypeUpdateAPI',		GenotypeUpdateAPIResource)
		.factory('GenotypeTotalCountAPI',	GenotypeTotalCountAPIResource)
		.factory('GenotypeGetDataSetsAPI',	GenotypeGetDataSetsAPIResource)
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

	// modification
	function GenotypeUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'genotype', {},
			{'update': { method: 'PUT', 
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

})();

