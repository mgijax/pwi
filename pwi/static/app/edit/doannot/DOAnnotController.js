(function() {
	'use strict';
	angular.module('pwi.doannot').controller('DOAnnotController', DOAnnotController);

	function DOAnnotController(
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
			DOAnnotSearchAPI,
			DOAnnotSearchByKeysAPI,
			DOAnnotGetAPI,
			DOAnnotUpdateAPI,
			DOAnnotTotalCountAPI,
			DOAnnotValidateAlleleReferenceAPI,
			DOAnnotCreateReferenceAPI,
			// global APIs
			ValidateJnumAPI,
			VocTermSearchAPI,
			ValidateTermAPI,
			NoteTypeSearchAPI
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {};

		// api/json input/output
		vm.apiDomain = {};

                // default booleans for page functionality
		vm.hideApiDomain = true;       // JSON package
		vm.hideVmData = true;          // JSON package + other vm objects
                vm.hideErrorContents = true;	// display error message

		// used in validateTerm()
		vm.includeObsolete = false;

		// results list and data
		vm.total_count = 0;
		vm.results = [];
		vm.selectedIndex = -1;
		vm.selectedAnnotIndex = 0;
		vm.selectedNoteIndex = 0;
		
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			resetData();
			refreshTotalCount();
			loadVocabs();
			addAnnotRow();
			addAnnotRow();

			if (document.location.search.length > 0) {
				searchByKeys();
			}
		}

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        	// mapped to 'Clear' button; called from init();  resets page
		function clear() {		
			resetData();
                        refreshTotalCount();
			addAnnotRow();
			addAnnotRow();
			setFocus();
		}		

		// mapped to query 'Search' button
		// default is to select first result
		function search() {				
			console.log(vm.apiDomain);
		
			pageScope.loadingStart();
			
			// call API to search; pass query params (vm.selected)
			DOAnnotSearchAPI.search(vm.apiDomain, function(data) {
				vm.results = data;
				vm.selectedIndex = 0;
				if (vm.results.length > 0) {
					loadObject();
				}
				pageScope.loadingEnd();
				//setFocus();
			}, function(err) { // server exception
				pageScope.handleError(vm, "API ERROR: DOAnnotSearchAPI.search");
				pageScope.loadingEnd();
				//setFocus();
			});
		}		

		function searchAccId() {
			console.log("searchAccId");

                        if (vm.results.length > 0) {
                                return;
                        }

			if (vm.apiDomain.genotypeKey == "" && vm.apiDomain.accID != "") {
				search();
			}
		}

		// search by parameter keys
		function searchByKeys() {				
			console.log("searchByKeys: " + document.location.search);
		
			pageScope.loadingStart();
			
			var searchKeys = document.location.search.split("?searchKeys=");
			var params = {};
			params.genotypeKey = searchKeys[1];

			DOAnnotSearchByKeysAPI.search(params, function(data) {
				vm.results = data;
				vm.selectedIndex = 0;
				if (vm.results.length > 0) {
					loadObject();
				}
				pageScope.loadingEnd();

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: MPAnnotSearchByKeysAPI.search");
				pageScope.loadingEnd();
			});
		}		

		/////////////////////////////////////////////////////////////////////
		// Search Results
		/////////////////////////////////////////////////////////////////////
		
        	// called when user clicks a row in the results
		function selectResult(index) {
			if (index == vm.selectedIndex) {
				deselectObject();
			}
			else {
				vm.apiDomain = {};
				vm.selectedIndex = index;
				loadObject();
				setFocus();
			}
		}		

 		// Deselect current item from the searchResults.
 		function deselectObject() {
			console.log("deselectObject()");
			var newObject = angular.copy(vm.apiDomain);
                        vm.apiDomain = newObject;
			vm.selectedIndex = -1;
			resetDataDeselect();
			setFocus();
		}
	
		// refresh the total count
                function refreshTotalCount() {
                        DOAnnotTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////
		
        	// modify annotations
		function modifyAnnot() {
			console.log("modifyAnnot() -> DOAnnotUpdateAPI()");
			var allowCommit = true;

			// check if record selected
			if(vm.selectedIndex < 0) {
				alert("Cannot save this Annotation if a record is not selected.");
				allowCommit = false;
			}
			
			// check required
			for(var i=0;i<vm.apiDomain.annots.length; i++) {
				if (vm.apiDomain.annots[i].processStatus == "u") {
					if ((vm.apiDomain.annots[i].termKey == "")
						|| (vm.apiDomain.annots[i].refsKey == "")
					) {
						alert("Required Fields are missing:  Term ID, J:");
						allowCommit = false;
					}
				}
			}

			if (allowCommit){
				pageScope.loadingStart();

				DOAnnotUpdateAPI.update(vm.apiDomain, function(data) {
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						loadObject();
					}
					pageScope.loadingEnd();
				}, function(err) {
					pageScope.handleError(vm, "API ERROR: DOAnnotUpdateAPI.update");
					pageScope.loadingEnd();
				});
			}
			else {
				loadObject();
				pageScope.loadingEnd();
			}
		}		
		
		/////////////////////////////////////////////////////////////////////
		// SUMMARY NAVIGATION
		/////////////////////////////////////////////////////////////////////

		function prevSummaryObject() {
			console.log("prevSummaryObject()");
			if(vm.results.length == 0) return;
			if(vm.selectedIndex == 0) return;
			vm.selectedIndex--;
			loadObject();
			scrollToObject();
		}
		
		function nextSummaryObject() {
			console.log("nextSummaryObject()");
			if(vm.results.length == 0) return;
			if(vm.selectedIndex + 1 >= vm.results.length) return;
			vm.selectedIndex++;
			loadObject();
			scrollToObject();
		}		

	    	function firstSummaryObject() {
			console.log("firstSummaryObject()");
	        	if(vm.results.length == 0) return;
	        	vm.selectedIndex = 0;
			loadObject();
			scrollToObject();
	      	}

	    	function lastSummaryObject() {
			console.log("lastSummaryObject()");
	        	if(vm.results.length == 0) return;
	        	vm.selectedIndex = vm.results.length - 1;
			loadObject();
			scrollToObject();
	      	}

	    	// ensure we keep the selected row in view
		function scrollToObject() {
			$q.all([
			   FindElement.byId("resultTableWrapper"),
			   FindElement.byQuery("#resultsTable .selectedRow")
			 ]).then(function(elements) {
				 var table = angular.element(elements[0]);
				 var selected = angular.element(elements[1]);
				 var offset = 30;
				 table.scrollToElement(selected, offset, 0);
			 });
			setFocus();
		}
		
		
		/////////////////////////////////////////////////////////////////////
		// Utility methods
		/////////////////////////////////////////////////////////////////////
		
		// resets page data
		function resetData() {
			console.log("resetData()");

			vm.results = [];
			vm.selectedIndex = -1;
			vm.selectedAnnotIndex = 0;
			vm.total_count = 0;

			// rebuild empty apiDomain submission object, else bindings fail
			vm.apiDomain = {};
			vm.apiDomain.genotypeKey = "";	
			vm.apiDomain.accID = "";

			// term-specific checks
			vm.apiDomain.allowEditTerm = false;	// allow user to change Terms/default is false
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");

			vm.apiDomain.genotypeKey = "";	
			vm.apiDomain.annots = [];
			vm.apiDomain.annots.allNotes = [];
			addAnnotRow();
		}

		// load vocabularies
                function loadVocabs() {
                        console.log("loadVocabs()");

			vm.qualifierLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"53"}, function(data) { 
				vm.qualifierLookup = data.items[0].terms
				for(var i=0;i<vm.qualifierLookup.length; i++) {
					if (vm.qualifierLookup[i].abbreviation == null) {
						vm.qualifierLookup[i].abbreviation = "(none)";
					}
				}
			});;

			vm.evidenceLookup = {};
			VocTermSearchAPI.search({"vocabKey":"43"}, function(data) { vm.evidenceLookup = data.items[0].terms});;

			vm.noteTypeLookup = [];
                        //NoteTypeSearchAPI.search({"mgiTypeKey":"25"}, function(data) { vm.noteTypeLookup = data.items});;

			vm.noteTypeLookup[0] = {
  				"mgiTypeKey": "25",
      				"noteTypeKey": "1008",
      				"noteType": "General"
    			}
                }

		// load a selected object from results
		function loadObject() {
			console.log("loadObject()");

			if (vm.results.length == -1) {
				return;
			}

			if (vm.selectedIndex < 0) {
				return;
			}

			DOAnnotGetAPI.get({key: vm.results[vm.selectedIndex].genotypeKey}, function(data) {
				vm.apiDomain = data;
				vm.apiDomain.genotypeKey = vm.results[vm.selectedIndex].genotypeKey;
				vm.apiDomain.genotypeDisplay = vm.results[vm.selectedIndex].genotypeDisplay;
				selectAnnot(0);

				// create new rows
                        	for(var i=0;i<5; i++) {
                                	addAnnotRow();
                        	}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: DOAnnotGetAPI.get");
			});
		}	
		
		// when an annot is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove annot (and thumbnail, if it exists)
			removeSearchResultsItem(vm.apiDomain.genotypeKey);

			// clear if now empty; otherwise, load next row
			if (vm.results.length == 0) {
				clear();
			}
			else {
				// adjust selected results index as needed, and load annot
				if (vm.selectedIndex > vm.results.length -1) {
					vm.selectedIndex = vm.results.length -1;
				}
				loadObject();
			}
		}

		// handle removal from results list
		function removeSearchResultsItem(keyToRemove) {
			
			// first find the item to remove
			var removeIndex = -1;
			for(var i=0;i<vm.results.length; i++) {
				if (vm.results[i].genotypeKey == keyToRemove) {
					removeIndex = i;
				}
			}
			// if found, remove it
			if (removeIndex >= 0) {
				vm.results.splice(removeIndex, 1);
			}
		}

		// setting of mouse focus
		function setFocus () {
			input.focus(document.getElementById("genotypeDisplay"));
		}

		/////////////////////////////////////////////////////////////////////
		// validating
		/////////////////////////////////////////////////////////////////////		
		
        	// validate jnum
		function validateJnum(row, index, id) {		
			console.log("validateJnum = " + id + index);

			id = id + index;

			if (row.jnumid == undefined || row.jnumid == "") {
				if (index > 0) {
					row.refsKey = vm.apiDomain.annots[index-1].refsKey;
					row.jnumid = vm.apiDomain.annots[index-1].jnumid;
					row.jnum = vm.apiDomain.annots[index-1].jnum;
					row.short_citation = vm.apiDomain.annots[index-1].short_citation;
					selectAnnot(index + 1);
					return;
				}
				else {
					row.refsKey = "";
					row.jnumid = "";
					row.jnum = null;
					row.short_citation = "";
					selectAnnot(index + 1);
					return;
				}
			}

                        if (row.jnumid.includes("%")) {
                                return;
                        }

			ValidateJnumAPI.query({ jnum: row.jnumid }, function(data) {
				if (data.length == 0) {
					alert("Invalid Reference: " + row.jnumid);
					document.getElementById(id).focus();
					row.refsKey = "";
					row.jnumid = "";
					row.jnum = null;
					row.short_citation = "";
					selectAnnot(index + 1);
				} else {
					row.refsKey = data[0].refsKey;
					row.jnumid = data[0].jnumid;
					row.jnum = parseInt(data[0].jnum, 10);
					row.short_citation = data[0].short_citation;
					selectAnnot(index + 1);
					validateAlleleReference(row);
				}

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateJnumAPI.query");
				document.getElementById(id).focus();
				row.refsKey = "";
                                row.jnumid = ""; 
                                row.jnum = null; 
				row.short_citation = "";
				selectAnnot(index + 1);
			});
		}		

        	// validate allele/reference; is association needed?
		function validateAlleleReference(row) {		
			console.log("validateAlleleReference");

			if ((vm.apiDomain.genotypeKey == null)
				|| (vm.apiDomain.genotypeKey == "")) {
				return;
			}

			var searchParams = {};
			searchParams.genotypeKey = vm.apiDomain.genotypeKey;
			searchParams.refsKey = row.refsKey;
			console.log(searchParams);

			// check if allele/reference associations is missing
			DOAnnotValidateAlleleReferenceAPI.validate(searchParams, function(data) {
				if (data.length > 0) {
					createAlleleReference(data);
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: DOAnnotValidateAlleleReferenceAPI.validate");
			});
		}

		// create allele/reference association
		function createAlleleReference(mgireferecneassocs) {
			console.log("createAlleleReference");
			
			// process new Allele/Reference associations if user responds OK
			if ($window.confirm("This reference is not associated to all Alleles of this Genotype.\n\nTo add 'Used-FC' reference associations, click 'OK'\n\nElse, click 'Cancel'")) {

                        	for(var i=0;i<mgireferecneassocs.length; i++) {
					DOAnnotCreateReferenceAPI.create(mgireferecneassocs[i], function(data) {
						console.log("ran DOAnnotCreateReferenceAPI.create");
					}, function(err) {
						pageScope.handleError(vm, "API ERROR: DOAnnotCreateReferenceAPI.create");
					});
				}
			}
		}

        	// validate term
		function validateTerm(row, index, id) {		
			console.log("validateTerm = " + id + index);

			id = id + index;

			if (row.termid == "") {
				row.termKey = "";
				row.term = "";
				return;
			}

			// json for term search
			var params = {};
			params.vocabKey = "125";

			if (row.termid.includes("DOID:") == false) {
				row.termid = "DOID:" + row.termid;
			}

			params.accessionIds = [];
			params.accessionIds.push({"accID":row.termid.trim()});
			params.includeObsolete = vm.includeObsolete;
			console.log(params);

			ValidateTermAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Acc ID: " + params.accessionIds[0].accID);
					document.getElementById(id).focus();
					row.termKey = "";
					row.term = "";
					row.termid = "";
				} else {
					row.termKey = data[0].termKey;
					row.term = data[0].term;
					row.termid = data[0].accessionIds[0].accID;
				}

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateTermAPI.search");
				document.getElementById(id).focus();
				row.termKey = "";
				row.term = "";
				row.termid = "";
			});
		}		

		/////////////////////////////////////////////////////////////////////
		// annotations 
		/////////////////////////////////////////////////////////////////////		
		
		// set current annotation row
		function selectAnnot(index) {
			console.log("selectAnnot: " + index);
			vm.selectedAnnotIndex = index;
			vm.selectedNoteIndex = 0;

			if (vm.apiDomain.annots.length == 0) {
				addAnnotRow();
			}

		}

		// set current note row
		function selectNote(index) {
			console.log("selectNote: " + index);
			vm.selectedNoteIndex = index;
		}

		//
		// change of row/field detected
		//
		
		// if current annotation row has changed
		function changeAnnotRow(index) {
			console.log("changeAnnotRow: " + index);

			vm.selectedAnnotIndex = index;

			if (vm.apiDomain.annots[index] == null) {
				vm.selectedAnnotIndex = 0;
				return;
			}

			if (vm.apiDomain.annots[index].processStatus == "x") {
				vm.apiDomain.annots[index].processStatus = "u";
			};

			addNoteRow(index);
		}

		// add new annotation row
		function addAnnotRow() {

			if (vm.apiDomain.annots == undefined) {
				vm.apiDomain.annots = [];
			}

			var i = vm.apiDomain.annots.length;

			vm.apiDomain.annots[i] = {
				"processStatus": "c",
				"annotKey": "",
				"annotTypeKey": "1020",
			       	"objectKey": vm.apiDomain.genotypeKey,
				"termid" : "",
			       	"termKey": "",
			       	"term": "",
			       	"qualifierKey": "",
			       	"qualifierAbbreviation": "",
				"annotEvidenceKey": "",
				"annotKey": "",
			       	"evidenceTermKey": "",
			       	"evidenceAbbreviation": "",
				"refsKey": "",
			       	"jnumid": "",
				"short_citation": "",
				"createdBy": "",
				"creation_date": "",
				"modifiedBy": "",
				"modification_date": ""
			}

			addNoteRow(i);
		}		

		// if current note row has changed
		function changeNoteRow(index) {
			console.log("changeNoteRow: " + index);

			vm.selectedNoteIndex = index;
			var notes = vm.apiDomain.annots[vm.selectedAnnotIndex].allNotes;

			if (notes == null) {
				vm.selectedNoteIndex = 0;
				return;
			}

			// set default noteType = "General"
			if ((notes[index].noteChunk.length > 0)
				&& (notes[index].noteTypeKey.length == 0)) {
				vm.apiDomain.annots[vm.selectedAnnotIndex].allNotes[index].noteTypeKey = "1008";
			}

			if (vm.apiDomain.annots[vm.selectedAnnotIndex].processStatus == "x") {
				vm.apiDomain.annots[vm.selectedAnnotIndex].processStatus = "u";
			};
		}

		// add new note row
		function addNoteRow(index) {
			console.log("addNoteRow: " + index);

			// only at most 1 row is allowed
			
			if (vm.apiDomain.annots[index].allNotes == undefined) {
				vm.apiDomain.annots[index].allNotes = [];
			}

			if (vm.apiDomain.annots[index].allNotes.length > 0) {
				return;
			}

			var i = vm.apiDomain.annots[index].allNotes.length;

			vm.apiDomain.annots[index].allNotes[i] = {
				"noteKey": "",
				"objectKey": vm.apiDomain.annots[index].annotEvidenceKey,
				"mgiTypeKey": "25",
				"noteTypeKey": "1008",
				"noteChunk": ""
			}
		}

		// delete note row
		function deleteNoteRow(index) {
			console.log("deleteNoteRow: " + index);
			changeAnnotRow(vm.selectedAnnotIndex);
			vm.apiDomain.annots[vm.selectedAnnotIndex].allNotes[index].noteChunk = "";
		}

                //
		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
		$scope.searchAccId = searchAccId;
		$scope.clear = clear;
		$scope.modifyAnnot = modifyAnnot;
		$scope.changeAnnotRow = changeAnnotRow;
		$scope.addAnnotRow = addAnnotRow;
		$scope.changeNoteRow = changeNoteRow;
		$scope.addNoteRow = addNoteRow;
		$scope.deleteNoteRow = deleteNoteRow;
		$scope.selectAnnot = selectAnnot;
		$scope.selectNote = selectNote;

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

		// other functions: buttons, onBlurs and onChanges
		$scope.selectResult = selectResult;
		$scope.validateJnum = validateJnum;
		$scope.validateTerm = validateTerm;
		
		// global shortcuts
		$scope.KclearAll = function() { $scope.clear(); $scope.$apply(); }
		$scope.Ksearch = function() { $scope.search(); $scope.$apply(); }
		$scope.Kfirst = function() { $scope.firstSummaryObject(); $scope.$apply(); }
		$scope.Knext = function() { $scope.nextSummaryObject(); $scope.$apply(); }
		$scope.Kprev = function() { $scope.prevSummaryObject(); $scope.$apply(); }
		$scope.Klast = function() { $scope.lastSummaryObject(); $scope.$apply(); }
		$scope.Kmodify = function() { $scope.modifyAnnot(); $scope.$apply(); }

		var globalShortcuts = Mousetrap($document[0].body);
		globalShortcuts.bind(['ctrl+alt+c'], $scope.KclearAll);
		globalShortcuts.bind(['ctrl+alt+s'], $scope.Ksearch);
		globalShortcuts.bind(['ctrl+alt+f'], $scope.Kfirst);
		globalShortcuts.bind(['ctrl+alt+p'], $scope.Kprev);
		globalShortcuts.bind(['ctrl+alt+n'], $scope.Knext);
		globalShortcuts.bind(['ctrl+alt+l'], $scope.Klast);
		globalShortcuts.bind(['ctrl+alt+a'], $scope.Kadd);
		globalShortcuts.bind(['ctrl+alt+m'], $scope.Kmodify);
		globalShortcuts.bind(['ctrl+alt+d'], $scope.Kdelete);

		// call to initialize the page, and start the ball rolling...
		init();
	}

})();

