(function() {
	'use strict';
	angular.module('pwi.gxd')
		.factory('MarkerValidatorService', MarkerValidatorService);


	function MarkerValidatorService(
			ErrorMessage,
			$q,
			$rootScope,
			ValidMarkerAPI
	) {
		
		// hook set by component
		var componentValidationHook = function(){
			return $q.when();
		};
		
		function validateMarker(marker_symbol) {
				
			var promise = ValidMarkerAPI.get({symbol: marker_symbol}).$promise
			
			return promise;
		}
		
		
		function isWildcardSearch(input) {
			return input.indexOf('%') >= 0;
		}
		
		
		function isHeritablePhenotypicMarker(marker) {
			
			for (var i=0; i<marker.featuretypes.length; i++) {
				var featuretype = marker.featuretypes[i];
				if (featuretype == 'heritable phenotypic marker') {
					return true;
				}
			}
			
			return false;
		}
		
		function isQTLMarker(marker) {
			return marker.markertype == 'QTL';
		}
		
		function isWithdrawnMarker(marker) {
			return marker.markerstatus == 'withdrawn';
		}
		
		
		function raiseHeritableMarkerWarning(marker) {
			var errorMessage = 'You selected a heritable phenotypic marker: ' 
				+ marker.symbol;
			;
			var error = {
				error: 'Warning',
				message: errorMessage
			};
			ErrorMessage.notifyError(error);
		}
		
		function raiseQTLWarning(marker) {

			var errorMessage = 'You selected a QTL type marker: ' 
				+ marker.symbol;
			;
			var error = {
				error: 'Warning',
				message: errorMessage
			};
			ErrorMessage.notifyError(error);
		}
		function raiseWithdrawnMarkerError(marker) {

			var errorMessage = 'Cannot select withdrawn marker: ' 
				+ marker.symbol
				+ '. Current symbols are: ' 
				+ marker.current_symbols
			;
			var error = {
				error: 'SelectedWithdrawnMarkerError',
				message: errorMessage
			};
			ErrorMessage.notifyError(error);
		}
		
		
		/*
		 * Validates the marker, but stops if the bound validationController 
		 *   has to be handled by any further user interaction.
		 *   E.g. Two markers came back ('T' and 't') and user must select one
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
			// validations
			isHeritablePhenotypicMarker: isHeritablePhenotypicMarker,
			isQTLMarker: isQTLMarker,
			isWildcardSearch: isWildcardSearch,
			isWithdrawnMarker: isWithdrawnMarker,
			// errors & warnings
			raiseHeritableMarkerWarning: raiseHeritableMarkerWarning,
			raiseQTLWarning: raiseQTLWarning,
			raiseWithdrawnMarkerError: raiseWithdrawnMarkerError,
			// component <=> controller communication
			setValidationHook: setValidationHook,
			// AJAX validators
			validateMarker: validateMarker,
			validateWithComponent: validateWithComponent
		}
	}


})();
