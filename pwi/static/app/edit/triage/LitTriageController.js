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
			JournalAPI,
			ReferenceSearchAPI,
			ReferenceCreateAPI,
			ReferenceUpdateAPI,
			ReferenceDeleteAPI,
			ReferenceBatchRefUpdateTagAPI,
			ActualDbSearchAPI,
			ReferenceAlleleAssocAPI,
			// global resource APIs
			MGIRefAssocTypeSearchAPI,
			ValidateAlleleAPI,
			VocTermSearchAPI
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {}

		// This is the mapping submitted to the main lit triage query.
		// These setup defaults for select lists and radio buttons.
		vm.selected = {};

		// results list and data
		vm.results = []
		vm.selectedIndex = 0;
		vm.summary_count = 0;

		// This mapping represents the data in the tabs, and their defaults
		vm.refData = {};

		// This is the mapping submitted to the batch tag setting
		vm.batchRefTag = {};		

		// list of tags to use in auto-complete
		vm.workflowTags = [];
		vm.workflowTagObjs = [];

		// list of journals to use in auto-complete
		vm.journals = {}
		
		// set hidden query form and controls 
		vm.isFullSearch = isFullSearch;
		vm.queryForm = false;
		vm.closeButton = true;
		vm.showSelected = true;
		vm.showResults = true;
		vm.showRefData = true;
		vm.showWorkflowTags = true;
		vm.showJournals = true;

		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			resetAll();
			loadActualDbValues();
			loadVocabs();
		
			if (vm.isFullSearch) { 
				vm.queryForm = false; 
			}
			else { 
				vm.queryForm = true;
			}
			console.log(vm.queryForm);
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
			
			// reference types droplist
			VocTermSearchAPI.search( {name:"Reference Type"}, function(data) {
				$scope.reftype_choices = data.items[0].terms;
			});

			// workflow supplemental status droplist
			VocTermSearchAPI.search( {name:"Workflow Supplemental Status"}, function(data) {
				$scope.workflow_supp_status_choices = data.items[0].terms;
			});

			// all tags for autocomplete
			VocTermSearchAPI.search( {name:"Workflow Tag"}, function(data) {
				// save tag term objects locally
				vm.workflowTagObjs = data.items[0].terms;
				
				// convert tag term objects to an array of sorted strings
				var counter;
				for (counter in vm.workflowTagObjs) {
					vm.workflowTags.push(vm.workflowTagObjs[counter].term);
				}
				vm.workflowTags.sort();
			});

			// make sure setAutoComplete() is run after this function
			// autocomplete for journal
			JournalAPI.get({}, function(data) {
				vm.journals = data.items;
				setAutoComplete();
			});			
			
			// allele assoc droplist
			MGIRefAssocTypeSearchAPI.search( {mgiTypeKey:"11"}, function(data) {
				vm.alleleAssocType_choices = data.items;
			});
		}

		// set the auto-complete attachments
		function setAutoComplete() {
			
			// attach tag autocomplete
			$q.all([
			    FindElement.byId("tags"),
			]).then(function(elements) {
				pageScope.autocompleteAll(angular.element(elements[0]), vm.workflowTags);
			});
			$q.all([
			    FindElement.byId("workflow_tag1"),
			]).then(function(elements) {
				pageScope.autocompleteAll(angular.element(elements[0]), vm.workflowTags);
			});
			$q.all([
			    FindElement.byId("workflow_tag2"),
			]).then(function(elements) {
				pageScope.autocompleteAll(angular.element(elements[0]), vm.workflowTags);
			});
			$q.all([
			    FindElement.byId("workflow_tag3"),
			]).then(function(elements) {
				pageScope.autocompleteAll(angular.element(elements[0]), vm.workflowTags);
			});
			$q.all([
			    FindElement.byId("workflow_tag4"),
			]).then(function(elements) {
				pageScope.autocompleteAll(angular.element(elements[0]), vm.workflowTags);
			});
			$q.all([
			    FindElement.byId("workflow_tag5"),
			]).then(function(elements) {
				pageScope.autocompleteAll(angular.element(elements[0]), vm.workflowTags);
			});
			$q.all([
			    FindElement.byId("workflow_tag_batch"),
			]).then(function(elements) {
				pageScope.autocompleteAll(angular.element(elements[0]), vm.workflowTags);
			});
							  
			// autocomplete for journal
			$q.all([
			    FindElement.byId("journal"),
			]).then(function(elements) {
				pageScope.autocompleteBeginning(angular.element(elements[0]), vm.journals);
			});

			$q.all([
			    FindElement.byId("editTabJournal"),
			]).then(function(elements) {
				pageScope.autocompleteBeginning(angular.element(elements[0]), vm.journals);
			});
		}

		/////////////////////////////////////////////////////////////////////
		// Query Form functionality
		/////////////////////////////////////////////////////////////////////
		
        	// query form search -- mapped to query search button
		function search() {				
			console.log("search()");
		
			// reset the results table and edit tab to clear the page
			clearResultTable();
			vm.tabWrapperForm.$setPristine();
			vm.tabWrapperForm.$setUntouched();

			// ensure the query form has been touched before submission
			// or the accession id exists
			if (vm.litTriageQueryForm.$dirty || vm.selected.accids != null) {

				// start spinner & close query form area
				pageScope.loadingStart();
				if (vm.queryForm==false)  {vm.queryForm = true; };
				if (vm.closeButton==true) {vm.closeButton = false;};
				
				// call API to search; pass query params (vm.selected)
				TriageSearchAPI.search(vm.selected, function(data) {
				
					// check for API returned error
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						vm.results = data.items;
						vm.summary_count = data.all_match_count;
						vm.selectedIndex = 0;
						loadReference();
					}
	
					// close the spinner
					pageScope.loadingEnd();
	
				}, function(err) { // server exception
					setMessage(err.data);
					pageScope.loadingEnd();
				});

			
			} else { // query form empty
				alert("Please add query parameter");
			}
		}

		// binded to clear button; includes setFocusAcc()
		function clearAll() {
			resetAll();
			setFocusAcc();
		}

		// reset all fields; *cannot* include setFocusAcc()
		function resetAll() {

			vm.selected = {
			  isDiscard: 'No',
			  workflow_tag_operator: 'AND',
			  status_operator: 'OR'			  
			};

			vm.refData = {};
			vm.refData.refsKey = "";
			vm.refData.referenceTypeKey = "";
			vm.refData.referenceType = "";
        		vm.refData.authors = "";
        		vm.refData.title = "";
        		vm.refData.journal = "";
        		vm.refData.vol = "";
        		vm.refData.issue = "";
        		vm.refData.date = "";
        		vm.refData.year = "";
        		vm.refData.pgs = "";
			vm.refData.book_author = "";
			vm.refData.book_title = "";
			vm.refData.place = "";
			vm.refData.publisher = "";
			vm.refData.series_ed = "";
        		vm.refData.referenceAbstract = "";
			vm.refData.referenceNote = "";
        		vm.refData.isReviewArticle = "No";
        		vm.refData.isDiscard = "No";

			// allele associations
			vm.refData.alleleAssocs = [];

			vm.activeTab = 1;
			vm.disableDelete = true;

			// reference summary table  
			clearResultTable();

			// autocomplete
			vm.acTag = "";                    

			vm.batchRefTag = {
			  	"refsKeys": [],
			  	"workflow_tag": ""
			};		

		}

		// reset QFs
		function clearQFs() {
			// reset QFs dirty/pristine touched/untouched flags
			vm.litTriageQueryForm.$setPristine();
			vm.tabWrapperForm.$setUntouched();
			setFocusAcc();
		}
	
		// clear accession id
		function clearJnumId() {
			vm.refData.jnumid = "";
		}
		function clearPubmedId() {
			vm.refData.pubmedid = "";
		}
		function clearDOIId() {
			vm.refData.doiid = "";
		}
		function clearGORefId() {
			vm.refData.gorefid = "";
		}
		function clearAbstract() {
			vm.refData.referenceAbstract = "";
		}
		function clearNote() {
			vm.refData.referenceNote = "";
		}

		/////////////////////////////////////////////////////////////////////
		// Summary functionality
		/////////////////////////////////////////////////////////////////////
		
		// removes all results from result table
        	function clearResultTable() {
        		vm.results = [];
        		vm.summary_count = 0;
        		
        	}

        	// mapped to 'Select All' button -- add checks to all checkboxes in summary
		function selectAllSummaryRefs() {
			var ref;
			var counter;
			for (counter in vm.results) {
				ref = vm.results[counter];
				ref.has_new_tag = '1'; 
			}
		}		

		// mapped to 'De-select All' button -- removes checks from all checkboxes in summary
		function deselectAllSummaryRefs() {
			var ref;
			var counter;
			for (counter in vm.results) {
				ref = vm.results[counter];
				ref.has_new_tag = '0'; 
			}
		}		

		// mapped to 'Download' button -- downloads checked references as PDF files
		function downloadSummaryRefs() {
			var refsToDownload = [];
			var ref;
			
			// look for checked references and add them to the list to download
			var counter;
			for (counter in vm.results) {
				ref = vm.results[counter];
				if (ref.has_new_tag == '1') {
					if ((ref.jnumid != undefined) && (ref.jnumid != null) && (ref.jnumid != '')) {
						refsToDownload.push(ref.jnumid);
					} else {
						refsToDownload.push(ref.mgiid);
					}
				}
			}
			var refString = refsToDownload.join(',');
			window.open('http://bhmgiapp01.jax.org/usrlocalmgi/live/pdfviewer/pdfviewer.cgi?zip=1&id=' + refString); 
		}
		
		// associate tag to summary references - mapped to button
		function associateTagToSummaryRefs() {

			var refsToTag = [];
			var ref;

			// check all refs in summary for checked status, and set list to query param
			var counter;
			for (counter in vm.results) {
				ref = vm.results[counter];
				if (ref.has_new_tag == '1') {
					refsToTag.push(ref.refsKey);
				}
			}
			vm.batchRefTag.refsKeys = refsToTag;
			
			//flag this as an add
			vm.batchRefTag.workflow_tag_operation = "add";

			if(refsToTag.length != 0) {

				// start spinner
				pageScope.loadingStart();

				// call API to update results
				ReferenceBatchRefUpdateTagAPI.update(vm.batchRefTag, function(data) {
				
					// stop loading, reload reference, and reset the autocomplete
					pageScope.loadingEnd();
					loadReference();
					vm.batchRefTag.workflow_tag = "";

				}, function(err) {
					setMessage(err.data);
					pageScope.loadingEnd();
				});

			} else { // no summary references selected
				alert("Please select at least one reference.");
			}

		}		

		// un-associate tag from summary references - mapped to button
		function unassociateTagToSummaryRefs() {
	
			var refsToTag = [];
			var ref;

			// check all refs in summary for checked status, and set list to query param
			var counter;
			for (counter in vm.results) {
				ref = vm.results[counter];
				if (ref.has_new_tag == '1') {
					refsToTag.push(ref.refsKey);
				}
			}
			vm.batchRefTag.refsKeys = refsToTag;
			
			//flad this as an add
			vm.batchRefTag.workflow_tag_operation = "remove";

			if(refsToTag.length != 0) {
			
				// start spinner
				pageScope.loadingStart();

				// call API to update results
				ReferenceBatchRefUpdateTagAPI.update(vm.batchRefTag, function(data) {
				
					// stop loading, reload reference, and reset the autocomplete
					pageScope.loadingEnd();
					loadReference();
					vm.batchRefTag.workflow_tag = "";

				}, function(err) {
					setMessage(err.data);
					pageScope.loadingEnd();
				});

			} else { // no summary references selected
				alert("Please select at least one reference.");
			}

		}		

		/////////////////////////////////////////////////////////////////////
		// set/next/previous/etc functionality
		/////////////////////////////////////////////////////////////////////
		
		// called when user clicks on summary row reference
		function setReference(index) {

			// check to see if user has modified any data
			var userCheck;
			if (vm.tabWrapperForm.$dirty) {
				userCheck = userCheckUnsavedModification ();
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
				userCheck = userCheckUnsavedModification ();
				if (userCheck == false) return;
			}

			if(vm.results.length == 0) return;
			if(vm.selectedIndex == 0) return;
			vm.selectedIndex--;
			loadReference();
			scrollToRef();
		}

		// mapped to Next Reference button
		function nextReference() {

			// check to see if user has any unsaved data modifications
			var userCheck;
			if (vm.tabWrapperForm.$dirty) {
				userCheck = userCheckUnsavedModification ();
				if (userCheck == false) return;
			}
			
			if(vm.results.length == 0) return;
			if(vm.selectedIndex + 1 >= vm.results.length) return;
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
			 setFocusAuthor();
		}	
		
		// setting focus
		function setFocusAcc() {
			document.getElementById("accids").focus();
		}
		function setFocusAuthor() {
			document.getElementById("editTabAuthors").focus();
		}

		function userCheckUnsavedModification () {
			return $window.confirm('You have unsaved modifications. Click \'Cancel\' on this message if you wish to go back and Modify the record. (Click \'OK\' to move on to the next record and not save.)');
		}

		/////////////////////////////////////////////////////////////////////
		// Edit tab functionality
		/////////////////////////////////////////////////////////////////////

		// load reference info of selected result
		function loadReference() {
			console.log("loadReference()");

			if (vm.results.length == 0) {
				return;
			}

			vm.tabWrapperForm.$setUntouched();
			unhighlightLastTagRow();
			vm.acTag = ""; // autocomplete
			
			// call API to search results
			ReferenceSearchAPI.get({ key: vm.results[vm.selectedIndex].refsKey }, function(data) {
				vm.refData = data.items[0];
				if (vm.refData.isDiscard == "No") {
					vm.disableDeleteDiscard = true;
				}
				else {
					vm.disableDeleteDiscard = false;
				}
				loadAlleleAssoc();
			}, function(err) {
				setMessage(err.data);
			});

			// reset QF dirty/pristine flag
			vm.tabWrapperForm.$setPristine();		
		}

		// load allele assoc info of selected result
		function loadAlleleAssoc() {
			console.log("loadAlleleAssoc():vm.activeTab: " + vm.activeTab);

			if (vm.activeTab!=2) {
				return;
			}

			if (vm.results.length == 0) {
				return;
			}

			pageScope.loadingStart();

                        ReferenceAlleleAssocAPI.query({ key: vm.results[vm.selectedIndex].refsKey }, function(data) {
                                if (data.length == 0) { 
                                        console.log("no allele assoc for key: " + vm.results[vm.selectedIndex].refsKe);
                                } else {
					vm.refData.alleleAssocs = data;
                                }
				pageScope.loadingEnd();

                        }, function(err) {     
				setMessage(err.data);
				pageScope.loadingEnd();
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
		
        	// mapped to 'Create' button
		function createEditTab() {
			console.log("createEditTab() -> ReferenceCreateAPI()");
			var allowCommit = true;
			
			// check required fields
			// nothing at the moment
			
			if (allowCommit){

				pageScope.loadingStart();

				ReferenceCreateAPI.create(vm.refData, function(data) {
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
                                        	vm.refData = data.items[0];
                                        	vm.selectedIndex = vm.results.length;
                                        	vm.results[vm.selectedIndex] = [];
                                        	vm.results[vm.selectedIndex].refsKey = vm.refData.refsKey;
                                        	vm.results[vm.selectedIndex].mgiid = vm.refData.mgiid;
                                        	vm.results[vm.selectedIndex].jnumid = vm.refData.jnumid;
                                        	vm.results[vm.selectedIndex].doiid = vm.refData.doiid;
                                        	vm.results[vm.selectedIndex].pubmedid = vm.refData.pubmedid;
                                        	vm.results[vm.selectedIndex].short_citation = vm.refData.short_citation;
                                        	vm.results[vm.selectedIndex].title = vm.refData.title;
                                        	vm.results[vm.selectedIndex].has_pdf = vm.refData.has_pdf;
                                        	vm.results[vm.selectedIndex].ap_status = vm.refData.ap_status;
                                        	vm.results[vm.selectedIndex].go_status = vm.refData.go_status;
                                        	vm.results[vm.selectedIndex].gxd_status = vm.refData.gxd_status;
                                        	vm.results[vm.selectedIndex].qtl_status = vm.refData.qtl_status;
                                        	vm.results[vm.selectedIndex].tumor_status = vm.refData.tumor_status;
						vm.tabWrapperForm.$setPristine();
						vm.tabWrapperForm.$setUntouched();
						loadReference();
					}
					pageScope.loadingEnd();
				}, function(err) {
					pageScope.handleError(vm, "Error creating reference.");
					pageScope.loadingEnd();
				});
			}

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
				}
				else {
					// set return data and finish
					vm.refData = data.items[0];
					unhighlightLastTagRow();
				}
				loadReference();
				pageScope.loadingEnd();
				vm.tabWrapperForm.$setPristine();		
				
			}, function(err) {
				setMessage(err.data);
				pageScope.loadingEnd();
			});

		}		

		// mapped to delete  button in edit tabs
		function deleteEditTab() {
			console.log("deleteEditTab() -> ReferenceDeleteAPI()");

			if ($window.confirm("Are you sure you want to delete this record?")) {
				pageScope.loadingStart();
				vm.tabWrapperForm.$setUntouched();

				ReferenceDeleteAPI.delete({ key: vm.refData.refsKey }, function(data) {
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						postObjectDelete();
					}
					pageScope.loadingEnd();
					vm.tabWrapperForm.$setPristine();		
					
				}, function(err) {
					setMessage(err.data);
					pageScope.loadingEnd();
				});

			}
		}		

		// when an object is deleted, remove it from the summary
		function postObjectDelete() {
			console.log("postObjectDelete()");

			removeSearchResultsItem(vm.refData.refsKey);

			if (vm.results.length == 0) {
				clearAll();
				clearQFs();
			}
			else {
				if (vm.selectedIndex > vm.results.length - 1) {
					vm.selectedIndex = vm.results.length - 1;
				}
				loadReference();
			}
		}

		// handle removal from summary list
		function removeSearchResultsItem(keyToRemove) {
			
			// first find the item to remove
			var removeIndex = -1;
			for(var i=0;i<vm.results.length; i++) {
				if (vm.results[i].refsKey == keyToRemove) {
					removeIndex = i;
				}
			}
			// if found, remove it
			if (removeIndex >= 0) {
				vm.results.splice(removeIndex, 1);
			}
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

		function setActiveTab(tabIndex) {
			console.log("setActiveTab(): " + tabIndex);

			vm.activeTab=tabIndex;			
			setAutoComplete();

			if (tabIndex==2) {
				loadAlleleAssoc();
			}
		}

		/////////////////////////////////////////////////////////////////////
		// allele association tab functionality
		/////////////////////////////////////////////////////////////////////
		
		// set process status for deletion
		function deleteAssocRow(assocs, index) {
			assocs[index].processStatus = "d";
		}

		// add new allele assoc
		function addAlleleAssocRow() {
			vm.refData.alleleAssocs.unshift({
				"processStatus": "c", 
				"assocKey": "",
				"objectKey": "",
				"mgiTypeKey": "11",
				"refAssocTypeKey": "1013",
				"refAssocType": "Indexed",
				"refsKey": vm.refData.refsKey,
				"alleleSymbol": "",
				"alleleAccID": "",
				"alleleMarkerSymbol": ""
			});
		}		

		// validate the id
		function validateAllele(index, id) {
			console.log("validateAllele() : " + id);

			// params if used for the validation search only
			var params = {};

			if ((id == "alleleSymbol")
				&& (vm.refData.alleleAssocs[index].alleleSymbol != null) 
				&& (vm.refData.alleleAssocs[index].alleleSymbol != undefined) 
				&& (vm.refData.alleleAssocs[index].alleleSymbol.trim() != "")
				) {

				params.symbol = vm.refData.alleleAssocs[index].alleleSymbol;
			}

			if ((id == "alleleAccID")
				&& (vm.refData.alleleAssocs[index].alleleAccID != null) 
				&& (vm.refData.alleleAssocs[index].alleleAccID != undefined) 
				&& (vm.refData.alleleAssocs[index].alleleAccID.trim() != "")
				) {

				params.mgiAccessionIds = [];
				params.mgiAccessionIds.push({"accID":vm.refData.alleleAssocs[index].alleleAccID.trim()});
			}
			
			if (JSON.stringify(params) != '{}') {
				ValidateAlleleAPI.search(params, function(data) {
					if (data.length == 0) {
						alert("Invalid Allele");
						document.getElementById(id).focus();
					} else {
						if ((vm.refData.alleleAssocs[index].assocKey == null)
							|| (vm.refData.alleleAssocs[index].assocKey == undefined) 
							|| (vm.refData.alleleAssocs[index].assocKey == "")
						) {
							vm.refData.alleleAssocs[index].processStatus = "c";
						} else {
							vm.refData.alleleAssocs[index].processStatus = "u";
						}
						vm.refData.alleleAssocs[index].objectKey = data[0].alleleKey;
						vm.refData.alleleAssocs[index].alleleSymbol = data[0].symbol;
						vm.refData.alleleAssocs[index].alleleAccID = data[0].mgiAccessionIds[0].accID;
						vm.refData.alleleAssocs[index].alleleMarkerSymbol = data[0].markerSymbol;
					}

				}, function(err) {
					pageScope.handleError(vm, "Invalid Allele");
					document.getElementById(id).focus();
				});
			}
		}

		//Expose functions on controller scope
		$scope.search = search;
		$scope.clearAll = clearAll;
		$scope.clearJnumId = clearJnumId;
		$scope.clearPubmedId = clearPubmedId;
		$scope.clearDOIId = clearDOIId;
		$scope.clearGORefId = clearGORefId;
		$scope.clearAbstract = clearAbstract;
		$scope.clearNote = clearNote;

		$scope.setAutoComplete = setAutoComplete;
		$scope.setReference = setReference;
		$scope.nextReference = nextReference;
		$scope.prevReference = prevReference;
		$scope.setActiveTab = setActiveTab;

		$scope.createEditTab = createEditTab;
		$scope.modifyEditTab = modifyEditTab;
		$scope.deleteEditTab = deleteEditTab;
		$scope.cancelEdit = cancelEdit;
		$scope.associateTag = associateTag;
		$scope.removeTag = removeTag;
		$scope.associateTagToSummaryRefs = associateTagToSummaryRefs;
		$scope.unassociateTagToSummaryRefs = unassociateTagToSummaryRefs;

		$scope.selectAllSummaryRefs = selectAllSummaryRefs;
		$scope.deselectAllSummaryRefs = deselectAllSummaryRefs;
		$scope.downloadSummaryRefs = downloadSummaryRefs;

		$scope.deleteAssocRow = deleteAssocRow;
		$scope.addAlleleAssocRow = addAlleleAssocRow;
		$scope.validateAllele = validateAllele;

		// global shortcuts
		$scope.KclearAll = function() { $scope.clearAll(); $scope.$apply(); }
		$scope.Ksearch = function() { $scope.search(); $scope.$apply(); }
		$scope.KnextReference = function() { $scope.nextReference(); $scope.$apply(); }
		$scope.KprevReference = function() { $scope.prevReference(); $scope.$apply(); }
		$scope.KaddEditTab = function() { $scope.createEditTab(); $scope.$apply(); }
		$scope.KmodifyEditTab = function() { $scope.modifyEditTab(); $scope.$apply(); }
		$scope.KdeleteyEditTab = function() { $scope.deleteEditTab(); $scope.$apply(); }
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
		globalShortcuts.bind(['ctrl+alt+a'], $scope.KaddEditTab);
		globalShortcuts.bind(['ctrl+alt+m'], $scope.KmodifyEditTab);
		globalShortcuts.bind(['ctrl+alt+d'], $scope.KdeleteEditTab);
		globalShortcuts.bind(['ctrl+alt+t'], $scope.KassociateTag);
		
		// initialize the page
		init();
		
	}

})();

