(function() {
	'use strict';
	angular.module('pwi.gxd')
		.factory('ReferenceValidatorService', ReferenceValidatorService);


	function ReferenceValidatorService(
			ErrorMessage,
			$q,
			$rootScope,
			ValidReferenceAPI
	) {
		
		var userResponseFunc = function(){
			return $q.when();
		};
		
		
		function validateReference(jnumber) {
				
			var promise = ValidReferenceAPI.get({jnumber: jnumber}).$promise
			
			return promise;
		}
		
		/*
		 * Validates the reference, but stops if the bound validationController 
		 *   has any errors during validation
		 */
		function validateWithUserResponse() {
			var promiseResolver;
			var promiseRejector;
			var promise = $q(function(resolve, reject){
				promiseResolver = resolve;
				promiseRejector = reject;
			});
			
			userResponseFunc().then(function(){
				console.log("resolved promise");
				promiseResolver();
			}, function(error){
				console.log("rejected promise");
				promiseRejector(error);
			});
			
			return promise;
		}
		
		/*
		 * Called by validateWithUserResponse()
		 * 
		 * callbackFunc must return a promise
		 */
		function setUserResponseFunction(callbackFunc) {
			userResponseFunc = callbackFunc;
		}
		
		
		// Exposed methods
		return {
			
			// directive controller communication
			setUserResponseFunction: setUserResponseFunction,
			// AJAX validators
			validateReference: validateReference,
			validateWithUserResponse: validateWithUserResponse
		}
	}


})();
