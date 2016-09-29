(function() {
	'use strict';
	
	/*
	 * Add a reference validator that invokes on 'tab' out of the input field
	 * 	this directive is used on.
	 */
	var module = angular.module('pwi.gxd');
	
	module.component('referenceValidator', {
		    templateUrl: '/pwi/static/app/edit/gxd/directives/referenceValidator.html',
		    bindings: {
		    	jnumid: '=',
		    	onValidation: '&',
		    	onInvalidate: '&'
		    },
		    controller: ReferenceValidatorController
	});
	
	function ReferenceValidatorController(
			// angular tools
			$element,
			$q,
			$scope,
			$timeout,
			// general utilities
			ErrorMessage,
			Focus,
			usSpinnerService,
			// resource APIs
			ReferenceValidatorService
	) {
		
		$scope.vm = {};
		var vm = $scope.vm;
		vm.validated = false;
		
		var _self = this;
		
		
		/*
		 * Initialize controller and set values from the
		 * 	link function scope
		 */
		function controllerInit() {

			$scope.onValidation = _self.onValidation || function(){};
			$scope.onInvalidate = _self.onInvalidate || function(){};
		
			// set communication hooks that can be called by ReferenceValidatorService
			ReferenceValidatorService.setValidationHook(validateHook);
			ReferenceValidatorService.setInputValidHook(setInputValidHook);
			
			
			// watch the ngmodel for changes
			$scope.$watch(
			  function(){
				return _self.jnumid;
			  }, function(newValue, oldValue) {
				  
				  if (newValue != oldValue) {
					  invalidate();
				  }
			}, true);
		}
		
		function validateHook() {
			return validateReference();
		}
		
		function setInputValidHook() {
			$timeout(function(){
				vm.validated = true;
			},0);
		}
		
		function setSpinner() {
			usSpinnerService.spin('reference-spinner');
		}
		function stopSpinner() {
			usSpinnerService.stop('reference-spinner');
		}
		
		function validateReference() {
			
			// get ngModel value
			var jnumid = _self.jnumid;
			
			if (!jnumid) {
				return $q.when();
			}
			
			// previous search was valid and has not yet changed
			if (vm.validated) {
				return $q.when();
			}
			
			setSpinner();
			var promise = ReferenceValidatorService.validateReference(jnumid)
			.then(function(reference){
				selectReference(reference);
			}, function(error) {
			    ErrorMessage.handleError(error);
			    clearAndFocus();
			    throw error;
			}).finally(function(){
				stopSpinner();
			});
			
			return promise;
		}
		
		
		function selectReference(reference) {
			ErrorMessage.clear();
			// after-validated callback
			vm.validated = true;
			console.log('reference selected');
			$scope.onValidation({reference: reference});
		}
		
		function invalidate() {
			if (vm.validated) {
				vm.validated = false;
				$scope.onInvalidate();
			}
		}
		
		
		function clearAndFocus() {
			// clear ngModel value
			_self.jnumid = '';
			var inputElement = $element.find("input")[0];
			Focus.onElement(inputElement);
		}
		
		
		function checkTab(event) {
			// Add the 'tab' shortcut for this input
			var TAB_KEY = 9;
			if (event.keyCode == TAB_KEY) {
				validateReference();
				return false;
			}
			return true;
		}
		
		
		// Expose functions to template
		$scope.checkTab = checkTab;
		controllerInit();
	}

})();
