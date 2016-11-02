(function() {
	'use strict';
	
	/*
	 * Add a reference validator that invokes on 'tab' out of the input field
	 * 	this directive is used on.
	 */
	var module = angular.module('pwi.gxd');
	
	module.component('referenceValidator', {
		    templateUrl: function(RESOURCE_PATH) {
		    	return RESOURCE_PATH + 'app/edit/gxd/directives/referenceValidator.html'
		    },
		    bindings: {
		    	jnumid: '=',
		    	// expression to further define when input is valid
		    	isValid: '=',
		    	// called on validation
		    	onValidation: '&',
		    	// called on input change (by user)
		    	onChange: '&',
		    	tabindex: '='
		    },
		    controller: ReferenceValidatorController
	});
	
	function ReferenceValidatorController(
			// angular tools
			$element,
			$q,
			// general utilities
			ErrorMessage,
			Focus,
			usSpinnerService,
			// resource APIs
			ReferenceValidatorService
	) {
		
		var _self = this;
		
		_self.vm = {};
		var vm = _self.vm;
		vm.validated = false;
		
		
		/*
		 * Initialize controller and set values from the
		 * 	link function scope
		 */
		function controllerInit() {

			_self.onValidation = _self.onValidation || function(){};
			_self.onChange = _self.onChange || function(){};
		
			// set communication hooks that can be called by ReferenceValidatorService
			ReferenceValidatorService.setValidationHook(validateHook);
			
		}
		
		function validateHook() {
			return validateReference();
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
			if (vm.validated || _self.isValid) {
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
			_self.onValidation({reference: reference});
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
		
		function onUserInputChange() {
			vm.validated = false;
			_self.onChange();
		}
		
		
		// Expose functions to template
		_self.checkTab = checkTab;
		_self.onUserInputChange = onUserInputChange;
		
		controllerInit();
	}

})();
