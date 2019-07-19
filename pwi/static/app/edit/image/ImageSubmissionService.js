(function() {
	'use strict';
	angular.module('pwi.image')
		.factory('ImageSubmissionSearchAPI',		ImageSubmissionSearchAPIResource)
		.factory('ImageSubmissionGatherByKeyAPI',	ImageSubmissionGatherByKeyAPIResource)
		.factory('ImageSubmissionProcessAPI',		ImageSubmissionProcessAPIResource)
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

	// object modification
	function ImageSubmissionProcessAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'imageSubmission', {},
				{'process': { method: 'PUT', 
				 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	

	// used to validate reference
	function JnumValidationAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'reference/validateJnumImage', {}, {
			'validate': { method: 'POST', isArray: true }
		});
	}	
	
})();

