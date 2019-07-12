(function() {
	'use strict';
	angular.module('pwi.foo')
		.factory('FooSearchAPI',		FooSearchAPIResource)
		.factory('FooGatherByKeyAPI',	FooGatherByKeyAPIResource)
		.factory('FooCreateAPI', 		FooCreateAPIResource)
		.factory('FooUpdateAPI',		FooUpdateAPIResource)
		.factory('FooDeleteAPI',		FooDeleteAPIResource)
		.factory('VocabSearchAPI',		VocabSearchAPIResource)
		.factory('JnumValidationAPI', 	JnumValidationAPIResource);


	// object summary search
	function FooSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'marker/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function FooGatherByKeyAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'marker/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// object creation
	function FooCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'marker', {},
				{'create': { method: 'POST', 
							 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	
	
	// object modification
	function FooUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'marker', {},
				{'update': { method: 'PUT', 
							 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	

	// object deletion
	function FooDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'marker/:key', {},
				{'delete': { method: 'DELETE', 
							 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	

        // total number of records
        function ImageTotalCountAPIResource($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'marker/getObjectCount', {}, {
                        'getObjectCount': { method: 'JSONP' }
                });
        }

	// normally used to retrieve vocabs to fill drop-lists
	function VocabSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'vocab/search', {}, {
			'search': { method: 'POST' }
		});
	}
	
	// used to validate reference
	function JnumValidationAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'reference/validJnum/:jnum', {}, {
			'': { method: 'JSONP' , isArray: true}
		});
	}
	
})();

