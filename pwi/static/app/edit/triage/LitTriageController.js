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
			ReferenceSearchAPI,
			ReferenceGetAPI,
			ReferenceCreateAPI,
			ReferenceUpdateAPI,
			ReferenceDeleteAPI,
			ReferenceBatchRefUpdateTagAPI,
			ActualDbSearchAPI,
			ReferenceAlleleAssocAPI,
			ReferenceMarkerAssocAPI,
			ReferenceStrainAssocAPI,
			JournalAPI,
			// global resource APIs
			MGIRefAssocTypeSearchAPI,
			ValidateAlleleAPI,
			ValidateMarkerAPI,
			ValidateStrainAPI,
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

			// marker assoc droplist
			MGIRefAssocTypeSearchAPI.search( {mgiTypeKey:"2"}, function(data) {
				vm.markerAssocType_choices = data.items;
			});

			// strain assoc droplist
			MGIRefAssocTypeSearchAPI.search( {mgiTypeKey:"10"}, function(data) {
				vm.strainAssocType_choices = data.items;
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

                        // add alleleAssocs to vm.selected
                        vm.selected.alleleAssocs = vm.refData.alleleAssocs;
                        vm.selected.markerAssocs = vm.refData.markerAssocs;
                        vm.selected.strainAssocs = vm.refData.strainAssocs;
                        
			// ensure the query form has been touched before submission
			// or the accession id exists
			if (
                                vm.litTriageQueryForm.$dirty || 
                                vm.selected.accids != null || 
                                vm.selected.alleleAssocs.length > 0 || 
                                vm.selected.markerAssocs.length > 0 ||
                                vm.selected.strainAssocs.length > 0
                                ) {

				// start spinner & close query form area
				pageScope.loadingStart();
				if (vm.queryForm==false)  {vm.queryForm = true; };
				if (vm.closeButton==true) {vm.closeButton = false;};
				
				// call API to search; pass query params (vm.selected)
				ReferenceSearchAPI.search(vm.selected, function(data) {
					vm.results = data
					vm.summary_count = data.length;
					vm.selectedIndex = 0;
					loadReference();
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

			//  currentRelevance: 'keep',
			vm.selected = {
			  currentRelevance: '70594667',
			  workflow_tag_operator: 'AND',
			  status_operator: 'OR',
                          orderBy: '1'
			};
                        addBook(vm.selected);
                        addNote(vm.selected);

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

        		vm.refData.referenceAbstract = "";
        		vm.refData.isReviewArticle = "0";

                        addBook(vm.refData);
                        addNote(vm.refData);

			// associations
			vm.refData.alleleAssocs = [];
			vm.refData.markerAssocs = [];
			vm.refData.strainAssocs = [];

			if (vm.activeTab == undefined) {
				vm.activeTab = 1;
			}

			vm.disableDelete = true;

			// reference summary table  
			clearResultTable();

			// autocomplete
			vm.acTag = "";                    

			vm.batchRefTag = {
			  	"refsKeys": [],
			  	"workflowTag": ""
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
                        vm.refData.referenceNote.note = "";
		}

                function addBook(domain) {
                        console.log("addBook()");

                        if (domain.referenceBook != null) {
                                return;
                        }

                        var b = {
                                "processStatus": "c",
			        "refsKey": "",
			        "book_author": "",
			        "book_title": "",
			        "place": "",
			        "publisher": "",
			        "series_ed": ""
                        }
                        domain.referenceBook = b;
                }

                function addNote(domain) {
                        console.log("addNote()");

                        if (domain.referenceNote != null) {
                                return;
                        }

                        var n = {
                                "processStatus": "c",
                                "refsKey": "",
                                "note": ""
                        }
                        domain.referenceNote = n;
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
			var counter;
			for (counter in vm.results) {
                                console.log(vm.results[counter]);
				vm.results[counter].has_new_tag = '1';
			}
		}		

		// mapped to 'De-select All' button -- removes checks from all checkboxes in summary
		function deselectAllSummaryRefs() {
			var counter;
			for (counter in vm.results) {
				vm.results[counter].has_new_tag = '0';
			}
		}		

		// mapped to 'Download' button -- downloads checked references as PDF files
		function downloadSummaryRefs() {
			var refsToDownload = [];
			
			// look for checked references and add them to the list to download
			var counter;
			for (counter in vm.results) {
				if (vm.results[counter].has_new_tag == '1') {
					if ((vm.results[counter].jnumid != undefined) && (ref.jnumid != null) && (ref.jnumid != '')) {
						refsToDownload.push(vm.results[counter].jnumid);
					} else {
						refsToDownload.push(vm.results[counter].mgiid);
					}
				}
			}
			var refString = refsToDownload.join(',');
                        var pdfviewerUrl = pageScope.PDFVIEWER_URL
			window.open(pdfviewerUrl + refString + '&zip=1')
		}
		
		// associate tag to summary references - mapped to button
		function associateTagToSummaryRefs() {
                        console.info("associatTagToSummaryRefs()");

			var refsToTag = [];

			// check all refs in summary for checked status, and set list to query param
			var counter;
			for (counter in vm.results) {
				if (vm.results[counter].has_new_tag == '1') {
					refsToTag.push(vm.results[counter].refsKey);
				}
			}
			vm.batchRefTag.refsKeys = refsToTag;
                        console.info("associatTagToSummaryRefs():" + refsToTag);
			
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
					vm.batchRefTag.workflowTag = "";
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

			// check all refs in summary for checked status, and set list to query param
			var counter;
			for (counter in vm.results) {
				if (vm.results[counter].has_new_tag == '1') {
					refsToTag.push(vm.results[counter].refsKey);
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
					vm.batchRefTag.workflowTag = "";
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
			ReferenceGetAPI.get({ key: vm.results[vm.selectedIndex].refsKey }, function(data) {
				vm.refData = data;
				vm.disableDeleteDiscard = false;
				setActiveTab(vm.activeTab);
                                addBook(vm.refData);
                                addNote(vm.refData);
			}, function(err) {
				setMessage(err.data);
			});

			// reset QF dirty/pristine flag
			vm.tabWrapperForm.$setPristine();		
		}

		// mapped to associate tag button in edit tab
		function associateTag() {
			// add the selected tag to this reference
			vm.refData.workflowTagString.push(vm.acTag);
			vm.acTag = '';
			// highlight the row -- pause to wait for injection
			setTimeout(highlightLastTagRow, 200)
		}		

		// mapped remove tag icon
		function removeTag(index) {
			//delete vm.refData.workflowTagString[index];
			vm.refData.workflowTagString.splice(index, 1);
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
                                        	vm.results[vm.selectedIndex].ap_status = vm.refData.ap_status;
                                        	vm.results[vm.selectedIndex].go_status = vm.refData.go_status;
                                        	vm.results[vm.selectedIndex].gxd_status = vm.refData.gxd_status;
                                        	vm.results[vm.selectedIndex].pro_status = vm.refData.pro_status;
                                        	vm.results[vm.selectedIndex].qtl_status = vm.refData.qtl_status;
                                        	vm.results[vm.selectedIndex].tumor_status = vm.refData.tumor_status;
                                        	vm.results[vm.selectedIndex].haspdf = vm.refData.workflowData.haspdf;
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

                        // wts2-648/remove Routed this alert
			// first, ensure a status/relevance conflict doesn't exist
                        // checking "discard"
			if(vm.refData.editRelevanceKey == "70594666" &&
					(
					vm.refData.ap_status == "Chosen" ||
					vm.refData.go_status == "Chosen" ||
					vm.refData.gxd_status == "Chosen" ||
					vm.refData.pro_status == "Chosen" ||
					vm.refData.qtl_status == "Chosen" ||
					vm.refData.tumor_status == "Chosen" ||
					vm.refData.ap_status == "Indexed" ||
					vm.refData.go_status == "Indexed" ||
					vm.refData.gxd_status == "Indexed" ||
					vm.refData.pro_status == "Indexed" ||
					vm.refData.qtl_status == "Indexed" ||
					vm.refData.tumor_status == "Indexed" ||
					vm.refData.ap_status == "Full-coded" ||
					vm.refData.go_status == "Full-coded" ||
					vm.refData.gxd_status == "Full-coded" ||
					vm.refData.pro_status == "Full-coded" ||
					vm.refData.qtl_status == "Full-coded" ||
					vm.refData.tumor_status == "Full-coded"
					)
                 ) 
			{
				alert("Both a Status and relevance=Discard are selected - choose one or the other.");
				return;
			}
			
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
			else if (tabIndex==3) {
				loadMarkerAssoc();
			}
			else if (tabIndex==4) {
				loadStrainAssoc();
			}
		}

		// mapped to some workflow status radio buttons
		function setRelevanceToKeep() {
			console.log("In setRelevanceToKeep");
			vm.refData.editRelevanceKey = "70594667";
		}	


		/////////////////////////////////////////////////////////////////////
		// association tab functionality
		/////////////////////////////////////////////////////////////////////
		
		// set process status for modify
		function modifyAssocRow(assocs, index) {
			if (assocs[index].processStatus != 'c') {
				assocs[index].processStatus = 'u';
			}
		}

		// set process status for delete
		function deleteAssocRow(assocs, index) {
			if (assocs[index].processStatus == 'x') {
				assocs[index].processStatus = "d";
			}
			else {
				assocs[index].processStatus = "x";
			}
		}

		/////////////////////////////////////////////////////////////////////
		// allele association tab functionality
		/////////////////////////////////////////////////////////////////////
		
		// load allele assoc info of selected result
		function loadAlleleAssoc() {
			console.log("loadAlleleAssoc():vm.activeTab: " + vm.activeTab);

			if (vm.activeTab!=2) {
				return;
			}

                        if (vm.refData.refsKey == null || vm.refData.refsKey == "") {
                                if (vm.refData.alleleAssocs == null || vm.refData.alleleAssocs.length == 0) {
				        addAlleleAssocRow();
                                }
                                return;
                        }

			pageScope.loadingStart();

                        ReferenceAlleleAssocAPI.query({ key: vm.results[vm.selectedIndex].refsKey }, function(data) {
                                if (data.length == 0) { 
                                        console.log("no allele assoc for key: " + vm.results[vm.selectedIndex].refsKe);
				        addAlleleAssocRow();
				        pageScope.loadingEnd();
                                } else {
					vm.refData.alleleAssocs = data;
				        addAlleleAssocRow();
				        pageScope.loadingEnd();
                                }
                        }, function(err) {     
				setMessage(err.data);
				pageScope.loadingEnd();
                        });
		}

		// add new allele assoc
		function addAlleleAssocRow() {
			console.log("addAlleleAssocRow()");

			if (vm.refData.alleleAssocs == undefined) {
				vm.refData.alleleAssocs = [];
			}

			var i = vm.refData.alleleAssocs.length;

                        if (i > 0 && vm.refData.alleleAssocs[i-1].processStatus == "c") {
                                return;
                        }

			vm.refData.alleleAssocs[i] = {
				"processStatus": "c", 
				"assocKey": "",
				"objectKey": "",
				"mgiTypeKey": "11",
				"refAssocTypeKey": "1013",
				//"refAssocType": "Indexed",
				"refsKey": vm.refData.refsKey,
				"alleleSymbol": "",
				"alleleAccID": "",
				"alleleMarkerSymbol": ""
			};
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

			else if ((id == "alleleAccID")
				&& (vm.refData.alleleAssocs[index].alleleAccID != null) 
				&& (vm.refData.alleleAssocs[index].alleleAccID != undefined) 
				&& (vm.refData.alleleAssocs[index].alleleAccID.trim() != "")
				) {

				params.accID = vm.refData.alleleAssocs[index].alleleAccID.trim();
			}
			
			console.log(params);

			if (JSON.stringify(params) != '{}') {
				ValidateAlleleAPI.search(params, function(data) {
					if (data.length == 0) {
						alert("Invalid Allele");
						vm.refData.alleleAssocs[index].objectKey = "";
						vm.refData.alleleAssocs[index].alleleSymbol = "";
						vm.refData.alleleAssocs[index].alleleAccID = "";
						vm.refData.alleleAssocs[index].alleleMarkerSymbol = "";
						//document.getElementById(id).focus();
					} else {
						if ((vm.refData.alleleAssocs[index].assocKey == undefined)
							|| (vm.refData.alleleAssocs[index].assocKey == null) 
							|| (vm.refData.alleleAssocs[index].assocKey == "")
						) {
							vm.refData.alleleAssocs[index].processStatus = "c";
						} else {
							vm.refData.alleleAssocs[index].processStatus = "u";
						}
						vm.refData.alleleAssocs[index].objectKey = data[0].alleleKey;
						vm.refData.alleleAssocs[index].alleleSymbol = data[0].symbol;
						vm.refData.alleleAssocs[index].alleleAccID = data[0].accID;
						vm.refData.alleleAssocs[index].alleleMarkerSymbol = data[0].markerSymbol;
					}

				}, function(err) {
					pageScope.handleError(vm, "Invalid Allele");
					document.getElementById(id).focus();
				});
			}
		}

		/////////////////////////////////////////////////////////////////////
		// marker association tab functionality
		/////////////////////////////////////////////////////////////////////
		
		// load marker assoc info of selected result
		function loadMarkerAssoc() {
			console.log("loadMarkerAssoc():vm.activeTab: " + vm.activeTab);

			if (vm.activeTab!=3) {
				return;
			}

                        if (vm.refData.refsKey == null || vm.refData.refsKey == "") {
                                if (vm.refData.markerAssocs == null || vm.refData.markerAssocs.length == 0) {
				        addMarkerAssocRow();
                                }
                                return;
                        }

			pageScope.loadingStart();

                        ReferenceMarkerAssocAPI.query({ key: vm.results[vm.selectedIndex].refsKey }, function(data) {
                                if (data.length == 0) { 
                                        console.log("no marker assoc for key: " + vm.results[vm.selectedIndex].refsKe);
				        addMarkerAssocRow();
				        pageScope.loadingEnd();
                                } else {
					vm.refData.markerAssocs = data;
				        addMarkerAssocRow();
				        pageScope.loadingEnd();
                                }

                        }, function(err) {     
				setMessage(err.data);
				pageScope.loadingEnd();
                        });
		}

		// add new marker assoc
		function addMarkerAssocRow() {
			console.log("addMarkerAssocRow()");

			if (vm.refData.markerAssocs == undefined) {
				vm.refData.markerAssocs = [];
			}

			var i = vm.refData.markerAssocs.length;

                        if (i > 0 && vm.refData.markerAssocs[i-1].processStatus == "c") {
                                return;
                        }

			vm.refData.markerAssocs[i] = {
				"processStatus": "c", 
				"assocKey": "",
				"objectKey": "",
				"mgiTypeKey": "2",
				"refAssocTypeKey": "1018",
				"refsKey": vm.refData.refsKey,
				"markerSymbol": "",
				"markerAccID": ""
			};
		}		

		// validate the id
		function validateMarker(index, id) {
			console.log("validateMarker() : " + id);

			// params if used for the validation search only
			var params = {};

			if ((id == "markerSymbol")
				&& (vm.refData.markerAssocs[index].markerSymbol != null) 
				&& (vm.refData.markerAssocs[index].markerSymbol != undefined) 
				&& (vm.refData.markerAssocs[index].markerSymbol.trim() != "")
				) {

				params.symbol = vm.refData.markerAssocs[index].markerSymbol;
			}

			else if ((id == "markerAccID")
				&& (vm.refData.markerAssocs[index].markerAccID != null) 
				&& (vm.refData.markerAssocs[index].markerAccID != undefined) 
				&& (vm.refData.markerAssocs[index].markerAccID.trim() != "")
				) {

				params.accID = vm.refData.markerAssocs[index].markerAccID.trim();
			}
			
			console.log(params);

			if (JSON.stringify(params) != '{}') {
				ValidateMarkerAPI.search(params, function(data) {
					if (data.length == 0) {
						alert("Invalid Marker");
						vm.refData.markerAssocs[index].objectKey = "";
						vm.refData.markerAssocs[index].markerSymbol = "";
						vm.refData.markerAssocs[index].markerAccID = "";
						document.getElementById(id).focus();
					} else {
						if ((vm.refData.markerAssocs[index].assocKey == undefined) 
							|| (vm.refData.markerAssocs[index].assocKey == null)
							|| (vm.refData.markerAssocs[index].assocKey == "")
						) {
							vm.refData.markerAssocs[index].processStatus = "c";
						} else {
							vm.refData.markerAssocs[index].processStatus = "u";
						}
						vm.refData.markerAssocs[index].objectKey = data[0].markerKey;
						vm.refData.markerAssocs[index].markerSymbol = data[0].symbol;
						vm.refData.markerAssocs[index].markerAccID = data[0].accID;
					}

				}, function(err) {
					pageScope.handleError(vm, "Invalid Marker");
					document.getElementById(id).focus();
				});
			}
		}

		/////////////////////////////////////////////////////////////////////
		// strain association tab functionality
		/////////////////////////////////////////////////////////////////////
		
		// load strain assoc info of selected result
		function loadStrainAssoc() {
			console.log("loadStrainAssoc():vm.activeTab: " + vm.activeTab);

			if (vm.activeTab!=4) {
				return;
			}

                        if (vm.refData.refsKey == null || vm.refData.refsKey == "") {
                                if (vm.refData.strainAssocs == null || vm.refData.strainAssocs.length == 0) {
				        addStrainAssocRow();
                                }
                                return;
                        }

			pageScope.loadingStart();

                        ReferenceStrainAssocAPI.query({ key: vm.results[vm.selectedIndex].refsKey }, function(data) {
                                if (data.length == 0) { 
                                        console.log("no strain assoc for key: " + vm.results[vm.selectedIndex].refsKey);
				        addStrainAssocRow();
				        pageScope.loadingEnd();
                                } else {
					vm.refData.strainAssocs = data;
				        addStrainAssocRow();
				        pageScope.loadingEnd();
                                }

                        }, function(err) {     
				setMessage(err.data);
				pageScope.loadingEnd();
                        });
		}

		// add new strain assoc
		function addStrainAssocRow() {
                        console.log("addStrainAssocRow()");

			if (vm.refData.strainAssocs == undefined) {
				vm.refData.strainAssocs = [];
			}

			var i = vm.refData.strainAssocs.length;

                        if (i > 0 && vm.refData.strainAssocs[i-1].processStatus == "c") {
                                return;
                        }

			vm.refData.strainAssocs[i] = {
				"processStatus": "c", 
				"assocKey": "",
				"objectKey": "",
				"mgiTypeKey": "10",
				"refAssocTypeKey": "1031",
				//"refAssocType": "Indexed",
				"refsKey": vm.refData.refsKey,
				"strainSymbol": "",
				"strainAccID": ""
			};
		}		

		// validate the id
		function validateStrain(index, id) {
			console.log("validateStrain() : " + id);

			// params if used for the validation search only
			var params = {};

			if ((id == "strainSymbol")
				&& (vm.refData.strainAssocs[index].strainSymbol != null) 
				&& (vm.refData.strainAssocs[index].strainSymbol != undefined) 
				&& (vm.refData.strainAssocs[index].strainSymbol.trim() != "")
				) {

				params.strain = vm.refData.strainAssocs[index].strainSymbol;
			}

			else if ((id == "strainAccID")
				&& (vm.refData.strainAssocs[index].strainAccID != null) 
				&& (vm.refData.strainAssocs[index].strainAccID != undefined) 
				&& (vm.refData.strainAssocs[index].strainAccID.trim() != "")
				) {

				params.accID = vm.refData.strainAssocs[index].strainAccID.trim();
			}
			
			console.log(params);

			if (JSON.stringify(params) != '{}') {
				ValidateStrainAPI.search(params, function(data) {
					if (data.length == 0) {
						alert("Invalid Strain");
						vm.refData.strainAssocs[index].objectKey = "";
						vm.refData.strainAssocs[index].strainSymbol = "";
						vm.refData.strainAssocs[index].strainAccID = "";
						document.getElementById(id).focus();
					} else {
						if ((vm.refData.strainAssocs[index].assocKey == undefined)
							|| (vm.refData.strainAssocs[index].assocKey == null) 
							|| (vm.refData.strainAssocs[index].assocKey == "")
						) {
							vm.refData.strainAssocs[index].processStatus = "c";
						} else {
							vm.refData.strainAssocs[index].processStatus = "u";
						}
						vm.refData.strainAssocs[index].objectKey = data[0].strainKey;
						vm.refData.strainAssocs[index].strainSymbol = data[0].strain;
						vm.refData.strainAssocs[index].strainAccID = data[0].accID;
					}

				}, function(err) {
					pageScope.handleError(vm, "Invalid Strain");
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
		$scope.setRelevanceToKeep = setRelevanceToKeep;
		$scope.associateTagToSummaryRefs = associateTagToSummaryRefs;
		$scope.unassociateTagToSummaryRefs = unassociateTagToSummaryRefs;

		$scope.selectAllSummaryRefs = selectAllSummaryRefs;
		$scope.deselectAllSummaryRefs = deselectAllSummaryRefs;
		$scope.downloadSummaryRefs = downloadSummaryRefs;

		$scope.modifyAssocRow = modifyAssocRow;
		$scope.deleteAssocRow = deleteAssocRow;
		$scope.addAlleleAssocRow = addAlleleAssocRow;
		$scope.validateAllele = validateAllele;
		$scope.addMarkerAssocRow = addMarkerAssocRow;
		$scope.validateMarker = validateMarker;
		$scope.addStrainAssocRow = addStrainAssocRow;
		$scope.validateStrain = validateStrain;

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

