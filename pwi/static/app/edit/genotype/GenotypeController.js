(function() {
	'use strict';
	angular.module('pwi.genotype').controller('GenotypeController', GenotypeController);

	function GenotypeController(
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
			GenotypeSearchAPI,
			GenotypeGetAPI,
			GenotypeUpdateAPI,
			GenotypeTotalCountAPI,
			GenotypeGetDataSetsAPI,
			// global APIs
			ChromosomeSearchAPI,
			ValidateJnumAPI,
			VocTermSearchAPI
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

		// results list and data
		vm.total_count = 0;
		vm.results = [];
		vm.selectedIndex = -1;
		vm.selectedAllelePairIndex = 0;
		
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			resetDomain();
			refreshTotalCount();
			loadVocabs();
			addAllelePairRow();
			addAllelePairRow();
		}

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        	// mapped to 'Clear' button; called from init();  resets page
		function clear() {		
			resetDomain();
                        refreshTotalCount();
			setFocus();
			addAllelePairRow();
			addAllelePairRow();
			addNotes();
		}		

		// mapped to query 'Search' button
		// default is to select first result
		function search() {				
			console.log(vm.apiDomain);
		
			pageScope.loadingStart();
			
			// call API to search; pass query params (vm.selected)
			GenotypeSearchAPI.search(vm.apiDomain, function(data) {
				
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

		function searchAccId() {
			console.log("searchAccId");

			//if (vm.apiDomain.strainKey == "" && vm.apiDomain.accID != "") {
				//search();
			//}
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
			resetDomainDeselect();
			setFocus();
		}
	
		// refresh the total count
                function refreshTotalCount() {
                        GenotypeTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////
		
        	// modify genotypes
		function modifyGenotype() {
			console.log("modifyGenotype() -> GenotypeUpdateAPI()");
			var allowCommit = true;

			// check if record selected
			if(vm.selectedIndex < 0) {
				alert("Cannot save this Genotype if a record is not selected.");
				allowCommit = false;
			}
			
			// check required
			for(var i=0;i<vm.apiDomain.allelePairs.length; i++) {
				if (vm.apiDomain.allelePairs[i].processStatus == "u") {
					if ((vm.apiDomain.allelePairs[i].termKey == "")
						|| (vm.apiDomain.allelePairs[i].refsKey == "")
					) {
						alert("Required Fields are missing:  Term ID, J:");
						allowCommit = false;
					}
				}
			}

			if (allowCommit){
				pageScope.loadingStart();

				GenotypeUpdateAPI.update(vm.apiDomain, function(data) {
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						loadObject();
					}
					pageScope.loadingEnd();
				}, function(err) {
					pageScope.handleError(vm, "Error updating genotype.");
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
		function resetDomain() {
			console.log("resetDomain()");

			vm.results = [];
			vm.selectedIndex = -1;
			vm.total_count = 0;

                	vm.hideErrorContents = true;

			// rebuild empty apiDomain submission object, else bindings fail
			vm.apiDomain = {};
			vm.apiDomain.genotypeKey = "";	
			vm.apiDomain.strainKey = "";	
			vm.apiDomain.isConditional = "";	
			vm.apiDomain.existsAsKey = "";	
                        vm.apiDomain.accID = "";

			vm.dataSets = [];
		}

		// resets page data deselect
		function resetDomainDeselect() {
			console.log("resetDomainDeselect()");

			vm.apiDomain.strainKey = "";	
			vm.apiDomain.allelePairs = [];
			addAllelePairRow();
		}

		// load vocabularies
                function loadVocabs() {
                        console.log("loadVocabs()");

                        vm.chromosomeLookup = [];
                        ChromosomeSearchAPI.search({"organismKey":"1"}, function(data) { vm.chromosomeLookup = data});;

			vm.pairStateLookup = {};
			VocTermSearchAPI.search({"vocabKey":"39"}, function(data) { vm.pairStateLookup = data.items[0].terms});;

			vm.compoundLookup = {};
			VocTermSearchAPI.search({"vocabKey":"42"}, function(data) { vm.compoundLookup = data.items[0].terms});;

			vm.existsAsLookup = {};
			VocTermSearchAPI.search({"vocabKey":"60"}, function(data) { vm.existsAsLookup = data.items[0].terms});;

                        vm.conditionalLookup = [];
                        vm.conditionalLookup[0] = {
                                "termKey": "1",
                                "term": "Yes"
                        }
                        vm.conditionalLookup[1] = {
                                "termKey": "0",
                                "term": "No"
                        }

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
			GenotypeGetAPI.get({key: vm.results[vm.selectedIndex].genotypeKey}, function(data) {
				vm.apiDomain = data;
				selectAllelePair(0);

				// create new rows
                        	for(var i=0;i<5; i++) {
                                	addAllelePairRow();
                        	}

				vm.dataSets = [];

			}, function(err) {
				pageScope.handleError(vm, "Error retrieving data object");
			});
		}	
		
		// when an annot is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove annot (and thumbnail, if it exists)
			removeSearchResultsItem(vm.apiDomain.strainKey);

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
				if (vm.results[i].strainKey == keyToRemove) {
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
			input.focus(document.getElementById("strain"));
		}

		/////////////////////////////////////////////////////////////////////
		// validating
		/////////////////////////////////////////////////////////////////////		
		
        	// validate jnum
		function validateJnum(row, index, id) {		
			console.log("validateJnum = " + id + index);

			id = id + index;

                        if (row.jnumid.includes("%")) {
                                return;
                        }

			if (row.jnumid == undefined || row.jnumid == "") {
				if (index > 0) {
					row.refsKey = vm.apiDomain.allelePairs[index-1].refsKey;
					row.jnumid = vm.apiDomain.allelePairs[index-1].jnumid;
					row.jnum = vm.apiDomain.allelePairs[index-1].jnum;
					row.short_citation = vm.apiDomain.allelePairs[index-1].short_citation;
					selectAllelePair(index + 1);
					return;
				}
				else {
					row.refsKey = "";
					row.jnumid = "";
					row.jnum = null;
					row.short_citation = "";
					selectAllelePair(index + 1);
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
					selectAllelePair(index + 1);
				} else {
					row.refsKey = data[0].refsKey;
					row.jnumid = data[0].jnumid;
					row.jnum = parseInt(data[0].jnum, 10);
					row.short_citation = data[0].short_citation;
					selectAllelePair(index + 1);
					validateAlleleReference(row);
				}

			}, function(err) {
				pageScope.handleError(vm, "Invalid Reference");
				document.getElementById(id).focus();
				row.refsKey = "";
                                row.jnumid = ""; 
                                row.jnum = null; 
				row.short_citation = "";
				selectAllelePair(index + 1);
			});
		}		

		/////////////////////////////////////////////////////////////////////
		// genotypes
		/////////////////////////////////////////////////////////////////////		
		
		// set current genotype row
		function selectAllelePair(index) {
			console.log("selectAllelePair: " + index);
			vm.selectedAllelePairIndex = index;
		}

		//
		// change of row/field detected
		//
		
		// if current genotype row has changed
		function changeAllelePairRow(index) {
			console.log("changeAllelePairRow: " + index);

			vm.selectedAllelePairIndex = index;

			if (vm.apiDomain.allelePairs[index] == null) {
				vm.selectedAllelePairIndex = 0;
				return;
			}

			if (vm.apiDomain.allelePairs[index].processStatus == "x") {
				vm.apiDomain.allelePairs[index].processStatus = "u";
			};
		}

		// add new genotype row
		function addAllelePairRow() {

			if (vm.apiDomain.allelePairs == undefined) {
				vm.apiDomain.allelePairs = [];
			}

			var i = vm.apiDomain.allelePairs.length;

			vm.apiDomain.allelePairs[i] = {
				"processStatus": "c",
				"genotypeKey": "",
				"allelePairKey": "",
				"createdBy": "",
				"creation_date": "",
				"modifiedBy": "",
				"modification_date": ""
			}
		}		

		/////////////////////////////////////////////////////////////////////
		// notes
		/////////////////////////////////////////////////////////////////////		
		
		// add new note row
		function addNote(note, noteType) {
			console.log("addNote:" + note);

			if (note != undefined) { return; }

			var noteTypeKey = "";

			if (noteType == "General") {
				noteTypeKey = "1027";
			}
			if (noteType == "Private Curatorial") {
				noteTypeKey = "1028";
			}

			note = {
				"noteKey": "",
				"objectKey": vm.apiDomain.markerKey,
				"mgiTypeKey": "12",
				"noteTypeKey": noteTypeKey,
				"noteChunk": ""
			}

			if (noteType == "General") {
				vm.apiDomain.generalNote = note;
			}
			if (noteType == "Private Curatorial") {
				vm.apiDomain.privateCuratorialNote = note;
			}
		}

		function addNotes() {
			console.log("addNotes");

			addNote(vm.apiDomain.generalNote, "General");
			addNote(vm.apiDomain.privateCuratorialNote, "Private Curatorial");
		}

		// DataSets
		
		// load data sets by genotype key
		function loadDataSets() {
			console.log("loadDataSets: " + vm.apiDomain.genotypeKey);

			GenotypeGetDataSetsAPI.query({key: vm.apiDomain.genotypeKey}, function(data) {
				console.log("loadDataSets: " + data);
				vm.dataSets = data;
			}, function(err) {
				pageScope.handleError(vm, "Error retrieving data sets");
			});
		}	
		
		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
		$scope.searchAccId = searchAccId;
		$scope.clear = clear;
		//$scope.create = create;
		//$scope.update = update;
		//$scope.delete = delete;
		$scope.changeAllelePairRow = changeAllelePairRow;
		$scope.addAllelePairRow = addAllelePairRow;
		$scope.selectAllelePair = selectAllelePair;
		$scope.loadDataSets = loadDataSets;

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

		// other functions: buttons, onBlurs and onChanges
		$scope.selectResult = selectResult;
		$scope.validateJnum = validateJnum;
		
		// global shortcuts
		$scope.KclearAll = function() { $scope.clear(); $scope.$apply(); }
		$scope.Ksearch = function() { $scope.search(); $scope.$apply(); }
		$scope.Kfirst = function() { $scope.firstSummaryObject(); $scope.$apply(); }
		$scope.Knext = function() { $scope.nextSummaryObject(); $scope.$apply(); }
		$scope.Kprev = function() { $scope.prevSummaryObject(); $scope.$apply(); }
		$scope.Klast = function() { $scope.lastSummaryObject(); $scope.$apply(); }
		$scope.Kadd = function() { $scope.create(); $scope.$apply(); }
		$scope.Kmodify = function() { $scope.update(); $scope.$apply(); }
		$scope.Kdelete = function() { $scope.delete(); $scope.$apply(); }

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

