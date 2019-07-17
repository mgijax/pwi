(function() {
	'use strict';
	angular.module('pwi.image')
		.factory('ImageSubmissionSearchAPI',		ImageSubmissionSearchAPIResource)
		.factory('ImageSubmissionGatherByKeyAPI',	ImageSubmissionGatherByKeyAPIResource)
		.factory('ImageSubmissionCreateAPI', 		ImageSubmissionCreateAPIResource)
		.factory('ImageSubmissionUpdateAPI',		ImageSubmissionUpdateAPIResource)
		.factory('ImageSubmissionDeleteAPI',		ImageSubmissionDeleteAPIResource)
		.factory('VocabSearchAPI',			VocabSearchAPIResource)
		.factory('JnumValidationAPI',			JnumValidationAPIResource);


	// object summary search
	function ImageSubmissionSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'imageSubmission/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function ImageSubmissionGatherByKeyAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'imageSubmission/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// object creation
	function ImageSubmissionCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'imageSubmission', {},
				{'create': { method: 'POST', 
				 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	
	
	// object modification
	function ImageSubmissionUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'imageSubmission', {},
				{'update': { method: 'PUT', 
				 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	

	// object deletion
	function ImageSubmissionDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'imageSubmission/:key', {},
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
		return $resource(JAVA_API_URL + 'reference/validateJnumImage', {}, {
			'validate': { method: 'POST', isArray: true }
		});
	}	
	
})();

