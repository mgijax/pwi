(function() {
	'use strict';
	angular.module('pwi.organism')
		.factory('OrganismSearchAPI',	        OrganismSearchAPIResource)
		.factory('OrganismGetAPI',		OrganismGetAPIResource)
                .factory('OrganismCreateAPI',           OrganismCreateAPIResource)
		.factory('OrganismUpdateAPI',	        OrganismUpdateAPIResource)
		.factory('OrganismDeleteAPI',	        OrganismDeleteAPIResource)
		.factory('OrganismTotalCountAPI',	OrganismTotalCountAPIResource)
		.factory('MGITypeSearchAPI',	        MGITypeSearchAPIResource)
		;

	// object summary search
	function OrganismSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'organism/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function OrganismGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'organism/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// create
	function OrganismCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'organism', {},
			{'create': { method: 'POST', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// update
	function OrganismUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'organism', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// delete
	function OrganismDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'organism/:key', {},
			{'delete': { method: 'DELETE', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// total number of records
	function OrganismTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'organism/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	
	
        // mgi types
        function MGITypeSearchAPIResource($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'mgitype/search', {}, {
	                'search': { method: 'POST', isArray: true }
                });
        }

})();

