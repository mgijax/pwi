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
			AntibodyClassSearchAPI,
			AntibodyClassUpdateAPI,
			GXDLabelSearchAPI,
			GXDLabelUpdateAPI,
			PatternSearchAPI,
			PatternUpdateAPI,
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
			addTermRow();
			search();
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

        	// modify Term
		function modifyTerm() {
			console.log("modifyTerm -> SVUpdateAPI()");

			// check if record selected
			if(vm.selectedTermIndex < 0) {
				alert("Cannot Modify if a record is not selected.");
				return;
			}

			pageScope.loadingStart();

                        if (vm.results[vm.selectedIndex].vocabKey == "151") {
			        AntibodyClassUpdateAPI.update(vm.apiDomain, function(data) {
				        if (data.error != null) {
					        alert("ERROR: " + data.error + " - " + data.message);
				        }
				        else {
					        loadSV();
				        }
				        pageScope.loadingEnd();
			        }, function(err) {
				        pageScope.handleError(vm, "API ERROR: AntibodyClassSearchAPI.search");
				        pageScope.loadingEnd();
			        });
                        }
                        else if (vm.results[vm.selectedIndex].vocabKey == "152") {
			        GXDLabelUpdateAPI.update(vm.apiDomain, function(data) {
				        if (data.error != null) {
					        alert("ERROR: " + data.error + " - " + data.message);
				        }
				        else {
					        loadSV();
				        }
				        pageScope.loadingEnd();
			        }, function(err) {
				        pageScope.handleError(vm, "API ERROR: GXDLabelSearchAPI.search");
				        pageScope.loadingEnd();
			        });
                        }
                        else if (vm.results[vm.selectedIndex].vocabKey == "153") {
			        PatternUpdateAPI.update(vm.apiDomain, function(data) {
				        if (data.error != null) {
					        alert("ERROR: " + data.error + " - " + data.message);
				        }
				        else {
					        loadSV();
				        }
				        pageScope.loadingEnd();
			        }, function(err) {
				        pageScope.handleError(vm, "API ERROR: PatternSearchAPI.search");
				        pageScope.loadingEnd();
			        });
                        }
                        else {
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

                        if (vm.results[vm.selectedIndex].vocabKey == "151") {
			        AntibodyClassSearchAPI.search(vm.apiDomain, function(data) {
				        vm.apiDomain = data[0];
				        vm.apiDomain.vocabKey = vm.results[vm.selectedIndex].vocabKey; 
				        addTermRow();
				        selectTerm(0);
			        }, function(err) {
				        pageScope.handleError(vm, "API ERROR: AntibodyClassSearchAPI.search");
			        });
                        }
                        else if (vm.results[vm.selectedIndex].vocabKey == "152") {
			        GXDLabelSearchAPI.search(vm.apiDomain, function(data) {
				        vm.apiDomain = data[0];
				        vm.apiDomain.vocabKey = vm.results[vm.selectedIndex].vocabKey; 
				        addTermRow();
				        selectTerm(0);
			        }, function(err) {
				        pageScope.handleError(vm, "API ERROR: GXDLabelSearchAPI.search");
			        });
                        }
                        else if (vm.results[vm.selectedIndex].vocabKey == "153") {
			        PatternSearchAPI.search(vm.apiDomain, function(data) {
				        vm.apiDomain = data[0];
				        vm.apiDomain.vocabKey = vm.results[vm.selectedIndex].vocabKey; 
				        addTermRow();
				        selectTerm(0);
			        }, function(err) {
				        pageScope.handleError(vm, "API ERROR: PatternSearchAPI.search");
			        });
                        }
                        else {
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
		    vm.apiDomain.terms[i] = {
			"processStatus": "c",
                        "termKey": "" ,
			"term": "" ,
                        "vocabKey": vm.apiDomain.vocabKey ,
                        "abbreviation": "",
                        "note": "",
                        "sequenceNum": i + 1,
                        "isObsolete": "0"
                    }
		}

		function addSynonymRow(index) { // index is index of term
		    console.log("addSynonymRow index: " + index);
			
		    // only GO Property terms have synonyms, only add empty row in this case
		    if (vm.apiDomain.terms[index].vocabKey != "82") {
			console.log("addSynonymRow. Not a GO Property");
			return;
		    }

		    if (vm.apiDomain.terms[index].goRelSynonyms == null || vm.apiDomain.terms[index].goRelSynonyms == undefined) {
			vm.apiDomain.terms[index].goRelSynonyms = [];
		    }

		    var i = vm.apiDomain.terms[index].goRelSynonyms.length;
                    vm.apiDomain.terms[index].goRelSynonyms[i] = {
			"processStatus": "c",
		        "synonymKey": "" ,
			"objectKey": vm.apiDomain.termKey,
			"mgiTypeKey": "13",
			"synonymTypeKey": "1034",
			"synonym": ""
		    }
		}
	
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

		function changeSynonymRow(index) {
		    console.log("changeSynonymRow: " + index);

                    vm.selectedSynonymIndex = index;

                    if (vm.apiDomain.terms[vm.selectedTermIndex].goRelSynonyms == null) {
			vm.selectedTermIndex = 0;
			return;
                    }

		    if (vm.apiDomain.terms[vm.selectedTermIndex].processStatus == "x") {
                    	vm.apiDomain.terms[vm.selectedTermIndex].processStatus = "u";
                    }

		    if (vm.apiDomain.terms[vm.selectedTermIndex].goRelSynonyms[index].processStatus == "x") {
			vm.apiDomain.terms[vm.selectedTermIndex].goRelSynonyms[index].processStatus = "u";
		    }
                }

		function deleteSynonymRow(index) {
		    console.log("deleteSynonymRow: " + index);

		    if (vm.apiDomain.terms[vm.selectedTermIndex].processStatus == "x") {
			vm.apiDomain.terms[vm.selectedTermIndex].processStatus = "u";
		    }

		    vm.apiDomain.terms[vm.selectedTermIndex].goRelSynonyms[index].processStatus = "d";
		}

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
		//  Terms
		/////////////////////////////////////////////////////////////////////		
		
		// set simple vocab row
		function selectTerm(index) {
			console.log("selectTerm index: " + index);
			vm.selectedTermIndex = index;
			vm.selectedSynonymIndex = 0;
		}


                // Main Buttons
		$scope.search = search;
		$scope.clear = clear;
		$scope.modifyTerm = modifyTerm;
		$scope.addTermRow = addTermRow;
		$scope.addSynonymRow = addSynonymRow;
		$scope.changeTermRow = changeTermRow;
                $scope.changeSynonymRow = changeSynonymRow;
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

