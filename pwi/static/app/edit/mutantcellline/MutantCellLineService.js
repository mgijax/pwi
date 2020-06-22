(function() {
	'use strict';
	angular.module('pwi.mutantcellline')
		.factory('MutantCellLineSearchAPI',		MutantCellLineSearchAPIResource)
		.factory('MutantCellLineGetAPI',		MutantCellLineGetAPIResource)
                .factory('MutantCellLineCreateAPI',             MutantCellLineCreateAPIResource)
		.factory('MutantCellLineUpdateAPI',		MutantCellLineUpdateAPIResource)
		.factory('MutantCellLineDeleteAPI',		MutantCellLineDeleteAPIResource)
		.factory('MutantCellLineTotalCountAPI',	        MutantCellLineTotalCountAPIResource)
		;

	// object summary search
	function MutantCellLineSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function MutantCellLineGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// create
	function MutantCellLineCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'allele', {},
			{'create': { method: 'POST', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// update
	function MutantCellLineUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'allele', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// delete
	function MutantCellLineDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'allele/:key', {},
			{'delete': { method: 'DELETE', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// total number of records
	function MutantCellLineTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	
	
})();

