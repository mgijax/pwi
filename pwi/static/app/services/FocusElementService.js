(function() {
	'use strict';
	angular.module('pwi.mgi')
		.factory('Focus', FocusElementService);

	/*
	 * Focus on element
	 *   queries first using FindElement service
	 */
	function FocusElementService(FindElement) {
		
		
		/*
		 * Focus on given DOM element
		 */
		function focus(element) {
			element.focus();
		}
		
		function onElementById(id) {
			FindElement.byId(id).then(focus);
		}
		
		function onElementByQuery(query) {
			FindElement.byQuery(query).then(focus);
		}
		
		
		return {
			onElement: focus,
			onElementById: onElementById,
			onElementByQuery: onElementByQuery
		}
	}


})();
