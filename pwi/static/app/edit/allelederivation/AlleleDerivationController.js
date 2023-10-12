(function() {
	'use strict';
	angular.module('pwi.allelederivation').controller('AlleleDerivationController', AlleleDerivationController);

	function AlleleDerivationController(
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
			AlleleDerivationSearchAPI,
			AlleleDerivationGetAPI,
			AlleleDerivationCreateAPI,
			AlleleDerivationUpdateAPI,
                        AlleleDerivationDeleteAPI,
			AlleleDerivationTotalCountAPI,
                        ParentCellLineSearchAPI,
                        AlleleDerivationMCLCountAPI,
                        AlleleDerivationDuplicateByNameAPI,
			// global APIs
			ValidateJnumAPI,
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
			
			AlleleDerivationSearchAPI.search(vm.apiDomain, function(data) {
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
				pageScope.handleError(vm, "API ERROR: AlleleDerivationSearchAPI.search");
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
                        AlleleDerivationTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		// refresh the mcl count
                function refreshMCLCount() {
                        AlleleDerivationMCLCountAPI.search(vm.results[vm.selectedIndex].derivationKey, function(data) {
                                vm.mcl_count = data.total_count;
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////
		
                // generate derivation name
                function generateDerivationName() {
			console.log("generateDerivationName()");

                }

        	// create derivation
		function create() {
			console.log("create()");

			// verify if record selected
			if (vm.apiDomain.derivationKey != null && vm.apiDomain.derivationKey != "") {
				alert("Cannot Add if a record is already selected.");
                                return;
			}

                        // required : Derivation Type
                        // required : Creator
                        // required : Vector Name
                        // required : Vector Type
                        if (vm.apiDomain.derivationTypeKey == "" || vm.apiDomain.derivationTypeKey == null) {
				alert("Derivation Type required.");
                                return;
                        }
                        if (vm.apiDomain.creatorKey == "" || vm.apiDomain.creatorKey == null) {
				alert("Creator required.");
                                return;
                        }
                        if (vm.apiDomain.vectorKey == "" || vm.apiDomain.vectorKey == null) {
				alert("Vector Name required.");
                                return;
                        }
                        if (vm.apiDomain.vectorTypeKey == "" || vm.apiDomain.vectorTypeKey == null) {
				alert("Vector Type required.");
                                return;
                        }

                        // Creator + Derivation Type + "Library" + Parent Cell Line + Parent Strain + Vector
			for(var i=0;i<vm.creatorLookup.length; i++) {
                                if (vm.creatorLookup[i].termKey == vm.apiDomain.creatorKey) {
                                        vm.apiDomain.creator = vm.creatorLookup[i].term;
                                }
                        }

			for(var i=0;i<vm.derivationTypeLookup.length; i++) {
                                if (vm.derivationTypeLookup[i].termKey == vm.apiDomain.derivationTypeKey) {
                                        vm.apiDomain.derivationType = vm.derivationTypeLookup[i].term;
                                }
                        }

			for(var i=0;i<vm.vectorLookup.length; i++) {
                                if (vm.vectorLookup[i].termKey == vm.apiDomain.vectorKey) {
                                        vm.apiDomain.vector = vm.vectorLookup[i].term;
                                }
                        }

                        if (vm.apiDomain.creator == null) {
                                vm.apiDomain.creator = "";
                        }
                        if (vm.apiDomain.derivationType == null) {
                                vm.apiDomain.derivationType = "";
                        }
                        if (vm.apiDomain.parentCellLine.cellLine == null) {
                                vm.apiDomain.parentCellLine.cellLine = "";
                        }
                        if (vm.apiDomain.parentCellLine.strain == null) {
                                vm.apiDomain.parentCellLine.strain = "";
                        }
                        if (vm.apiDomain.vector == null) {
                                vm.apiDomain.vector = "";
                        }

                        vm.apiDomain.name = vm.apiDomain.creator + " " 
                                + vm.apiDomain.derivationType + " Library "
                                + vm.apiDomain.parentCellLine.cellLine + " "
                                + vm.apiDomain.parentCellLine.strain + " "
                                + vm.apiDomain.vector;

			console.log(vm.apiDomain.name);

                        // check for duplicate vm.apiDomain.name
			AlleleDerivationDuplicateByNameAPI.search(vm.apiDomain, function(data) {
			        console.log("data.length: " + data.length);
				if (data.length == 0) {
			                console.log("calling AlleleDerivationCreateAPI.create");
				        pageScope.loadingStart();

				        AlleleDerivationCreateAPI.create(vm.apiDomain, function(data) {
					        if (data.error != null) {
						        alert("ERROR: " + data.error + " - " + data.message);
						        loadObject();
					        }
					        else {
						        vm.apiDomain = data.items[0];
                                                        vm.selectedIndex = vm.results.length;
                                                        vm.results[vm.selectedIndex] = []
                                                        vm.results[vm.selectedIndex].derivationKey = vm.apiDomain.derivationKey;
                                                        vm.results[vm.selectedIndex].name = vm.apiDomain.name;
						        loadObject();
						        refreshTotalCount();
					        }
					        pageScope.loadingEnd();
                                                setFocus();
				        }, function(err) {
					        pageScope.handleError(vm, "API ERROR: AlleleDerivationUpdateAPI.update");
					        pageScope.loadingEnd();
                                                setFocus();
				        });
			        }
			        else {
					alert("Duplicate Derivation : Creator, Derivation Type, Cell Line, Strain, Vector");
				        loadObject();
				        pageScope.loadingEnd();
                                        setFocus();
			        }
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AlleleDerivationDuplicateByNameAPI.search");
			});
		}		

        	// modify derivation
		function modify() {
			console.log("modify() -> AlleleDerivationUpdateAPI()");

			// check if record selected
			if (vm.selectedIndex < 0) {
				alert("Cannot Modify if a record is not selected.");
				return;
			}
			
                        // Creator + Derivation Type + "Library" + Parent Cell Line + Parent Strain + Vector
			for(var i=0;i<vm.creatorLookup.length; i++) {
                                if (vm.creatorLookup[i].termKey == vm.apiDomain.creatorKey) {
                                        vm.apiDomain.creator = vm.creatorLookup[i].term;
                                }
                        }

			for(var i=0;i<vm.derivationTypeLookup.length; i++) {
                                if (vm.derivationTypeLookup[i].termKey == vm.apiDomain.derivationTypeKey) {
                                        vm.apiDomain.derivationType = vm.derivationTypeLookup[i].term;
                                }
                        }

			for(var i=0;i<vm.vectorLookup.length; i++) {
                                if (vm.vectorLookup[i].termKey == vm.apiDomain.vectorKey) {
                                        vm.apiDomain.vector = vm.vectorLookup[i].term;
                                }
                        }

                        if (vm.apiDomain.creator == null) {
                                vm.apiDomain.creator = "";
                        }
                        if (vm.apiDomain.derivationType == null) {
                                vm.apiDomain.derivationType = "";
                        }
                        if (vm.apiDomain.parentCellLine.cellLine == null) {
                                vm.apiDomain.parentCellLine.cellLine = "";
                        }
                        if (vm.apiDomain.parentCellLine.strain == null) {
                                vm.apiDomain.parentCellLine.strain = "";
                        }
                        if (vm.apiDomain.vector == null) {
                                vm.apiDomain.vector = "";
                        }

                        vm.apiDomain.name = vm.apiDomain.creator + " " 
                                + vm.apiDomain.derivationType + " Library "
                                + vm.apiDomain.parentCellLine.cellLine + " "
                                + vm.apiDomain.parentCellLine.strain + " "
                                + vm.apiDomain.vector;

                        // check for duplicate vm.apiDomain.name
			AlleleDerivationDuplicateByNameAPI.search(vm.apiDomain, function(data) {
			        console.log("data.length: " + data.length);
				if (data.length == 0) {
			                console.log("calling AlleleDerivationUpdateAPI.update");
				        pageScope.loadingStart();

                                        vm.apiDomain.processStatus = "u";

				        AlleleDerivationUpdateAPI.update(vm.apiDomain, function(data) {
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
					        pageScope.handleError(vm, "API ERROR: AlleleDerivationUpdateAPI.update");
					        pageScope.loadingEnd();
                                                setFocus();
				        });
			        }
			        else {
					alert("Duplicate Derivation : Creator, Derivation Type, Cell Line, Strain, Vector");
				        loadObject();
				        pageScope.loadingEnd();
                                        setFocus();
			        }
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AlleleDerivationDuplicateByNameAPI.search");
			});
		}		
		
        	// delete allele
		function deleteIt() {
			console.log("deleteIt() -> AlleleDerivationDeleteAPI() : " + vm.selectedIndex);

			// check if record selected
			if (vm.selectedIndex < 0) {
				alert("Cannot Delete if a record is not selected.");
				return;
			}

			if (vm.mcl_count > 0) {
				alert("This derivation is associated with 1 or more mutant cell line and cannot be deleted.");
				return;
                        }

			if ($window.confirm("Are you sure you want to delete this record?")) {
			
				pageScope.loadingStart();

                                AlleleDerivationDeleteAPI.delete({key: vm.apiDomain.derivationKey}, function(data) {
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
					pageScope.handleError(vm, "API ERROR: AlleleDerivationDeleteAPI.delete");
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
			vm.total_count = 0;
                        vm.mcl_count = 0;
                        loadEmptyObject();
			resetBoolean();
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");
			resetBoolean();
                        vm.apiDomain.processStatus = "c";
                        vm.apiDomain.derivationKey = "";
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

			vm.parentCellLineLookup = [];
			ParentCellLineSearchAPI.search({}, function(data) { vm.parentCellLineLookup = data});;

			vm.vectorLookup = [];
                        VocTermSearchAPI.search({"vocabKey":"72"}, function(data) { vm.vectorLookup = data.items[0].terms});;
                }

		// load empty oject
		function loadEmptyObject() {
			console.log("loadEmptyObject()");

			AlleleDerivationGetAPI.get({ key: "-999" }, function(data) {
				vm.apiDomain = data;
                                vm.apiDomain.processStatus = "c";
                                vm.apiDomain.name = "";
                                vm.apiDomain.parentCellLine = {
                                        "processStatus": "x",
                                        "cellLineKey": "",
                                        "cellLine": "",
                                        "isMutant": "0",
                                        "cellLineTypeKey": "",
                                        "cellLineType": "",
                                        "strainKey": "",
                                        "strain": ""
                                }
                                addNotes();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AlleleDerivationGetAPI.get");
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

			AlleleDerivationGetAPI.get({ key: vm.results[vm.selectedIndex].derivationKey }, function(data) {
				vm.apiDomain = data;
                                addNotes();
                                refreshMCLCount();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AlleleDerivationGetAPI.get");
			});
		}	
		
		// when an object is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			removeSearchResultsItem(vm.apiDomain.derivationKey);

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
				if (vm.results[i].derivationKey == keyToRemove) {
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
                                document.getElementById("name").focus();
                        }, (200));
		}

		/////////////////////////////////////////////////////////////////////
		// validating
		/////////////////////////////////////////////////////////////////////		
		
        	// validate jnum
		function validateJnum(id) {		
			console.log("validateJnum = " + id);

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

        	// validate parent cell line
		function validateParentCellLine(row, id) {		
			console.log("validateParentCellLine = " + id);

			if (row.cellLine == "") {
      				row.derivationKey = "";
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
      					row.derivationKey = "";
      					row.cellLineTypeKey = "";
      					row.cellLineType = "";
      					row.strainKey = "";
      					row.strain = "";
				} else {
      					row.cellLine = data[0].cellLine;
      					row.derivationKey = data[0].derivationKey;
      					row.cellLineTypeKey = data[0].cellLineTypeKey;
      					row.cellLineType = data[0].cellLineType;
      					row.strainKey = data[0].strainKey;
      					row.strain = data[0].strain;
				}

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateParentCellLineAPI.search");
				document.getElementById(id).focus();
      				row.derivationKey = "";
      				row.cellLineTypeKey = "";
      				row.cellLineType = "";
      				row.strainKey = "";
      				row.strain = "";
			});
		}		

		// validate strain
		function validateStrain(id) {
			console.log("validateStrain()");

			if (vm.apiDomain.parentCellLine.strain == undefined || vm.apiDomain.parentCellLine.strain == "") {
                                vm.apiDomain.parentCellLine.strainKey = "";
                                return;
			}

                        if (vm.apiDomain.parentCellLine.strain.includes("%")) {
                                vm.apiDomain.parentCellLine.strainKey = "";
                                return;
                        }

			console.log("validateStrain(): " + vm.apiDomain.parentCellLine.strain);
			ValidateStrainAPI.search({strain: vm.apiDomain.parentCellLine.strain}, function(data) {
				if (data.length == 0) {
					alert("Invalid Strain");
                                        vm.apiDomain.parentCellLine.strainKey = "";
                                        vm.apiDomain.parentCellLine.strain = "";
					document.getElementById(id).focus();
				} else {
					if (data[0].isPrivate == "1") {
						alert("This value is designated as 'private' and cannot be used: " + vm.apiDomain.strain);
                                                vm.apiDomain.parentCellLine.strainKey = "";
                                                vm.apiDomain.parentCellLine.strain = "";
						document.getElementById(id).focus();
					}
					else {
                                                vm.apiDomain.parentCellLine.strainKey = data[0].strainKey;
                                                vm.apiDomain.parentCellLine.strain = data[0].strain;
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

			if (vm.apiDomain.vector == undefined || vm.apiDomain.vector == "") {
                                vm.apiDomain.vectorKey = "";
                                return;
			}

                        if (vm.apiDomain.vector.includes("%")) {
                                vm.apiDomain.vectorKey = "";
                                return;
                        }

			// json for term search
			var params = {};
			params.vocabKey = "72";
			params.term = vm.apiDomain.vector;

			console.log("validateVector(): " + vm.apiDomain.vector);
			ValidateTermAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Vector Name");
					document.getElementById(id).focus();
                                        vm.apiDomain.vectorKey = "";
                                        vm.apiDomain.vector = "";
				} else {
					vm.apiDomain.vectorKey = data[0].termKey;
					vm.apiDomain.vector = data[0].term;
				}

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateTermAPI.search");
				document.getElementById(id).focus();
                                vm.apiDomain.vectorKey = "";
                                vm.apiDomain.vector = "";
			});
		}		

		/////////////////////////////////////////////////////////////////////
		// lookups
		/////////////////////////////////////////////////////////////////////		
                
		// selected parent cell line row
		function selectParentCellLine(index) {
			console.log("selectParentCellLine(): " + index);
			vm.selectedParentCellLineIndex = index;
                        vm.apiDomain.parentCellLine = vm.parentCellLineLookup[vm.selectedParentCellLineIndex];
		}		

		// selected derivation row
		function selectDerivation(index) {
			console.log("selectDerivation(): " + index);
			vm.selectedDerivationIndex = index;
                        vm.apiDomain.vm.derivationTypeLookup[vm.selectedDerivationIndex];
			vm.apiDomain.cellLineTypeKey = vm.apiDomain.parentCellLine.cellLineTypeKey;
	                vm.apiDomain.cellLineType = vm.apiDomain.parentCellLine.cellLineType;
			vm.apiDomain.strainKey = vm.apiDomain.parentCellLine.strainKey;
	                vm.apiDomain.strain = vm.apiDomain.parentCellLine.strain;
		}		

		// selected vector row
		function selectVector(index) {
			console.log("selectVector(): " + index);
			vm.selectedVectorIndex = index;
                        vm.apiDomain.vectorKey = vm.vectorLookup[vm.selectedVectorIndex].termKey;
                        vm.apiDomain.vector = vm.vectorLookup[vm.selectedVectorIndex].term;
		}		

		/////////////////////////////////////////////////////////////////////
		// notes
		/////////////////////////////////////////////////////////////////////		
		
		// add new note row
		function addNote(note, noteType) {
			console.log("addNote():" + note);

			if (note != null) { return; }

			var noteTypeKey = "";

			if (noteType == "General") {
				noteTypeKey = "1033";
			}

			note = {
                                "processStatus": "c",
				"noteKey": "",
				"objectKey": vm.apiDomain.alleleKey,
				"mgiTypeKey": "36",
				"noteTypeKey": noteTypeKey,
				"noteChunk": ""
			}

			if (noteType == "General") {
				vm.apiDomain.generalNote = note;
			}
		}

		function addNotes() {
			console.log("addNotes()");
			addNote(vm.apiDomain.generalNote, "General");
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
                $scope.validateJnum = validateJnum;
		$scope.validateParentCellLine = validateParentCellLine;
		$scope.validateStrain = validateStrain;
		$scope.validateVectorName = validateVectorName;
		
		// global shortcuts
		$scope.KclearAll = function() { $scope.clear(); $scope.$apply(); }
		$scope.Ksearch = function() { $scope.search(); $scope.$apply(); }
		$scope.Kfirst = function() { $scope.firstSummaryObject(); $scope.$apply(); }
		$scope.Knext = function() { $scope.nextSummaryObject(); $scope.$apply(); }
		$scope.Kprev = function() { $scope.prevSummaryObject(); $scope.$apply(); }
		$scope.Klast = function() { $scope.lastSummaryObject(); $scope.$apply(); }
                $scope.Kadd = function() { $scope.create(); $scope.$apply(); }
                $scope.Kmodify = function() { $scope.modify(); $scope.$apply(); }
                $scope.Kdelete = function() { $scope.deleteIt(); $scope.$apply(); }

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

