(function() {
	'use strict';
	angular.module('pwi.simplevocab').controller('SimpleVocabController', SimpleVocabController);

	function SimpleVocabController(
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
			SVSearchAPI,
			SVGetAPI,
			SVUpdateAPI,
			SVTotalCountAPI,
			// global APIs
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {};

		// api/json input/output
		vm.apiDomain = {};
		
		vm.synonymTypeLookup = [];
		vm.synonymTypeLookup[1] = {
                    "synonymTypeKey": "1034",
                    "synonymType": "MGI-GORel"
                }

		// isObsolete lookup for  adb active? multiple?
		vm.isObsoleteLookup = [];
		vm.isObsoleteLookup[0] = {
		    "termKey": "1",
		    "term": "Yes"
		}
		vm.isObsoleteLookup[1] = {
			"termKey": "0",
			"term": "No"
		}

                // default booleans for page functionality
		vm.hideApiDomain = true;       // JSON package
		vm.hideVmData = true;          // JSON package + other vm objects
                vm.hideErrorContents = true;	// display error message

		// results list and data
		vm.total_count = 0;
		vm.results = [];
		vm.selectedIndex = -1;
		vm.selectedTermIndex = 0;
		vm.selectedSynonymIndex = 0;

		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			console.log("init()");
			resetData();
			refreshTotalCount();
			//addTermRow();
			console.log("done init()");
		}

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        	// mapped to 'Clear' button; called from init();  resets page
		function clear() {
			console.log("clear()");		
			resetData();
                        refreshTotalCount();
			setFocus();
			addTermRow();
			addSynonymRow(0);
			console.log("done clear()");
		}		

		// mapped to query 'Search' button
		// default is to select first result
		function search() {				
			console.log("search()");
			console.log(vm.apiDomain);
	
			pageScope.loadingStart();
			console.log("after pageScope.loadingStart()");
			// call API to search; pass query params (vm.selected)
			//SVSearchAPI(vm.apiDomain, function(data) {
                        SVSearchAPI.searchsimple(function(data) {
			 	console.log("setting vm.results - data");
				vm.results = data;
				vm.selectedIndex = 0;

				console.log("calling loadSV");
				loadSV();
				console.log("done calling loadSV");

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
			console.log("selectResult(index): " + index);
			console.log("selectResult vm.selectedIndex: " + vm.selectedIndex);
			if (index == vm.selectedIndex) {
				deselectObject();
			}
			else {
				vm.apiDomain = {};
				vm.selectedIndex = index;
				loadSV();
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
			console.log("refreshTotalCount()");
                        SVTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////

		/*function createTerms() {
                        console.log("createTerms() -> SVUpdateAPI()");
                        pageScope.loadingStart();

			console.log("before calling SVUpdateAPI");
                        SVUpdateAPI.update(vm.apiDomain, function(data) {
			console.log("after calling SVUpdateAPI");
                                pageScope.loadingEnd();
			
                                if (data.error != null) {
                                        alert("ERROR: " + data.error + " - " + data.message);
                                }
                                else {
                                        vm.apiDomain = data.items[0];
					console.log("vm.results before: " +  vm.results.length);
                                        vm.selectedIndex = vm.results.length;
                                        vm.results[vm.selectedIndex] = [];
                                        vm.results[vm.selectedIndex].vocabKey = vm.apiDomain.vocabKey;
                                        vm.results[vm.selectedIndex].vocabName = vm.apiDomain.vocabName;
					console.log("vm.results after: " +  vm.results.length);
					console.log ("vm.selectedIndex: " +  vm.selectedIndex);
					console.log ("vm.results[vm.selectedIndex].name " + vm.results[vm.selectedIndex].name);
					console.log("vm.results[vm.selectedIndex].logicalDBKey: " + vm.results[vm.selectedIndex].logicalDBKey);
                                        loadSV();
                                        refreshTotalCount();
                                }
                                pageScope.loadingEnd();
                                setFocus();

                        }, function(err) {
                                pageScope.handleError(vm, "Error creating Term.");
                                pageScope.loadingEnd();
                                setFocus();
                        });
                }**/


        	// modify Term
		function modifyTerm() {
			console.log("update() -> SVUpdateAPI()");
			var allowCommit = true;

			// check if record selected
			if(vm.selectedTermIndex < 0) {
				alert("Cannot save this Term if a record is not selected.");
				allowCommit = false;
			}
			// check required, not sure we need this.
			/*
			for (var i=0;i<vm.apiDomain.terms.length; i++) {
                                if (vm.apiDomain.terms[i].processStatus == "u") {
                                        if (vm.apiDomain.terms[i].termKey == "") {
                                                alert("Required Fields are missing:  Term ");
                                                vm.allowCommit = false;
                                        }
                            	}
			}**/
			if (allowCommit){
				pageScope.loadingStart();

				SVUpdateAPI.update(vm.apiDomain, function(data) {
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						loadSV();
					}
					pageScope.loadingEnd();
				}, function(err) {
					pageScope.handleError(vm, "Error updating Term.");
					pageScope.loadingEnd();
				});
			}
			else {
				loadSV();
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
			loadSV();
			scrollToObject();
		}
		
		function nextSummaryObject() {
			console.log("nextSummaryObject()");
			if(vm.results.length == 0) return;
			if(vm.selectedIndex + 1 >= vm.results.length) return;
			vm.selectedIndex++;
			loadSV();
			scrollToObject();
		}		

	    	function firstSummaryObject() {
			console.log("firstSummaryObject()");
	        	if(vm.results.length == 0) return;
	        	vm.selectedIndex = 0;
			loadSV();
			scrollToObject();
	      	}

	    	function lastSummaryObject() {
			console.log("lastSummaryObject()");
	        	if(vm.results.length == 0) return;
			console.log("lastSummaryObject vm.selectedIndex: " + vm.selectedIndex);
			console.log("lastSummaryObject vm.results.length: " + vm.results.length);
	        	vm.selectedIndex = vm.results.length - 1;
			loadSV();
			scrollToObject();
	      	}

	    	// ensure we keep the selected row in view
		function scrollToObject() {
			console.log("scrollToObject()");
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
			vm.total_count = 0;

			// rebuild empty apiDomain submission object, else bindings fail
			vm.apiDomain = {};
			vm.apiDomain.logicalDBKey = "";	
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");

			vm.apiDomain.logicalDBKey = "";	
			addTermRow();
			addSynonymRow(0);
		}

		// load a selected object from results
		function loadSV() {
			console.log("loadSV()");
			if (vm.results.length == 0) {
				return;
			}

			if (vm.selectedIndex < 0) {
				return;
			}

			// api get object by primary key
			console.log("vm.results[vm.selectedIndex].vocabKey: " + vm.results[vm.selectedIndex].vocabKey); 
			SVGetAPI.get({ key: vm.results[vm.selectedIndex].vocabKey }, function(data) { 

				vm.apiDomain = data;
				vm.apiDomain.vocabKey = vm.results[vm.selectedIndex].vocabKey; 
				console.log("loadSV calling addTermRow");
				addTermRow();
				console.log("loadSV calling selectTerm");
				selectTerm(0);

			}, function(err) {
				pageScope.handleError(vm, "Error retrieving data object.");
			});
		}	

		function selectSV(index) {
		    console.log("selectSV: " + index);
                    vm.selectedIndex = index;
		    vm.selectedTermIndex = 0;
		    vm.selectedSynonymIndex = 0;
		}
		
		// set current note row
		function selectSynonym(index) {
                        console.log("selectSynonym: " + index);
                        vm.selectedSynonymIndex = index;
                }

		function addTermRow() {
		   console.log("addTermRow");
                    if (vm.apiDomain.terms == undefined) {
                        vm.apiDomain.terms = [];
                    }
                    var i = vm.apiDomain.terms.length;
		    console.log("Number of terms: " + vm.apiDomain.terms.length);
		    vm.apiDomain.terms[i] = {
			"processStatus": "c",
                        "termKey": "" ,
			"term": "" ,
                        "vocabKey": vm.apiDomain.vocabKey ,
                        "vocabName": "",
                        "abbreviation": "",
                        "note": "",
                        "sequenceNum": i + 1,
                        "isObsolete": "0",
                        "createdByKey": "",
                        "createdBy": "",
                        "modifiedByKey": "",
                        "modifiedBy": "",
                        "creation_date": "",
                        "modification_date": ""
                    }
		    console.log("Number of terms: " + vm.apiDomain.terms.length);
		    console.log("new term vocabKey: " + vm.apiDomain.terms[i].vocabKey);
		}

		function addSynonymRow(index) { // index is index of term
		    console.log("addSynonymRow index: " + index);
			
		    if (vm.apiDomain.terms[index].vocabKey != "82") {
			console.log("addSynonymRow. Not a GO Property");
			return; // only GO Property terms have synonyms, only add empty row in this case
		    }
		    console.log("addSynonymRow. Is a GO Property");
		    if (vm.apiDomain.terms[index].goRelSynonyms == null || vm.apiDomain.terms[index].goRelSynonyms == undefined) {
			console.log("setting goRelSynonyms to empty list");
			vm.apiDomain.terms[index].goRelSynonyms = [];
			console.log("goRelSynonyms " + vm.apiDomain.terms[index].goRelSynonyms);
		    }
		    var i = vm.apiDomain.terms[index].goRelSynonyms.length;
		    
		    console.log("var i: " + i);	
		    // refsKey is null for goRelSynonyms
                    vm.apiDomain.terms[index].goRelSynonyms[i] = {
			"processStatus": "c",
		        "synonymKey": "" ,
			"objectKey": vm.apiDomain.termKey,
			"mgiTypeKey": "13",
			"synonymTypeKey": "1034",
			"synonymType": "MGI-GORel",
			"refsKey": "",
			"jnumid": "",
			"jnum": "",
			"short_citation": "",
			"synonym": "",
			"createdByKey": "",
			"createdBy": "",
			"modifiedByKey": "",
			"modifiedBy": "",
			"creation_date": "",
			"modification_date": ""
		    }
		    console.log("Number of synonyms: " + vm.apiDomain.terms[index].goRelSynonyms.length);
		}
	
		function deleteSynonymRow(index) {
		    console.log("deleteSynonymRow: " + index);
		    changeTermRow(vm.selectedTermIndex);
		    vm.apiDomain.terms[vm.selectedTermIndex].goRelSynonyms[index].synonym = "";
                }
	
		/*function deleteTermRow(index) {
		    console.log("deleteTermRow: " + index);
		    changeTermRow(vm.selectedTermIndex); 
		    console.log("vm.selectedIndex: " + vm.selectedIndex);
		    console.log("index: " + index);
		    console.log(" vm.apiDomain[vm.selectedIndex]: " +  vm.apiDomain[vm.selectedIndex]);
		    console.log("vm.apiDomain.terms[index].term: " + vm.apiDomain.terms[index].term);
		    vm.apiDomain.terms[index].term = "";
		        
                }**/
		function changeTermRow(index) {
		    console.log("changeTermRow: " + index);

                    vm.selectedTermIndex = index;

                    if (vm.apiDomain.terms[index] == null) {
                        vm.selectedTermIndex = 0;
                        return;
                    }
		
		     if (vm.apiDomain.terms[index].processStatus == "x") {
                                vm.apiDomain.terms[index].processStatus = "u";
                     }
		}
               /* 
		function deleteTerm() {
		    console.log("update() -> SVUpdateAPI()");

		    if ($window.confirm("Are you sure you want to delete this record?")) {

			pageScope.loadingStart();
			console.log("vm.apiDomain.termKey" + vm.apiDomain.logicalDBKey);
			SVUpdateAPI.update({ key: vm.apiDomain.logicalDBKey }, function(data) {
			    if (data.error != null) {
				alert("ERROR: " + data.error + " - " + data.message);
			    }
			    else {
				postObjectDelete();
				refreshTotalCount();
			    }
			    pageScope.loadingEnd();
			    setFocus();

			}, function(err) {
			    pageScope.handleError(vm, "Error deleting logical DB.");
			    pageScope.loadingEnd();
			    setFocus();
			});
		    }
                }**/
	
		// when a logical DB  is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove ldb (and thumbnail, if it exists)
			removeSearchResultsItem(vm.apiDomain.logicalDBKey);

			// clear if now empty; otherwise, load next row
			if (vm.results.length == 0) {
				clear();
			}
			else {
				// adjust selected results index as needed, and load ldb
				if (vm.selectedIndex > vm.results.length -1) {
					vm.selectedIndex = vm.results.length -1;
				}
				loadSV();
			}
		}

		// handle removal from results list
		function removeSearchResultsItem(keyToRemove) {
		   	console.log("removeSearchResultsItem()");
			// first find the item to remove
			var removeIndex = -1;
			for(var i=0;i<vm.results.length; i++) {
				if (vm.results[i].logicalDBKey == keyToRemove) {
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
			document.getElementById("name").focus();
		}

		/////////////////////////////////////////////////////////////////////
		// validating
		/////////////////////////////////////////////////////////////////////		
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

			
		/////////////////////////////////////////////////////////////////////
		//  Terms
		/////////////////////////////////////////////////////////////////////		
		
		// set simple vocab row
		function selectTerm(index) {
			console.log("selectTerm index: " + index);
			vm.selectedTermIndex = index;
			vm.selectedSynonymIndex = 0;
			addSynonymRow(index); // pass index of term
		}


                // Main Buttons
		$scope.search = search;
		$scope.clear = clear;
		$scope.modifyTerm = modifyTerm;
		$scope.addSynonymRow = addSynonymRow;
		$scope.changeTermRow = changeTermRow;
		//$scope.deleteTermRow = deleteTermRow;
		$scope.deleteSynonymRow = deleteSynonymRow;
		$scope.selectTerm = selectTerm;
		$scope.selectSynonym = selectSynonym;

		// change of row/field detected
		$scope.selectSV = selectSV;

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

		// other functions: buttons, onBlurs and onChanges
		$scope.selectResult = selectResult;
		
		// global shortcuts
		$scope.KclearAll = function() { $scope.clear(); $scope.$apply(); }
		$scope.Ksearch = function() { $scope.search(); $scope.$apply(); }
		$scope.Kfirst = function() { $scope.firstSummaryObject(); $scope.$apply(); }
		$scope.Knext = function() { $scope.nextSummaryObject(); $scope.$apply(); }
		$scope.Kprev = function() { $scope.prevSummaryObject(); $scope.$apply(); }
		$scope.Klast = function() { $scope.lastSummaryObject(); $scope.$apply(); }
		$scope.Kmodify = function() { $scope.modifyTerm(); $scope.$apply(); }

		var globalShortcuts = Mousetrap($document[0].body);
		globalShortcuts.bind(['ctrl+alt+c'], $scope.KclearAll);
		globalShortcuts.bind(['ctrl+alt+s'], $scope.Ksearch);
		globalShortcuts.bind(['ctrl+alt+f'], $scope.Kfirst);
		globalShortcuts.bind(['ctrl+alt+n'], $scope.Knext);
		globalShortcuts.bind(['ctrl+alt+p'], $scope.Kprev);
		globalShortcuts.bind(['ctrl+alt+l'], $scope.Klast);
		globalShortcuts.bind(['ctrl+alt+a'], $scope.Kadd);
		globalShortcuts.bind(['ctrl+alt+m'], $scope.Kmodify);
		globalShortcuts.bind(['ctrl+alt+d'], $scope.Kdelete);

		// call to initialize the page, and start the ball rolling...
		init();
	}

})();

