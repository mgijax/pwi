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
		vm.refData = {
		  gxd_status: 'Rejected',
		  isreviewarticleYN: 'No',
		  go_status: 'Not Routed'
		}		
		

		// index of selected summary reference
		vm.selectedIndex = 0;

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
				
				// set return data
				vm.data = data.items;
				vm.total_count = data.total_count;
				pageScope.loadingFinished();
				
				// load first returned row into reference area
				vm.selectedIndex = 0;
				setReference(0);
				
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
			vm.selectedIndex = index;
			loadReference();
		}		

		// mapped to Next Reference button
		function nextReference() {
			
			// ensure we have data
			if(vm.data.length == 0) return;

			// ensure we're not past the end of the data
			if(vm.selectedIndex + 1 >= vm.data.length) return;

			// we're safe -- increment & load reference
			vm.selectedIndex++;
			loadReference();
		}

		// mapped to Prev Reference button
		function prevReference() {
			
			// ensure we have data
			if(vm.data.length == 0) return;

			// ensure we're not at the first reference
			if(vm.selectedIndex == 0) return;

			// we're safe -- increment & load reference
			vm.selectedIndex--;
			loadReference();
		}

		function loadReference() {	
			vm.summary_refs_key = vm.data[vm.selectedIndex]._refs_key;
			
			// call API to search results
			ReferenceSearchAPI.get({ key: vm.summary_refs_key }, function(data) {
				vm.refData = data;
				scrollToRef();
			}, function(err) {
				setMessage(err.data);
			});
		}

		function scrollToRef() {
			$q.all([
			   FindElement.byId("resultTableWrapper"),
			   FindElement.byQuery("#resultsTable .resultsTableSelectedRow")
			 ]).then(function(elements) {
				 var table = angular.element(elements[0]);
				 var selected = angular.element(elements[1]);
				 var offset = 30;
				 table.scrollToElement(selected, offset, 0);
			 });
		}	
		
		function setMessage(data) {
			if(data.error) {
				vm.message.type = "danger";
				vm.message.text = data.message;
				vm.message.detail = data.error;
			} else if(data.success) {
				vm.message.type = "success";
				vm.message.text = data.message;
				$timeout(turnOffCheck, 2700);
			} else {
				vm.message.type = "info";
				vm.message.text = data.message;
			}
		}

		
		//Expose functions on controller scope
		$scope.search = search;
		$scope.clearAll = clearAll;
		$scope.setReference = setReference;
		$scope.nextReference = nextReference;
		$scope.prevReference = prevReference;
		
		// initialize the page
		init();
		
	}

})();

