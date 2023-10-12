(function() {
	'use strict';
	angular.module('pwi.clonelib').controller('CloneLibController', CloneLibController);

	function CloneLibController(
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
			CloneLibSearchAPI,
			CloneLibGetAPI,
			CloneLibCreateAPI,
			CloneLibUpdateAPI,
			CloneLibDeleteAPI,
			CloneLibTotalCountAPI,
			StrainCreateAPI,
			TissueCreateAPI,
			CellLineCreateAPI,
                        LogicalDBSearchAPI,
			// global APIs
                        OrganismSearchProbeAPI,
                        StrainListProbeAntigenAPI,
                        TissueListAPI,
			ValidateJnumAPI,
                        ValidateStrainAPI,
                        ValidateTissueAPI,
                        ValidateTermAPI,
			VocTermSearchAPI,
                        VocTermListAPI,
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
		vm.selectedAccIndex = 0;
		
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			resetData();
			refreshTotalCount();
			loadVocabs();
                        setFocus();
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
			
                        if (vm.apiDomain.name == null || vm.apiDomain.name == "") {
                                vm.apiDomain.name = "%";
                        }

			CloneLibSearchAPI.search(vm.apiDomain, function(data) {
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
				pageScope.handleError(vm, "API ERROR: CloneLibSearchAPI.search");
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
			resetDataDeselect();
			setFocus();
		}
	
		// refresh the total count
                function refreshTotalCount() {
                        CloneLibTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////
		
        	// create
		function create() {
			console.log("create()");

			// verify if record selected
                        if (vm.apiDomain.sourceKey != null && vm.apiDomain.sourceKey != "") {
				alert("Cannot Add if a record is already selected.");
                                return;
			}

			if (vm.apiDomain.name == null || vm.apiDomain.name == "") {
				alert("Required Field : Name");
                                return;
			}

			console.log("create() -> CloneLibCreateAPI()");
			pageScope.loadingStart();

			CloneLibCreateAPI.create(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					vm.apiDomain = data.items[0];
                                        vm.selectedIndex = vm.results.length;
                                        vm.results[vm.selectedIndex] = [];
                                        vm.results[vm.selectedIndex].sourceKey = vm.apiDomain.sourceKey;
					vm.results[vm.selectedIndex].name = vm.apiDomain.namel;
					loadObject();
					refreshTotalCount();
				}
				pageScope.loadingEnd();
                                setFocus();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: CloneLibCreateAPI.create");
				pageScope.loadingEnd();
                                setFocus();
			});
		}		

        	// modify
		function modify() {
			console.log("modify() -> CloneLibUpdateAPI()");

			// check if record selected
			if(vm.selectedIndex < 0) {
				alert("Cannot Modify if a record is not selected.");
                                return;
			}
			
			if (vm.apiDomain.name == null || vm.apiDomain.name == "") {
				alert("Required Field : Name");
                                return;
			}

			pageScope.loadingStart();
			CloneLibUpdateAPI.update(vm.apiDomain, function(data) {
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
				pageScope.handleError(vm, "API ERROR: CloneLibUpdateAPI.update");
				pageScope.loadingEnd();
                                       setFocus();
			});
		}		
		
        	// delete
		function deleteIt() {
			console.log("deleteIt() -> CloneLibDeleteAPI() : " + vm.selectedIndex);

			// check if record selected
			if (vm.selectedIndex < 0) {
				alert("Cannot Delete if a record is not selected.");
				return;
			}

			if ($window.confirm("Are you sure you want to delete this record?")) {
			
				pageScope.loadingStart();

				CloneLibDeleteAPI.delete({key: vm.apiDomain.sourceKey}, function(data) {
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
					pageScope.handleError(vm, "API ERROR: CloneLibDeleteAPI.delete");
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
			setFocus();
		}
		
		
		/////////////////////////////////////////////////////////////////////
		// Utility methods
		/////////////////////////////////////////////////////////////////////
		
		// resets page data
		function resetData() {
			console.log("resetData()");

			vm.selectedIndex = -1;
		        vm.selectedAccIndex = 0;

			vm.results = [];
			vm.selectedIndex = -1;
			vm.selectedAccIndex = 0;
			vm.apiDomain = {};
                        vm.apiDomain.sourceKey = "";
                        vm.apiDomain.name = "";
                        vm.apiDomain.description = "";
                        vm.apiDomain.age = "";
                        vm.apiDomain.agePrefix = "";
                        vm.apiDomain.ageStage = "";
                        vm.apiDomain.segmentTypeKey = "";
                        vm.apiDomain.segmentType = "";
                        vm.apiDomain.vectorKey = "";
                        vm.apiDomain.vector = "";
                        vm.apiDomain.organismKey = "";
                        vm.apiDomain.organism = "";
                        vm.apiDomain.strainKey = "";
                        vm.apiDomain.strain = "";
                        vm.apiDomain.tissueKey = "";
                        vm.apiDomain.tissue = "";
                        vm.apiDomain.genderKey = "";
                        vm.apiDomain.gender = "";
                        vm.apiDomain.cellLineKey = "";
                        vm.apiDomain.cellLine = "";
                        vm.apiDomain.createdByKey = "";
                        vm.apiDomain.createdBy = "";
                        vm.apiDomain.modifiedByKey = "";
                        vm.apiDomain.modifiedBy = "";
                        vm.apiDomain.creation_date = "";
                        vm.apiDomain.modification_date = "";
                        addAccRow(0);
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");

			vm.selectedIndex = -1;
		        vm.selectedAccIndex = 0;

                        vm.apiDomain.sourceKey = "";
                        vm.apiDomain.name = "";
                        vm.apiDomain.description = "";
                        vm.apiDomain.age = "";
                        vm.apiDomain.agePrefix = "";
                        vm.apiDomain.ageStage = "";
                        vm.apiDomain.segmentTypeKey = "";
                        vm.apiDomain.segmentType = "";
                        vm.apiDomain.vectorKey = "";
                        vm.apiDomain.vector = "";
                        vm.apiDomain.organismKey = "";
                        vm.apiDomain.organism = "";
                        vm.apiDomain.strainKey = "";
                        vm.apiDomain.strain = "";
                        vm.apiDomain.tissueKey = "";
                        vm.apiDomain.tissue = "";
                        vm.apiDomain.genderKey = "";
                        vm.apiDomain.gender = "";
                        vm.apiDomain.cellLineKey = "";
                        vm.apiDomain.cellLine = "";
                        vm.apiDomain.createdByKey = "";
                        vm.apiDomain.createdBy = "";
                        vm.apiDomain.modifiedByKey = "";
                        vm.apiDomain.modifiedBy = "";
                        vm.apiDomain.creation_date = "";
                        vm.apiDomain.modification_date = "";
                        addAccRow(0);
		}

		// load vocabularies
                function loadVocabs() {
                        console.log("loadVocabs()");

			vm.segmentLookup = {};
			VocTermSearchAPI.search({"vocabKey":"10"}, function(data) { vm.segmentLookup = data.items[0].terms});;

			vm.vectorLookup = {};
			VocTermSearchAPI.search({"vocabKey":"24"}, function(data) { vm.vectorLookup = data.items[0].terms});;

			vm.organismLookup = [];
			OrganismSearchProbeAPI.search({}, function(data) { vm.organismLookup = data});;

                        vm.ageLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"147"}, function(data) { vm.ageLookup = data.items[0].terms});;

                        vm.genderLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"17"}, function(data) { vm.genderLookup = data.items[0].terms});;

                        vm.molsegLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"150"}, function(data) { vm.molsegLookup = data.items[0].terms});;

			vm.logicaldbLookup = [];
			LogicalDBSearchAPI.search({}, function(data) { vm.logicaldbLookup = data});;

                        vm.tissueLookup = {};
                        TissueListAPI.get({}, function(data) { vm.tissueLookup = data.items; 
                                $q.all([
                                FindElement.byId("tissue"),
                                ]).then(function(elements) {
                                        pageScope.autocompleteBeginning(angular.element(elements[0]), vm.tissueLookup);
                                });
                        }); 

			vm.cellLineLookup = {};
			VocTermListAPI.search({"vocabKey":"18"}, function(data) { vm.cellLineLookup = data.items;
                                $q.all([
                                FindElement.byId("cellLine"),
                                ]).then(function(elements) {
                                        pageScope.autocompleteBeginning(angular.element(elements[0]), vm.cellLineLookup);
                                });
                        });

                        vm.strainLookup = {};
                        StrainListProbeAntigenAPI.get({}, function(data) { vm.strainLookup = data.items;
                                $q.all([
                                FindElement.byId("strain"),
                                ]).then(function(elements) {
                                        pageScope.autocompleteBeginning(angular.element(elements[0]), vm.strainLookup);
                                });
                        }); 
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

			CloneLibGetAPI.get({ key: vm.results[vm.selectedIndex].sourceKey }, function(data) {
				vm.apiDomain = data;
				vm.apiDomain.sourceKey = vm.results[vm.selectedIndex].sourceKey;
				vm.results[vm.selectedIndex].name = vm.apiDomain.name;
                                addAccRow(0);
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: CloneLibGetAPI.get");
			});
		}	
		
		// when an object is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove object, if it exists)
			removeSearchResultsItem(vm.apiDomain.sourceKey);

			// clear if now empty; otherwise, load next row
			if (vm.results.length == 0) {
				clear();
			}
			else {
				// adjust selected results index as needed, and load object
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
				if (vm.results[i].sourceKey == keyToRemove) {
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
                                document.getElementById("library").focus();
                        }, (500));
		}

		/////////////////////////////////////////////////////////////////////
		// validating
		/////////////////////////////////////////////////////////////////////		
		
        	// validate jnum
		function validateJnum() {		
			console.log("validateJnum()");

			if (vm.apiDomain.jnumid == undefined || vm.apiDomain.jnumid == "") {
				vm.apiDomain.refsKey = "";
				vm.apiDomain.jnumid = "";
				vm.apiDomain.jnum = null;
				vm.apiDomain.short_citation = "";
				return;
			}

                        if (vm.apiDomain.jnumid.includes("%")) {
                                return;
                        }

			ValidateJnumAPI.query({ jnum: vm.apiDomain.jnumid }, function(data) {
				if (data.length == 0) {
					alert("Invalid Reference: " + vm.apiDomain.jnumid);
					document.getElementById(id).focus();
					vm.apiDomain.refsKey = "";
					vm.apiDomain.jnumid = "";
					vm.apiDomain.jnum = null;
					vm.apiDomain.short_citation = "";
				} else {
					vm.apiDomain.refsKey = data[0].refsKey;
					vm.apiDomain.jnumid = data[0].jnumid;
					vm.apiDomain.jnum = parseInt(data[0].jnum, 10);
					vm.apiDomain.short_citation = data[0].short_citation;
				}

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateJnumAPI.query");
				document.getElementById(id).focus();
				vm.apiDomain.refsKey = "";
                                vm.apiDomain.jnumid = ""; 
                                vm.apiDomain.jnum = null; 
				vm.apiDomain.short_citation = "";
			});
		}		

                // validate strain	
                function validateStrain() {
                        console.log("validateStrain(): ") + vm.apiDomain.strain;

                        if (vm.apiDomain.strain == undefined || vm.apiDomain.strain == "") {
                                return;
                        }

                        if (vm.apiDomain.strain.includes("%")) {
                                return;
                        }

                        ValidateStrainAPI.search({strain: vm.apiDomain.strain}, function(data) {
                                if (data.length == 0 || data == undefined) {
                                        createStrain();
                                } 
                                else {
                                        if (data[0].isPrivate == "1") {
                                                alert("This value is designated as 'private' and cannot be used: " + vm.apiDomain.strain);
                                                vm.apiDomain.strainKey = "";
                                                vm.apiDomain.strain = "";
                                                document.getElementById("strain").focus();
                                        }
                                        else {
                                                vm.apiDomain.strainKey = data[0].strainKey;
                                                vm.apiDomain.strain = data[0].strain;
                                        }
                                }
                        }, function(err) {
                                pageScope.handleError(vm, "API ERROR: ValidateStrainAPI.search");
                                document.getElementById("strain").focus();
                        });
                }

                function createStrain() {
                        console.log("createStrain()");

                        var newterm = {};
                        newterm.strain = vm.apiDomain.strain;
                        newterm.speciesKey = "481207";
                        newterm.strainTypeKey = "3410535";
                        newterm.standard = "0";
                        newterm.isPrivate = "0";
                        newterm.geneticBackground = "0";

                        if ($window.confirm("The item: \n\n'" + newterm.strain + "' \n\ndoes not exist.\n\nTo add new item, click 'OK'\n\nElse, click 'Cancel'")) {
                                StrainCreateAPI.create(newterm, function(data) {
                                        if (data.error != null) {
                                                alert("ERROR: " + data.error + " - " + data.message);
                                                vm.apiDomain.strainKey = "";
                                                vm.apiDomain.strain = "";
                                                document.getElementById("strain").focus();
                                        } else {
                                                vm.apiDomain.strainKey = data.items[0].strainKey;
                                                vm.apiDomain.strain = data.items[0].strain;
                                        }
                                }, function(err) {
                                        pageScope.handleError(vm, "API ERROR: StrainCreateAPI.create");
                                        document.getElementById("strain").focus();
                                });
                        }
                        else {
                                vm.apiDomain.strainKey = "";
                                vm.apiDomain.strain = "";
                                document.getElementById("strain").focus();
                        }
                }

                // validate tissue
                function validateTissue() {
                        console.log("validateTissue(): " + vm.apiDomain.tissue);

                        if (vm.apiDomain.tissue == undefined || vm.apiDomain.tissue == "") {
                                return;
                        }

                        if (vm.apiDomain.tissue.includes("%")) {
                                return;
                        }

                        ValidateTissueAPI.search({tissue: vm.apiDomain.tissue}, function(data) {
                                if (data.length == 0 || data == undefined) {
                                        createTissue();
                                } else {
                                        vm.apiDomain.tissueKey = data[0].tissueKey;
                                        vm.apiDomain.tissue = data[0].tissue;
                                }
                        }, function(err) {
                                pageScope.handleError(vm, "API ERROR: ValidateTissueAPI.search");
                                document.getElementById("tissue").focus();
                        });
                }

                function createTissue() {
                        console.log("createTissue()");

                        var newterm = {};
                        newterm.tissue = vm.apiDomain.tissue;
                        newterm.standard = "0";

                        if ($window.confirm("The item: \n\n'" + newterm.tissue + "' \n\ndoes not exist.\n\nTo add new item, click 'OK'\n\nElse, click 'Cancel'")) {
                                TissueCreateAPI.create(newterm, function(data) {
                                        if (data.error != null) {
                                                alert("ERROR: " + data.error + " - " + data.message);
                                                vm.apiDomain.tissueKey = "";
                                                vm.apiDomain.tissue = "";
                                                document.getElementById("tissue").focus();
                                        } else {
                                                vm.apiDomain.tissueKey = data.items[0].tissueKey;
                                                vm.apiDomain.tissue = data.items[0].tissue;
                                        }
                                }, function(err) {
                                        pageScope.handleError(vm, "API ERROR: TissueCreateAPI.create");
                                        document.getElementById("tissue").focus();
                                });
                        }
                        else {
                                vm.apiDomain.tissueKey = "";
                                vm.apiDomain.tissue = "";
                                document.getElementById("tissue").focus();
                        }
                }
 
                //  validate cell line
                function validateCellLine() {
                        console.log("validateCellLine(): " + vm.apiDomain.cellLine);

                        if (vm.apiDomain.cellLine == undefined || vm.apiDomain.cellLine == "") {
                                return;
                        }

                        if (vm.apiDomain.cellLine.includes("%")) {
                                return;
                        }

                        var params = {};
                        params.vocabKey = "18";
                        params.term = vm.apiDomain.cellLine;
                        console.log(params); 

                        ValidateTermAPI.search(params, function(data) {
                                if (data == null || data.length == 0 || data.length == undefined) {
                                        createCellLine();
                                }
                                else {
                                        vm.apiDomain.cellLineKey = data[0].termKey;
                                        vm.apiDomain.cellLine = data[0].term;
                                }
                        }, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateTermAPI.search");
                                document.getElementById("cellLine").focus();
                        });
                }
                
                function createCellLine() {
                        console.log("createCellLine");

                        var newterm = {};
                        newterm.processStatus = "c";
                        newterm.term = vm.apiDomain.cellLine;
                        newterm.isObsolete = "0";
                        newterm.vocabKey = "18";

                        if ($window.confirm("The item: \n\n'" + newterm.term + "' \n\ndoes not exist.\n\nTo add new item, click 'OK'\n\nElse, click 'Cancel'")) {
                                CellLineCreateAPI.create(newterm, function(data) {
                                        if (data.error != null) {
                                                alert("ERROR: " + data.error + " - " + data.message);
                                                vm.apiDomain.cellLineKey = "";
                                                vm.apiDomain.cellLine = "";
                                                document.getElementById("cellLine").focus();
                                        } else {
                                                vm.apiDomain.cellLineKey = data.items[0].termKey;
                                                vm.apiDomain.cellLine = data.items[0].term;
                                        }
                                }, function(err) {
					pageScope.handleError(vm, "API ERROR: CellLineCreateAPI.create");
                                        document.getElementById("cellLine").focus();
                                });
                        }
                        else {
                                vm.apiDomain.cellLineKey = "";
                                vm.apiDomain.cellLine = "";
                                document.getElementById("cellLine").focus();
                        }
                }
	
		/////////////////////////////////////////////////////////////////////
		// accessionIds
		/////////////////////////////////////////////////////////////////////		
		
		// set current row
		function selectAcc(index) {
			console.log("selectAcc: " + index);
			vm.selectedAccIndex = index;
		        addAccRow(index);
		}

		// if current row has changed
		function changeAccRow(index) {
			console.log("changeAccRow: " + index);

			vm.selectedAccIndex = index;

			if (vm.apiDomain.accessionIds == null) {
				vm.selectedAccIndex = 0;
				return;
			}

			//if (vm.apiDomain.accessionIds[index].processStatus == "x") {
				//vm.apiDomain.accessionIds[index].processStatus = "u";
			//}

		}

		// add new row
		function addAccRow(index) {
			console.log("addAccRow: " + index);

			if (vm.apiDomain.accessionIds == undefined) {
				vm.apiDomain.accessionIds = [];
			}

			var i = vm.apiDomain.accessionIds.length;
			
			vm.apiDomain.accessionIds[i] = {
				"processStatus": "c",
				"objectKey": vm.apiDomain.sourceKey,
				"accessionKey": "",
				"logicaldbKey": "",
				"accID": ""
			}
		}		

		// delete row
		function deleteAccRow(index) {
			console.log("deleteAccRow: " + index);
			vm.apiDomain.accessionIds[index].processStatus = "d";
		}

                //
		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
		$scope.clear = clear;
		//$scope.create = create;
		//$scope.modify = modify;
		//$scope.delete = deleteIt;
		$scope.changeAccRow = changeAccRow;
		$scope.addAccRow = addAccRow;
		$scope.deleteAccRow = deleteAccRow;

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

		// other functions: buttons, onBlurs and onChanges
		$scope.selectResult = selectResult;
		$scope.validateJnum = validateJnum;
		$scope.validateStrain = validateStrain;
		$scope.validateTissue = validateTissue;
		$scope.validateCellLine = validateCellLine;

		// global shortcuts
		$scope.Kclear = function() { $scope.clear(); $scope.$apply(); }
		$scope.Ksearch = function() { $scope.search(); $scope.$apply(); }
		$scope.Kfirst = function() { $scope.firstSummaryObject(); $scope.$apply(); }
		$scope.Knext = function() { $scope.nextSummaryObject(); $scope.$apply(); }
		$scope.Kprev = function() { $scope.prevSummaryObject(); $scope.$apply(); }
		$scope.Klast = function() { $scope.lastSummaryObject(); $scope.$apply(); }
		$scope.Kadd = function() { $scope.create(); $scope.$apply(); }
		$scope.Kmodify = function() { $scope.modify(); $scope.$apply(); }
		$scope.Kdelete = function() { $scope.delete(); $scope.$apply(); }

		var globalShortcuts = Mousetrap($document[0].body);
		globalShortcuts.bind(['ctrl+alt+c'], $scope.Kclear);
		globalShortcuts.bind(['ctrl+alt+s'], $scope.Ksearch);
		globalShortcuts.bind(['ctrl+alt+f'], $scope.Kfirst);
		globalShortcuts.bind(['ctrl+alt+p'], $scope.Kprev);
		globalShortcuts.bind(['ctrl+alt+n'], $scope.Knext);
		globalShortcuts.bind(['ctrl+alt+l'], $scope.Klast);
		//globalShortcuts.bind(['ctrl+alt+a'], $scope.Kadd);
		//globalShortcuts.bind(['ctrl+alt+m'], $scope.Kmodify);
		//globalShortcuts.bind(['ctrl+alt+d'], $scope.Kdelete);

		// call to initialize the page, and start the ball rolling...
		init();
	}

})();

