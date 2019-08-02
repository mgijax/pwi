(function() {
	'use strict';
	angular.module('pwi.image')
		.factory('ImageSubmissionSearchAPI',		ImageSubmissionSearchAPIResource)
		.factory('ImageSubmissionSubmitAPI',		ImageSubmissionSubmitAPIResource)
		.factory('JnumValidationAPI',			JnumValidationAPIResource);


	// object summary search
	function ImageSubmissionSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'imageSubmission/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// used to validate reference
	function JnumValidationAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'reference/validateJnumImage', {}, {
			'validate': { method: 'POST', isArray: true }
		});
	}	
	
	// submit file form
	function ImageSubmissionSubmitAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'imageSubmission/submit', {},
				{'submit': { 
					method: 'POST', 
					transformRequest: angular.identity,
				 	headers: 
					{ 
						'api_access_token': access_token, 
						'username': USERNAME,
						'Content-Type': undefined
					} 
				}
		});
	}	

})();

