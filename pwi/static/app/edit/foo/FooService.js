(function() {
	'use strict';
	angular.module('pwi.foo')
		.factory('VocabSearchAPI',		VocabSearchAPIResource)
		.factory('JnumValidationAPI', 	JnumValidationAPIResource)
		.factory('FooSearchAPI',		FooSearchAPIResource)
		.factory('FooGatherByKeyAPI',	FooGatherByKeyAPIResource)
		.factory('FooCreateAPI', 		FooCreateAPIResource)
		.factory('FooUpdateAPI',		FooUpdateAPIResource)
		.factory('FooDeleteAPI',		FooDeleteAPIResource);


	function VocabSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'vocab/search', {}, {
			'search': { method: 'POST' }
		});
	}
	
	function JnumValidationAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'reference/validJnum/:jnum', {}, {
			'': { method: 'JSONP' , isArray: true}
		});
	}

	function FooSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'marker/eiSearch', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	function FooGatherByKeyAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'marker/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	function FooCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'marker', {},
				{'create': { method: 'POST', 
							 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	
	
	function FooUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'marker', {},
				{'update': { method: 'PUT', 
							 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	

	function FooDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'marker/:key', {},
				{'delete': { method: 'DELETE', 
							 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	

	
})();

