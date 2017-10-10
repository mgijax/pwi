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
			ReferenceUpdateAPI,
			ReferenceBatchRefUpdateTagAPI,
			VocTermSearchAPI,
			ActualDbSearchAPI
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {}

		// This is the mapping submitted to to the main lit triage query.
		// These setup defaults for select lists and radio buttons.
		vm.selected = {
		  is_discard: 'No Discard',
		  workflow_tag_operator: 'AND',
		  status_operator: 'OR'			  
		};

		// Used to track which summary reference is highlighted / active
		vm.selectedIndex = 0;
		vm.summary_refs_key = {
				_refs_key: ''
			};
		
		// This mapping is set from main query, and represents the 
		// list of summary references
		vm.searchResults = {
			items: [],
		}		

		// number of references returned
		vm.ref_count = 0;

		// This mapping represents the data in the tabs, and their defaults
		vm.refData = {
		  isreviewarticle: 'No',
		  is_discard: 'No',
		}		

		// This is the mapping submitted to the batch tag setting
		vm.batchRefTag = {
			  "_refs_keys": [],
			  "workflow_tag": ""
		}		

		// list of tags to use in auto-complete
		vm.workflowTags = [];
		vm.workflowTagObjs = [];
		
		// set hidden query form and controls 
		vm.queryForm = false;
		vm.closeButtonRow = true;
		vm.showSelected = true;
		vm.showSelected = true;
		vm.showData = true;
		vm.showRefData = true;
		vm.showWorkflowTags = true;


		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			loadActualDbValues();
			loadVocabs();
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
			
			// pull reference types for droplist
			VocTermSearchAPI.search(
			  {'vocab.name':'Reference Type'}, 
			  function(data) {
				$scope.reftype_choices = data.items;
			});

			// pull workflow supplemental status droplist
			VocTermSearchAPI.search(
			  {'vocab.name':'Workflow Supplemental Status'}, 
			  function(data) {
				$scope.workflow_supp_status_choices = data.items;
			});

			// pull all tags for autocomplete
			VocTermSearchAPI.search(
			  {'vocab.name':'Workflow Tag'}, 
			  function(data) {
				
				// save tag term objects locally
				vm.workflowTagObjs = data.items;
				
				// convert tag term objects to an array of sorted strings
				var counter;
				for (counter in vm.workflowTagObjs) {
					vm.workflowTags.push(vm.workflowTagObjs[counter].term);
				}
				vm.workflowTags.sort();

				// attach tag autocomplete
				$q.all([
				    FindElement.byId("tags"),
				]).then(function(elements) {
					var ac = angular.element(elements[0]);
					ac.autocomplete({
						source: vm.workflowTags,
						autoFocus: true
					});
				});
				$q.all([
					    FindElement.byId("workflow_tag1"),
				]).then(function(elements) {
						var ac = angular.element(elements[0]);
						ac.autocomplete({
							source: vm.workflowTags,
							autoFocus: true
					});
				});
				$q.all([
					    FindElement.byId("workflow_tag2"),
				]).then(function(elements) {
						var ac = angular.element(elements[0]);
						ac.autocomplete({
							source: vm.workflowTags,
							autoFocus: true
					});
				});
				$q.all([
					    FindElement.byId("workflow_tag3"),
				]).then(function(elements) {
						var ac = angular.element(elements[0]);
						ac.autocomplete({
							source: vm.workflowTags,
							autoFocus: true
					});
				});
				$q.all([
					    FindElement.byId("workflow_tag4"),
				]).then(function(elements) {
						var ac = angular.element(elements[0]);
						ac.autocomplete({
							source: vm.workflowTags,
							autoFocus: true
					});
				});
				$q.all([
					    FindElement.byId("workflow_tag5"),
				]).then(function(elements) {
						var ac = angular.element(elements[0]);
						ac.autocomplete({
							source: vm.workflowTags,
							autoFocus: true
					});
				});
				$q.all([
					    FindElement.byId("workflow_tag_batch"),
				]).then(function(elements) {
						var ac = angular.element(elements[0]);
						ac.autocomplete({
							source: vm.workflowTags,
							autoFocus: true
					});
				});
							  
			 });			
		}


		/////////////////////////////////////////////////////////////////////
		// Query Form functionality
		/////////////////////////////////////////////////////////////////////
		
        // query form search -- mapped to query search button
		function search() {				
		
			// reset the results table and edit tab to clear the page
			clearResultTable();
			vm.tabWrapperForm.$setPristine();
			vm.tabWrapperForm.$setUntouched();

			// ensure the query form has been touched before submission
			if (vm.litTriageQueryForm.$dirty) {

				// start spinner & close query form area
				pageScope.loadingStart();
				vm.queryForm = !vm.queryForm; 
				vm.closeButtonRow = !vm.closeButtonRow
				
				// call API to search; pass query params (vm.selected)
				TriageSearchAPI.search(vm.selected, function(data) {
				
					// check for API returned error
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else { // success
						// set return data, and load first reference
						vm.data = data.items;
						vm.ref_count = data.total_count;
						vm.summary_count = data.all_match_count;
						vm.selectedIndex = 0;
						vm.refData = {};
						if (vm.ref_count != 0){
							setReference(0);
						}
					}

					// close the spinner
					pageScope.loadingFinished();

				}, function(err) { // server exception
					setMessage(err.data);
					pageScope.loadingFinished();
				});

			
			} else { // query form empty
				alert("Please add query parameter");
			}
		}

		// clears query form -- mapped to clear button
		function clearAll() {
			vm.selected = {
			  is_discard: 'No Discard',
			  workflow_tag_operator: 'AND',
			  status_operator: 'OR'			  
			};
			clearResultTable();               // reference summary table  
			vm.refData = {};                  // tab data
			vm.acTag = "";                    // autocomplete
			vm.batchRefTag.workflow_tag = ""; // autocomplete
			
			// reset QFs dirty/pristine touched/untouched flags
			vm.litTriageQueryForm.$setPristine();
			vm.tabWrapperForm.$setUntouched();

		}		
		

		/////////////////////////////////////////////////////////////////////
		// Summary functionality
		/////////////////////////////////////////////////////////////////////
		
		// removes all results from result table
        function clearResultTable() {
        	vm.data = [];
        	vm.ref_count = 0;
        }

        // mapped to 'Select All' button -- add checks to all checkboxes in summary
		function selectAllSummaryRefs() {
			var ref;
			var counter;
			for (counter in vm.data) {
				ref = vm.data[counter];
				ref.has_new_tag = '1'; 
			}
		}		

		// mapped to 'De-select All' button -- removes checks from all checkboxes in summary
		function deselectAllSummaryRefs() {
			var ref;
			var counter;
			for (counter in vm.data) {
				ref = vm.data[counter];
				ref.has_new_tag = '0'; 
			}
		}		

		// associate tag to summary references - mapped to button
		function associateTagToSummaryRefs() {

			// start spinner
			pageScope.loadingStart();

			var refsToTag = [];
			var ref;

			// check all refs in summary for checked status, and set list to query param
			var counter;
			for (counter in vm.data) {
				ref = vm.data[counter];
				if (ref.has_new_tag == '1') {
					refsToTag.push(ref._refs_key);
				}
			}
			vm.batchRefTag._refs_keys = refsToTag;
			
			//flag this as an add
			vm.batchRefTag.workflow_tag_operation = "add";

			// call API to update results
			ReferenceBatchRefUpdateTagAPI.update(vm.batchRefTag, function(data) {
				
				// stop loading, reload reference, and reset the autocomplete
				pageScope.loadingFinished();
				loadReference();
				vm.batchRefTag.workflow_tag = "";

			}, function(err) {
				setMessage(err.data);
				pageScope.loadingFinished();
			});

		}		

		// un-associate tag from summary references - mapped to button
		function unassociateTagToSummaryRefs() {
	
			// start spinner
			pageScope.loadingStart();

			var refsToTag = [];
			var ref;

			// check all refs in summary for checked status, and set list to query param
			var counter;
			for (counter in vm.data) {
				ref = vm.data[counter];
				if (ref.has_new_tag == '1') {
					refsToTag.push(ref._refs_key);
				}
			}
			vm.batchRefTag._refs_keys = refsToTag;
			
			//flad this as an add
			vm.batchRefTag.workflow_tag_operation = "remove";

			// call API to update results
			ReferenceBatchRefUpdateTagAPI.update(vm.batchRefTag, function(data) {
				
				// stop loading, reload reference, and reset the autocomplete
				pageScope.loadingFinished();
				loadReference();
				vm.batchRefTag.workflow_tag = "";

			}, function(err) {
				setMessage(err.data);
				pageScope.loadingFinished();
			});

		}		

		// called when user clicks on summary row reference
		function setReference(index) {

			// check to see if user has modified any data
			var userCheck;
			if (vm.tabWrapperForm.$dirty) {
				userCheck = $window.confirm('You have unsaved modifications.  Click cancel if you wish to go back and save the reference data.');
				if (userCheck == false) return;
			}

			// load reference
			vm.refData = {};
			vm.selectedIndex = index;
			loadReference();
		}		

		// mapped to Prev Reference button
		function prevReference() {
			
			// check to see if user has modified any data
			var userCheck;
			if (vm.tabWrapperForm.$dirty) {
				userCheck = $window.confirm('You have unsaved modifications.  Click cancel if you wish to go back and save the reference data.');
				if (userCheck == false) return;
			}

			// ensure we have data
			if(vm.data.length == 0) return;

			// ensure we're not at the first reference
			if(vm.selectedIndex == 0) return;

			// we're safe -- increment & load reference
			vm.selectedIndex--;
			loadReference();
			scrollToRef();
		}

		// mapped to Next Reference button
		function nextReference() {

			// check to see if user has modified any data
			var userCheck;
			if (vm.tabWrapperForm.$dirty) {
				userCheck = $window.confirm('You have unsaved modifications.  Click cancel if you wish to go back and save the reference data.');
				if (userCheck == false) return;
			}
			
			// ensure we have data
			if(vm.data.length == 0) return;

			// ensure we're not past the end of the data
			if(vm.selectedIndex + 1 >= vm.data.length) return;

			// we're safe -- increment & load reference
			vm.selectedIndex++;
			loadReference();
			scrollToRef();
		}

		// ensure we keep the selected row in view
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
		
		/////////////////////////////////////////////////////////////////////
		// Edit tab functionality
		/////////////////////////////////////////////////////////////////////

		// pulls reference for given ref key, and loads to local scope
		function loadReference() {
			vm.tabWrapperForm.$setUntouched();
			vm.summary_refs_key = vm.data[vm.selectedIndex]._refs_key;
			unhighlightLastTagRow();
			vm.acTag = ""; // autocomplete
			
			// call API to search results
			ReferenceSearchAPI.get({ key: vm.summary_refs_key }, function(data) {
				vm.refData = data.items[0];
			}, function(err) {
				setMessage(err.data);
			});

			// reset QF dirty/pristine flag
			vm.tabWrapperForm.$setPristine();		
		}

		// mapped to associate tag button in edit tab
		function associateTag() {

			// add the selected tag to this reference
			vm.refData.workflow_tags.push(vm.acTag);
			vm.acTag = '';
			
			// highlight the row -- pause to wait for injection
			setTimeout(highlightLastTagRow, 200)
		}		

		// mapped remove tag icon
		function removeTag(index) {
			//delete vm.refData.workflow_tags[index];
			vm.refData.workflow_tags.splice( index, 1 );
			vm.tabWrapperForm.$setDirty();
		}		

		// encapsulation of row highlighting
		function highlightLastTagRow() {
			var foo = angular.element("#editTabTags tr:last");
			foo.css('background-color', 'orange');
		}		
		// encapsulation of row highlighting removal
		function unhighlightLastTagRow() {
			var foo = angular.element("#editTabTags tr");
			foo.css('background-color', '');
		}		
		
		// mapped to modify button in edit tabs
		function modifyEditTab() {

			// start spinner and reset the form
			pageScope.loadingStart();
			vm.tabWrapperForm.$setUntouched();


			// call API to search results
			ReferenceUpdateAPI.update(vm.refData, function(data) {
				
				// check for API returned error
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
					pageScope.loadingFinished();
				}
				else {
					// set return data and finish
					vm.refData = data.items[0];
					unhighlightLastTagRow();
					pageScope.loadingFinished();
					vm.tabWrapperForm.$setPristine();		
				}
				
			}, function(err) {
				setMessage(err.data);
				pageScope.loadingFinished();
			});

		}		

		// mapped to cancel button in edit tabs
		function cancelEdit() {
			loadReference();
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
		$scope.modifyEditTab = modifyEditTab;
		$scope.cancelEdit = cancelEdit;
		$scope.associateTag = associateTag;
		$scope.removeTag = removeTag;
		$scope.associateTagToSummaryRefs = associateTagToSummaryRefs;
		$scope.unassociateTagToSummaryRefs = unassociateTagToSummaryRefs;
		$scope.selectAllSummaryRefs = selectAllSummaryRefs;
		$scope.deselectAllSummaryRefs = deselectAllSummaryRefs;


		// global shortcuts
		$scope.KclearAll = function() { $scope.clearAll(); $scope.$apply(); }
		$scope.Ksearch = function() { $scope.search(); $scope.$apply(); }
		$scope.KnextReference = function() { $scope.nextReference(); $scope.$apply(); }
		$scope.KprevReference = function() { $scope.prevReference(); $scope.$apply(); }
		$scope.KmodifyEditTab = function() { $scope.modifyEditTab(); $scope.$apply(); }
		$scope.KassociateTag = function() { 
			// change focus so autocomplete properly selects term, then reset focus
			var modifyButton = angular.element("#saveTagButton");
			var tagInput     = angular.element("#tags");
			modifyButton.focus();
			$scope.associateTag(); $scope.$apply(); 
			tagInput.focus();
		}
		var globalShortcuts = Mousetrap($document[0].body);
		globalShortcuts.bind(['ctrl+alt+c'], $scope.KclearAll);
		globalShortcuts.bind(['ctrl+alt+s'], $scope.Ksearch);
		globalShortcuts.bind(['ctrl+alt+n'], $scope.KnextReference);
		globalShortcuts.bind(['ctrl+alt+p'], $scope.KprevReference);
		globalShortcuts.bind(['ctrl+alt+m'], $scope.KmodifyEditTab);
		globalShortcuts.bind(['ctrl+alt+t'], $scope.KassociateTag);
		
		// initialize the page
		init();
		
	}

})();

