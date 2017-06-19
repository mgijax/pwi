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
			TriageSearchAPI,
			ActualDbSearchAPI
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
		
		// pull variables from global scope to angular can access them
		$scope.doi_url = $window.doi_url;
		
		/*
		 * Initialize the page.
		 */
		function init() {
			
			loadActualDbValues();
						
			// TODO - pf
			//addShortcuts();
			
		}
		

		// load the vocab choices
		function loadActualDbValues() {

			// URL for DOI link
			ActualDbSearchAPI.get(
			  {_actualdb_key:'65'}, 
			  function(data) {
				vm.actualDbData = data.items;
				vm.doi_url = data.items[0].url;
			});
			
			// URL for pubmed links
			ActualDbSearchAPI.get(
			  {_actualdb_key:'37'}, 
			  function(data) {
				vm.actualDbData = data.items;
				vm.pubmed_url = data.items[0].url;
			});
		}
		
		
		// functionality mapped to buttons
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
