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
			// general utilities
			ErrorMessage,
			Focus,
			usSpinnerService,
			// resource APIs
			ReferenceValidatorService
	) {
		
		$scope.vm = {};
		var vm = $scope.vm;
		vm.invalidated = true;
		
		var _self = this;
		
		
		/*
		 * Initialize controller and set values from the
		 * 	link function scope
		 */
		function controllerInit() {

			$scope.onValidation = _self.onValidation || function(){};
			$scope.onInvalidate = _self.onInvalidate || function(){};
		
			ReferenceValidatorService.setUserResponseFunction(serviceHook);
			
			// watch the ngmodel for changes
			$scope.$watch(
			  function(){
				return _self.jnumid;
			  }, function(newValue, oldValue) {
				  
				  if (!equalsJnum(newValue, oldValue)) {
					  invalidate();
				  }
			}, true);
		}
		
		function serviceHook() {
			return validateReference();
		}
		
		/*
		 * Helper for watching changes on ngModel.
		 * 	Checks if values are equivalent.
		 * 	E.g. should be able to set '2' to 'J:2' without invalidating
		 */
		function equalsJnum(s1, s2) {
			if (s1 == s2) {
				return true;
			}
			if (s1 && s2) {
				
				s1 = s1.toLowerCase();
				s2 = s2.toLowerCase();
				
				s1 = s1.replace('j', '').replace(':', '');
				s2 = s2.replace('j', '').replace(':', '');
				
				if (s1 == s2) {
				  return true;
				}
			}
			return false;
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
			if (!vm.invalidated) {
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
			vm.invalidated = false;
			console.log('reference selected');
			$scope.onValidation({reference: reference});
		}
		
		function invalidate() {
			if (!vm.invalidated) {
				vm.invalidated = true;
				$scope.onInvalidate();
			}
		}
		
		
		function clearAndFocus() {
			// clear ngModel value
			_self.jnumid = '';
			Focus.onElement($element.find("input")[0]);
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
