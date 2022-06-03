(function() {
	'use strict';
        angular.module('pwi.gxd').controller('GxdIndexController', GxdIndexController);

	function GxdIndexController(
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
			GxdIndexSearchAPI,
			GxdIndexGetAPI,
			GxdIndexCreateAPI,
			GxdIndexUpdateAPI,
			GxdIndexDeleteAPI,
			GxdIndexTotalCountAPI,
			// global APIs
			ValidateMarkerAPI,
			ValidateJnumAPI,
                        VocTermSearchAPI,
			// config
			USERNAME
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		$scope.USERNAME = USERNAME;

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
		//vm.selectedAllelePairIndex = 0;
		
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			resetDomain();
			refreshTotalCount();
			loadVocabs();
			//addAllelePairRow();
			//addAllelePairRow();
		}

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        	// mapped to 'Clear' button; called from init();  resets page
		function clear() {		
			resetDomain();
                        refreshTotalCount();
			//addAllelePairRow();
			//addAllelePairRow();
			//setFocus();
		}		

		// mapped to query 'Search' button
		// default is to select first result
		function search() {				
			console.log(vm.apiDomain);
		
			pageScope.loadingStart();
			
			GxdIndexSearchAPI.search(vm.apiDomain, function(data) {
				vm.results = data;
				vm.selectedIndex = 0;
				if (vm.results.length > 0) {
					loadObject();
				}
				pageScope.loadingEnd();
				setFocus();

			}, function(err) { // server exception
				pageScope.handleError(vm, "API ERROR: GxdIndexSearchAPI.search");
				pageScope.loadingEnd();
				setFocus();
			});
		}		

        	// mapped to 'Delete' button
		function deleteGxdIndex() {
			console.log("deleteGxdIndex() -> GxdIndexDeleteAPI()");

			if ($window.confirm("Are you sure you want to delete this record?")) {
			
				pageScope.loadingStart();

				GxdIndexDeleteAPI.delete({key: vm.apiDomain.indexKey}, function(data) {
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
					pageScope.handleError(vm, "API ERROR: GxdIndexDeleteAPI.delete");
					pageScope.loadingEnd();
					setFocus();
				});
			}
		}		

		/////////////////////////////////////////////////////////////////////
		// Search Results
		/////////////////////////////////////////////////////////////////////
		
        	// called when user clicks a row in the results
		function selectResult(index) {
			console.log("selectResults: " + index);

			if (index == vm.selectedIndex) {
				deselectObject();
			}
			else {
				vm.apiDomain = {};
				vm.selectedIndex = index;
				loadObject();
				//setFocus();
			}
		}		

 		// Deselect current item from the searchResults.
 		function deselectObject() {
			console.log("deselectObject()");
			var newObject = angular.copy(vm.apiDomain);
                        vm.apiDomain = newObject;
			vm.selectedIndex = -1;

			resetDomainDeselect();

			// change all processStatus to 'c'
			//for(var i=0;i<vm.apiDomain.allelePairs.length; i++) {
				//vm.apiDomain.allelePairs[i].processStatus = "c";
				//vm.apiDomain.allelePairs[i].allelePairKey = "";
				//vm.apiDomain.allelePairs[i].indexKey = "";
				//vm.apiDomain.generalNote = null;
				//addNote(vm.apiDomain.generalNote, "General");
				//vm.apiDomain.privateCuratorialNote = null;
				//addNote(vm.apiDomain.privateCuratorialNote, "Private Curatorial");
				//vm.apiDomain.imagePaneAssocs = [];
			//}

			//setFocus();
		}
	
		// refresh the total count
                function refreshTotalCount() {
                        GxdIndexTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////
		
        	// create
		function createGxdIndex() {
			console.log("createGxdIndex() -> GxdIndexCreateAPI()");

			// check if record selected
			if(vm.selectedIndex > 0) {
				alert("Cannot Add if a record is already selected.");
				return;
			}

			pageScope.loadingStart();

			GxdIndexCreateAPI.create(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
					loadObject();
				}
				else {
					vm.apiDomain = data.items[0];
                			vm.selectedIndex = vm.results.length;
					vm.results[vm.selectedIndex] = [];
					vm.results[vm.selectedIndex].indexKey = vm.apiDomain.indexKey;
					loadObject();
					refreshTotalCount();
				}
				pageScope.loadingEnd();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: GxdIndexCreateAPI.create");
				pageScope.loadingEnd();
			});
		}		

        	// modify
		function modifyGxdIndex() {
			console.log("modifyGxdIndex() -> GxdIndexUpdateAPI()");

			// check if record selected
			if(vm.selectedIndex < 0) {
				alert("Cannot modify if a record is not selected.");
				return;
			}
			
			GxdIndexUpdateAPI.update(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
					loadObject();
				}
				else {
					loadObject();
				}
				pageScope.loadingEnd();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: GxdIndexUpdateAPI.update");
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
		function resetDomain() {
			console.log("resetDomain()");

			vm.results = [];
			vm.selectedIndex = -1;
			vm.total_count = 0;

                	vm.hideErrorContents = true;

			// rebuild empty apiDomain submission object, else bindings fail
			vm.apiDomain = {};
			vm.apiDomain.indexKey = "";	
			vm.apiDomain.refsKey = "";	
			vm.apiDomain.jnumid = "";	
			vm.apiDomain.jnum = "";	
		}

		// resets page data deselect
		function resetDomainDeselect() {
			console.log("resetDomainDeselect()");

			vm.apiDomain.indexKey = "";	
			//vm.apiDomain.editAllelePairOrder = false;
			//vm.apiDomain.allelePairs = [];
			//addAllelePairRow();
		}

		// load vocabularies
                function loadVocabs() {
                        console.log("loadVocabs()");

			vm.priorityLookup = {};
			VocTermSearchAPI.search({"vocabKey":"11"}, function(data) { vm.priorityLookup = data.items[0].terms});;

			vm.conditionalLookup = {};
			VocTermSearchAPI.search({"vocabKey":"74"}, function(data) { vm.conditionalLookup = data.items[0].terms});;

                        //vm.yesnoLookup = [];
                        //vm.yesnoLookup[0] = {
                                //"termKey": "1",
                                //"term": "Yes"
                        //}
                        //vm.yesnoLookup[1] = {
                                //"termKey": "0",
                                //"term": "No"
                        //}

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

			console.log("loadObject(): " + vm.results[vm.selectedIndex].indexKey);

			GxdIndexGetAPI.get({key: vm.results[vm.selectedIndex].indexKey}, function(data) {
				vm.apiDomain = data;
				//selectAllelePairRow(0);
				// create new rows
                        	//for(var i=0;i<2; i++) {
                                	//addAllelePairRow();
                        	//}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: GxdIndexGetAPI.get");
			});
		}	
		
		// when an annot is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove from search results
			removeSearchResultsItem(vm.apiDomain.indexKey);

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
			console.log("removeSearchResultsItem: " + keyToRemove);
			
			// first find the item to remove
			var removeIndex = -1;
			for(var i=0;i<vm.results.length; i++) {
				if (vm.results[i].indexKey == keyToRemove) {
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
                                document.getElementById("jnumID").focus();
                        }, (200));
		}

		/////////////////////////////////////////////////////////////////////
		// validating
		/////////////////////////////////////////////////////////////////////		
		
		function validateMarker(row, index, id) {
			console.log("validateMarker = " + id + index);

			id = id + index;
			
			if ((row.markerAccID == undefined || row.markerAccID == "")
			   && (row.markerSymbol == undefined || row.markerSymbol == "")) {
				row.markerKey = "";
				row.markerSymbol = "";
				row.markerChromosome = "";
				row.markerAccID = "";
				return;
			}

			if (row.markerSymbol.includes("%")) {
				return;
			}

			var params = {};
                        if (row.markerAccID != undefined && row.markerAccID != "") {
			        params.symbol = "";
			        params.chromosome = "";
			        params.accID = row.markerAccID;;
                        } else if (row.markerSymbol != undefined && row.markerSymbol != "") {
			        params.symbol = row.markerSymbol;
			        params.chromosome = row.markerChromosome;
			        params.accID = "";
                        }
                        
			ValidateMarkerAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Marker Symbol: " + row.markerSymbol);
					document.getElementById(id).focus();
					row.markerKey = "";
					row.markerSymbol = "";
					row.markerChromosome = "";
				        row.markerAccID = "";
				} else if (data.length > 1) {
					alert("This marker requires a Chr.\nSelect a Chr, then Marker, and try again:\n\n" + row.markerSymbol);
					document.getElementById(id).focus();
					row.markerKey = "";
					row.markerSymbol = "";
					row.markerChromosome = "";
				        row.markerAccID = "";
				} else {
					console.log(data);
					row.markerKey = data[0].markerKey;
					row.markerSymbol = data[0].symbol;
					row.markerChromosome = data[0].chromosome;
				        row.markerAccID = data[0].accID;
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateMarkerAPI.search");
				document.getElementById(id).focus();
				row.markerKey = "";
				row.markerSymbol = "";
				row.markerChromosome = "";
				row.markerAccID = "";
			});
		}

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
					return;
				}
				else {
					row.refsKey = "";
					row.jnumid = "";
					row.jnum = null;
					row.short_citation = "";
					return;
				}
			}

                        if (row.jnumid.includes("%")) {
                                return;
                        }

			ValidateJnumAPI.query({jnum: row.jnumid}, function(data) {
				if (data.length == 0) {
					alert("Invalid Reference: " + row.jnumid);
					document.getElementById(id).focus();
					row.refsKey = "";
					row.jnumid = "";
					row.jnum = null;
					row.short_citation = "";
				} else {
					row.refsKey = data[0].refsKey;
					row.jnumid = data[0].jnumid;
					row.jnum = parseInt(data[0].jnum, 10);
					row.short_citation = data[0].short_citation;
				}

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateJnumAPI.query");
				document.getElementById(id).focus();
				row.refsKey = "";
                                row.jnumid = ""; 
                                row.jnum = null; 
				row.short_citation = "";
			});
		}		

		/////////////////////////////////////////////////////////////////////
		// allele pairs
		/////////////////////////////////////////////////////////////////////		
		
		// set current row
		function selectAllelePairRow(index) {
			console.log("selectAllelePairRow: " + index);
			vm.selectedAllelePairIndex = index;
		}

		//
		// change of row/field detected
		//
		
		// if current row has changed
		function changeAllelePairRow(index) {
			console.log("changeAllelePairRow: " + index);

			vm.selectedAllelePairIndex = index;

			if (vm.apiDomain.allelePairs[index] == null) {
				vm.selectedAllelePairIndex = 0;
				return;
			}

			if (vm.apiDomain.allelePairs[index].alleleKey1 == ""
				|| vm.apiDomain.allelePairs[index].markerKey == ""
				|| vm.apiDomain.allelePairs[index].pairStateKey == ""
				|| vm.apiDomain.allelePairs[index].compoundKey == "") {
				return;
			}

			if (vm.apiDomain.allelePairs[index].processStatus == "x") {
				vm.apiDomain.allelePairs[index].processStatus = "u";
			};
		}

		// add new allele pair row
		function addAllelePairRow() {

			if (vm.apiDomain.allelePairs == undefined) {
				vm.apiDomain.allelePairs = [];
			}

			var i = vm.apiDomain.allelePairs.length;

			vm.apiDomain.allelePairs[i] = {
				"processStatus": "c",
				"indexKey": vm.apiDomain.indexKey,
				"creation_date": "",
				"modification_date": ""
			}
		}		

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
		$scope.clear = clear;
		$scope.create = createGxdIndex;
		$scope.modify = modifyGxdIndex;
		$scope.delete = deleteGxdIndex;
		//$scope.changeAllelePairRow = changeAllelePairRow;
		//$scope.addAllelePairRow = addAllelePairRow;
		//$scope.selectAllelePairRow = selectAllelePairRow;

		// Validations
		$scope.validateMarker = validateMarker;
		$scope.validateJnum = validateJnum;

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
		$scope.Kadd = function() { $scope.create(); $scope.$apply(); }
		$scope.Kmodify = function() { $scope.modify(); $scope.$apply(); }
		$scope.Kdelete = function() { $scope.deleteGxdIndex(); $scope.$apply(); }

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

