(function() {
	'use strict';
	angular.module('pwi.allelederivation')
		.factory('AlleleDerivationSearchAPI',		AlleleDerivationSearchAPIResource)
		.factory('ParentCellLineSearchAPI',		ParentCellLineSearchAPIResource)
		.factory('AlleleDerivationGetAPI',		AlleleDerivationGetAPIResource)
                .factory('AlleleDerivationCreateAPI',             AlleleDerivationCreateAPIResource)
		.factory('AlleleDerivationUpdateAPI',		AlleleDerivationUpdateAPIResource)
		.factory('AlleleDerivationDeleteAPI',		AlleleDerivationDeleteAPIResource)
		.factory('AlleleDerivationTotalCountAPI',	        AlleleDerivationTotalCountAPIResource)
		.factory('DerivationSearchMCLAPI',		DerivationSearchMCLAPIResource)
		;

	// mutant cell line search
	function AlleleDerivationSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allelecelllinederivation/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// parent cell line search
	function ParentCellLineSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'cellline/searchParentCellLines', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function AlleleDerivationGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allelecelllinederivation/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// create
	function AlleleDerivationCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'allelecelllinederivation', {},
			{'create': { method: 'POST', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// update
	function AlleleDerivationUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'allelecelllinederivation', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// delete
	function AlleleDerivationDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'allelecelllinederivation', {},
			{'delete': { method: 'DELETE', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// total number of records
	function AlleleDerivationTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allelecelllinederivation/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	
	
	// derivations for mutant cell line set
	function DerivationSearchMCLAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allelecelllinederivation/searchMCLSet', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}
        

})();

