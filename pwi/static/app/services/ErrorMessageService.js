(function() {
	'use strict';
	angular.module('pwi.mgi')
		.factory('ErrorMessage', ErrorMessageService);

	/*
	 * Handles setting error messages
	 */
	function ErrorMessageService($rootScope) {
		
		var NOTIFY_ERROR_EVENT = 'notify-error-event';
		
		function clear() {
			notifyError(false);
		}
		
		function handleError(errorResponse) {
			
			var data = errorResponse.data;
			
			notifyError(data);
		}
		
		function notifyError(data) {
			$rootScope.$emit(NOTIFY_ERROR_EVENT, data);
		}
		
		function notifyErrorOn(scope, callbackFunc) {
			var handler = $rootScope.$on(NOTIFY_ERROR_EVENT, callbackFunc);
			scope.$on('$destroy', handler);
		}
		
		
		return {
			clear: clear,
			
			handleError: handleError,
			
			notifyError: notifyError,
			
			notifyErrorOn: notifyErrorOn
		}
	}


})();
