(function() {
	'use strict';
	angular.module('pwi.marker')
		.factory('MarkerUtilAPI',    MarkerUtilAPIResource)
		.factory('MarkerSearchAPI',    MarkerSearchAPIResource)
		.factory('MarkerKeySearchAPI', MarkerKeySearchAPIResource)
		.factory('MarkerCreateAPI', MarkerCreateAPIResource)
		.factory('MarkerUpdateAPI', MarkerUpdateAPIResource)
		.factory('MarkerHistorySymbolValidationAPI', MarkerHistorySymbolValidationAPIResource)
		.factory('MarkerHistoryJnumValidationAPI', MarkerHistoryJnumValidationAPIResource)
		.factory('MarkerAssocRefsAPI', MarkerAssocRefsAPIResource)
		.factory('MarkerDeleteAPI', MarkerDeleteAPIResource);


	function MarkerUtilAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'marker/eiUtilities', {}, {
			'process': { method: 'POST' }
		});
	}

	function MarkerSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'marker/eiSearch', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	function MarkerKeySearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'marker/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	function MarkerCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'marker', {},
				{'create': { method: 'POST', 
							 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	
	
	function MarkerUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'marker', {},
				{'update': { method: 'PUT', 
							 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	

	function MarkerDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'marker/:key', {},
				{'delete': { method: 'DELETE', 
							 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	

	function MarkerHistorySymbolValidationAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'marker/validateAnyStatus/:symbol', {}, {
			'': { method: 'JSONP' , isArray: true}
		});
	}

	function MarkerHistoryJnumValidationAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'reference/validJnum/:jnum', {}, {
			'': { method: 'JSONP' , isArray: true}
		});
	}

		function MarkerAssocRefsAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'mgireferenceassoc/marker/:key', {}, {
			'': { method: 'JSONP' , isArray: true}
		});
	}
	
})();

