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
			MPAnnotSearchByKeysAPI,
			MPAnnotGetAPI,
			MPAnnotUpdateAPI,
			MPAnnotTotalCountAPI,
			MPAnnotValidateAlleleReferenceAPI,
			MPAnnotCreateReferenceAPI,
			// global APIs
			ValidateJnumAPI,
			VocTermSearchAPI,
			ValidateTermAPI,
			ValidateMPHeaderAPI,
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
                vm.hideLoadingHeader = true;	// display loading header
                vm.hideErrorContents = true;	// display error message

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
		
			if (vm.results.length > 0) {
                                return;
                        }

			pageScope.loadingStart();
			
			MPAnnotSearchAPI.search(vm.apiDomain, function(data) {
				vm.results = data;
				vm.selectedIndex = 0;
				if (vm.results.length > 0) {
					loadObject();
				}
				pageScope.loadingEnd();
				setFocus();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: MPAnnotSearchAPI.search");
				pageScope.loadingEnd();
				setFocus();
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
			
			var stuff = document.location.search.split("?searchKeys=");
			var params = {};
			params.genotypeKey = stuff[1];

			MPAnnotSearchByKeysAPI.search(params, function(data) {
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

			// check if record selected
			if(vm.selectedIndex < 0) {
				alert("Cannot Modify if a record is not selected.");
				return;
			}
			
			// check required
			for(var i=0;i<vm.apiDomain.annots.length; i++) {
				if (vm.apiDomain.annots[i].processStatus == "u") {
					if ((vm.apiDomain.annots[i].termKey == "")
						|| (vm.apiDomain.annots[i].refsKey == "")
					) {
						alert("Required Fields are missing:  Term ID, J:");
						return;
					}
				}
			}

			pageScope.loadingStart();

			// set all headers to "x"; headers can only be updated by modifyHeaders()
			if (vm.apiDomain.headers != null) {
				for(var i=0;i<vm.apiDomain.headers.length; i++) {
					vm.apiDomain.headers[i].processStatus = "x";
				}
			}

			MPAnnotUpdateAPI.update(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					loadObject();
				}
				pageScope.loadingEnd();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: MPAnnotUpdateAPI.update");
				pageScope.loadingEnd();
			});
		}		
		
        	// modify headers
		function modifyHeaders() {
			console.log("modifyHeaders()");

			// check headers for duplicate sequenceNum
			if(vm.apiDomain.headers != null) {
				var hasDuplicateOrder = false;
				var orderList = [];
				var s = 0;
				for(var i=0;i<vm.apiDomain.headers.length; i++) {
					s = vm.apiDomain.headers[i].sequenceNum;
					if (orderList.includes(s)) {
						hasDuplicateOrder = true;
					}
					else {
						orderList.push(s);
					}
				}
				if (hasDuplicateOrder) {
					alert("Duplicate Order Detected in Table.  Cannot Modify.");
					return;
				}
			}

			pageScope.loadingStart();

			// set all annotations to "x"
			for(var i=0;i<vm.apiDomain.annots.length; i++) {
				vm.apiDomain.annots[i].processStatus = "x";
			}

			// set all headers to "u"
			if (vm.apiDomain.headers != null) {
				for(var i=0;i<vm.apiDomain.headers.length; i++) {
					vm.apiDomain.headers[i].processStatus = "u";
				}
			}

			MPAnnotUpdateAPI.update(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					loadObject();
				}
				pageScope.loadingEnd();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: MPAnnotUpdateAPI.update");
				pageScope.loadingEnd();
			});
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

			MPAnnotGetAPI.get({key: vm.results[vm.selectedIndex].genotypeKey}, function(data) {
				vm.apiDomain = data;
				vm.apiDomain.genotypeKey = vm.results[vm.selectedIndex].genotypeKey;
				vm.apiDomain.genotypeDisplay = vm.results[vm.selectedIndex].genotypeDisplay;
				selectAnnot(0);

				// create new rows
                        	for(var i=0;i<5; i++) {
                                	addAnnotRow();
                        	}

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: MPAnnotGetAPI.get");
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
                        console.log("setFocus()");
                        // must pause for a bit...then it works
                        setTimeout(function() {
                                document.getElementById("genotypeAccId").focus();
                        }, (200));
		}

		/////////////////////////////////////////////////////////////////////
		// validating
		/////////////////////////////////////////////////////////////////////		
		
        	// validate jnum
		function validateJnum(row, index, id) {		
			console.log("validateJnum = " + id + index);

			// note:  do *not* move focus to next row
			// keep focus on current row so user can enter a Note too
			
			id = id + index;

			if (row.jnumid == undefined || row.jnumid == "") {
				if (index > 0) {
					row.refsKey = vm.apiDomain.annots[index-1].refsKey;
					row.jnumid = vm.apiDomain.annots[index-1].jnumid;
					row.jnum = vm.apiDomain.annots[index-1].jnum;
					row.short_citation = vm.apiDomain.annots[index-1].short_citation;
					//selectAnnot(index + 1);
					return;
				}
				else {
					row.refsKey = "";
					row.jnumid = "";
					row.jnum = null;
					row.short_citation = "";
					//selectAnnot(index + 1);
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
					//selectAnnot(index + 1);
				} else {
					row.refsKey = data[0].refsKey;
					row.jnumid = data[0].jnumid;
					row.jnum = parseInt(data[0].jnum, 10);
					row.short_citation = data[0].short_citation;
					//selectAnnot(index + 1);
					validateAlleleReference(row);
				}

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateJnumAPI.query");
				document.getElementById(id).focus();
				row.refsKey = "";
                                row.jnumid = ""; 
                                row.jnum = null; 
				row.short_citation = "";
				//selectAnnot(index + 1);
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
			MPAnnotValidateAlleleReferenceAPI.validate(searchParams, function(data) {
				if (data.length > 0) {
					createAlleleReference(data);
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: MPAnnotValidateAlleleReferenceAPI.validate");
			});
		}

		// create allele/reference association
		function createAlleleReference(mgireferecneassocs) {
			console.log("createAlleleReference");
			
			// process new Allele/Reference associations if user responds OK
			if ($window.confirm("This reference is not associated to all Alleles of this Genotype.\n\nTo add 'Used-FC' reference associations, click 'OK'\n\nElse, click 'Cancel'")) {
                        	for(var i=0;i<mgireferecneassocs.length; i++) {
					MPAnnotCreateReferenceAPI.create(mgireferecneassocs[i], function(data) {
						console.log("ran MPAnnotCreateReferenceAPI.create");
					}, function(err) {
						pageScope.handleError(vm, "API ERROR: MPAnnotCreateReferenceAPI.create");
					});
				}
			}
		}

        	// validate acc id
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

			if (row.termid.includes("MP:") == false) {
				row.termid = "MP:" + row.termid;
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

					params = {};
					params.termKey = row.termKey;
					console.log(params);
					ValidateMPHeaderAPI.search(params, function(data) {
						if (data.length > 0) {
							row.qualifierKey = "2181424";
							row.qualifierAbbreviation = "norm";
							row.qualifier = "normal";
						}
					}, function(err) {
						pageScope.handleError(vm, "API ERROR: ValidateMPHeaderAPI.search");
						document.getElementById(id).focus();
					});
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
			vm.selectedHeaderIndex = 0;

                        if (vm.apiDomain.annots.length == 0) {
                               addAnnotRow();
                        }

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

			if (vm.apiDomain.annots[index] == null) {
				vm.selectedAnnotIndex = 0;
				return;
			}

			if (vm.apiDomain.annots[index].processStatus == "x") {
				vm.apiDomain.annots[index].processStatus = "u";
			};
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
				&& (notes[index].noteTypeKey.length == 0)
				&& (vm.apiDomain.annots[vm.selectedAnnotIndex].qualifierKey == "2181424")
				) {
				vm.apiDomain.annots[vm.selectedAnnotIndex].allNotes[index].noteTypeKey = "1031";
			}
			else if ((notes[index].noteChunk.length > 0)
				&& (notes[index].noteTypeKey.length == 0)) {
				vm.apiDomain.annots[vm.selectedAnnotIndex].allNotes[index].noteTypeKey = "1008";
			}

			if (vm.apiDomain.annots[vm.selectedAnnotIndex].processStatus == "x") {
				vm.apiDomain.annots[vm.selectedAnnotIndex].processStatus = "u";
			};
		}

		// if current header row has changed
		function changeHeaderRow(index) {
			console.log("changeHeaderRow: " + index);

			vm.selectedHeaderIndex = index;

			if (vm.apiDomain.headers[index] == null) {
				vm.selectedHeaderIndex = 0;
				return;
			}

			if (vm.apiDomain.headers[index].processStatus == "x") {
				vm.apiDomain.headers[index].processStatus = "u";
			};
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
				"annotTypeKey": "1002",
			       	"objectKey": vm.apiDomain.genotypeKey,
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

			vm.apiDomain.annots[i].properties = [];
			vm.apiDomain.annots[i].properties[0] = {
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

			if (vm.apiDomain.annots[index].allNotes == undefined) {
				vm.apiDomain.annots[index].allNotes = [];
			}

			var i = vm.apiDomain.annots[index].allNotes.length;

			vm.apiDomain.annots[index].allNotes[i] = {
				"processStatus": "c",
				"noteKey": "",
				"objectKey": vm.apiDomain.annots[index].annotEvidenceKey,
				"mgiTypeKey": "12",
				"noteTypeKey": "",
				"noteChunk": ""
			}
		}

		// delete note row
		function deleteNoteRow(index) {
			console.log("deleteNoteRow: " + index);
			changeAnnotRow(vm.selectedAnnotIndex);
			if (vm.apiDomain.annots[vm.selectedAnnotIndex].allNotes[index].processStatus  == "d") {
				vm.apiDomain.annots[vm.selectedAnnotIndex].allNotes[index].processStatus = "x";
			}
			else {
				vm.apiDomain.annots[vm.selectedAnnotIndex].allNotes[index].processStatus = "d";
			}
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

			if (vm.apiDomain.annots[row].termKey != "") {
				var copyNotes = null;
				if (vm.apiDomain.annots[row].allNotes != null) {
					copyNotes = vm.apiDomain.annots[row].allNotes.slice();
				}
				var newItem = {
			        	"termKey": vm.apiDomain.annots[row].termKey,
			        	"term": vm.apiDomain.annots[row].term,
					"termid": vm.apiDomain.annots[row].termid,
			        	"evidenceTermKey": vm.apiDomain.annots[row].evidenceTermKey,
			        	"evidenceAbbreviation": vm.apiDomain.annots[row].evidenceAbbreviation,
					"mpSexSpecificityValue": vm.apiDomain.annots[row].properties[0].value,
			        	"item": vm.apiDomain.annots[row].termid + "," 
						+ vm.apiDomain.annots[row].properties[0].value + ","
						+ vm.apiDomain.annots[row].term,
					"allNotes": copyNotes
					}

                        	if (copyNotes != null) {
                        		for(var i=0;i<newItem.allNotes.length; i++) {
						newItem.allNotes[i].processStatus = "x";
						newItem.allNotes[i].noteKey = "";
						newItem.allNotes[i].objectKey = "";
					}
				}

				vm.clipboard.push(newItem);
			}
		}
		
		// add all table rows to clipboard
		function addAllClipboard() {
			console.log("addAllClipboard()");

                        for(var i=0;i<vm.apiDomain.annots.length; i++) {
				addClipboard(i);
			}
		}

		// paste all clipboard items to table
		function pasteClipboard() {
			console.log("pasteClipboard()");

			var emptyRow = 0;

			// find next available empty row
                        for(var i=0;i<vm.apiDomain.annots.length; i++) {
				if ((vm.apiDomain.annots[i].processStatus == "c")
					&& (vm.apiDomain.annots[i].termKey == "")
					) {
					emptyRow = i;
					break;
				}
			}

                        for(var i=0;i<vm.clipboard.length; i++) {

				// add new empty annot row if needed
				if (emptyRow == 0 || emptyRow == vm.apiDomain.annots.length) {
					addAnnotRow();
				}

				vm.apiDomain.annots[emptyRow].termKey = vm.clipboard[i].termKey;
				vm.apiDomain.annots[emptyRow].term = vm.clipboard[i].term;
				vm.apiDomain.annots[emptyRow].termid = vm.clipboard[i].termid;
				vm.apiDomain.annots[emptyRow].evidenceTermKey = vm.clipboard[i].evidenceTermKey;
				vm.apiDomain.annots[emptyRow].evidenceAbbreviation = vm.clipboard[i].evidenceAbbreviation;
			
				if (vm.clipboard[i].allNotes != null) {
					vm.apiDomain.annots[emptyRow].allNotes = vm.clipboard[i].allNotes.slice();
                        		for(var j=0;j<vm.apiDomain.annots[emptyRow].allNotes.length; j++) {
						vm.apiDomain.annots[emptyRow].allNotes[j].objectKey = vm.apiDomain.genotypeKey;
					}
				}

				vm.apiDomain.annots[emptyRow].properties[0] = {
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
		$scope.searchAccId = searchAccId;
		$scope.clear = clear;
		$scope.modifyAnnot = modifyAnnot;
		$scope.modifyHeaders = modifyHeaders;
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

