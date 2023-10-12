(function() {
	'use strict';
	angular.module('pwi.mutantcellline').controller('MutantCellLineController', MutantCellLineController);

	function MutantCellLineController(
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
			MutantCellLineSearchAPI,
			MutantCellLineGetAPI,
			MutantCellLineCreateAPI,
			MutantCellLineUpdateAPI,
			MutantCellLineDeleteAPI,
			MutantCellLineTotalCountAPI,
                        ParentCellLineSearchAPI,
                        AlleleGetByMCLAPI,
                        DerivationSearchMCLAPI,
                        LogicalDBSearchMCLAPI,
			// global APIs
			ValidateParentCellLineAPI,
			ValidateStrainAPI,
                        ValidateTermAPI,
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
                vm.selectedParentCellLineIndex = -1;
                vm.selectedDerivationIndex = -1;
                vm.selectedVectorIndex = -1;
                vm.selectedAccIndex = 0;
		
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
			
			MutantCellLineSearchAPI.search(vm.apiDomain, function(data) {
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
				pageScope.handleError(vm, "API ERROR: MutantCellLineSearchAPI.search");
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
                        MutantCellLineTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////
		
        	// create mutant cell line
		function create() {
			console.log("create()");

			// verify if record selected
                        if (vm.apiDomain.cellLineKey != null && vm.apiDomain.cellLineKey != "") {
				alert("Cannot Add if a record is already selected.");
                                return;
			}

                        // required : Cell Line
                        if (vm.apiDomain.cellLine == "" || vm.apiDomain.cellLine == null) {
				alert("Cell Line required.");
                                return;
                        }

                        // required : Derivation
                        if (vm.apiDomain.derivation.derivationKey == "") {
				alert("No derivation exists for that creator/PCL/vector. Please select from existing derivations or add the desired derivation in the derivation module before adding the MCL.");
                                return;
                        }

			console.log("create() -> MutantCellLineCreateAPI()");
			pageScope.loadingStart();

			MutantCellLineCreateAPI.create(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					vm.apiDomain = data.items[0];
                                        vm.selectedIndex = vm.results.length;
                                        vm.results[vm.selectedIndex] = [];
                                        vm.results[vm.selectedIndex].cellLineKey = vm.apiDomain.cellLineKey;
                                        vm.results[vm.selectedIndex].cellLine = vm.apiDomain.cellLine;
					loadObject();
					refreshTotalCount();
				}
				pageScope.loadingEnd();
                                setFocus();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: MutantCellLineCreateAPI.create");
				pageScope.loadingEnd();
                                setFocus();
			});
		}		

        	// modify mutant cell line
		function modify() {
			console.log("modify() -> MutantCellLineUpdateAPI()");

			// check if record selected
			if (vm.selectedIndex < 0) {
				alert("Cannot Modify if a record is not selected.");
				return;
			}
			
			pageScope.loadingStart();
                        vm.apiDomain.processStatus = "u";

			MutantCellLineUpdateAPI.update(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
					loadObject();
				}
				else {
					loadObject();
				}
				pageScope.loadingEnd();
                                setFocus();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: MutantCellLineUpdateAPI.update");
				pageScope.loadingEnd();
                                setFocus();
			});
		}		
		
        	// delete allele
		function deleteIt() {
			console.log("deleteIt() -> MutantCellLineDeleteAPI() : " + vm.selectedIndex);

			// check if record selected
			if (vm.selectedIndex < 0) {
				alert("Cannot Delete if a record is not selected.");
				return;
			}

			if (vm.apiDomain.alleleSymbols != null) {
			        if (vm.apiDomain.alleleSymbols.length > 0) {
				        alert("MCL is associated with an allele and cannot be deleted.");
				        return;
			        }
                        }

			if ($window.confirm("Are you sure you want to delete this record?")) {
			
				pageScope.loadingStart();

				MutantCellLineDeleteAPI.delete({key: vm.apiDomain.cellLineKey}, function(data) {
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
					pageScope.handleError(vm, "API ERROR: MutantCellLineDeleteAPI.delete");
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
                        vm.selectedAccIndex = 0;
			vm.total_count = 0;
                        loadEmptyObject();
			resetBoolean();
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");
			resetBoolean();
                        vm.apiDomain.processStatus = "c";
                        vm.apiDomain.cellLineKey = "";
		}

		// reset booleans
	        function resetBoolean() {
			vm.hideErrorContents = true;
		}

		// load vocabularies
                function loadVocabs() {
                        console.log("loadVocabs()");

                        vm.creatorLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"62"}, function(data) { vm.creatorLookup = data.items[0].terms});;

                        vm.cellLineTypeLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"63"}, function(data) { vm.cellLineTypeLookup = data.items[0].terms});;

                        vm.derivationTypeLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"38"}, function(data) { vm.derivationTypeLookup = data.items[0].terms});;

                        vm.vectorTypeLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"64"}, function(data) { vm.vectorTypeLookup = data.items[0].terms});;

			vm.derivationLookup = [];
                        DerivationSearchMCLAPI.search({}, function(data) { vm.derivationLookup = data;});;

			vm.parentCellLineLookup = [];
			ParentCellLineSearchAPI.search({}, function(data) { vm.parentCellLineLookup = data});;

			vm.vectorLookup = [];
                        VocTermSearchAPI.search({"vocabKey":"72"}, function(data) { vm.vectorLookup = data.items[0].terms});;

			vm.logicaldbLookup = [];
			LogicalDBSearchMCLAPI.search({}, function(data) { vm.logicaldbLookup = data});;
                }

		// load empty oject
		function loadEmptyObject() {
			console.log("loadEmptyObject()");

			MutantCellLineGetAPI.get({ key: "-999" }, function(data) {
				vm.apiDomain = data;
                                vm.apiDomain.processStatus = "c";
                                vm.apiDomain.alleleSymbols = "";
                                vm.apiDomain.isMutant = "1";

                                // parent derivation
                                vm.apiDomain.derivation = {
                                        "derivationKey": "",
                                        "creatorKey": "",
                                        "creator": "",
                                        "vectorKey": "",
                                        "vector": ""
                                }

                                // parent cellline
                                vm.apiDomain.derivation.parentCellLine = {
				        "cellLineKey": "",
				        "cellLine": "",
				        "isMutant": "0",
				        "cellLineTypeKey": "",
				        "cellLineType": "",
				        "strainKey": "",
				        "strain": ""
                                }
                                
                                // editAccessionIds
                                vm.apiDomain.editAccessionIds = [];
                                vm.apiDomain.editAccessionIds[0] = {
					"processStatus": "c",
					"objectKey":"",
					"mgiTypeKey":"28",
					"logicaldbKey":"",
			                "accID":""
                                }
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: MutantCellLineGetAPI.get");
			});
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

			MutantCellLineGetAPI.get({ key: vm.results[vm.selectedIndex].cellLineKey }, function(data) {
				vm.apiDomain = data;
                                selectAccRow(0);
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: MutantCellLineGetAPI.get");
			});


			AlleleGetByMCLAPI.search(vm.results[vm.selectedIndex].cellLineKey, function(data) {
			        for(var i=0;i<data.length; i++) {
                                        if(i==0) {
                                                vm.apiDomain.alleleSymbols = data[i].symbol
                                        }
                                        else {
                                                vm.apiDomain.alleleSymbols = vm.apiDomain.alleleSymbols + ',' + data[i].symbol
                                        }
                                }
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AlleleGetByMCLAPI.get");
			});
		}	
		
		// when an object is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			removeSearchResultsItem(vm.apiDomain.cellLineKey);

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
				if (vm.results[i].cellLineKey == keyToRemove) {
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
                                document.getElementById("cellLine").focus();
                        }, (200));
		}

		/////////////////////////////////////////////////////////////////////
		// validating
		/////////////////////////////////////////////////////////////////////		
		
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

		// validate strain
		function validateStrain(id) {
			console.log("validateStrain()");

			if (vm.apiDomain.derivation.parentCellLine.strain == undefined || vm.apiDomain.derivation.parentCellLine.strain == "") {
                                // cannot set default here/due to blur
				//vm.apiDomain.strain = "Not Specified";
                                //vm.apiDomain.derivation.parentCellLine.strain = "Not Specified";
				vm.apiDomain.strainKey = "";
				vm.apiDomain.strain = "";
                                vm.apiDomain.derivation.parentCellLine.strainKey = "";
                                return;
			}

                        if (vm.apiDomain.derivation.parentCellLine.strain.includes("%")) {
				vm.apiDomain.strainKey = "";
				vm.apiDomain.strain = "";
                                vm.apiDomain.derivation.parentCellLine.strainKey = "";
                                return;
                        }

			console.log("validateStrain(): " + vm.apiDomain.derivation.parentCellLine.strain);
			ValidateStrainAPI.search({strain: vm.apiDomain.derivation.parentCellLine.strain}, function(data) {
				if (data.length == 0) {
					alert("Invalid Strain");
					vm.apiDomain.strainKey = "";
					vm.apiDomain.strain = "";
                                        vm.apiDomain.derivation.parentCellLine.strainKey = "";
                                        vm.apiDomain.derivation.parentCellLine.strain = "";
					document.getElementById(id).focus();
				} else {
					if (data[0].isPrivate == "1") {
						alert("This value is designated as 'private' and cannot be used: " + vm.apiDomain.strain);
						vm.apiDomain.strainKey = "";
						vm.apiDomain.strain = "";
                                                vm.apiDomain.derivation.parentCellLine.strainKey = "";
                                                vm.apiDomain.derivation.parentCellLine.strain = "";
						document.getElementById(id).focus();
					}
					else {
						vm.apiDomain.strainKey = data[0].strainKey;
						vm.apiDomain.strain = data[0].strain;
                                                vm.apiDomain.derivation.parentCellLine.strainKey = data[0].strainKey;
                                                vm.apiDomain.derivation.parentCellLine.strain = data[0].strain;
					}
				}

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateStrainAPI.search");
				document.getElementById(id).focus();
			});
		}

        	// validate vector name
		function validateVectorName(id) {		
			console.log("validateVectorName(): " + id);

			if (vm.apiDomain.derivation.vector == undefined || vm.apiDomain.derivation.vector == "") {
                                // cannot set default here/due to blur
                                //vm.apiDomain.derivation.vector = "Not Specified";
                                vm.apiDomain.derivation.vectorKey = "";
                                return;
			}

                        if (vm.apiDomain.derivation.vector.includes("%")) {
                                vm.apiDomain.derivation.vectorKey = "";
                                return;
                        }

			// json for term search
			var params = {};
			params.vocabKey = "72";
			params.term = vm.apiDomain.derivation.vector;

			console.log("validateVector(): " + vm.apiDomain.derivation.parentCellLine.strain);
			ValidateTermAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Vector Name");
					document.getElementById(id).focus();
                                        vm.apiDomain.derivation.vectorKey = "";
                                        vm.apiDomain.derivation.vector = "";
				} else {
					vm.apiDomain.derivation.vectorKey = data[0].termKey;
					vm.apiDomain.derivation.vector = data[0].term;
				}

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateTermAPI.search");
				document.getElementById(id).focus();
                                vm.apiDomain.derivation.vectorKey = "";
                                vm.apiDomain.derivation.vector = "";
			});
		}		

		/////////////////////////////////////////////////////////////////////
		// lookups
		/////////////////////////////////////////////////////////////////////		
                
		// selected parent cell line row
		function selectParentCellLine(index) {
			console.log("selectParentCellLine(): " + index);
			vm.selectedParentCellLineIndex = index;
                        vm.apiDomain.derivation.parentCellLine = vm.parentCellLineLookup[vm.selectedParentCellLineIndex];
		}		

		// selected derivation row
		function selectDerivation(index) {
			console.log("selectDerivation(): " + index);
			vm.selectedDerivationIndex = index;
                        vm.apiDomain.derivation = vm.derivationLookup[vm.selectedDerivationIndex];
			vm.apiDomain.cellLineTypeKey = vm.apiDomain.derivation.parentCellLine.cellLineTypeKey;
	                vm.apiDomain.cellLineType = vm.apiDomain.derivation.parentCellLine.cellLineType;
			vm.apiDomain.strainKey = vm.apiDomain.derivation.parentCellLine.strainKey;
	                vm.apiDomain.strain = vm.apiDomain.derivation.parentCellLine.strain;
		}		

		// selected vector row
		function selectVector(index) {
			console.log("selectVector(): " + index);
			vm.selectedVectorIndex = index;
                        vm.apiDomain.derivation.vectorKey = vm.vectorLookup[vm.selectedVectorIndex].termKey;
                        vm.apiDomain.derivation.vector = vm.vectorLookup[vm.selectedVectorIndex].term;
		}		

		// edit accession ids

		function addAccRow() {
			console.log("addAccRow()");

			if (vm.apiDomain.editAccessionIds == undefined) {
				vm.apiDomain.editAccessionIds = [];
			}

			var i = vm.apiDomain.editAccessionIds.length;

			vm.apiDomain.editAccessionIds[i] = {
				"processStatus": "c",
				"mgiTypeKey":"28",
				"objectKey": vm.apiDomain.cellLineKey,
				"logicaldbKey": "",
				"accID": ""
			}
		}		

		function changeAccRow(index) {
			console.log("changeAccRow: " + index);

			vm.selectedAccIndex = index;

			if (vm.apiDomain.editAccessionIds[index] == null) {
				vm.selectedAccIndex = 0;
				return;
			}

			if (vm.apiDomain.editAccessionIds[index].processStatus == "x") {
				vm.apiDomain.editAccessionIds[index].processStatus = "u";
			};
		}
		
		function selectAccRow(index) {
			console.log("selectAccRow: " + index);
                        vm.selectedAccIndex = index;

			if (vm.apiDomain.editAccessionIds == undefined) {
				vm.apiDomain.editAccessionIds = [];
			}

                        if (vm.apiDomain.editAccessionIds.length == 0) {
                               addAccRow();
                        }
		}

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
		$scope.clear = clear;
		$scope.create = create;
		$scope.modify = modify;
		$scope.delete = deleteIt;

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

		// other functions: buttons, onBlurs and onChanges
		$scope.selectResult = selectResult;
                $scope.selectParentCellLine = selectParentCellLine;
                $scope.selectDerivation = selectDerivation;
                $scope.selectVector = selectVector;
		$scope.validateParentCellLine = validateParentCellLine;
		$scope.validateStrain = validateStrain;
		$scope.validateVectorName = validateVectorName;
		
		// Edit-Accession
		$scope.addAccRow = addAccRow;
		$scope.changeAccRow = changeAccRow;
		$scope.selectAccRow = selectAccRow;

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

