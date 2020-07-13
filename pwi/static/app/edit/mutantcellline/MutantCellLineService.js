(function() {
	'use strict';
	angular.module('pwi.mutantcellline')
		.factory('MutantCellLineSearchAPI',		MutantCellLineSearchAPIResource)
		.factory('MutantCellLineGetAPI',		MutantCellLineGetAPIResource)
                .factory('MutantCellLineCreateAPI',             MutantCellLineCreateAPIResource)
		.factory('MutantCellLineUpdateAPI',		MutantCellLineUpdateAPIResource)
		.factory('MutantCellLineDeleteAPI',		MutantCellLineDeleteAPIResource)
		.factory('MutantCellLineTotalCountAPI',	        MutantCellLineTotalCountAPIResource)
		.factory('AlleleGetByMCLAPI',		        AlleleGetByMCLAPIResource)
		.factory('DerivationSearchMCLAPI',		DerivationSearchMCLAPIResource)
		.factory('LogicalDBSearchMCLAPI',		LogicalDBSearchMCLAPIResource)
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
		return $resource(JAVA_API_URL + 'cellline/:key', {},
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
	
	// allele by mutant cell line key
	function AlleleGetByMCLAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/getSlimByMCL', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// derivations for mutant cell line set
	function DerivationSearchMCLAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allelecelllinederivation/searchMCLSet', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}
        
	// logical db for mutant cell line set
	function LogicalDBSearchMCLAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'logicaldb/searchMCLSet', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}


})();

