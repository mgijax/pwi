(function() {
	'use strict';
	angular.module('pwi.mutantcellline')
		.factory('MutantCellLineSearchAPI',		MutantCellLineSearchAPIResource)
		.factory('MutantCellLineGetAPI',		MutantCellLineGetAPIResource)
                .factory('MutantCellLineCreateAPI',             MutantCellLineCreateAPIResource)
		.factory('MutantCellLineUpdateAPI',		MutantCellLineUpdateAPIResource)
		.factory('MutantCellLineDeleteAPI',		MutantCellLineDeleteAPIResource)
		.factory('MutantCellLineTotalCountAPI',	        MutantCellLineTotalCountAPIResource)
		.factory('DerivationSearchMCLSetAPI',		DerivationSearchMCLSetAPIResource)
		.factory('AlleleGetByMCLAPI',		        AlleleGetByMCLAPIResource)
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
	
	// derivations for mutant cell line set
	function DerivationSearchMCLSetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allelecelllinederivation/searchMCLSet', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// allele by mutant cell line key
	function AlleleGetByMCLAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/getSlimByMCL', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

})();

