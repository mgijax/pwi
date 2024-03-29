(function() {
	'use strict';
	angular.module('pwi.marker')
		.factory('MarkerUtilAPI', MarkerUtilAPIResource)
		.factory('MarkerUtilValidationAPI', MarkerUtilValidationAPIResource)
		.factory('MarkerSearchAPI', MarkerSearchAPIResource)
		.factory('MarkerStatusSearchAPI', MarkerStatusSearchAPIResource)
		.factory('MarkerTypeSearchAPI', MarkerTypeSearchAPIResource)
		.factory('MarkerKeySearchAPI', MarkerKeySearchAPIResource)
		.factory('MarkerCreateAPI', MarkerCreateAPIResource)
		.factory('MarkerUpdateAPI', MarkerUpdateAPIResource)
		.factory('MarkerDeleteAPI', MarkerDeleteAPIResource)
		.factory('MarkerTotalCountAPI', MarkerTotalCountAPIResource)
		.factory('MarkerAssocRefsAPI', MarkerAssocRefsAPIResource)
		.factory('MarkerFeatureTypeValidationAPI', MarkerFeatureTypeValidationAPIResource)
		.factory('MarkerNextGmSequenceAPI', MarkerNextGmSequenceAPIResource)
		.factory('MarkerNextRrSequenceAPI', MarkerNextRrSequenceAPIResource)
		;

	function MarkerUtilAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'marker/eiUtilities', {}, {
			'process': { method: 'POST',
				 headers: { 'api_access_token': access_token, 'username': USERNAME}
				}
		});
	}
	
	function MarkerUtilValidationAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'marker/validateOfficialChrom', {}, {
			'validate': { method: 'POST' }
		});
	}	
	
	function MarkerSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'marker/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	function MarkerStatusSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'markerStatus/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	function MarkerTypeSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'markerType/search', {}, {
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

	// total number of records
	function MarkerTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'marker/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	

	function MarkerAssocRefsAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'mgireferenceassoc/marker/:key', {}, {
			'': { method: 'JSONP' , isArray: true}
		});
	}
	

        function MarkerFeatureTypeValidationAPIResource($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'marker/validateFeatureTypes', {}, {
                        'validate': { method: 'POST' }
                });
        }

        function MarkerNextGmSequenceAPIResource($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'marker/getNextGmSequence', {}, {
                        'search': { method: 'POST', isArray: true}
                });
        }

        function MarkerNextRrSequenceAPIResource($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'marker/getNextRrSequence', {}, {
                        'search': { method: 'POST', isArray: true}
                });
        }

})();

