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
		// pull in parent scope from page controller
		var pageScope = $scope.$parent;

		// these equate to form parameters
		var vm = $scope.vm = {}
		vm.selected = {
			accids: '',
			authors: '',
			journal: '',
			title: '',
			volume: '',
			issue: '',
			pages: '',
			date: '',
			abstract: '',
			notes: ''
		};
		
		vm.searchResults = {
			items: [],
			total_count: 0
		}		
		
		// set hidden query form and controls 
		vm.queryForm = false;
		vm.closeButtonRow = true;

		/*
		 * Initialize the page.
		 */
		function init() {
			
			loadActualDbValues();
						
			// TODO - pf
			//addShortcuts();
			
		}
		

		// load the actual db values from DB for linking purposes
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
			
			// start spinner
			pageScope.loadingStart();

			// call API to search
			TriageSearchAPI.search(vm.selected, function(data) {
				vm.data = data.items;
				vm.total_count = data.total_count;
				pageScope.loadingFinished();
			}, function(err) {
				setMessage(err.data);
				pageScope.loadingFinished();
			});
		}
		function clearAll() {
			vm.selected = {};
			vm.data = [];
		}		
		
		//Expose functions on controller scope
		$scope.search = search;
		$scope.clearAll = clearAll;
		
		// initialize the page
		init();
		
	}

})();
