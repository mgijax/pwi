(function() {
	'use strict';
	angular.module('pwi.clonelib')
		.factory('CloneLibSearchAPI',	CloneLibSearchAPIResource)
		.factory('CloneLibGetAPI',		CloneLibGetAPIResource)
                .factory('CloneLibCreateAPI',      CloneLibCreateAPIResource)
		.factory('CloneLibUpdateAPI',	CloneLibUpdateAPIResource)
		.factory('CloneLibDeleteAPI',	CloneLibDeleteAPIResource)
		.factory('CloneLibTotalCountAPI',	CloneLibTotalCountAPIResource)
                .factory('StrainCreateAPI',     StrainCreateAPIResource)
                .factory('TissueCreateAPI',     TissueCreateAPIResource)
                .factory('CellLineCreateAPI',   CellLineCreateAPIResource)
		;

	// object summary search
	function CloneLibSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'source/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function CloneLibGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'source/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// create
	function CloneLibCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'source', {},
			{'create': { method: 'POST', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// update
	function CloneLibUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'source', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// delete
	function CloneLibDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'source/:key', {},
			{'delete': { method: 'DELETE', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// total number of records
	function CloneLibTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'source/getObjectCount', {}, {
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

})();

