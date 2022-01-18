(function() {
	'use strict';
	angular.module('pwi.allele')
		.factory('AlleleSearchAPI',		AlleleSearchAPIResource)
		.factory('AlleleGetAPI',		AlleleGetAPIResource)
                .factory('AlleleCreateAPI',             AlleleCreateAPIResource)
		.factory('AlleleUpdateAPI',		AlleleUpdateAPIResource)
		.factory('AlleleDeleteAPI',		AlleleDeleteAPIResource)
		.factory('AlleleTotalCountAPI',         AlleleTotalCountAPIResource)
		.factory('ParentCellLineSearchAPI',	ParentCellLineSearchAPIResource)
		.factory('AlleleCreateStrainAPI',	AlleleCreateStrainAPIResource)
		;

	// object summary search
	function AlleleSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function AlleleGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// create
	function AlleleCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'allele', {},
			{'create': { method: 'POST', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// update
	function AlleleUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'allele', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// delete
	function AlleleDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'allele/:key', {},
			{'delete': { method: 'DELETE', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// total number of records
	function AlleleTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	
	
	// parent cell line search
	function ParentCellLineSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'cellline/searchParentCellLines', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// create strain
	function AlleleCreateStrainAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'strain', {},
				{'create': { method: 'POST', 
				 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	

})();

