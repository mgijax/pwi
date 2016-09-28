(function() {
	'use strict';
	
	/*
	 * Add a reference validator that invokes on 'tab' out of the input field
	 * 	this directive is used on.
	 */
	var module = angular.module('pwi.gxd');
	
	module.directive('referenceValidator', ReferenceValidatorDirective);
	
	function ReferenceValidatorController(
			// angular tools
			$document, 
			$element,
			$q,
			$scope,
			$timeout,
			// general utilities
			ErrorMessage,
			FindElement,
			Focus,
			usSpinnerService,
			// resource APIs
			ValidReferenceAPI,
			ReferenceValidatorService
	) {
		
		$scope.vm = {};
		var vm = $scope.vm;
		vm.invalidated = true;
		
		/*
		 * Initialize controller and set values from the
		 * 	link function scope
		 */
		function controllerInit() {

			$scope.onValidation = $scope.onValidation || function(){};
			$scope.onInvalidate = $scope.onInvalidate || function(){};
		
			addShortcuts();
			
			ReferenceValidatorService.setUserResponseFunction(serviceHook);
			
			// watch the ngmodel for changes
			$scope.$watch(
			  function(){
				return $scope.getNgModel();
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
			var jnumid = $scope.getNgModel();
			
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
			$scope.setNgModel('');
			Focus.onElement($element[0]);
		}
		
		
		function addShortcuts() {
			// Add the 'tab' shortcut for this input
			var referenceShortcut = Mousetrap($element[0]);
			referenceShortcut.bind('tab', function(e){
				validateReference();
			});
			console.log("reference mousetrap element = " + $element[0]);
		}
		
		
		// Expose functions to link() method
		$scope.controllerInit = controllerInit;
	}
	
	function ReferenceValidatorDirective(
			$compile,
			$parse
	) {
		return {
		    require: ['ngModel'],
		    restrict: 'A',
		    scope: {
		    	ngModel: '=',
		    	onValidation: '&',
		    	onInvalidate: '&'
		    },
		    controller: ReferenceValidatorController,
		    link: function(scope, element, attrs, ngModelCtrl) {
		    	
		      scope.element = element;
              
              // add mini-spinner

			  var spinnerHtml = "<span us-spinner=\"{radius: 6, width: 2, length: 6, position:'relative', top:'1.2em', left:'1.2em'}\""
				  +" spinner-key=\"reference-spinner\"></span>'";
			  var spinner = angular.element(spinnerHtml);
			  spinner.insertBefore(element);
			  
			  var model = $parse(attrs.ngModel);
			  
			  // capture the ngModel value and assign methods for reading and updating it.
			  function getNgModel() {
		            return ngModelCtrl[0].$modelValue;
		      }

		      function setNgModel(value) {
	            	ngModelCtrl[0].$setViewValue(value);
	            	ngModelCtrl[0].$render();
		      }

		      
              scope.getNgModel = getNgModel;
              scope.setNgModel = setNgModel;
              
              // call controller initialization
              scope.controllerInit();
		    }
		  };
	}

})();
