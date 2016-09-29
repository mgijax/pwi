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
		
		// hook set by component
		var inputValidHook = function(){};
		
		
		
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
		
		
		/*
		 * Sets component value as valid 
		 *   (I.e. should not trigger validation until value is changed)
		 */
		function setComponentAsValid() {
			inputValidHook();
		}
		
		/*
		 * Called by setComponantAsValid()
		 */
		function setInputValidHook(callbackFunc) {
			inputValidHook = callbackFunc;
		}
		
		
		// Exposed methods
		return {
			
			// component <=> controller communication
			setValidationHook: setValidationHook,
			setComponentAsValid: setComponentAsValid,
			setInputValidHook: setInputValidHook,
			// AJAX validators
			validateReference: validateReference,
			validateWithComponent: validateWithComponent
		}
	}


})();
