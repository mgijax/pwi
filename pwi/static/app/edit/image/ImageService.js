(function() {
	'use strict';
	angular.module('pwi.image')
		.factory('ImageSearchAPI',		ImageSearchAPIResource)
		.factory('ImageGatherByKeyAPI',	ImageGatherByKeyAPIResource)
		.factory('ImageCreateAPI', 		ImageCreateAPIResource)
		.factory('ImageUpdateAPI',		ImageUpdateAPIResource)
		.factory('ImageDeleteAPI',		ImageDeleteAPIResource)
		.factory('VocabSearchAPI',		VocabSearchAPIResource)
		.factory('JnumValidationAPI', 	JnumValidationAPIResource);


	// object summary search
	function ImageSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'image/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function ImageGatherByKeyAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'image/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// object creation
	function ImageCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'image', {},
				{'create': { method: 'POST', 
							 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	
	
	// object modification
	function ImageUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'image', {},
				{'update': { method: 'PUT', 
							 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	

	// object deletion
	function ImageDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'image/:key', {},
				{'delete': { method: 'DELETE', 
							 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
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

