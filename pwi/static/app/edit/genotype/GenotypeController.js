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
			GenotypeDeleteAPI,
			GenotypeTotalCountAPI,
			GenotypeGetDataSetsAPI,
			GenotypeSearchDataSetsAPI,
			ValidateAlleleStateAPI,
			ValidateMutantCellLinesAPI,
			// global APIs
			ChromosomeSearchAPI,
			ValidateAlleleAPI,
			ValidateMarkerOfficialStatusAPI,
			ValidateJnumAPI,
			ValidateStrainAPI,
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
			addImagePaneRow();
			addDataSetRow();
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
			addImagePaneRow();
			addDataSetRow();
		}		

		// mapped to query 'Search' button
		// default is to select first result
		function search() {				
			console.log(vm.apiDomain);
		
			pageScope.loadingStart();
			
			if (vm.dataSets[0].refsKey != "") {
				GenotypeSearchDataSetsAPI.query({key: vm.dataSets[0].refsKey}, function(data) {
					console.log(data);
					vm.results = data;
					vm.selectedIndex = 0;
					if (vm.results.length > 0) {
						loadObject();
					}
					pageScope.loadingEnd();
					setFocus();
	
				}, function(err) { // server exception
					pageScope.handleError(vm, "API ERROR: GenotypeSearchDataSetsAPI.query");
					pageScope.loadingEnd();
					setFocus();
				});
			}
			else {
				GenotypeSearchAPI.search(vm.apiDomain, function(data) {
					vm.results = data;
					vm.selectedIndex = 0;
					if (vm.results.length > 0) {
						loadObject();
					}
					pageScope.loadingEnd();
					setFocus();
	
				}, function(err) { // server exception
					pageScope.handleError(vm, "API ERROR: GenotypeSearchAPI.search");
					pageScope.loadingEnd();
					setFocus();
				});
			}
		}		

		function searchAccId() {
			console.log("searchAccId");

			if (vm.apiDomain.genotypeKey == "" && vm.apiDomain.accID != "") {
				search();
			}
		}

        	// mapped to 'Delete' button
		function deleteGenotype() {
			console.log("deleteGenotype() -> GenotypeDeleteAPI()");

			if ($window.confirm("Are you sure you want to delete this record?")) {
			
				pageScope.loadingStart();

				GenotypeDeleteAPI.delete({key: vm.apiDomain.genotypeKey}, function(data) {
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
					pageScope.handleError(vm, "API ERROR: GenotypeDeleteAPI.delete");
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
					pageScope.handleError(vm, "API ERROR: GenotypeUpdateAPI.update");
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
			vm.apiDomain.strain = "";	
			vm.apiDomain.isConditional = "";	
			vm.apiDomain.existsAsKey = "";	
                        vm.apiDomain.accID = "";
		}

		// resets page data deselect
		function resetDomainDeselect() {
			console.log("resetDomainDeselect()");

			vm.apiDomain.genotypeKey = "";	
			vm.apiDomain.allelePairs = [];
			addAllelePairRow();
			addImagePaneRow();
			addDataSetRow();
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

                        vm.yesnoLookup = [];
                        vm.yesnoLookup[0] = {
                                "termKey": "1",
                                "term": "Yes"
                        }
                        vm.yesnoLookup[1] = {
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

				addImagePaneRow();
				addDataSetRow();
				getDataSets();

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: GenotypeGetAPI.get");
			});
		}	
		
		// when an annot is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove from search results
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
			console.log("removeSearchResultsItem: " + keyToRemove);
			
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
			input.focus(document.getElementById("strain"));
		}

		/////////////////////////////////////////////////////////////////////
		// validating
		/////////////////////////////////////////////////////////////////////		
		
		function validateAllele1(row, index, id) {
			console.log("validateAllele1 = " + id + index);

			id = id + index;

			if (row.alleleSymbol1 == "") {
				row.alleleKey1 = "";
				row.alleleSymbol1 = "";
				return;
			}

			if (row.alleleSymbol1.includes("%")) {
				return;
			}

			// params if used for the validation search only
			var params = {};
			params.symbol = row.alleleSymbol1;
			console.log(params);
			
			ValidateAlleleAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Allele Symbol: " + row.alleleSymbol1);
					document.getElementById(id).focus();
					row.alleleKey1 = "";
					row.alleleSymbol1 = "";
				} else {
					row.alleleKey1 = data[0].alleleKey;
					row.alleleSymbol1 = data[0].symbol;
					if (row.markerKey == "") {
						row.markerKey = data[0].markerKey; 
						row.markerSymbol = data[0].markerSymbol; 
						row.markerChromosome = data[0].chromosome;
					}
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateAlleleAPI.search");
				document.getElementById(id).focus();
				row.alleleKey1 = "";
				row.alleleSymbol1 = "";
			});
		}

		function validateAllele2(row, index, id) {
			console.log("validateAllele2 = " + id + index);

			id = id + index;

			if (row.alleleSymbol2 == "") {
				row.alleleKey2 = "";
				row.alleleSymbol2 = "";
				return;
			}

			if (row.alleleSymbol2.includes("%")) {
				return;
			}

			// params if used for the validation search only
			var params = {};
			params.symbol = row.alleleSymbol2;
			console.log(params);
			
			ValidateAlleleAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Allele Symbol: " + row.alleleSymbol2);
					document.getElementById(id).focus();
					row.alleleKey2 = "";
					row.alleleSymbol2 = "";
				} else {
					row.alleleKey2 = data[0].alleleKey;
					row.alleleSymbol2 = data[0].symbol;
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateAlleleAPI.search");
				document.getElementById(id).focus();
				row.alleleKey2 = "";
				row.alleleSymbol2 = "";
			});
		}

		function validateMarker(row, index, id) {
			console.log("validateMarker = " + id + index);

			id = id + index;
			
			if (row.markerSymbol == undefined || row.markerSymbol == "") {
				row.markerKey = "";
				row.markerSymbol = "";
				row.markerChromosome = "";
				return;
			}

			if (row.markerSymbol.includes("%")) {
				return;
			}

			ValidateMarkerOfficialStatusAPI.query({symbol: row.markerSymbol}, function(data) {
				if (data.length == 0) {
					alert("Invalid Marker Symbol: " + row.markerSymbol);
					document.getElementById(id).focus();
					row.markerKey = "";
					row.markerSymbol = "";
					row.markerChromosome = "";
				} else {
					row.markerKey = data[0].markerKey;
					row.markerSymbol = data[0].symbol;
					row.markerChromosome = data[0].chromosome;
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateMarkerOfficialStatusAPI.query");
				document.getElementById(id).focus();
				row.markerKey = "";
				row.markerSymbol = "";
				row.markerChromosome = "";
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

		// validate strain
		function validateStrain(id) {
			console.log("validateStrain()");

			if (vm.apiDomain.strain == undefined || vm.apiDomain.strain == "") {
				vm.apiDomain.strainKey = "";
				vm.apiDomain.strain = "";
				return;
			}

                        if (vm.apiDomain.strain.includes("%")) {
                                return;
                        }

			ValidateStrainAPI.search({strain: vm.apiDomain.strain}, function(data) {
				if (data.length == 0) {
					alert("The item : " + vm.apiDomain.strain + " does not exist in the database.");
					vm.apiDomain.strainKey = "";
					vm.apiDomain.strain = "";
					document.getElementById(id).focus();
				} else {
					if (data[0].isPrivate == "1") {
						alert("This value is designated as 'private' and cannot be used: " + vm.apiDomain.strain);
						vm.apiDomain.strainKey = "";
						vm.apiDomain.strain = "";
						document.getElementById(id).focus();
					}
					else {
						vm.apiDomain.strainKey = data[0].strainKey;
						vm.apiDomain.strain = data[0].strain;
					}
				}

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateStrainAPI.search");
				document.getElementById(id).focus();
			});
		}

		function validateMutantCellLines(row, index, id) {
			console.log("validateMutantCellLines = " + id + index);

			id = id + index;

			if (row.cellLine1.includes("%")) {
				return;
			}

			ValidateMutantCellLinesAPI.validate(vm.apiDomain.allelePairs[index], function(data) {
				if (data.error != null) {
					alert(data.message);
					vm.apiDomain.allelePairs[index].cellLine1 = "";
					vm.apiDomain.allelePairs[index].cellLine2 = "";
				} else {
					if (vm.apiDomain.allelePairs[index].processStatus == "x") {
						vm.apiDomain.allelePairs[index].processStatus = "u";
					};
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateMutantCellLinesAPI.validate");
			});
		}

		/////////////////////////////////////////////////////////////////////
		// allele pairs
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

			if (vm.apiDomain.allelePairs[index].alleleKey1 == ""
				|| vm.apiDomain.allelePairs[index].markerKey == ""
				|| vm.apiDomain.allelePairs[index].pairStateKey == ""
				|| vm.apiDomain.allelePairs[index].compoundKey == "") {
				return;
			}

			ValidateAlleleStateAPI.validate(vm.apiDomain.allelePairs[index], function(data) {
				if (data.error != null) {
					alert(data.message);
				} else {
					if (vm.apiDomain.allelePairs[index].processStatus == "x") {
						vm.apiDomain.allelePairs[index].processStatus = "u";
					};
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateAlleleStateAPI.validate");
			});
		}

		// add new allele pair row
		function addAllelePairRow() {

			if (vm.apiDomain.allelePairs == undefined) {
				vm.apiDomain.allelePairs = [];
			}

			var i = vm.apiDomain.allelePairs.length;

			vm.apiDomain.allelePairs[i] = {
				"processStatus": "c",
				"genotypeKey": vm.apiDomain.genotypeKey,
				"allelePairKey": "",
				"alleleKey1": "",
				"alleleSymbol1": "",
				"alleleKey2": "",
				"alleleSymbol2": "",
				"markerKey": "",
				"markerSymbol": "",
				"markerChromosome": "",
				"sequenceNum": i + 1,
				"pairStateKey": "",
				"compoundKey": "",
				"cellLineKey1": "",
				"cellLine1": "",
				"cellLineKey2": "",
				"cellLine2": "",
				"createdBy": "",
				"creation_date": "",
				"modifiedBy": "",
				"modification_date": ""
			}
		}		

		/////////////////////////////////////////////////////////////////////
		// image panes
		/////////////////////////////////////////////////////////////////////		
		
		// add new image pane row
		function addImagePaneRow() {

			if (vm.apiDomain.imagePaneAssocs == undefined) {
				vm.apiDomain.imagePaneAssocs = [];
			}

			var i = vm.apiDomain.imagePaneAssocs.length;

                        vm.apiDomain.imagePaneAssocs[i] = {
                                "processStatus": "c",
      				"assocKey": "",
      				"imagePaneKey": "",
      				"mgiTypeKey": "12",
      				"objectKey": "",
      				"isPrimary": "",
      				"figureLabel": "",
      				"mgiID": "",
      				"pixID": ""
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
			//console.log("addNotes");

			addNote(vm.apiDomain.generalNote, "General");
			addNote(vm.apiDomain.privateCuratorialNote, "Private Curatorial");
		}

		// DataSets
		
		// add new data sets row
		function addDataSetRow() {

			vm.dataSets = [];

                        vm.dataSets[0] = {
      				"refsKey": "",
      				"jnumid": ""
      				//"short_citation": ""
    			}
		}		

		// get data sets by genotype key
		function getDataSets() {
			console.log("getDataSets: " + vm.apiDomain.genotypeKey);

			GenotypeGetDataSetsAPI.query({key: vm.apiDomain.genotypeKey}, function(data) {
				vm.dataSets = data;
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: GenotypeGetDataSetsAPI.query");
			});
		}	
		
		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
		$scope.searchAccId = searchAccId;
		$scope.clear = clear;
		//$scope.create = createGenotype;
		$scope.modify = modifyGenotype;
		$scope.delete = deleteGenotype;
		$scope.changeAllelePairRow = changeAllelePairRow;
		$scope.addAllelePairRow = addAllelePairRow;
		$scope.selectAllelePair = selectAllelePair;
		$scope.addImagePaneRow = addImagePaneRow;

		// Data Sets
		$scope.getDataSets = getDataSets;

		// Validations
		$scope.validateAllele1 = validateAllele1;
		$scope.validateAllele2 = validateAllele2;
		$scope.validateMarker = validateMarker;
		$scope.validateJnum = validateJnum;
		$scope.validateStrain = validateStrain;
		$scope.validateMutantCellLines = validateMutantCellLines;

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

