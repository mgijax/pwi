(function() {
	'use strict';
	angular.module('pwi.doalleleannot').controller('DOAlleleAnnotController', DOAlleleAnnotController);

	function DOAlleleAnnotController(
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
			DOAlleleAnnotSearchAPI,
			DOAlleleAnnotSearchByKeysAPI,
			DOAlleleAnnotGetAPI,
			DOAlleleAnnotUpdateAPI,
			DOAlleleAnnotTotalCountAPI,
			// global APIs
			ValidateJnumAPI,
			VocTermSearchAPI,
			ValidateTermAPI
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
			DOAlleleAnnotSearchAPI.search(vm.apiDomain, function(data) {
				vm.results = data;
				vm.selectedIndex = 0;
				if (vm.results.length > 0) {
					loadObject();
				}
				pageScope.loadingEnd();
				//setFocus();
			}, function(err) { // server exception
				pageScope.handleError(vm, "API ERROR: DOAlleleAnnotSearchAPI.search");
				pageScope.loadingEnd();
				//setFocus();
			});
		}		

		function searchAccId() {
			console.log("searchAccId");

                        if (vm.results.length > 0) {
                                return;
                        }

			if (vm.apiDomain.alleleKey == "" && vm.apiDomain.accID != "") {
				search();
			}
		}

		// search by parameter keys
		function searchByKeys() {				
			console.log("searchByKeys: " + document.location.search);
		
			pageScope.loadingStart();
			
			var searchKeys = document.location.search.split("?searchKeys=");
			var params = {};
			params.alleleKey = searchKeys[1];

			DOAlleleAnnotSearchByKeysAPI.search(params, function(data) {
				vm.results = data;
				vm.selectedIndex = 0;
				if (vm.results.length > 0) {
					loadObject();
				}
				pageScope.loadingEnd();

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: DOAlleleAnnotSearchByKeysAPI.search");
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
                        DOAlleleAnnotTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////
		
        	// modify annotations
		function modifyAnnot() {
			console.log("modifyAnnot() -> DOAlleleAnnotUpdateAPI()");

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

			DOAlleleAnnotUpdateAPI.update(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					loadObject();
				}
				pageScope.loadingEnd();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: DOAlleleAnnotUpdateAPI.update");
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
			vm.apiDomain.alleleKey = "";	
			vm.apiDomain.accID = "";

			// term-specific checks
			vm.apiDomain.allowEditTerm = false;	// allow user to change Terms/default is false
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");

			vm.apiDomain.alleleKey = "";	
			vm.apiDomain.annots = [];
			vm.apiDomain.annots.allNotes = [];
			addAnnotRow();
		}

		// load vocabularies
                function loadVocabs() {
                        console.log("loadVocabs()");

			vm.qualifierLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"84"}, function(data) { 
				vm.qualifierLookup = data.items[0].terms
				for(var i=0;i<vm.qualifierLookup.length; i++) {
					if (vm.qualifierLookup[i].abbreviation == null) {
						vm.qualifierLookup[i].abbreviation = "(none)";
					}
				}
			});;

			vm.evidenceLookup = {};
			VocTermSearchAPI.search({"vocabKey":"43"}, function(data) { vm.evidenceLookup = data.items[0].terms});;
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

			DOAlleleAnnotGetAPI.get({key: vm.results[vm.selectedIndex].alleleKey}, function(data) {
				vm.apiDomain = data;
				vm.apiDomain.alleleKey = vm.results[vm.selectedIndex].alleleKey;
				vm.apiDomain.alleleDisplay = vm.results[vm.selectedIndex].alleleDisplay;
				selectAnnot(0);

				// create new rows
                        	for(var i=0;i<5; i++) {
                                	addAnnotRow();
                        	}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: DOAlleleAnnotGetAPI.get");
			});
		}	
		
		// when an annot is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove annot (and thumbnail, if it exists)
			removeSearchResultsItem(vm.apiDomain.alleleKey);

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
				if (vm.results[i].alleleKey == keyToRemove) {
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
                                document.getElementById("alleleDisplay").focus();
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
					//validateAlleleReference(row);
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

		// add new annotation row
		function addAnnotRow() {

			if (vm.apiDomain.annots == undefined) {
				vm.apiDomain.annots = [];
			}

			var i = vm.apiDomain.annots.length;

			vm.apiDomain.annots[i] = {
				"processStatus": "c",
				"annotKey": "",
				"annotTypeKey": "1021",
			       	"objectKey": vm.apiDomain.alleleKey,
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
		$scope.selectAnnot = selectAnnot;

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

