(function() {
	'use strict';
	angular.module('pwi.mgi')
		.factory('FindElement', FindElementService);

	/*
	 * FindElementService will query the DOM for the desired element
	 * 	If it does not exist yet, it will try until a timeout of 10 seconds is reached.
	 * 
	 * All methods return the found element in a $q promise
	 */
	function FindElementService($document, $q, $timeout) {
		
		function findElementsWithRetries(domQueryFunc, secondsToTry) {

			var timeoutLength = 100;
			var numTimeouts = secondsToTry * 1000 / timeoutLength;
			
			return $q(function(resolve, reject) {
				function _callTimeouts(numTimeoutsLeft) {
					
					$timeout( function(){
						
						var el = domQueryFunc();
						if(el) {
							// resolve
							resolve(el);
						}
						else if (numTimeoutsLeft == 0) {
							// reject
							reject("Failed to find element after " + secondsToTry + " seconds");
						}
						else {
							_callTimeouts(numTimeoutsLeft - 1);
						}
						
					}, timeoutLength);
					
				}
				
				_callTimeouts(numTimeouts);
				
			});
		}
		
		return {
			byId: function(id) {
				function _byId(){
					return $document[0].getElementById(id);
				}
				return findElementsWithRetries(_byId, 10);
			},
			byQuery: function(query) {
				function _byQuery() {
					return $document[0].querySelector(query);
				}
				return findElementsWithRetries(_byQuery, 10);
			}
		}
	}


})();
