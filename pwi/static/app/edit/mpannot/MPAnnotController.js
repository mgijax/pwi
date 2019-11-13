(function() {
	'use strict';
	angular.module('pwi.mpannot').controller('MPAnnotController', MPAnnotController);

	function MPAnnotController(
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
			MPAnnotSearchAPI,
			MPAnnotGetAPI,
			MPAnnotUpdateAPI,
			MPAnnotTotalCountAPI,
			MPAnnotValidateAlleleReferenceAPI,
			MPAnnotCreateReferenceAPI,
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
		vm.objectData = {};

                // default booleans for page functionality
                vm.hideObjectData = true;	// JSON data
                vm.hideVmData = true;      	// JSON data (just marker data package)
                vm.hideLoadingHeader = true;	// display loading header
                vm.hideErrorContents = true;	// display error message
                vm.editableField = true;	// used to disable field edits

		// used in validateTerm()
		vm.includeObsolete = false;

		// results list and data
		vm.total_count = 0;
		vm.results = [];
		vm.selectedIndex = -1;
		vm.selectedAnnotIndex = 0;
		vm.selectedNoteIndex = 0;
		vm.selectedHeaderIndex = 0;
		vm.selectedClipboardIndex = 0;
		
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			resetData();
			resetClipboard();
			refreshTotalCount();
			loadVocabs();
			addAnnotRow();
			addAnnotRow();
		}

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        	// mapped to 'Clear' button; called from init();  resets page
		function clear() {		
			resetData();
                        refreshTotalCount();
			setFocus();
			addAnnotRow();
			addAnnotRow();
		}		

		// mapped to query 'Search' button
		// default is to select first result
		function search() {				
			console.log(vm.objectData);
		
			pageScope.loadingStart();
			
			// call API to search; pass query params (vm.selected)
			MPAnnotSearchAPI.search(vm.objectData, function(data) {
				
				vm.results = data;
				vm.selectedIndex = 0;
				if (vm.results.length > 0) {
					loadObject();
				}
				pageScope.loadingEnd();
				setFocus();

			}, function(err) { // server exception
				pageScope.handleError(vm, "Error while searching");
				pageScope.loadingEnd();
				setFocus();
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
				vm.objectData = {};
				vm.selectedIndex = index;
				loadObject();
				setFocus();
			}
		}		

 		// Deselect current item from the searchResults.
 		function deselectObject() {
			console.log("deselectObject()");
			var newObject = angular.copy(vm.objectData);
                        vm.objectData = newObject;
			vm.selectedIndex = -1;
			resetDataDeselect();
			setFocus();
		}
	
		// refresh the total count
                function refreshTotalCount() {
                        MPAnnotTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////
		
        	// modify annotations
		function modifyAnnot() {
			console.log("modifyAnnot() -> MPAnnotUpdateAPI()");
			var allowCommit = true;

			// check if record selected
			if(vm.selectedIndex < 0) {
				alert("Cannot save this Annotation if a record is not selected.");
				allowCommit = false;
			}
			
			// check required
			for(var i=0;i<vm.objectData.annots.length; i++) {
				if (vm.objectData.annots[i].processStatus == "u") {
					if ((vm.objectData.annots[i].termKey == "")
						|| (vm.objectData.annots[i].refsKey == "")
					) {
						alert("Required Fields are missing:  Term ID, J:");
						allowCommit = false;
					}
				}
			}

			// check headers for duplicate sequenceNum
			if (vm.objectData.mpHeaders != null) {
				var hasDuplicateOrder = false;
				var headerOrderList = [];
				var s = 0;
				for(var i=0;i<vm.objectData.mpHeaders.length; i++) {
					s = vm.objectData.mpHeaders[i].sequenceNum;
					if (headerOrderList.includes(s)) {
						hasDuplicateOrder = true;
					}
					else {
						headerOrderList.push(s);
					}
				}
				if (hasDuplicateOrder) {
					alert("Duplicate Order Detected in Table.  Cannot Modify.");
					allowCommit = false;
				}
			}

			if (allowCommit){
				pageScope.loadingStart();

				MPAnnotUpdateAPI.update(vm.objectData, function(data) {
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						loadObject();
					}
					pageScope.loadingEnd();
				}, function(err) {
					pageScope.handleError(vm, "Error updating mpannot.");
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
			   FindElement.byQuery("#resultsTable .resultsTableSelectedRow")
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
			vm.total_count = 0;

			// rebuild empty objectData submission object, else bindings fail
			vm.objectData = {};
			vm.objectData.genotypeKey = "";	
			vm.objectData.accid = "";

			// term-specific checks
			vm.objectData.allowEditTerm = false;	// allow user to change Terms/default is false
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");

			vm.objectData.genotypeKey = "";	
			vm.objectData.annots = [];
			vm.objectData.annots.allNotes = [];
			addAnnotRow();
		}

		// load vocabularies
                function loadVocabs() {
                        console.log("loadVocabs()");

			vm.qualifierLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"54"}, function(data) { 
				vm.qualifierLookup = data.items[0].terms
				for(var i=0;i<vm.qualifierLookup.length; i++) {
					if (vm.qualifierLookup[i].abbreviation == null) {
						vm.qualifierLookup[i].abbreviation = "(none)";
					}
				}
			});;

			vm.evidenceLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"2"}, function(data) { vm.evidenceLookup = data.items[0].terms});;

			vm.mpSexSpecificityLookup = {};
                        VocTermSearchAPI.search({"name":"MP-Sex-Specificity"}, function(data) { vm.mpSexSpecificityLookup = data.items[0].terms});;

			vm.noteTypeLookup = {};
                        NoteTypeSearchAPI.search({"mgiTypeKey":"25"}, function(data) { vm.noteTypeLookup = data.items});;
                }

		// load a selected object from results
		function loadObject() {
			console.log("loadObject()");

			if (vm.results.length == 0) {
				return;
			}

			if (vm.selectedIndex < 0) {
				return;
			}

			// api get object by primary key
			MPAnnotGetAPI.get({ key: vm.results[vm.selectedIndex].genotypeKey }, function(data) {

				vm.objectData = data;
				vm.objectData.genotypeKey = vm.results[vm.selectedIndex].genotypeKey;
				vm.objectData.genotypeDisplay = vm.results[vm.selectedIndex].genotypeDisplay;
				selectAnnot(0);

				// create new rows
                        	for(var i=0;i<5; i++) {
                                	addAnnotRow();
                        	}

			}, function(err) {
				pageScope.handleError(vm, "Error retrieving data object.");
			});
		}	
		
		// when an mpannot is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove mpannot (and thumbnail, if it exists)
			removeSearchResultsItem(vm.objectData.genotypeKey);

			// clear if now empty; otherwise, load next row
			if (vm.results.length == 0) {
				clear();
			}
			else {
				// adjust selected results index as needed, and load mpannot
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

			if (row.jnumid == "") {
				if (index > 0) {
					row.refsKey = vm.objectData.annots[index-1].refsKey;
					row.jnumid = vm.objectData.annots[index-1].jnumid;
					row.jnum = vm.objectData.annots[index-1].jnum;
					row.short_citation = vm.objectData.annots[index-1].short_citation;
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
				pageScope.handleError(vm, "Invalid Reference");
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

			if ((vm.objectData.genotypeKey == null)
				|| (vm.objectData.genotypeKey == "")) {
				return;
			}

			var searchParams = {};
			searchParams.genotypeKey = vm.objectData.genotypeKey;
			searchParams.refsKey = row.refsKey;
			console.log(searchParams);

			// check if allele/reference associations is missing
			MPAnnotValidateAlleleReferenceAPI.validate(searchParams, function(data) {
				if (data.length > 0) {
					createAlleleReference(data);
				}
			}, function(err) {
				pageScope.handleError(vm, "Error executing validateAlleleReference");
			});
		}

		// create allele/reference association
		function createAlleleReference(mgireferecneassocs) {
			console.log("createAlleleReference");
			
			// process new Allele/Reference associations if user responds OK
			if ($window.confirm("This reference is not associated to all Alleles of this Genotype.\nDo you want the system to add a 'Used-FC' reference association for these Alleles?")) {

                        	for(var i=0;i<mgireferecneassocs.length; i++) {
					MPAnnotCreateReferenceAPI.create(mgireferecneassocs[i], function(data) {
						console.log("ran MPAnnotCreateReferenceAPI.create");
					}, function(err) {
						pageScope.handleError(vm, "Error executing MGI-reference-assoc create");
					});
				}
			}
		}

        	// validate mp acc id
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
			params.vocabKey = "5";

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
				pageScope.handleError(vm, "Invalid Acc ID");
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
			vm.selectedHeaderIndex = 0;
		}

		// set current note row
		function selectNote(index) {
			console.log("selectNote: " + index);
			vm.selectedNoteIndex = index;
		}

		// set current header row
		function selectHeader(index) {
			console.log("selectHeader: " + index);
			vm.selectedHeaderIndex = index;
		}

		//
		// change of row/field detected
		//
		
		// if current annotation row has changed
		function changeAnnotRow(index) {
			console.log("changeAnnotRow: " + index);

			vm.selectedAnnotIndex = index;

			if (vm.objectData.annots[index] == null) {
				vm.selectedAnnotIndex = 0;
				return;
			}

			if (vm.objectData.annots[index].processStatus == "x") {
				vm.objectData.annots[index].processStatus = "u";
			};
		}

		// if current note row has changed
		function changeNoteRow(index) {
			console.log("changeNoteRow: " + index);

			vm.selectedNoteIndex = index;
			var notes = vm.objectData.annots[vm.selectedAnnotIndex].allNotes;

			if (notes == null) {
				vm.selectedNoteIndex = 0;
				return;
			}

			// set default noteType = "General"
			if ((notes[index].noteChunk.length > 0)
				&& (notes[index].noteTypeKey.length == 0)) {
				vm.objectData.annots[vm.selectedAnnotIndex].allNotes[index].noteTypeKey = "1008";
			}

			if (vm.objectData.annots[vm.selectedAnnotIndex].processStatus == "x") {
				vm.objectData.annots[vm.selectedAnnotIndex].processStatus = "u";
			};
		}

		// if current header row has changed
		function changeHeaderRow(index) {
			console.log("changeHeaderRow: " + index);

			vm.selectedHeaderIndex = index;

			if (vm.objectData.mpHeaders[index] == null) {
				vm.selectedHeaderIndex = 0;
				return;
			}

			if (vm.objectData.mpHeaders[index].processStatus == "x") {
				vm.objectData.mpHeaders[index].processStatus = "u";
			};
		}

		// add new annotation row
		function addAnnotRow() {

			if (vm.objectData.annots == undefined) {
				vm.objectData.annots = [];
			}

			var i = vm.objectData.annots.length;

			vm.objectData.annots[i] = {
				"processStatus": "c",
				"annotKey": "",
				"annotTypeKey": "1002",
			       	"objectKey": vm.objectData.genotypeKey,
			       	"termKey": "",
			       	"term": "",
				"termid" : "",
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

			vm.objectData.annots[i].properties = [];
			vm.objectData.annots[i].properties[0] = {
				"processStatus": "c",
				"evidencePropertyKey": "",
				"propertyTermKey": "8836535",
				"value": ""
			}

			addNoteRow(i);
		}		

		// add new note row
		function addNoteRow(index) {
			//console.log("addNoteRow: " + index);

			if (vm.objectData.annots[index].allNotes == undefined) {
				vm.objectData.annots[index].allNotes = [];
			}

			var i = vm.objectData.annots[index].allNotes.length;

			vm.objectData.annots[index].allNotes[i] = {
				"noteKey": "",
				"objectKey": vm.objectData.annots[index].annotEvidenceKey,
				"mgiTypeKey": "12",
				"noteTypeKey": "",
				"noteChunk": ""
			}
		}

		// delete note row
		function deleteNoteRow(index) {
			console.log("deleteNoteRow: " + index);
			changeAnnotRow(vm.selectedAnnotIndex);
			vm.objectData.annots[vm.selectedAnnotIndex].allNotes[index].noteChunk = "";
		}

		/////////////////////////////////////////////////////////////////////
		// clipboard
		/////////////////////////////////////////////////////////////////////		
	
		// reset clipboard
		function resetClipboard() {
			console.log("resetClipboard()");
			vm.clipboard = [];
		}

		// selected clipboard row
		function selectClipboard(index) {
			console.log("selectClipboard(): " + index);
			vm.selectedClipboardIndex = index;
		}		

		// add selected table row to clipboard
		function addClipboard(row) {
			console.log("addClipboard(): " + row);

			if (vm.objectData.annots[row].termKey != "") {
				var newItem = {
			        	"termKey": vm.objectData.annots[row].termKey,
			        	"term": vm.objectData.annots[row].term,
					"termid": vm.objectData.annots[row].termid,
			        	"evidenceTermKey": vm.objectData.annots[row].evidenceTermKey,
			        	"evidenceAbbreviation": vm.objectData.annots[row].evidenceAbbreviation,
					"mpSexSpecificityValue": vm.objectData.annots[row].properties[0].value,
			        	"item": vm.objectData.annots[row].termid + "," 
						+ vm.objectData.annots[row].properties[0].value + ","
						+ vm.objectData.annots[row].term
					}

				vm.clipboard.push(newItem);
			}
		}
		
		// add all table rows to clipboard
		function addAllClipboard() {
			console.log("addAllClipboard()");

                        for(var i=0;i<vm.objectData.annots.length; i++) {
				addClipboard(i);
			}
		}

		// paste all clipboard items to table
		function pasteClipboard() {
			console.log("pasteClipboard()");

			var emptyRow = 0;

			// find next available empty row
                        for(var i=0;i<vm.objectData.annots.length; i++) {
				if ((vm.objectData.annots[i].processStatus == "c")
					&& (vm.objectData.annots[i].termKey == "")
					) {
					emptyRow = i;
					break;
				}
			}

                        for(var i=0;i<vm.clipboard.length; i++) {

				// add new empty annot row if needed
				if (emptyRow == 0 || emptyRow == vm.objectData.annots.length) {
					addAnnotRow();
				}

				vm.objectData.annots[emptyRow].termKey = vm.clipboard[i].termKey;
				vm.objectData.annots[emptyRow].term = vm.clipboard[i].term;
				vm.objectData.annots[emptyRow].termid = vm.clipboard[i].termid;
				vm.objectData.annots[emptyRow].evidenceTermKey = vm.clipboard[i].evidenceTermKey;
				vm.objectData.annots[emptyRow].evidenceAbbreviation = vm.clipboard[i].evidenceAbbreviation;
			
				vm.objectData.annots[emptyRow].properties[0] = {
					"processStatus": "c",
					"evidencePropertyKey": "",
					"propertyTermKey": "8836535",
					"value": vm.clipboard[i].mpSexSpecificityValue
				}

				emptyRow = emptyRow + 1;
			}
		}

		// delete one clipboard item
		function deleteClipboard(row) {
			console.log("deleteClipboard(): " + row);
			vm.clipboard.splice(row,1)
		}
		
		// clear all clipboard items
		function clearClipboard() {
			console.log("clearClipboard()");
			resetClipboard();
		}
		
                //
		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
		$scope.clear = clear;
		$scope.modifyAnnot = modifyAnnot;
		$scope.changeAnnotRow = changeAnnotRow;
		$scope.changeNoteRow = changeNoteRow;
		$scope.changeHeaderRow = changeHeaderRow;
		$scope.addAnnotRow = addAnnotRow;
		$scope.addNoteRow = addNoteRow;
		$scope.deleteNoteRow = deleteNoteRow;
		$scope.selectAnnot = selectAnnot;
		$scope.selectNote = selectNote;
		$scope.selectHeader = selectHeader;

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

		// other functions: buttons, onBlurs and onChanges
		$scope.selectResult = selectResult;
		$scope.validateJnum = validateJnum;
		$scope.validateTerm = validateTerm;
		
		// clipboard functions
		$scope.selectClipboard = selectClipboard;
		$scope.addClipboard = addClipboard;
		$scope.addAllClipboard = addAllClipboard;
		$scope.pasteClipboard = pasteClipboard;
		$scope.deleteClipboard = deleteClipboard;
		$scope.clearClipboard = clearClipboard;
		
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

