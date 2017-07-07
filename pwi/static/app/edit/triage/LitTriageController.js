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
			ReferenceSearchAPI,
			VocTermSearchAPI,
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
		vm.summary_refs_key = {
				_refs_key: ''
			};
		
		vm.searchResults = {
			items: [],
			total_count: 0
		}		
		
		// set hidden query form and controls 
		vm.queryForm = false;
		vm.closeButtonRow = true;
		vm.showSelected = true;
		vm.showSelected = true;
		vm.showCount = true;
		vm.showData = true;
		vm.showRefData = true;
		
		/*
		 * Initialize the page.
		 */
		function init() {
			
			loadActualDbValues();
			
			loadVocabs();
						
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
		
		// load the vocab choices for reference type drop list
		function loadVocabs() {
			
			VocTermSearchAPI.get(
			  {vocab_name:'Reference Type'}, 
			  function(data) {
				$scope.reftype_choices = data.items;
			});
		}


		// removes all results from result table
        function clearResultTable() {
        	vm.data = [];
        	vm.total_count = 0;
        }

        // mapped to search summary button
		function search() {	
			
			// start spinner
			pageScope.loadingStart();
			
			// reset the results table
			clearResultTable();

			// call API to search results
			TriageSearchAPI.search(vm.selected, function(data) {
				vm.data = data.items;
				vm.total_count = data.total_count;
				pageScope.loadingFinished();
				
				// TODO -- load first reference in vm.data
				// set vm.summary_refs_key to first ref in data and call loadReference()
				
			}, function(err) {
				setMessage(err.data);
				pageScope.loadingFinished();
			});
		}

		// mapped to clear button
		function clearAll() {
			vm.selected = {};
			clearResultTable();
		}		

		function setReference(index) {
			vm.summary_refs_key = vm.data[index]._refs_key;
			loadReference();
		}		
		function loadReference() {	
			
			// call API to search results
			//ReferenceSearchAPI.search(vm.summary_refs_key, function(data) {
			ReferenceSearchAPI.get({ key: vm.summary_refs_key }, function(data) {
				vm.refData = data;
			}, function(err) {
				setMessage(err.data);
			});
		}
		
		
		//Expose functions on controller scope
		$scope.search = search;
		$scope.clearAll = clearAll;
		$scope.setReference = setReference;
		
		// initialize the page
		init();
		
	}

})();

