(function() {
	'use strict';
	
	/*
	 * Add a marker validator that invokes on 'tab' out of the input field
	 * 	this directive is used on.
	 */
	var module = angular.module('pwi.gxd');
	
	module.component('markerValidator', {
	    templateUrl: function(RESOURCE_PATH) {
	    	return RESOURCE_PATH + 'app/edit/gxd/directives/markerValidator.html'
	    },
	    bindings: {
	    	
	    	// Not using 'marker_symbol', 
	    	// underscores are not allowed in attributes (they turn into camelCase)
	    	markerSymbol: '=',
	    	// expression to further define when input is valid
	    	isValid: '=',
	    	// called on validation
	    	onValidation: '&',
	    	// called on input change (by user)
	    	onChange: '&',
	    	tabindex: '='
	    },
	    controller: MarkerValidatorController
	});
	
	function MarkerValidatorController(
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
			MarkerValidatorService
	) {
		
		var _self = this;
		
		_self.vm = {};
		var vm = _self.vm;
		vm.markerSelectIndex = 0;
		vm.markerSelections = [];
		vm.validated = false;
		
		function controllerInit() {
			
			_self.onValidation = _self.onValidation || function(){};
			_self.onChange = _self.onChange || function(){};
			_self.isValid = _self.isValid;
			
			// set communication hooks that can be called by MarkerValidatorService
			MarkerValidatorService.setValidationHook(validateHook);

			addShortcuts();
		}
		
		function addShortcuts() {
			
			var globalShortcut = Mousetrap($document.body);
			globalShortcut.bind('enter', enter);
			globalShortcut.bind('up', upArrow);
			globalShortcut.bind('down', downArrow);
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
				
				FindElement.byQuery(".markerSelections .selected").then(
					function(element) {
						// escape $digest cycle when triggering event
						$timeout(function(){
							angular.element(element).triggerHandler('click');
						}, 0);
					}
				);
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
		

		
		function validateHook() {
			return validateMarker().then(function(data){
				if (data && data.items.length > 1) {
					throw "user interaction required";
				}
			});
		}	
				
		
		function setSpinner() {
			usSpinnerService.spin('marker-spinner');
		}
		function stopSpinner() {
			usSpinnerService.stop('marker-spinner');
		}
		
		
		function validateMarker() {

			// get ngModel value
			var marker_symbol = _self.markerSymbol;
			
			if (!marker_symbol) {
				return $q.when();
			}
			
			if (MarkerValidatorService.isWildcardSearch(marker_symbol)) {
				return $q.when();
			}
			
			// previous search was valid and has not yet changed
			if (vm.validated || _self.isValid) {
				return $q.when();
			}
			
			setSpinner();
			var promise = MarkerValidatorService.validateMarker(marker_symbol)
			  .then(function(data){
				if (data.total_count == 1) {
					var marker = data.items[0];
					
					// prevent selecting withdrawn marker
					if (MarkerValidatorService.isWithdrawnMarker(marker)) {
						MarkerValidatorService.raiseWithdrawnMarkerError(marker);
						clearAndFocus('marker_symbol');
						throw "selected withdrawn marker";
					}
					
					selectMarker(marker);
				}
				else if (data.total_count == 0) {

					var error = {
						error: 'MarkerSymbolNotFoundError',
						message: 'Invalid marker symbol ' + marker_symbol
					};
					ErrorMessage.notifyError(error);
					clearAndFocus('marker_symbol');
					throw "invalid marker symbol";
				}
				else {
					vm.markerSelections = data.items;
					focusOnMarkerSelections();
				}
				
				return data;
			}, function(error) {
			    ErrorMessage.handleError(error);
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
			ErrorMessage.clear();
			// after-validated callback
			// ????
			vm.validated = true;
			console.log('marker selected');
			_self.onValidation({marker: marker});
		}

		
		function clearAndFocus() {
			// clear ngModel value
			_self.markerSymbol = '';
			var element = $element.find('input')[0]
			Focus.onElement(element);
		}
		
		function focusOnMarkerSelections() {
			Focus.onElementByQuery(".markerSelections");
		}
	
		
		function checkTab(event) {
			// Add the 'tab' shortcut for this input
			var TAB_KEY = 9;
			if (event.keyCode == TAB_KEY) {
				validateMarker();
				return false;
			}
			return true;
		}
		
		
		function onUserInputChange() {
			clearMarkerSelection();
			vm.validated = false;
			_self.onChange();
		}
		
		// expose functions to template
		_self.checkTab = checkTab;		
		_self.onUserInputChange = onUserInputChange;
		_self.cancelMarkerSelection = cancelMarkerSelection;
		_self.selectMarker = selectMarker;
		
		controllerInit();
	}
	

})();
