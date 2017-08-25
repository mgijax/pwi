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
		// pull in parent scope from page controller
		var pageScope = $scope.$parent;

		// these equate to form parameters
		var vm = $scope.vm = {}
		vm.selected = {
		  is_discard: 'No Discard',
		};
		vm.summary_refs_key = {
				_refs_key: ''
			};
		
		vm.searchResults = {
			items: [],
		}		
		vm.refData = {
		  isreviewarticle: 'No',
		  is_discard: 'No',
		}		
		vm.batchRefTag = {
			  "_refs_keys": [],
			  "workflow_tag": ""
		}		
		// list of tags to use in autocomplete
		vm.workflowTags = [];
		vm.workflowTagObjs = [];
		
		// index of selected summary reference
		vm.selectedIndex = 0;

		// number of references returned
		vm.ref_count = 0;
		
		// set hidden query form and controls 
		vm.queryForm = false;
		vm.closeButtonRow = true;
		vm.showSelected = true;
		vm.showSelected = true;
		vm.showData = true;
		vm.showRefData = true;
		vm.showWorkflowTags = true;

		
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
			
			// pull reference types for droplist
			VocTermSearchAPI.get(
			  {vocab_name:'Reference Type'}, 
			  function(data) {
				$scope.reftype_choices = data.items;
			});

			// pull all tags for autocomplete
			VocTermSearchAPI.get(
			  {vocab_name:'Workflow Tag', sort_name: 'term'}, 
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
		  
		// removes all results from result table
        function clearResultTable() {
        	vm.data = [];
        	vm.ref_count = 0;
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
				vm.ref_count = data.total_count;
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
			vm.selected = {
			  is_discard: 'No Discard',
			};
			clearResultTable();               // reference summary table  
			vm.refData = {};                  // tab data
			vm.acTag = "";                    // autocomplete
			vm.batchRefTag.workflow_tag = ""; // autocomplete
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

		// mapped to associate tags button on summary (used to apply a tag to multiple references)
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

		// mapped to remove tags button on summary (used to remove a tag to multiple references)
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
		
		// mapped to Next Reference button
		function nextReference() {
			
			// ensure we have data
			if(vm.data.length == 0) return;

			// ensure we're not past the end of the data
			if(vm.selectedIndex + 1 >= vm.data.length) return;

			// we're safe -- increment & load reference
			vm.selectedIndex++;
			loadReference();
			scrollToRef();
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
			scrollToRef();
		}

		// mapped to click on summary row
		function setReference(index) {
			vm.refData = {};
			vm.selectedIndex = index;
			loadReference();
		}		

		// pulls reference for given ref key, and loads to local scope
		function loadReference() {	
			vm.summary_refs_key = vm.data[vm.selectedIndex]._refs_key;
			unhighlightLastTagRow();
			vm.acTag = ""; // autocomplete
			
			// call API to search results
			ReferenceSearchAPI.get({ key: vm.summary_refs_key }, function(data) {
				vm.refData = data.items[0];
			}, function(err) {
				setMessage(err.data);
			});
		}

		// mapped to modify button in edit tabs
		function modifyEditTab() {
			// start spinner
			pageScope.loadingStart();

			unhighlightLastTagRow();

			// call API to search results
			ReferenceUpdateAPI.update(vm.refData, function(data) {
				
				// set return data and finish
				vm.refData = data.items[0];
				pageScope.loadingFinished();
				
			}, function(err) {
				setMessage(err.data);
				pageScope.loadingFinished();
			});
		}		

		// mapped to cancel button in edit tabs
		function cancelEdit() {
			loadReference();
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

		// initialize the page
		init();
		
	}

})();

