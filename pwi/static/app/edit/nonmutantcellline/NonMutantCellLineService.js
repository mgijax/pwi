(function() {
	'use strict';
	angular.module('pwi.nonmutantcellline')
		.factory('NonMutantCellLineSearchAPI',		NonMutantCellLineSearchAPIResource)
		.factory('NonMutantCellLineGetAPI',		NonMutantCellLineGetAPIResource)
                .factory('NonMutantCellLineCreateAPI',          NonMutantCellLineCreateAPIResource)
		.factory('NonMutantCellLineUpdateAPI',		NonMutantCellLineUpdateAPIResource)
		.factory('NonMutantCellLineDeleteAPI',		NonMutantCellLineDeleteAPIResource)
		.factory('NonMutantCellLineTotalCountAPI',	NonMutantCellLineTotalCountAPIResource)
		.factory('NonMutantCellLineMCLCountAPI',	NonMutantCellLineMCLCountAPIResource)
		;

	// cell line search
	function NonMutantCellLineSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'cellline/searchParentCellLines', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function NonMutantCellLineGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'cellline/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// create
	function NonMutantCellLineCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'cellline', {},
			{'create': { method: 'POST', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// update
	function NonMutantCellLineUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'cellline', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// delete
	function NonMutantCellLineDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'cellline/:key', {},
			{'delete': { method: 'DELETE', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// total number of records
	function NonMutantCellLineTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'cellline/getParentCellLineCount', {}, {
			'getParentCellLineCount': { method: 'JSONP' } 
		});
	}	
	
	// mcl number of records by parent cell line key
	function NonMutantCellLineMCLCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'cellline/getMCLCountByParentCellLine', {}, {
			'search': { method: 'POST' } 
		});
	}	
	
})();

