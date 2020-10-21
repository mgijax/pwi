(function() {
	'use strict';
	angular.module('pwi.probe')
		.factory('OrganismSearchAPI',	OrganismSearchAPIResource)
		.factory('OrganismGetAPI',		OrganismGetAPIResource)
                .factory('OrganismCreateAPI',      OrganismCreateAPIResource)
		.factory('OrganismUpdateAPI',	OrganismUpdateAPIResource)
		.factory('OrganismDeleteAPI',	OrganismDeleteAPIResource)
		.factory('OrganismTotalCountAPI',	OrganismTotalCountAPIResource)
                .factory('StrainCreateAPI',     StrainCreateAPIResource)
                .factory('TissueCreateAPI',     TissueCreateAPIResource)
                .factory('CellLineCreateAPI',   CellLineCreateAPIResource)
		.factory('LogicalDBSearchAPI',	LogicalDBSearchAPIResource)
		;

	// object summary search
	function OrganismSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'probe/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function OrganismGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'probe/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// create
	function OrganismCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'probe', {},
			{'create': { method: 'POST', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// update
	function OrganismUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'probe', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// delete
	function OrganismDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'probe/:key', {},
			{'delete': { method: 'DELETE', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// total number of records
	function OrganismTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'probe/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	
	
	// create
	function StrainCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'strain', {},
			{'create': { method: 'POST', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// create
	function TissueCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'tissue', {},
			{'create': { method: 'POST', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// create
	function CellLineCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'term', {},
			{'create': { method: 'POST', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// logical db for probe set
	function LogicalDBSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'logicaldb/searchOrganismSet', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

})();

