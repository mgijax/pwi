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
		
		// hook set by component
		var componentValidationHook = function(){
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
		function validateWithComponent() {
			var promiseResolver;
			var promiseRejector;
			var promise = $q(function(resolve, reject){
				promiseResolver = resolve;
				promiseRejector = reject;
			});
			
			componentValidationHook().then(function(){
				console.log("resolved promise");
				promiseResolver();
			}, function(error){
				console.log("rejected promise");
				promiseRejector(error);
			});
			
			return promise;
		}
		
		/*
		 * Called by validateWithComponent()
		 * 
		 * callbackFunc must return a promise
		 */
		function setValidationHook(callbackFunc) {
			componentValidationHook = callbackFunc;
		}
		
		
		
		// Exposed methods
		return {
			
			// component <=> controller communication
			setValidationHook: setValidationHook,
			// AJAX validators
			validateReference: validateReference,
			validateWithComponent: validateWithComponent
		}
	}


})();
