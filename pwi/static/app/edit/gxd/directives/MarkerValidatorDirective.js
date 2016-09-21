(function() {
	'use strict';
	
	/*
	 * Add a marker validator that invokes on 'tab' out of the input field
	 * 	this directive is used on.
	 */
	var module = angular.module('pwi.gxd');
	
	module.controller('markerValidatorController', MarkerValidatorController);
	module.directive('markerValidator', MarkerValidatorDirective);
	
	function MarkerValidatorController(
			$document, 
			$q,
			$scope,
			usSpinnerService,
			ValidMarkerAPI
	) {
		console.log('controllers rule!');
		
		var $directiveScope = $scope.$parent;
		var $inputElement = $directiveScope.element;
		var $onValidation = $directiveScope.onValidation || function(){};
		var $onInvalidate = $directiveScope.onInvalidate || function(){};
		
		$scope.vm = {};
		var vm = $scope.vm;
		vm.markerSelectIndex = 0;
		vm.markerSelections = [];
		vm.invalidated = true;
		
		function setSpinner() {
			usSpinnerService.spin('marker-spinner');
		}
		function stopSpinner() {
			usSpinnerService.stop('marker-spinner');
		}
		
		
		function validateMarker() {
			
			// get ngModel value
			var marker_symbol = $directiveScope.getNgModel();
			
			if (!marker_symbol) {
				return $q.when();
			}
			
			if (isWildcardSearch(marker_symbol)) {
				return $q.when();
			}
			
			// previous search was valid and has not yet changed
			if (!vm.invalidated) {
				return $q.when();
			}
			
			setSpinner();
			var promise = ValidMarkerAPI.get({symbol: marker_symbol}).$promise
			.then(function(data){
				
				if (data.total_count == 1) {
					selectMarker(data.items[0]);
				}
				else if (data.total_count == 0) {
					//TODO(kstone): do error message here with global error service
					selectMarker(undefined);
//					var error = {
//						data: {
//							error: 'MarkerSymbolNotFoundError',
//							message: 'Invalid marker symbol: ' + marker_symbol
//						}
//					}
//					// TODO(kstone): make handle error global
//					//$directiveScope.$parent.handleError(error);
//					clearAndFocus();
				}
				else {
					vm.markerSelections = data.items;
					focusOnMarkerSelections();
				}
				
			}, function(error) {
			  //handleError(error);
			  clearAndFocus();
			}).finally(function(){
				stopSpinner();
			});
			
			return promise;
		}
		
		function cancelMarkerSelection() {
			clearMarkerSelection();
			clearAndFocus();
		}
		
		function clearMarkerSelection() {
			vm.markerSelectIndex = 0;
			vm.markerSelections = [];
		}
		
		function selectMarker(marker) {
			clearMarkerSelection();
			// after-validated callback
			// ????
			vm.invalidated = false;
			console.log('marker selected');
			$onValidation({marker: marker});
		}
		
		function invalidate() {
			if (!vm.invalidated) {
				vm.invalidated = true;
				$onInvalidate();
			}
		}
		
		
		function isWildcardSearch(input) {
			return input.indexOf('%') >= 0;
		}
		
		function clearAndFocus() {
			// clear ngModel value
			$directiveScope.setNgModel('');
			focus($inputElement[0]);
		}
		
		// Focus an html element by id
		function focus(element) {
			setTimeout(function(){
				element.focus();
			}, 200);
		}
		
		function focusOnMarkerSelections() {
			setTimeout(function(){
				
				$document[0].querySelector(".markerSelections").focus();
			}, 200);
		}
		
		function upArrow(e) {
			if (vm.markerSelections.length > 0) {
				vm.markerSelectIndex += 1;
				if (vm.markerSelectIndex >= vm.markerSelections.length) {
					vm.markerSelectIndex = 0;
				}
				console.log('selected marker index: '+vm.markerSelectIndex);
				e.preventDefault();
				$scope.$apply();
			}
		}
		
		function enter() {
			
			if (vm.markerSelections.length > 0) {
				
				setTimeout(function(){
				  angular.element('.markerSelections .selected').triggerHandler('click');
				}, 0);
			}
		}
		
		function downArrow(e) {
			if (vm.markerSelections.length > 0) {
				vm.markerSelectIndex -= 1;
				if (vm.markerSelectIndex < 0) {
					vm.markerSelectIndex = vm.markerSelections.length - 1;
				}
				console.log('selected marker index: '+vm.markerSelectIndex);
				e.preventDefault();
				$scope.$apply();
			}
			return false;
		}
		
		/*
		 * Expose functions to scope
		 */
		$scope.selectMarker = selectMarker;
		$scope.cancelMarkerSelection = cancelMarkerSelection;
		
		
		function addShortcuts() {
			// Add the 'tab' shortcut for this input
			var markerShortcut = Mousetrap($inputElement[0]);
			markerShortcut.bind('tab', function(e){
				validateMarker();
			});
			console.log("marker mousetrap element = " + $inputElement[0]);
			
			var globalShortcut = Mousetrap(document.body);
			globalShortcut.bind('enter', enter);
			globalShortcut.bind('up', upArrow);
			globalShortcut.bind('down', downArrow);
		}
		// TODO(kstone): find out how to call this on angular ready/onload
		setTimeout(addShortcuts, 500);
		
		// watch the ngmodel for changes
		$directiveScope.$watch(
		  function(){
			return $directiveScope.getNgModel();
		  }, function(newValue, oldValue) {
			  
			  if (!equalsIgnoreCase(newValue, oldValue)) {
				  invalidate();
			  }
		}, true);
		
		function equalsIgnoreCase(s1, s2) {
			if (s1 == s2) {
				return true;
			}
			if (s1 && s2 && s1.toLowerCase() == s2.toLowerCase()) {
				return true;
			}
			return false;
		}
	}
	
	function MarkerValidatorDirective(
			$compile,
			$parse,
			$templateRequest
	) {
		return {
		    require: ['ngModel'],
		    restrict: 'A',
		    scope: {
		    	ngModel: '=',
		    	onValidation: '&',
		    	onInvalidate: '&'
		    },
		    link: function(scope, element, attrs, ngModelCtrl) {
		    	
		      scope.element = element;
		      
			  // TODO(kstone): pull in static directory as relative path
		      var templateUrl = "/pwi/static/app/edit/gxd/directives/markerValidator.html";
              
              $templateRequest(templateUrl).then(function(html){
                  var template = angular.element(html);
                  template.insertAfter(element);
                  $compile(template)(scope);
               });
              
              // add mini-spinner

			  var spinnerHtml = "<span us-spinner=\"{radius: 6, width: 2, length: 6, position:'relative', top:'1.2em', left:'1.2em'}\""
				  +" spinner-key=\"marker-spinner\"></span>'";
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
		    }
		  };
	}

})();
