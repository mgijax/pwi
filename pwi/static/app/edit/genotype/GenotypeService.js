(function() {
	'use strict';
	angular.module('pwi.genotype')
		.factory('GenotypeSearchAPI',		GenotypeSearchAPIResource)
		.factory('GenotypeGetAPI',		GenotypeGetAPIResource)
		.factory('GenotypeUpdateAPI',		GenotypeUpdateAPIResource)
		.factory('GenotypeTotalCountAPI',	GenotypeTotalCountAPIResource)
		;

	// object summary search
	function GenotypeSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotype/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function GenotypeGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotype/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// object modification
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
	
})();

