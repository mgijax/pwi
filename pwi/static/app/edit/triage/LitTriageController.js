(function() {
	'use strict';
	angular.module('pwi.triage').controller('LitTriageController', LitTriageController);

	function LitTriageController(
			// angular tools
			$document,
			$filter,
			$http,  
			$q,
			$scope, 
			$timeout,
			$window, 
			// general purpose utilities
			ErrorMessage,
			FindElement,
			Focus,
			// resource APIs
			TriageSearchAPI
	) {
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {}
		// primary form model
		vm.selected = {
			accids: ''
		};
		
		vm.searchResults = {
			items: [],
			total_count: 0
		}		
		
		/*
		 * Initialize the page.
		 * 
		 * 	All items are asynchronous, but are roughly
		 * 		ordered by importance.
		 */
		function init() {
			
			//initCommentChoices();
						
			//addShortcuts();
			
			//setTimeout(function(){
			//	addScrollBarToGrid();
			//	slideGridToRight();
			//}, 2000);
			
		}
		

		function search() {	
			TriageSearchAPI.search(vm.selected, function(data) {
				vm.data = data.items;
			}, function(err) {
				setMessage(err.data);
			});
		}
		function clearAll() {
			vm.selected = {};
			vm.data = [];
		}		
		
		/*
		 * Expose functions on controller scope
		 */
		//$scope.clearAll = clearAll;
		$scope.search = search;
		$scope.clearAll = clearAll;
		
		init();
		
	}

})();
