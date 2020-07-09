(function() {
	'use strict';
	angular.module('pwi.mutantcellline')
		.factory('MutantCellLineSearchAPI',		MutantCellLineSearchAPIResource)
		.factory('MutantCellLineGetAPI',		MutantCellLineGetAPIResource)
                .factory('MutantCellLineCreateAPI',             MutantCellLineCreateAPIResource)
		.factory('MutantCellLineUpdateAPI',		MutantCellLineUpdateAPIResource)
		.factory('MutantCellLineDeleteAPI',		MutantCellLineDeleteAPIResource)
		.factory('MutantCellLineTotalCountAPI',	        MutantCellLineTotalCountAPIResource)
		.factory('DerivationGetAPI',		        DerivationGetAPIResource)
		.factory('DerivationSearchMCLSetAPI',		DerivationSearchMCLSetAPIResource)
		;

	// object summary search
	function MutantCellLineSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'cellline/searchMutantCellLines', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function MutantCellLineGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'cellline/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// create
	function MutantCellLineCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'cellline', {},
			{'create': { method: 'POST', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// update
	function MutantCellLineUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'cellline', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// delete
	function MutantCellLineDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'cellline', {},
			{'delete': { method: 'DELETE', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// total number of records
	function MutantCellLineTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'cellline/getMutantCellLineCount', {}, {
			'getMutantCellLineCount': { method: 'JSONP' } 
		});
	}	
	
	// object retrieval by key
	function DerivationGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allelecelllinederivation/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// derivations for mutant cell line set
	function DerivationSearchMCLSetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allelecelllinederivation/searchMCLSet', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

})();

