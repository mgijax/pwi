(function() {
	'use strict';
	angular.module('pwi.allele').controller('AlleleController', AlleleController);

	function AlleleController(
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
			AlleleSearchAPI,
			AlleleGetAPI,
			AlleleUpdateAPI,
			AlleleTotalCountAPI,
			AlleleGetReferencesAPI,
			AlleleReferenceReportAPI,
			// global APIs
                        OrganismSearchDriverGeneAPI,
			ReferenceAssocTypeSearchAPI,
			ValidateJnumAPI,
			VocTermSearchAPI,
			ValidateMarkerAPI,
			ValidateMutantCellLineAPI,
			ValidateParentCellLineAPI,
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
		vm.selectedRefIndex = 0;
		vm.selectedCellLineIndex = 0;
                vm.selectedSynonymIndex = 0;
                vm.selectedSubtypeIndex = 0;
                vm.selectedMutationIndex = 0;
                vm.selectedDriverGeneIndex = 0;
		
		vm.allowCommit = true;

		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			resetData();
			refreshTotalCount();
			loadVocabs();
		}

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        	// mapped to 'Clear' button; called from init();  resets page
		function clear() {		
			resetData();
                        refreshTotalCount();
			setFocus();
		}		

		// mapped to query 'Search' button
		// default is to select first result
		function search() {				
			console.log(vm.apiDomain);
		
			pageScope.loadingStart();
			
			AlleleSearchAPI.search(vm.apiDomain, function(data) {
				vm.results = data;
				vm.selectedIndex = 0;
				if (vm.results.length > 0) {
					loadObject();
				}
				else {
					clear();
				}
				pageScope.loadingEnd();
				setFocus();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AlleleSearchAPI.search");
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
                        AlleleTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////
		
                // verify references
                function validateReferences() {
                        console.log("validateReferences()");

                        // at most 1 original referenced required
                        var hasOriginal = 0;
			for(var i=0;i<vm.apiDomain.refAssocs.length; i++) {
				if (vm.apiDomain.refAssocs[i].refAssocTypeKey == "1011") {
                                        hasOriginal += 1;
                                }
                        }

                        if(hasOriginal != 1) {
                                alert("At most one Original Reference is required.");
                                vm.allowCommit = false;
                                return;
                        }

                        // reference/mixed and Mixed (yes/not) must be in sync
                        var isMixed = vm.apiDomain.isMixed;
                        var hasMixed = false;
			for(var i=0;i<vm.apiDomain.refAssocs.length; i++) {
				if (vm.apiDomain.refAssocs[i].processStatus != "d"
                                        && vm.apiDomain.refAssocs[i].refAssocTypeKey == "1024") {
                                        hasMixed = true;
                                }
                        }
                        if(hasMixed) {
                                vm.apiDomain.isMixed = "1";
                        }
                        else {
                                vm.apiDomain.isMixed = "0";
                        }
                        if(isMixed == 1 && hasMixed == false) {
                                alert("Mixed Reference is required.");
                                vm.allowCommit = false;
                                return;
                        }
                        if(isMixed == 0 && hasMixed == true) {
                                if ($window.confirm("You are about to modify the Allele Mixed reference or status.\nAre you sure you want to modify this value?") == false) {
                                        vm.allowCommit = false;
                                        return;
                                }
                        }
                }

                // verify molecular mutation
                function validateMolecularMutation() {
                        console.log("validateMolecularMutation()");

                        // if Molecular Mutation = Other, then Molecular Notes are required.
                        
                        var hasNote = true;
			for(var i=0;i<vm.apiDomain.mutations.length; i++) {
				if (vm.apiDomain.mutations[i].mutationKey == "847105" 
			                && (vm.apiDomain.molecularNote.noteChunk == undefined || vm.apiDomain.molecularNote.noteChunk == "")) {
                                        hasNote = false;
                                        break;
                                }
                        }

                        if(hasNote == false) {
			        alert("If Molecular Mutation = Other, then Molecular Notes are required.");
                                vm.allowCommit = false;
                        }
                }

                // verify germline transmission/set defaults
                function validateGermLineTransmission() {
                        console.log("validateGermLineTranmission()");

                        // if Germ Line Transmission has not been selected
                        //      if the Mutant Cell Line = null/Not Specified then 
                        //              default = Not Applicable 
                        //      else 
                        //              default = Not Specified
                        
			if (vm.apiDomain.transmissionKey == "") {
			        for(var i=0;i<vm.apiDomain.mutantCellLineAssocs.length; i++) {
				        if (vm.apiDomain.mutantCellLineAssocs[i].mutantCellLine[0].cellLine == "Not Specified" 
                                                || vm.apiDomain.mutantCellLineAssocs[i].mutantCellLine[0].cellLine == "") {
                                                // Not Applicable
				                vm.apiDomain.transmissionKey = "3982955";
                                        }
                                        else {
                                                // Not Specified
				                vm.apiDomain.transmissionKey = "3982954";
                                        }
                                }
                        }
                }

        	// create allele
		function createAllele() {
			console.log("createAllele() -> AlleleCreateAPI()");
			vm.allowCommit = true;

			// verify if record selected
			if (vm.selectedIndex > 0) {
				alert("Cannot Add if a record is already selected.");
				vm.allowCommit = false;
			}

                        validateReferences();
                        validateMolecularMutation();
                        validateGermLineTransmission();

			if (vm.allowCommit){
				pageScope.loadingStart();

				AlleleCreateAPI.create(vm.apiDomain, function(data) {
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
						loadObject();
					}
					else {
						vm.apiDomain = data.items[0];
                				vm.selectedIndex = vm.results.length;
						vm.results[vm.selectedIndex] = [];
						vm.results[vm.selectedIndex].alleleKey = vm.apiDomain.alleleKey;
						loadObject();
						refreshTotalCount();
					}
					pageScope.loadingEnd();
				}, function(err) {
					pageScope.handleError(vm, "API ERROR: AlleleCreateAPI.create");
					pageScope.loadingEnd();
				});
			}
		}		

        	// modify allele
		function modifyAllele() {
			console.log("modifyAllele() -> AlleleUpdateAPI()");
			vm.allowCommit = true;

			// check if record selected
			if (vm.selectedIndex < 0) {
				alert("Cannot Modify if a record is not selected.");
				vm.allowCommit = false;
			}
			
                        validateReferences();
                        validateMolecularMutation();
                        validateGermLineTransmission();

			if (vm.allowCommit){
				pageScope.loadingStart();

				AlleleUpdateAPI.update(vm.apiDomain, function(data) {
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						loadObject();
					}
					pageScope.loadingEnd();
				}, function(err) {
					pageScope.handleError(vm, "API ERROR: AlleleUpdateAPI.update");
					pageScope.loadingEnd();
				});
			}
			else {
				loadObject();
				pageScope.loadingEnd();
			}
		}		
		
        	// delete allele
		function deleteAllele() {
			console.log("deleteAllele() -> AlleleDeleteAPI() : " + vm.selectedIndex);
			vm.allowCommit = true;

			// check if record selected
			if (vm.selectedIndex < 0) {
				alert("Cannot Delete if a record is not selected.");
				vm.allowCommit = false;
			}

			if (vm.allowCommit && $window.confirm("Are you sure you want to delete this record?")) {
			
				pageScope.loadingStart();

				AlleleDeleteAPI.delete({key: vm.apiDomain.alleleKey}, function(data) {
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
					pageScope.handleError(vm, "API ERROR: AlleleDeleteAPI.delete");
					pageScope.loadingEnd();
					setFocus();
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
			//setFocus();
		}
		
		
		/////////////////////////////////////////////////////////////////////
		// Utility methods
		/////////////////////////////////////////////////////////////////////
		
		// resets page data
		function resetData() {
			console.log("resetData()");

			vm.results = [];
			vm.selectedIndex = -1;
			vm.selectedRefIndex = 0;
			vm.total_count = 0;
                        vm.activeTab = 1;

			resetBoolean();
			resetAllele();
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");
			resetBoolean();
			resetAllele();
		}

		// reset booleans
	        function resetBoolean() {
			vm.hideErrorContents = true;
			vm.hideDetailClip = true;
			vm.hideGeneralNote = true;
			vm.hideMolecularNote = true;
			vm.hideNomenNote = true;
			vm.hideInducibleNote = true;
			vm.hideProidNote = true;
			vm.hideIkmcNote = true;
			vm.hideCreNote = true;
		}

		// resets allele data
		function resetAllele() {
			console.log("resetAllele()");
			vm.apiDomain = {};
			vm.apiDomain.alleleKey = "";	
			vm.apiDomain.symbol = "";	
			vm.apiDomain.name = "";	
			vm.apiDomain.accID = "";
			vm.apiDomain.alleleTypeKey;
			vm.apiDomain.alleleType;
			vm.apiDomain.alleleStatusKey;
			vm.apiDomain.alleleStatus;
			vm.apiDomain.inheritanceModeKey;
			vm.apiDomain.inheritanceMode;
			vm.apiDomain.transmissionKey;
			vm.apiDomain.transmission;
			vm.apiDomain.collectionKey;
			vm.apiDomain.collection;
                        vm.apiDomain.strainOfOriginKey;
                        vm.apiDomain.strainOfOrigin;
			vm.apiDomain.isWildType;
			vm.apiDomain.isExtinct;
			vm.apiDomain.isMixed;
			vm.apiDomain.markerKey;
			vm.apiDomain.markerSymbol;
			vm.apiDomain.markerStatusKey;
			vm.apiDomain.markerStatus;
			vm.apiDomain.refsKey;
			vm.apiDomain.jnumid;
			vm.apiDomain.short_citation;
			vm.apiDomain.alleleMarkerStatusKey;
			vm.apiDomain.alleleMarkerStatus;
			vm.apiDomain.detailClip;

			addOtherAccRow();
			addRefRows();
			addCellLineRow();
			addSynonymRow();
                        addSubtypeRow();
                        addMutationRow();
                        addDriverGeneRow();
			addNotes();
		}

		// load vocabularies
                function loadVocabs() {
                        console.log("loadVocabs()");

			vm.alleleStatusLookup = {};
			VocTermSearchAPI.search({"vocabKey":"37"}, function(data) { vm.alleleStatusLookup = data.items[0].terms});;

			vm.alleleTypeLookup = {};
			VocTermSearchAPI.search({"vocabKey":"38"}, function(data) { vm.alleleTypeLookup = data.items[0].terms});;

			vm.inheritanceLookup = {};
			VocTermSearchAPI.search({"vocabKey":"35"}, function(data) { vm.inheritanceLookup = data.items[0].terms});;

			vm.transmissionLookup = {};
			VocTermSearchAPI.search({"vocabKey":"61"}, function(data) { vm.transmissionLookup = data.items[0].terms});;

			vm.collectionLookup = {};
			VocTermSearchAPI.search({"vocabKey":"92"}, function(data) { vm.collectionLookup = data.items[0].terms});;

			vm.alleleMarkerStatusLookup = {};
			VocTermSearchAPI.search({"vocabKey":"73"}, function(data) { vm.alleleMarkerStatusLookup = data.items[0].terms});;

			vm.cellLineTypeLookup = {};
			VocTermSearchAPI.search({"vocabKey":"63"}, function(data) { vm.cellLineTypeLookup = data.items[0].terms});;

			vm.subtypeLookup = {};
			VocTermSearchAPI.search({"vocabKey":"93"}, function(data) { vm.subtypeLookup = data.items[0].terms});;

			vm.mutationLookup = {};
			VocTermSearchAPI.search({"vocabKey":"36"}, function(data) { vm.mutationLookup = data.items[0].terms});;

			vm.organismLookup = [];
			OrganismSearchDriverGeneAPI.search({}, function(data) { vm.organismLookup = data});;

                        vm.refAssocTypeLookup = [];
		        ReferenceAssocTypeSearchAPI.search({"mgiTypeKey":"11"}, function(data) { vm.refAssocTypeLookup = data.items});;

                        vm.yesnoLookup = [];
                        vm.yesnoLookup[0] = {
                                "termKey": "1",
                                "term": "Yes"
                        }
                        vm.yesnoLookup[1] = {
                                "termKey": "0",
                                "term": "No"
                        }

                        vm.otherAccLookup = [];
                        vm.otherAccLookup[0] = {
                                "termKey": "125",
                                "term": "KOMP Regeneron Project"
                        }
                        vm.otherAccLookup[1] = {
                                "termKey": "126",
                                "term": "KOMP CSD Project"
                        }
                        vm.otherAccLookup[2] = {
                                "termKey": "143",
                                "term": "NorCOMM Projects"
                        }
                        vm.otherAccLookup[3] = {
                                "termKey": "138",
                                "term": "EUCOMM Projects"
                        }
                        vm.otherAccLookup[4] = {
                                "termKey": "162",
                                "term": "Genentech"
                        }
                        vm.otherAccLookup[5] = {
                                "termKey": "166",
                                "term": "mirKO Project"
                        }
                }

                // set active tab
		function setActiveTab(tabIndex) {
                        console.log("tabIndex: " + tabIndex)
			vm.activeTab=tabIndex;			
                        console.log("activeTab: " + vm.activeTab)
		}

		// load a selected object from results
		function loadObject() {
			console.log("loadObject()");

			if(vm.results.length == 0) {
				return;
			}

			if(vm.selectedIndex < 0) {
				return;
			}

			AlleleGetAPI.get({ key: vm.results[vm.selectedIndex].alleleKey }, function(data) {
				vm.apiDomain = data;
                                selectRefRow(0);
                                selectCellLineRow(0);
                                selectSynonymRow(0);
				addOtherAccRow();
				addRefRows();
				addCellLineRow();
				addCellLineRow();
			        addSynonymRow();
                                addSubtypeRow();
                                addMutationRow();
                                addDriverGeneRow();
				addNotes();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AlleleGetAPI.get");
			});
		}	
		
		// when an object is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			removeSearchResultsItem(vm.apiDomain.alleleKey);

			// clear if now empty; otherwise, load next row
			if(vm.results.length == 0) {
				clear();
			}
			else {
				// adjust selected results index as needed, and load object
				if(vm.selectedIndex > vm.results.length -1) {
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
			input.focus(document.getElementById("symbol"));
		}

		/////////////////////////////////////////////////////////////////////
		// validating
		/////////////////////////////////////////////////////////////////////		
		
        	// validate jnum
		function validateJnum(row, index, id) {		
			console.log("validateJnum = " + id + index);
			console.log(row);

			id = id + index;

			if (row.jnumid == undefined || row.jnumid == "") {
				row.refsKey = "";
				row.jnumid = "";
				row.jnum = null;
				row.short_citation = "";
				return;
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

                // validate marker
		function validateMarker(row, index, id) {
			console.log("validateMarker = " + id + index);

			id = id + index;
			
			if (row.markerSymbol == undefined || row.markerSymbol == "") {
				row.markerKey = "";
				row.markerSymbol = "";
				return;
			}

			if (row.markerSymbol.includes("%")) {
				return;
			}

			var params = {};
			params.symbol = row.markerSymbol;

			ValidateMarkerAPI.search(params, function(data) {
				if (data.length == 0) {
				        if (row.alleleStatusKey == '847114') {
					    alert("Approved Allele Symbol must have an Approved Marker: " + row.markerSymbol);
                                        }
                                        else {
					    alert("Invalid Marker Symbol: " + row.markerSymbol);
                                        }
					document.getElementById(id).focus();
					row.markerKey = "";
					row.markerSymbol = "";
				} else {
					console.log(data);
					row.markerKey = data[0].markerKey;
					row.markerSymbol = data[0].symbol;
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateMarkerAPI.search");
				document.getElementById(id).focus();
				row.markerKey = "";
				row.markerSymbol = "";
			});
		}

        	// validate mutant cell line
                // row = mutantCellLineAssocs[0].mutantCellLine[0]
		function validateMutantCellLine(row, index, id) {		
			console.log("validateMutantCellLine = " + id + index);

			id = id + index;

			if (row.cellLine == "") {
				row.cellLineKey = "";
				row.cellLine = "";
      				row.cellLineTypeKey = "";
      				row.cellLineType = "";
      				row.strainKey = "";
      				row.strain = "";
                                row.derivation = {
                                        "derivationKey": "",
                                        "creatorKey": "",
                                        "creator": ""
                                }
                                vm.apiDomain.strainOfOriginKey = "";
                                vm.apiDomain.strainOfOrigin = "";
				return;
			}

                        if (row.cellLine.includes("%")) {
                                return;
                        }

			// json for mutation cellline search
			var params = {};
			params.cellLine = row.cellLine.trim();
			console.log(params);

			ValidateMutantCellLineAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Mutant Cell Line: " + params.cellLine);
					document.getElementById(id).focus();
					row.cellLineKey = "";
					row.cellLine = "";
      					row.cellLineTypeKey = "";
      					row.cellLineType = "";
      					row.strainKey = "";
      					row.strain = "";
                                        row.derivation = {
                                                "derivationKey": "",
                                                "creatorKey": "",
                                                "creator": ""
                                        }
                                        vm.apiDomain.strainOfOriginKey = "";
                                        vm.apiDomain.strainOfOrigin = "";
				} else {
					row.cellLineKey = data[0].cellLineKey;
					row.cellLine = data[0].cellLine;
      					row.cellLineTypeKey = data[0].cellLineTypeKey;
      					row.cellLineType = data[0].cellLineType;
      					row.strainKey = data[0].strainKey;
      					row.strain = data[0].strain;
      					row.derivation = data[0].derivation;
                                        vm.apiDomain.strainOfOriginKey = data[0].strainKey;
                                        vm.apiDomain.strainOfOrigin = data[0].strain;;
				}

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateMutantCellLineAPI.search");
				document.getElementById(id).focus();
				row.cellLineKey = "";
				row.cellLine = "";
      				row.cellLineTypeKey = "";
      				row.cellLineType = "";
      				row.strainKey = "";
      				row.strain = "";
                                row.derivation = {
                                        "derivationKey": "",
                                        "creatorKey": "",
                                        "creator": ""
                                }
                                vm.apiDomain.strainOfOriginKey = "";
                                vm.apiDomain.strainOfOrigin = "";
			});
		}		

        	// validate parent cell line
		function validateParentCellLine(row, id) {		
			console.log("validateParentCellLine = " + id);

			if (row.cellLine == "") {
      				row.cellLineKey = "";
      				row.cellLineTypeKey = "";
      				row.cellLineType = "";
      				row.strainKey = "";
      				row.strain = "";
				return;
			}

                        if (row.cellLine.includes("%")) {
                                return;
                        }

			// json for parent cellline search
			var params = {};
			params.cellLine = row.cellLine.trim();
			console.log(params);

			ValidateParentCellLineAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Parent Cell Line: " + params.cellLine);
					document.getElementById(id).focus();
      					row.cellLineKey = "";
      					row.cellLineTypeKey = "";
      					row.cellLineType = "";
      					row.strainKey = "";
      					row.strain = "";
				} else {
      					row.cellLine = data[0].cellLine;
      					row.cellLineKey = data[0].cellLineKey;
      					row.cellLineTypeKey = data[0].cellLineTypeKey;
      					row.cellLineType = data[0].cellLineType;
      					row.strainKey = data[0].strainKey;
      					row.strain = data[0].strain;
				}

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateParentCellLineAPI.search");
				document.getElementById(id).focus();
      				row.cellLineKey = "";
      				row.cellLineTypeKey = "";
      				row.cellLineType = "";
      				row.strainKey = "";
      				row.strain = "";
			});
		}		

		/////////////////////////////////////////////////////////////////////
		// other acc ids
		/////////////////////////////////////////////////////////////////////		
		
		// add new other acc id line row
		function addOtherAccRow() {

			if (vm.apiDomain.otherAccIDs == undefined) {
				vm.apiDomain.otherAccIDs = [];
			}

			var i = vm.apiDomain.otherAccIDs.length;

			if (i > 0) {
				return;
			}

			vm.apiDomain.otherAccIDs[i] = {
				"objectKey": vm.apiDomain.alleleKey,
				"logicaldbKey": "",
				"logicaldb": "",
				"accID": ""
			}
		}		

		// set current other acc id row
		function selectOtherAccRow(index) {
			console.log("selectOtherAccRow: " + index);

                        if (vm.apiDomain.otherAccIDs == null) {
				return;
			}

                        if (vm.apiDomain.otherAccIDs.length == 0) {
                               addOtherAccRow();
                        }

		}

		/////////////////////////////////////////////////////////////////////
		// references
		/////////////////////////////////////////////////////////////////////		
		
		// add new reference row
		function addRefRow(refAssocTypeKey) {

			if (vm.apiDomain.refAssocs == undefined) {
				vm.apiDomain.refAssocs = [];
			}

			var i = vm.apiDomain.refAssocs.length;

			var refAssocType;
			var allowOnlyOne;
			if (refAssocTypeKey == "1011") {
				refAssocType = "Original";
				allowOnlyOne = 1;
			}
			if (refAssocTypeKey == "1023") {
				refAssocType = "Transmission";
				allowOnlyOne = 0;
			}
			if (refAssocTypeKey == "1012") {
				refAssocType = "Molecular";
				allowOnlyOne = 0;
			}
			if (refAssocTypeKey == "1013") {
				refAssocType = "Indexed";
				allowOnlyOne = 0;
			}

			vm.apiDomain.refAssocs[i] = {
				"processStatus": "c",
      				"assocKey": "",
			       	"objectKey": vm.apiDomain.alleleKey,
      				"mgiTypeKey": "11",
      				"refAssocTypeKey": refAssocTypeKey,
      				"refAssocType": refAssocType,
      				"allowOnlyOne": allowOnlyOne,
				"refsKey": "",
			       	"jnumid": "",
				"short_citation": "",
				"createdBy": "",
				"creation_date": "",
				"modifiedBy": "",
				"modification_date": ""
			}
		}		

		// add this set of reference rows
		// original, transmission, molecular, indexed
		function addRefRows() {
			if (vm.apiDomain.refAssocs == undefined) {
				addRefRow("1011");
				addRefRow("1023");
				addRefRow("1012");
				addRefRow("1013");
			}
			else {
				addRefRow("1013");
			}
		}

		// if current reference row has changed
		function changeRefRow(index) {
			console.log("changeRefRow: " + index);

			vm.selectedRefIndex = index;

			if (vm.apiDomain.refAssocs[index] == null) {
				vm.selectedRefIndex = 0;
				return;
			}

			if (vm.apiDomain.refAssocs[index].processStatus == "x") {
				vm.apiDomain.refAssocs[index].processStatus = "u";
			};
		}

		// set current reference row
		function selectRefRow(index) {
			console.log("selectRefRow: " + index);
			vm.selectedRefIndex = index;

                        if (vm.apiDomain.refAssocs.length == 0) {
                               addRefRow("1013");
                        }

		}

		/////////////////////////////////////////////////////////////////////
		// mutant cell lines
		/////////////////////////////////////////////////////////////////////		
		
		// add new mutant cell line row
		function addCellLineRow() {

			if (vm.apiDomain.mutantCellLineAssocs == undefined) {
				vm.apiDomain.mutantCellLineAssocs = [];
			}

			var i = vm.apiDomain.mutantCellLineAssocs.length;

			vm.apiDomain.mutantCellLineAssocs[i] = {
				"processStatus": "c",
				"assocKey": "",
				"alleleKey": "",
				"modifiedBy": "",
				"modification_date": ""
			}

                        // mutant cellline(s)
                        vm.apiDomain.mutantCellLineAssocs[i].mutantCellLine = {
				"processStatus": "x",
				"cellLineKey": "",
				"cellLine": "",
				"isMutant": "",
				"cellLineTypeKey": "",
				"cellLineType": "",
				"strainKey": "",
				"strain": ""
                        }

                        // parent derivation
                        vm.apiDomain.mutantCellLineAssocs[i].mutantCellLine.derivation = {
                                "derivationKey": "",
                                "creatorKey": "",
                                "creator": ""
                        }

                        // parent cellline
                        vm.apiDomain.mutantCellLineAssocs[i].mutantCellLine.derivation.parentCellLine = {
				"cellLineKey": "",
				"cellLine": "",
				"isMutant": "",
				"cellLineTypeKey": "",
				"cellLineType": "",
				"strainKey": "",
				"strain": ""
                        }
		}		

		// if current mutant cell line row has changed
		function changeCellLineRow(index) {
			console.log("changeCellLineRow: " + index);

			vm.selectedCellLineIndex = index;

			if (vm.apiDomain.mutantCellLineAssocs[index] == null) {
				vm.selectedCellLineIndex = 0;
				return;
			}

			if (vm.apiDomain.mutantCellLineAssocs[index].processStatus == "x") {
				vm.apiDomain.mutantCellLineAssocs[index].processStatus = "u";
			};
		}

		// set current mutant cell line row
		function selectCellLineRow(index) {
			console.log("selectCellLineRow: " + index);
			vm.selectedCellLineIndex = index;

                        if (vm.apiDomain.mutantCellLineAssocs == null) {
				vm.selectedCellLineIndex = 0;
				return;
			}

                        if (vm.apiDomain.mutantCellLineAssocs.length == 0) {
                               addCellLineRow();
                        }
		}

		// if current parent cell line row 0 has changed
		function changeParentCellLineRow() {
			console.log("changeParentCellLineRow");

                        // TO-BE-DONE
                        // only change parent cell line if there is at most one mutant cell line
                        // count() length of vm.apiDomain.mutantCellLineAssocs where processStatus != "c"
                        // else send alert
                        
			if (vm.apiDomain.mutantCellLineAssocs[0].mutantCellLine.derivation.parentCellLine.processStatus == "x") {
				vm.apiDomain.mutantCellLineAssocs[0].mutantCellLine.derivation.processStatus = "u";
			};

                        selectedCellLineRow(0);
		}

		/////////////////////////////////////////////////////////////////////
		// synonyms
		/////////////////////////////////////////////////////////////////////		
		
		// add new synonyms row
		function addSynonymRow () {
			console.log("addSynonymRow");

			if (vm.apiDomain.synonyms == undefined) {
				vm.apiDomain.synonyms = [];
			}

			var i = vm.apiDomain.synonyms.length;

			vm.apiDomain.synonyms[i] = {
				"processStatus": "c",
				"objectKey":vm.apiDomain.alleleKey,
				"synonymKey":"",
				"synonym":"",
				"mgiTypeKey":"11",
				"synonymTypeKey":"1016",
				"refsKey":""
			};
		}

		// if current synonym row has changed
		function changeSynonymRow(index) {
                        console.log("changeSynonymRow: " + index);
			vm.selectedSynonymIndex = index;

                        if (vm.apiDomain.synonyms[index] == null) {
				vm.selectedSynonymIndex = 0;
                                return;
                        }

			if (vm.apiDomain.synonyms[index].processStatus != "d" && vm.apiDomain.synonyms[index].processStatus != "c") {
                                vm.apiDomain.synonyms[index].processStatus = "u";
				vm.allowModify = true;
                        };
		}

		// set current synonym row
		function selectSynonymRow(index) {
			console.log("selectSynonymRow: " + index);
			vm.selectedSynonymIndex = index;

                        if (vm.apiDomain.synonyms == null) {
				vm.selectedSynonymIndex = 0;
				return;
			}

                        if (vm.apiDomain.synonyms.length == 0) {
                               addSynonymsRow();
                        }
		}

		/////////////////////////////////////////////////////////////////////
		// subtypes
		/////////////////////////////////////////////////////////////////////		
		
		// add new subtypes row
		function addSubtypeRow () {
			console.log("addSubtypeRow");

			if (vm.apiDomain.subtypeAnnots == undefined) {
				vm.apiDomain.subtypeAnnots = [];
			}

			var i = vm.apiDomain.subtypeAnnots.length;

			vm.apiDomain.subtypeAnnots[i] = {
				"processStatus": "c",
				"annotTypeKey":"1014",
				"qualifierKey":"1614158",
				"objectKey":vm.apiDomain.alleleKey,
				"termKey":"",
				"term":""
			};
		}

		// if current subtype row has changed
		function changeSubtypeRow(index) {
                        console.log("changeSubtypeRow: " + index);
			vm.selectedSubtypeIndex = index;

                        if (vm.apiDomain.subtypeAnnots[index] == null) {
				vm.selectedSubtypeIndex = 0;
                                return;
                        }

			if (vm.apiDomain.subtypeAnnots[index].processStatus != "d" && vm.apiDomain.subtypeAnnots[index].processStatus != "c") {
                                vm.apiDomain.subtypeAnnots[index].processStatus = "u";
				vm.allowModify = true;
                        };
		}

		// set current subtype row
		function selectSubtypeRow(index) {
			console.log("selectSubtypeRow: " + index);
			vm.selectedSubtypeIndex = index;

                        if (vm.apiDomain.subtypeAnnots == null) {
				vm.selectedSubtypeIndex = 0;
				return;
			}

                        if (vm.apiDomain.subtypeAnnots.length == 0) {
                               addSubtypesRow();
                        }
		}

		/////////////////////////////////////////////////////////////////////
		// mutations
		/////////////////////////////////////////////////////////////////////		
		
		// add new mutations row
		function addMutationRow () {
			console.log("addMutationRow");

			if (vm.apiDomain.mutations == undefined) {
				vm.apiDomain.mutations = [];
			}

			var i = vm.apiDomain.mutations.length;

			vm.apiDomain.mutations[i] = {
				"processStatus": "c",
				"alleleKey":vm.apiDomain.alleleKey,
				"mutationKey":"",
				"mutation":""
			};
		}

		// if current mutations row has changed
		function changeMutationRow(index) {
                        console.log("changeMutationRow: " + index);
			vm.selectedMutationIndex = index;

                        if (vm.apiDomain.mutations[index] == null) {
				vm.selectedMutationIndex = 0;
                                return;
                        }

			if (vm.apiDomain.mutations[index].processStatus != "d" && vm.apiDomain.mutations[index].processStatus != "c") {
                                vm.apiDomain.mutations[index].processStatus = "u";
				vm.allowModify = true;
                        };
		}

		// set current mutations row
		function selectMutationRow(index) {
			console.log("selectMutationRow: " + index);
			vm.selectedMutationIndex = index;

                        if (vm.apiDomain.mutations == null) {
				vm.selectedMutationIndex = 0;
				return;
			}

                        if (vm.apiDomain.mutations.length == 0) {
                               addMutationsRow();
                        }
		}

		/////////////////////////////////////////////////////////////////////
		// driverGenes
		/////////////////////////////////////////////////////////////////////		
		
		// add new driverGenes row
		function addDriverGeneRow () {
			console.log("addDriverGeneRow");

			if (vm.apiDomain.driverGenes == undefined) {
				vm.apiDomain.driverGenes = [];
			}

			var i = vm.apiDomain.driverGenes.length;

			vm.apiDomain.driverGenes[i] = {
				"processStatus": "c",
				"relationshipKey":"",
				"alleleKey":vm.apiDomain.alleleKey,
				"markerKey":"",
				"organismKey":"",
				"markerSymbol":"",
				"commonname":""
			};
		}

		// if current driver gene row has changed
		function changeDriverGeneRow(index) {
                        console.log("changeDriverGeneRow: " + index);
			vm.selectedDriverGeneIndex = index;

                        if (vm.apiDomain.driverGenes[index] == null) {
				vm.selectedDriverGeneIndex = 0;
                                return;
                        }

			if (vm.apiDomain.driverGenes[index].processStatus != "d" && vm.apiDomain.driverGenes[index].processStatus != "c") {
                                vm.apiDomain.driverGenes[index].processStatus = "u";
				vm.allowModify = true;
                        };
		}

		// set current driver gene row
		function selectDriverGeneRow(index) {
			console.log("selectDriverGeneRow: " + index);
			vm.selectedDriverGeneIndex = index;

                        if (vm.apiDomain.driverGenes == null) {
				vm.selectedDriverGeneIndex = 0;
				return;
			}

                        if (vm.apiDomain.driverGenes.length == 0) {
                               addDriverGenesRow();
                        }
		}

		/////////////////////////////////////////////////////////////////////
		// notes
		/////////////////////////////////////////////////////////////////////		
		
		// Hide/Show note sections
		function hideShowDetailClip() {
			vm.hideDetailClip = !vm.hideDetailClip;
		}
		function hideShowGeneralNote() {
			vm.hideGeneralNote = !vm.hideGeneralNote;
		}
		function hideShowMolecularNote() {
			vm.hideMolecularNote = !vm.hideMolecularNote;
		}
		function hideShowNomenNote() {
			vm.hideNomenNote = !vm.hideNomenNote;
		}
		function hideShowInducibleNote() {
			vm.hideInducibleNote = !vm.hideInducibleNote;
		}
		function hideShowProidNote() {
			vm.hideProidNote = !vm.hideProidNote;
		}
		function hideShowIkmcNote() {
			vm.hideIkmcNote = !vm.hideIkmcNote;
		}
		function hideShowCreNote() {
			vm.hideCreNote = !vm.hideCreNote;
		}

		// add new note row
		function addNote(note, noteType) {
			console.log("addNote:" + note);

			if (note != null) { return; }

			var noteTypeKey = "";

			if (noteType == "General") {
				noteTypeKey = "1020";
			}
			if (noteType == "Molecular") {
				noteTypeKey = "1021";
			}
			if (noteType == "Nomenclature") {
				noteTypeKey = "1022";
			}
			if (noteType == "Inducible") {
				noteTypeKey = "1032";
			}
			if (noteType == "Proid") {
				noteTypeKey = "1036";
			}
			if (noteType == "Ikmc") {
				noteTypeKey = "1041";
			}
			if (noteType == "Cre") {
				noteTypeKey = "1040";
			}

			note = {
				"noteKey": "",
				"objectKey": vm.apiDomain.alleleKey,
				"mgiTypeKey": "11",
				"noteTypeKey": noteTypeKey,
				"noteChunk": ""
			}

			if (noteType == "General") {
				vm.apiDomain.generalNote = note;
			}
			if (noteType == "Molecular") {
				vm.apiDomain.molecularNote = note;
			}
			if (noteType == "Nomenclature") {
				vm.apiDomain.nomenNote = note;
			}
			if (noteType == "Inducible") {
				vm.apiDomain.inducibleNote = note;
			}
			if (noteType == "Proid") {
				vm.apiDomain.proidNote = note;
			}
			if (noteType == "Ikmc") {
				vm.apiDomain.ikmcNote = note;
			}
			if (noteType == "Cre") {
				vm.apiDomain.creNote = note;
			}
		}

		function addNotes() {
			console.log("addNotes");

			addNote(vm.apiDomain.generalNote, "General");
			addNote(vm.apiDomain.molecularNote, "Molecular");
			addNote(vm.apiDomain.nomenNote, "Nomenclature");
			addNote(vm.apiDomain.inducibleNote, "Inducible");
			addNote(vm.apiDomain.proidNote, "Proid");
			addNote(vm.apiDomain.ikmcNote, "Ikmc");
			addNote(vm.apiDomain.creNote, "Cre");
		}

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
		$scope.clear = clear;
		$scope.create = createAllele;
		$scope.modify = modifyAllele;
		$scope.delete = deleteAllele;
		$scope.addRefRow = addRefRow;
		$scope.changeRefRow = changeRefRow;
		$scope.selectRefRow = selectRefRow;
		$scope.addCellLineRow = addCellLineRow;
		$scope.changeCellLineRow = changeCellLineRow;
		$scope.changeParentCellLineRow = changeParentCellLineRow;
		$scope.selectCellLineRow = selectCellLineRow;
		$scope.addSynonymRow = addSynonymRow;
		$scope.changeSynonymRow = changeSynonymRow;
		$scope.selectSynonymRow = selectSynonymRow;
		$scope.addSubtypeRow = addSubtypeRow;
		$scope.changeSubtypeRow = changeSubtypeRow;
		$scope.selectSubtypeRow = selectSubtypeRow;
		$scope.addMutationRow = addMutationRow;
		$scope.changeMutationRow = changeMutationRow;
		$scope.selectMutationRow = selectMutationRow;
		$scope.addDriverGeneRow = addDriverGeneRow;
		$scope.changeDriverGeneRow = changeDriverGeneRow;
		$scope.selectDriverGeneRow = selectDriverGeneRow;

                // ActiveTab
                $scope.setActiveTab = setActiveTab;

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

		// Note Buttons
		$scope.hideShowDetailClip = hideShowDetailClip;
		$scope.hideShowGeneralNote = hideShowGeneralNote;
		$scope.hideShowMolecularNote = hideShowMolecularNote;
		$scope.hideShowNomenNote = hideShowNomenNote;
		$scope.hideShowInducibleNote = hideShowInducibleNote;
		$scope.hideShowCreNote = hideShowCreNote;
		$scope.hideShowIkmcNote = hideShowIkmcNote;
		$scope.hideShowProidNote = hideShowProidNote;

		// other functions: buttons, onBlurs and onChanges
		$scope.selectResult = selectResult;
		$scope.validateJnum = validateJnum;
		$scope.validateMarker = validateMarker;
		$scope.validateMutantCellLine = validateMutantCellLine;
		$scope.validateParentCellLine = validateParentCellLine;
		
		// global shortcuts
		$scope.KclearAll = function() { $scope.clear(); $scope.$apply(); }
		$scope.Ksearch = function() { $scope.search(); $scope.$apply(); }
		$scope.Kfirst = function() { $scope.firstSummaryObject(); $scope.$apply(); }
		$scope.Knext = function() { $scope.nextSummaryObject(); $scope.$apply(); }
		$scope.Kprev = function() { $scope.prevSummaryObject(); $scope.$apply(); }
		$scope.Klast = function() { $scope.lastSummaryObject(); $scope.$apply(); }
		$scope.Kmodify = function() { $scope.modify(); $scope.$apply(); }

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

