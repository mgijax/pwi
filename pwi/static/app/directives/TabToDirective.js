(function() {
	'use strict';
	
	/*
	 * Use tab-to="id" to change focus to a specified
	 *   element when "tabbing" out of the current field.
	 *   
	 *   Example:
	 *   <input id="markerSymbol" />
	 *   <input id="notes" tab-to="markerSymbol" />
	 *   
	 *   Pressing "tab" from notes input will focus user on markerSymbol next.
	 */
	angular.module('pwi')
		.directive('tabTo', function(Focus) {
		  return {
		    require: 'ngModel',
		    link: function(scope, element, attrs, ngModel) {
		    	
		    	function tabTo() {
		    		Focus.onElementById(attrs.tabTo);
		    	}
		    	
		    	function checkTab(event) {
		    		
					// Add the 'tab' shortcut for this input
					var TAB_KEY = 9;
					if (!event.shiftKey && event.keyCode == TAB_KEY) {
						tabTo();
						return false;
					}
					return true;
				}
		    	
		    	element.bind("keydown", checkTab);
		    	
		    }
		  };
		});

})();
