(function() {
	'use strict';
	angular.module('pwi.probe')
		.factory('ProbeSearchAPI',	ProbeSearchAPIResource)
		.factory('ProbeGetAPI',		ProbeGetAPIResource)
                .factory('ProbeCreateAPI',      ProbeCreateAPIResource)
		.factory('ProbeUpdateAPI',	ProbeUpdateAPIResource)
		.factory('ProbeDeleteAPI',	ProbeDeleteAPIResource)
		.factory('ProbeTotalCountAPI',	ProbeTotalCountAPIResource)
                .factory('StrainCreateAPI',     StrainCreateAPIResource)
                .factory('TissueCreateAPI',     TissueCreateAPIResource)
                .factory('CellLineCreateAPI',   CellLineCreateAPIResource)
		;

	// object summary search
	function ProbeSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'probe/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function ProbeGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'probe/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// create
	function ProbeCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'probe', {},
			{'create': { method: 'POST', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// update
	function ProbeUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'probe', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// delete
	function ProbeDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'probe/:key', {},
			{'delete': { method: 'DELETE', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// total number of records
	function ProbeTotalCountAPIResource($resource, JAVA_API_URL) {
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

})();

