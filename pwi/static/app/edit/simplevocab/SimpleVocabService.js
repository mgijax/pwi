(function() {
	'use strict';
	angular.module('pwi.simplevocab')
		.factory('SVSearchAPI',	SVSearchAPIResource)
		.factory('SVGetAPI',		SVGetAPIResource)
		.factory('TermCreateAPI',        TermCreateAPIResource)
		.factory('TermUpdateAPI',	TermUpdateAPIResource)
		.factory('TermDeleteAPI',	TermDeleteAPIResource)
		.factory('SVTotalCountAPI',	SVTotalCountAPIResource)
		;

	// object summary search
	
	function SVSearchAPIResource($resource, JAVA_API_URL) {
		console.log("SVSearchAPIResource");
		console.log(JAVA_API_URL + 'vocab/searchsimple', {}, {
                        'searchsimple': { method: 'GET', isArray: true }
                });
		return $resource(JAVA_API_URL + 'vocab/searchsimple', {}, {
			'searchsimple': { method: 'GET', isArray: true }
		}); 
	}

	// object retrieval by key
	function SVGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'vocab/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// object create
        function TermCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
                return $resource(JAVA_API_URL + 'term', {},
                                {'create': { method: 'POST',
                                headers: { 'api_access_token': access_token, 'username': USERNAME }
                                }
                });
        }

	// object modification
	function TermUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'term', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}

	// object deletion	
	function TermDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
                return $resource(JAVA_API_URL + 'term/:key', {},
                        {'delete': { method: 'DELETE',
                         headers: { 'api_access_token': access_token, 'username': USERNAME }
                        }
                });
        }

	// total number of records
	function SVTotalCountAPIResource($resource, JAVA_API_URL) {
		console.log(JAVA_API_URL + 'vocab/getObjectCount', {}, {
                        'getObjectCount': { method: 'JSONP' }
                });
		return $resource(JAVA_API_URL + 'vocab/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}
})();

