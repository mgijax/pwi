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
			AlleleCreateAPI,
                        AlleleCreateStrainAPI,
			AlleleUpdateAPI,
			AlleleDeleteAPI,
			AlleleTotalCountAPI,
                        ParentCellLineSearchAPI,
			// global APIs
                        OrganismSearchDriverGeneAPI,
			ReferenceAssocTypeSearchAPI,
			ValidateJnumAPI,
			VocTermSearchAPI,
			ValidateImagePaneAPI,
			ValidateMarkerAPI,
			ValidateMutantCellLineAPI,
			ValidateParentCellLineAPI,
			ValidateStrainAPI,
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
                vm.selectedImagePaneIndex = 0;
                vm.selectedParentCellLineIndex = -1;
		vm.attachInducibleNote = "";
		
                // track if mcl, parent cell line, or strain of origin has changed...
                vm.changedMCLParentSOO = false;

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
			
                        // if multiSymbols contains search text
                        if (vm.apiDomain.multiSymbols != "") {
                                var saveMultiSymbols = vm.apiDomain.multiSymbols;
                                resetData();
                                vm.apiDomain.multiSymbols = saveMultiSymbols
                        }
                        
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
			resetDataDeselect();
			vm.selectedIndex = -1;
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
		
                // verify inheritance
                function validateInheritance() {
                        console.log("validateInheritance()");

                        // if 'Other (see notes)//847093 and General Notes is empty...
                        if(vm.apiDomain.inheritanceModeKey == "847093" 
                                && vm.apiDomain.generalNote.noteChunk == "") {
			        alert("General Notes are required.");
                                return false;
                        }

                        return true;
                }

                // verify molecular mutation
                function validateMolecularMutation() {
                        console.log("validateMolecularMutation()");

                        // if Molecular Mutation = Other, then Molecular Note is required.
                        
                        var hasNote = true;
			for(var i=0;i<vm.apiDomain.mutations.length; i++) {
				if (vm.apiDomain.mutations[i].mutationKey == "847105" 
			                && (vm.apiDomain.molecularNote.noteChunk == undefined || vm.apiDomain.molecularNote.noteChunk == "")) {
                                        hasNote = false;
                                        break;
                                }
                        }

                        if(hasNote == false) {
			        alert("If Molecular Mutation = Other, then Molecular Note is required.");
                                return false;
                        }

                        return true;
                }

                // verify references
                function validateReferences() {
                        console.log("validateReferences()");

                        // at most 1 original referenced required
                        var hasOriginal = 0;
			for(var i=0;i<vm.apiDomain.refAssocs.length; i++) {
				if (vm.apiDomain.refAssocs[i].refAssocTypeKey == "1011" 
                                        && vm.apiDomain.refAssocs[i].refsKey != "") {
                                        hasOriginal += 1;
                                }
                        }

                        if(hasOriginal != 1) {
                                alert("At most one Original Reference is required.");
                                return false;
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
                                return false;
                        }

                        // reference/molecular and driverGenes must be in sync
                        var hasDriverGene = false;
                        var hasMolRef = false;
                        if((vm.apiDomain.driverGenes.length > 0) && (vm.apiDomain.driverGenes[0].markerKey != ""
                                && vm.apiDomain.driverGenes[0].processStatus != "d")) {
                                hasDriverGene = true;
                        }
			for(var i=0;i<vm.apiDomain.refAssocs.length; i++) {
				if (vm.apiDomain.refAssocs[i].processStatus != "d"
                                        && vm.apiDomain.refAssocs[i].refAssocTypeKey == "1012") {
                                         hasMolRef = true;
                                }
                        }
                        if(hasDriverGene == true && hasMolRef == false) {
                                alert("Molecular Reference is required for Driver Gene.");
                                return false;
                        }

                        return true;
                }

                // verify allele status
                function validateStatus() {
                        console.log("validateStatus()");

                        if(vm.apiDomain.alleleStatusKey == "847114" 
                                && (vm.apiDomain.markerKey == "" || vm.apiDomain.markerKey == undefined)) {
			        alert("Approved Allele Symbol must have an Approved Marker.");
                                return false;
                        }

                        return true;
                }

                // verify synonym/references exist
                function validateSynonyms() {
                        console.log("validateSynonyms()");

                        var hasRef = true;
			for(var i=0;i<vm.apiDomain.synonyms.length; i++) {
				if ((vm.apiDomain.synonyms[i].processStatus != "d")
			                && (vm.apiDomain.synonyms[i].synonym != "")
			                && (vm.apiDomain.synonyms[i].refsKey == "")) {
                                        hasRef = false;
                                        break;
                                }
                        }

                        if(hasRef == false) {
			        alert("Synonyms:  J#/Reference required");
                                return false;
                        }

                        return true;
                }

                // verify transmission
                function validateTransmission() {
                        console.log("validateTransmission()");

                        var hasTransmission = 0;
			for(var i=0;i<vm.apiDomain.refAssocs.length; i++) {
				if (vm.apiDomain.refAssocs[i].refAssocTypeKey == "1023" 
                                        && vm.apiDomain.refAssocs[i].refsKey != "") {
                                        hasTransmission += 1;
                                }
                        }

                        return true;
                }

        	// create allele
		function create() {
			console.log("create()");

			// verify if record selected
			if (vm.apiDomain.alleleKey != null && vm.apiDomain.alleleKey != "") {
				alert("Cannot Add if a record is already selected.");
                                return;
			}

                        // required : Symbol
                        // required : Name
                        // required : Allele Type
                        if (vm.apiDomain.symbol == "") {
				alert("Symbol required.");
                                return;
                        }
                        if (vm.apiDomain.name == "") {
				alert("Name required.");
                                return;
                        }
                        if (vm.apiDomain.alleleTypeKey == "") {
				alert("Generation required.");
                                return;
                        }
                        if (vm.apiDomain.transmissionKey == "") {
				alert("Germ Line Transmission required.");
                                return;
                        }

                        if (validateInheritance() == false) {
                                return;
                        }

                        if (validateMolecularMutation() == false) {
                                return;
                        }

                        if (validateReferences() == false) {
                                return;
                        }

                        if (validateStatus() == false) {
                                return;
                        }

                        if (validateSynonyms() == false) {
                                return;
                        }

                        // status = "Autoload" ("3983021") is not allowed
                        if (vm.apiDomain.alleleStatusKey == "3983021") {
				alert("You do not have permission to add an 'Autoload' Allele.");
                                return;
                        }

                        // if status = "Approved" (847114")
                        // if type != "Gene trapped" (847121)
                        // then markerKey must exist
                        if (vm.apiDomain.alleleStatusKey == "847114"
                                && vm.apiDomain.alleleTypeKey != "847121" 
                                && vm.apiDomain.markerKey == "") {
				alert("Approved Allele Symbol must have an Approved Marker.");
                                return;
                        }

                        // if Gene trapped or Targeted...
                        if (vm.apiDomain.alleleTypeKey == "847121" || vm.apiDomain.alleleTypeKey == "847116") {
			        vm.apiDomain.mutantCellLineAssocs[0].mutantCellLine.processStatus = "c";
                        }

			// check at most 1 primary image pane
			var hasPrimary = false;
			var primaryList = [];
			var s2 = 0;
			for(var i=0;i<vm.apiDomain.imagePaneAssocs.length; i++) {
				if (vm.apiDomain.imagePaneAssocs[i].processStatus == "d") {
					continue;
				}
				if (vm.apiDomain.imagePaneAssocs[i].isPrimary == "0") {
					continue;
				}
				s2 = vm.apiDomain.imagePaneAssocs[i].isPrimary;
				if (primaryList.includes(s2)) {
					hasPrimary = true;
				}
				else {
					primaryList.push(s2);
				}
			}
			if (hasPrimary) {
				alert("At most one Primary Image Pane is allowed.  Cannot Modify.");
                                return;
			}

			console.log("create() -> AlleleCreateAPI()");
			pageScope.loadingStart();
			AlleleCreateAPI.create(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					vm.apiDomain = data.items[0];
                                        vm.selectedIndex = vm.results.length;
                                        vm.results[vm.selectedIndex] = []
                                        vm.results[vm.selectedIndex].alleleKey = vm.apiDomain.alleleKey;
                                        vm.results[vm.selectedIndex].symbol = vm.apiDomain.symbol;
					loadObject();
					refreshTotalCount();
				}
				pageScope.loadingEnd();
                                       setFocus();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AlleleCreateAPI.create");
				pageScope.loadingEnd();
                                       setFocus();
			});
		}		

        	// modify allele
		function modify() {
			console.log("modify() -> AlleleUpdateAPI()");

			// check if record selected
			if (vm.selectedIndex < 0) {
				alert("Cannot Modify if a record is not selected.");
				return;
			}
			
                        if (validateInheritance() == false) {
                                return;
                        }

                        if (validateMolecularMutation() == false) {
                                return;
                        }

                        if (validateReferences() == false) {
                                return;
                        }

                        if (validateStatus() == false) {
                                return;
                        }

                        if (validateSynonyms() == false) {
                                return;
                        }

                        if (validateTransmission() == false) {
                                return;
                        }

                        // if Gene trapped or Targeted...and processStatus = "c"
                        // this means user is changing the key
                        if ((vm.apiDomain.alleleTypeKey == "847121" || vm.apiDomain.alleleTypeKey == "847116")
                                && vm.apiDomain.mutantCellLineAssocs[0].processStatus == "c") {
			        vm.apiDomain.mutantCellLineAssocs[0].mutantCellLine.processStatus = "c";
                        }

			// check at most 1 primary image pane
			var hasPrimary = false;
			var primaryList = [];
			var s2 = 0;
			for(var i=0;i<vm.apiDomain.imagePaneAssocs.length; i++) {
				if (vm.apiDomain.imagePaneAssocs[i].processStatus == "d") {
					continue;
				}
				if (vm.apiDomain.imagePaneAssocs[i].isPrimary == "0") {
					continue;
				}
				s2 = vm.apiDomain.imagePaneAssocs[i].isPrimary;
				if (primaryList.includes(s2)) {
					hasPrimary = true;
				}
				else {
					primaryList.push(s2);
				}
			}
			if (hasPrimary) {
				alert("At most one Primary Image Pane is allowed.  Cannot Modify.");
				return;
			}

                        // if MCL, Parent Cell Line, Strain of Origin has changed...
                        if (vm.changedMCLParentSOO == true) {
			    if ($window.confirm("You are about to modify the Mutant Cell Line, Parent Cell Line or Strain of Origin.\nAre you sure you want to modify these values?")) {
				pageScope.loadingStart();

				AlleleUpdateAPI.update(vm.apiDomain, function(data) {
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
					pageScope.handleError(vm, "API ERROR: AlleleUpdateAPI.update");
					pageScope.loadingEnd();
                                        setFocus();
				});
			    }
			    else {
				    loadObject();
				    pageScope.loadingEnd();
                                    setFocus();
			    }
                        }

                        else {
			        pageScope.loadingStart();

				AlleleUpdateAPI.update(vm.apiDomain, function(data) {
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
						//loadObject();
					}
					else {
						loadObject();
					}
					pageScope.loadingEnd();
                                        setFocus();
				}, function(err) {
					pageScope.handleError(vm, "API ERROR: AlleleUpdateAPI.update");
					pageScope.loadingEnd();
                                        setFocus();
				});
                        }
		}		
		
        	// delete allele
		function deleteIt() {
			console.log("deleteIt() -> AlleleDeleteAPI() : " + vm.selectedIndex);

			// check if record selected
			if (vm.selectedIndex < 0) {
				alert("Cannot Delete if a record is not selected.");
				return;
			}

			if ($window.confirm("Are you sure you want to delete this record?")) {
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
		        vm.attachInducibleNote = "";

			resetBoolean();
			resetAllele();
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");
			resetBoolean();
                        var saveDomain = vm.apiDomain;
                        resetAllele();
                        vm.apiDomain.symbol = saveDomain.symbol;
                        vm.apiDomain.name = saveDomain.name;
			vm.apiDomain.alleleTypeKey = saveDomain.alleleTypeKey;
			vm.apiDomain.alleleType = saveDomain.alleleType;
			vm.apiDomain.alleleStatusKey = saveDomain.alleleStatusKey;
			vm.apiDomain.alleleStatus = saveDomain.alleleStatus;
			vm.apiDomain.inheritanceModeKey = saveDomain.inheritanceModeKey;
			vm.apiDomain.inheritanceMode = saveDomain.inheritanceMode;
			vm.apiDomain.transmissionKey = saveDomain.transmissionKey;
			vm.apiDomain.transmission = saveDomain.transmission;
			vm.apiDomain.collectionKey = saveDomain.collectionKey;
			vm.apiDomain.collection = saveDomain.collection;
                        vm.apiDomain.strainOfOriginKey = saveDomain.strainOfOriginKey;
                        vm.apiDomain.strainOfOrigin = saveDomain.strainOfOrigin;
			vm.apiDomain.isWildType = saveDomain.isWildType;

                        // use isExtinct = default
			//vm.apiDomain.isExtinct = saveDomain.isExtinct;
			vm.apiDomain.isExtinct = "";

			vm.apiDomain.isMixed = saveDomain.isMixed;
                        vm.apiDomain.mutantCellLineAssocs[0].processStatus = "c";
			vm.apiDomain.mutantCellLineAssocs[0].mutantCellLine.derivation = saveDomain.mutantCellLineAssocs[0].mutantCellLine.derivation;
			vm.apiDomain.mutantCellLineAssocs[0].mutantCellLine.derivation.creatorKey = "";
			vm.apiDomain.mutantCellLineAssocs[0].mutantCellLine.derivation.creator = "";
		}

		// reset booleans
	        function resetBoolean() {
			vm.hideErrorContents = true;
			vm.hideDetailClip = true;
			vm.hideGeneralNote = true;
			vm.hideMolecularNote = true;
			vm.hideNomenNote = true;
			vm.hideInducibleNote = true;
			vm.hideIkmcNote = true;
			vm.hideCreNote = true;
			vm.hideProidNote = true;
			vm.hideProjectidNote = true;
		}

		// resets allele data
		function resetAllele() {
			console.log("resetAllele()");
			vm.apiDomain = {};
			vm.apiDomain.alleleKey = "";	
			vm.apiDomain.symbol = "";	
			vm.apiDomain.multiSymbols = "";	
			vm.apiDomain.name = "";	
			vm.apiDomain.accID = "";
			vm.apiDomain.alleleTypeKey = "";
			vm.apiDomain.alleleType = "";
			vm.apiDomain.alleleStatusKey = "";
			vm.apiDomain.alleleStatus = "";
			vm.apiDomain.inheritanceModeKey = "";
			vm.apiDomain.inheritanceMode = "";
			vm.apiDomain.transmissionKey = "";
			vm.apiDomain.transmission = "";
			vm.apiDomain.collectionKey = "";
			vm.apiDomain.collection = "";
                        vm.apiDomain.strainOfOriginKey = "";
                        vm.apiDomain.strainOfOrigin = "";
			vm.apiDomain.isWildType = "";
			vm.apiDomain.isExtinct = "";
			vm.apiDomain.isMixed = "";

			vm.apiDomain.markerKey = "";
			vm.apiDomain.markerSymbol = "";
			vm.apiDomain.markerStatusKey = "";
			vm.apiDomain.markerStatus = "";
			vm.apiDomain.refsKey = "";
			vm.apiDomain.jnumid = "";
			vm.apiDomain.jnum = "";
			vm.apiDomain.short_citation = "";
			vm.apiDomain.markerAlleleStatusKey = "";
			vm.apiDomain.markerAlleleStatus = "";

			addOtherAccRow();
			addRefRows();
			addCellLineRow();
			addSynonymRow();
                        addSubtypeRow();
                        addMutationRow();
                        addDriverGeneRow();
                        addImagePaneRow();
                        addDetailClip();
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

			vm.markerAlleleStatusLookup = {};
			VocTermSearchAPI.search({"vocabKey":"73"}, function(data) { vm.markerAlleleStatusLookup = data.items[0].terms});;

			vm.cellLineTypeLookup = {};
			VocTermSearchAPI.search({"vocabKey":"63"}, function(data) { vm.cellLineTypeLookup = data.items[0].terms});;

			vm.subtypeLookup = {};
			VocTermSearchAPI.search({"vocabKey":"93"}, function(data) { vm.subtypeLookup = data.items[0].terms});;

			vm.mutationLookup = {};
			VocTermSearchAPI.search({"vocabKey":"36"}, function(data) { vm.mutationLookup = data.items[0].terms});;

			vm.inducibleLookup = {};
			VocTermSearchAPI.search({"vocabKey":"174"}, function(data) { vm.inducibleLookup = data.items[0].terms});;

			vm.organismLookup = [];
			OrganismSearchDriverGeneAPI.search({}, function(data) { vm.organismLookup = data});;

			vm.parentCellLineLookup = [];
			ParentCellLineSearchAPI.search({}, function(data) { vm.parentCellLineLookup = data});;

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
                                if (vm.apiDomain.refAssocs != undefined) {
                                        selectRefRow(0);
                                }
                                if (vm.apiDomain.mutantCellLineAssocs != undefined) {
                                        selectCellLineRow(0);
                                }
                                if (vm.apiDomain.synonyms != undefined) {
                                        selectSynonymRow(0);
				}
                                addOtherAccRow();
				addRefRows();
				addCellLineRow();
				addCellLineRow();
			        addSynonymRow();
                                addSubtypeRow();
                                addMutationRow();
                                addDriverGeneRow();
                                addImagePaneRow();
                                addDetailClip();
				addNotes();
                                vm.changedMCLParentSOO = false;
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
                        console.log("setFocus()");
                        // must pause for a bit...then it works
                        setTimeout(function() {
                                document.getElementById("symbol").focus();
                        }, (200));
		}

		/////////////////////////////////////////////////////////////////////
		// validating
		/////////////////////////////////////////////////////////////////////		
		
        	// validate jnum
		function validateJnum(row, index, id) {		
			console.log("validateJnum = " + id + index);

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

                                        if (row.refAssocTypeKey == "1012") {
                                                vm.apiDomain.molRefKey = row.refsKey;
                                        }
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
		function validateMarker(row, id) {
			console.log("validateMarker");

			if (row.markerSymbol == undefined || row.markerSymbol == "" || row.markerSymbol == null) {
                                console.log("validateMarker skipped/marker is null");
				row.markerKey = "";
				row.markerSymbol = "";
				row.markerSymbol = "";
                                addDetailClip();
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
                                        console.log(id);
					document.getElementById(id).focus();
					row.markerKey = "";
					row.markerSymbol = "";
                                        addDetailClip();
				} else {
					row.markerKey = data[0].markerKey;
					row.markerSymbol = data[0].symbol;
                                        row.detailClip = data[0].detailClip;
                                        addDetailClip();
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateMarkerAPI.search");
				document.getElementById(id).focus();
				row.markerKey = "";
				row.markerSymbol = "";
                                row.detailClip = null;
                                addDetailClip();
			});
		}

                // validate driverGenes
		function validateDriverGene(index, id) {
			console.log("validateDriverGene");

                        if (vm.apiDomain.driverGenes[index] == undefined || vm.apiDomain.driverGenes[index] == "") {
				vm.apiDomain.driverGenes[index].markerKey = "";
				vm.apiDomain.driverGenes[index].markerSymbol = "";
                                vm.apiDomain.driverGenes[index].organismKey = "";
				return;
			}

			if (vm.apiDomain.driverGenes[index].markerSymbol.includes("%")) {
				return;
			}

			var params = {};
			params.symbol = vm.apiDomain.driverGenes[index].markerSymbol;
			params.organismKey = vm.apiDomain.driverGenes[index].organismKey;

			ValidateMarkerAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Marker of Driver Gene: " + vm.apiDomain.driverGenes[index].markerSymbol);
					document.getElementById(id).focus();
					vm.apiDomain.driverGenes[index].markerKey = "";
					vm.apiDomain.driverGenes[index].markerSymbol = "";
                                        vm.apiDomain.driverGenes[index].organismKey = "";
				} else {
					console.log(data);
					vm.apiDomain.driverGenes[index].markerKey = data[0].markerKey;
					vm.apiDomain.driverGenes[index].markerSymbol = data[0].symbol;
                                        vm.apiDomain.driverGenes[index].organismKey = data[0].organismKey;
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateDriverGeneAPI.search");
				document.getElementById(id).focus();
				vm.apiDomain.driverGenes[index].markerKey = "";
				vm.apiDomain.driverGenes[index].markerSymbol = "";
                                vm.apiDomain.driverGenes[index].organismKey = "";
			});
		}

        	// validate mutant cell line
                // row = mutantCellLineAssocs[0].mutantCellLine
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
                                vm.apiDomain.strainOfOriginKey = "";
                                vm.apiDomain.strainOfOrigin = "";
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
                                        vm.apiDomain.strainOfOriginKey = "";
                                        vm.apiDomain.strainOfOrigin = "";
				} else {
      					row.cellLine = data[0].cellLine;
      					row.cellLineKey = data[0].cellLineKey;
      					row.cellLineTypeKey = data[0].cellLineTypeKey;
      					row.cellLineType = data[0].cellLineType;
      					row.strainKey = data[0].strainKey;
      					row.strain = data[0].strain;
                                        vm.apiDomain.strainOfOriginKey = data[0].strainKey;
                                        vm.apiDomain.strainOfOrigin = data[0].strain;
				}

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateParentCellLineAPI.search");
				document.getElementById(id).focus();
      				row.cellLineKey = "";
      				row.cellLineTypeKey = "";
      				row.cellLineType = "";
      				row.strainKey = "";
      				row.strain = "";
                                vm.apiDomain.strainOfOriginKey = "";
                                vm.apiDomain.strainOfOrigin = "";
			});
		}		

		// validate strain
		function validateStrainOfOrigin(id) {
			console.log("validateStrainOfOrigin()");

			if (vm.apiDomain.strainOfOrigin == undefined || vm.apiDomain.strainOfOrigin == "") {
				return;
			}

                        if (vm.apiDomain.strainOfOrigin.includes("%")) {
                                return;
                        }

			ValidateStrainAPI.search({strain: vm.apiDomain.strainOfOrigin}, function(data) {
				if (data.length == 0) {
                                        createStrain();
					//alert("Invalid Strain of Origin");
				} else {
					if (data[0].isPrivate == "1") {
						alert("This value is designated as 'private' and cannot be used: " + vm.apiDomain.strain);
						vm.apiDomain.strainOfOriginKey = "";
						vm.apiDomain.strainOfOrigin = "";
						document.getElementById(id).focus();
					}
					else {
						vm.apiDomain.strainOfOriginKey = data[0].strainKey;
						vm.apiDomain.strainOfOrigin = data[0].strain;
					}
				}

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateStrainOfOriginAPI.search");
				document.getElementById(id).focus();
			});
		}

		// create strain
		function createStrain() {
			console.log("createStrain");
			
			var newstrain = {};
			newstrain.strain = vm.apiDomain.strainOfOrigin;

			// process new strain if user responds OK
			if ($window.confirm("The item: \n\n'" + newstrain.strain + "' \n\ndoes not exist.\n\nTo add new item, click 'OK'\n\nElse, click 'Cancel'")) {
				newstrain.speciesKey = "481207";
				newstrain.strainTypeKey = "3410535";
				newstrain.standard = "0";
				newstrain.isPrivate = "0";
				newstrain.geneticBackground = "0";
				//console.log(newstrain);

				AlleleCreateStrainAPI.create(newstrain, function(data) {
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
						vm.apiDomain.strainOfOriginKey = "";
						vm.apiDomain.strainOfOrigin = "";
						document.getElementById("strainOfOrigin").focus();
					} else {
						console.log("ran AlleleCreateStrainAPI.create");
						vm.apiDomain.strainOfOriginKey = data.items[0].strainKey;
					}
				}, function(err) {
					pageScope.handleError(vm, "API ERROR: AlleleCreateStrainAPI.create");
				});
			}
			// do not clear strain, return to next field
			//else {
			//	vm.apiDomain.strainOfOriginKey = "";
			//	vm.apiDomain.strainOfOrigin = "";
			//	document.getElementById("strainOfOrigin").focus();
			//}
		}

		function validateImagePaneByMgiID(row, index, id) {
			console.log("validateImagePaneByMgiID = " + id + index);

			id = id + index;
			
			if (row.mgiID == undefined || row.mgiID == "") {
				row.imagePaneKey = "";
				row.mgiID = "";
				return;
			}

			if (row.mgiID.includes("%")) {
				return;
			}

			var params = {};
			params.mgiID = row.mgiID;
			validateImagePane(row, id, params);
		}

		function validateImagePaneByPixID(row, index, id) {
			console.log("validateImagePaneByPixID = " + id + index);

			id = id + index;
			
			if (row.pixID == undefined || row.pixID == "") {
				row.imagePaneKey = "";
				row.pixID = "";
				return;
			}

			if (row.pixID.includes("%")) {
				return;
			}

			var params = {};
			params.pixID = row.pixID;
			validateImagePane(row, id, params);
		}

		function validateImagePane(row, id, params) {
			console.log("validateImagePane");
			console.log(params);

			ValidateImagePaneAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Image Pane: " + row.mgiID + " " + row.pixID);
					document.getElementById(id).focus();
					row.imagePaneKey = "";
					row.figureLabel = "";
					row.imageClass = "";
					row.mgiID = "";
					row.pixID = "";
				} else {
					row.imagePaneKey = data[0].imagePaneKey;
					row.figureLabel = data[0].figureLabel;
					row.imageClass = data[0].imageClass;
					row.mgiID = data[0].mgiID;
					row.pixID = data[0].pixID;
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateImagePaneAPI.query");
				document.getElementById(id).focus();
				row.imagePaneKey = "";
				row.figureLabel = "";
				row.imageClass = "";
				row.mgiID = "";
				row.pixID = "";
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

		// if current strain of origin has changed
		function changeStrainOfOrigin() {
			console.log("changeStrainOfOrigin");
                        vm.changedMCLParentSOO = true;
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
                                vm.changedMCLParentSOO = true;
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

		/////////////////////////////////////////////////////////////////////
		// parent cell line lookup
		/////////////////////////////////////////////////////////////////////		
                
		// selected parent cell line row
		function selectParentCellLine(index) {
			console.log("selectParentCellLine(): " + index);
			vm.selectedParentCellLineIndex = index;
                        vm.apiDomain.mutantCellLineAssocs[0].mutantCellLine.derivation.parentCellLine = vm.parentCellLineLookup[vm.selectedParentCellLineIndex];
                        vm.apiDomain.strainOfOriginKey = vm.parentCellLineLookup[vm.selectedParentCellLineIndex].strainKey;
                        vm.apiDomain.strainOfOrigin = vm.parentCellLineLookup[vm.selectedParentCellLineIndex].strain;
                        changeParentCellLineRow();
		}		

		// if current parent cell line row 0 has changed
		function changeParentCellLineRow() {
			console.log("changeParentCellLineRow()");

                        // if mutant cell line is 'Not Specified' or empty, then
                        if ((vm.apiDomain.mutantCellLineAssocs[0].mutantCellLine.cellLine == 'Not Specified')
                                || (vm.apiDomain.mutantCellLineAssocs[0].mutantCellLine.cellLine == "")) {

			        if (vm.apiDomain.mutantCellLineAssocs[0].processStatus == "x") {
				        vm.apiDomain.mutantCellLineAssocs[0].processStatus = "u";
				        vm.apiDomain.mutantCellLineAssocs[0].mutantCellLine.processStatus = "u";
                                        vm.changedMCLParentSOO = true;
                                }
			        if (vm.apiDomain.mutantCellLineAssocs[0].processStatus == "c") {
				        vm.apiDomain.mutantCellLineAssocs[0].processStatus = "c";
				        vm.apiDomain.mutantCellLineAssocs[0].mutantCellLine.processStatus = "c";
				        vm.apiDomain.mutantCellLineAssocs[0].alleleKey = vm.apiDomain.alleleKey;
                                }

				vm.apiDomain.mutantCellLineAssocs[0].mutantCellLine.cellLineKey = "";
				vm.apiDomain.mutantCellLineAssocs[0].mutantCellLine.cellLine = "";
                                vm.apiDomain.mutantCellLineAssocs[0].mutantCellLine.derivation.derivationKey = "";
                                vm.apiDomain.mutantCellLineAssocs[0].mutantCellLine.derivation.creatorKey = "";
                                vm.apiDomain.mutantCellLineAssocs[0].mutantCellLine.derivation.creator = "";
			};
		}

		/////////////////////////////////////////////////////////////////////
		// synonyms
		/////////////////////////////////////////////////////////////////////		
		
		// add new synonyms row
		function addSynonymRow() {
			console.log("addSynonymRow()");

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
                        console.log("changeSynonymRow(): " + index);
			vm.selectedSynonymIndex = index;

                        if (vm.apiDomain.synonyms[index] == null) {
				vm.selectedSynonymIndex = 0;
                                return;
                        }

			if (vm.apiDomain.synonyms[index].processStatus != "d" 
                                && vm.apiDomain.synonyms[index].processStatus != "c") {
                                vm.apiDomain.synonyms[index].processStatus = "u";
                        };
		}

		// set current synonym row
		function selectSynonymRow(index) {
			console.log("selectSynonymRow(): " + index);
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
		function addSubtypeRow() {
			console.log("addSubtypeRow()");

			if (vm.apiDomain.subtypeAnnots == undefined) {
				vm.apiDomain.subtypeAnnots = [];
			}

			var i = vm.apiDomain.subtypeAnnots.length;

			vm.apiDomain.subtypeAnnots[i] = {
				"processStatus": "c",
                                "annotKey": "",
				"annotTypeKey":"1014",
				"objectKey":vm.apiDomain.alleleKey,
				"termKey":"",
				"term":"",
                                "qualifierKey": ""
			};
		}

		// if current subtype row has changed
		function changeSubtypeRow(index) {
                        console.log("changeSubtypeRow(): " + index);
			vm.selectedSubtypeIndex = index;

                        if (vm.apiDomain.subtypeAnnots[index] == null) {
				vm.selectedSubtypeIndex = 0;
                                return;
                        }

			if (vm.apiDomain.subtypeAnnots[index].processStatus != "d" 
                                && vm.apiDomain.subtypeAnnots[index].processStatus != "c") {
                                vm.apiDomain.subtypeAnnots[index].processStatus = "u";
                        };
		}

		// set current subtype row
		function selectSubtypeRow(index) {
			console.log("selectSubtypeRow(): " + index);
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
		function addMutationRow() {
			console.log("addMutationRow()");

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
                        console.log("changeMutationRow(): " + index);
			vm.selectedMutationIndex = index;

                        if (vm.apiDomain.mutations[index] == null) {
				vm.selectedMutationIndex = 0;
                                return;
                        }

			if (vm.apiDomain.mutations[index].processStatus != "d" 
                                && vm.apiDomain.mutations[index].processStatus != "c") {
                                vm.apiDomain.mutations[index].processStatus = "u";
                        };
		}

		// set current mutations row
		function selectMutationRow(index) {
			console.log("selectMutationRow(): " + index);
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
		function addDriverGeneRow() {
			console.log("addDriverGeneRow()");

			if (vm.apiDomain.driverGenes == undefined) {
				vm.apiDomain.driverGenes = [];
			}

			var i = vm.apiDomain.driverGenes.length;

                        if (i == 1) {
                                return;
                        }

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

		// if current driverGenes row has changed
		function changeDriverGeneRow(index, id) {
                        console.log("changeDriverGeneRow(): " + index);
			vm.selectedDriverGeneIndex = index;

                        if (vm.apiDomain.driverGenes[index] == null) {
				vm.selectedDriverGeneIndex = 0;
                                return;
                        }

			if (vm.apiDomain.driverGenes[index].processStatus == "x") {
                                vm.apiDomain.driverGenes[index].processStatus = "u";
		                validateDriverGene(index, id);
                        };
		}

		// set current driverGenes row
		function selectDriverGeneRow(index) {
			console.log("selectDriverGeneRow(): " + index);
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
		// image panes
		/////////////////////////////////////////////////////////////////////		
		
		// set current row
		function selectImagePaneRow(index) {
			console.log("selectImagePaneRow: " + index);
			vm.selectedImagePaneIndex = index;
		}

		// if current row has changed
		function changeImagePaneRow(index) {
			console.log("changeImagePaneRow: " + index);

			vm.selectedImagePaneIndex = index;

			if (vm.apiDomain.imagePaneAssocs[index] == null) {
				vm.selectedImagePaneIndex = 0;
				return;
			}

			if (vm.apiDomain.imagePaneAssocs[index].processStatus == "x") {
				vm.apiDomain.imagePaneAssocs[index].processStatus = "u";
			};
		}

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
      				"mgiTypeKey": "11",
      				"objectKey": vm.apiDomain.alleleKey,
      				"isPrimary": "",
      				"figureLabel": "",
      				"imageClass": "",
      				"mgiID": "",
      				"pixID": ""
    			}
		}		

		/////////////////////////////////////////////////////////////////////
		// marker detail clip
		/////////////////////////////////////////////////////////////////////		
                
		// add marker detail clip
		function addDetailClip() {
			console.log("addDetailClip()");

                        if (vm.apiDomain.detailClip != null) {
                                return;
                        }

			vm.apiDomain.detailClip = {
				"processStatus": "c",
				"markerKey": vm.apiDomain.markerKey,
                                "note": ""
			};
		}

		// clear marker detail clip
		function clearDetailClip() {
                        console.log("clearDetailClip()");

                        if (vm.apiDomain.detailClip == null) {
                                return;
                        }

			if (vm.apiDomain.detailClip.processStatus == "x") {
                                vm.apiDomain.detailClip.processStatus = "d";
                                vm.apiDomain.detailClip.note = "";
                        };
		}
		// if marker detail clip has changed
		function changeDetailClip() {
                        console.log("changeDetailClip()");

			if (vm.apiDomain.detailClip.processStatus == "x") {
                                if (vm.apiDomain.detailClip.note == null 
                                        || vm.apiDomain.detailClip.note == "") {
                                        vm.apiDomain.detailClip.processStatus = "d";
                                }
                                else {
                                        vm.apiDomain.detailClip.processStatus = "u";
                                }
                        };
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
		function hideShowIkmcNote() {
			vm.hideIkmcNote = !vm.hideIkmcNote;
		}
		function hideShowCreNote() {
			vm.hideCreNote = !vm.hideCreNote;
		}
		function hideShowProidNote() {
			vm.hideProidNote = !vm.hideProidNote;
		}
		function hideShowProjectidNote() {
			vm.hideProjectidNote = !vm.hideProjectidNote;
		}

		// add new note row
		function addNote(note, noteType) {
			console.log("addNote():" + note);

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
			if (noteType == "Ikmc") {
				noteTypeKey = "1041";
			}
			if (noteType == "Cre") {
				noteTypeKey = "1040";
			}
			if (noteType == "Proid") {
				noteTypeKey = "1036";
			}
			if (noteType == "Projectid") {
				noteTypeKey = "1052";
			}

			note = {
                                "processStatus": "c",
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
			if (noteType == "Ikmc") {
				vm.apiDomain.ikmcNote = note;
			}
			if (noteType == "Cre") {
				vm.apiDomain.creNote = note;
			}
			if (noteType == "Proid") {
				vm.apiDomain.proidNote = note;
			}
			if (noteType == "Projectid") {
				vm.apiDomain.projectidNote = note;
			}
		}

		function addNotes() {
			console.log("addNotes()");

			addNote(vm.apiDomain.generalNote, "General");
			addNote(vm.apiDomain.molecularNote, "Molecular");
			addNote(vm.apiDomain.nomenNote, "Nomenclature");
			addNote(vm.apiDomain.inducibleNote, "Inducible");
			addNote(vm.apiDomain.ikmcNote, "Ikmc");
			addNote(vm.apiDomain.creNote, "Cre");
			addNote(vm.apiDomain.proidNote, "Proid");
			addNote(vm.apiDomain.projectidNote, "Projectid");
		}

		// attach to inducible note
		function attachInducibleNote() {
			console.log("attachInducibleNote()");

                        if (vm.apiDomain.inducibleNote.noteChunk == null || vm.apiDomain.inducibleNote.noteChunk == "") {
			        vm.apiDomain.inducibleNote.noteChunk = vm.attachInducibleNote;
                        }
                        else {
			        vm.apiDomain.inducibleNote.noteChunk = 
                                        vm.apiDomain.inducibleNote.noteChunk + ", " + vm.attachInducibleNote;
                        }

			if (vm.apiDomain.inducibleNote.processStatus == "x") {
                                vm.apiDomain.inducibleNote.processStatus = "u";
                        }
		}

		/////////////////////////////////////////////////////////////////////
		// link outs
		/////////////////////////////////////////////////////////////////////		
                
		// link out to doannot using clipboard keys
                function doannotLink() {
			console.log("doannotLink");

			var params = [];

			if (vm.results.length > 0) {
				for(var i=0;i<vm.results.length; i++) {
					params.push(vm.results[i].alleleKey);
				}
			}
			else {
				params.push("0");
			}

			console.log(params);
                        var doannotUrl = pageScope.url_for('pwi.doalleleannot', '?searchKeys=' + params.join(","));
			console.log(doannotUrl);

                        window.open(doannotUrl, '_blank');
                }

                function mutantCellLineLink() {
			console.log("mutantCellLineLink");
                        var mclUrl = pageScope.url_for('pwi.mutantcellline', '');
			console.log(mclUrl);
                        window.open(mclUrl, '_blank');
                }

                function nonmutantCellLineLink() {
			console.log("nonmutantCellLineLink");
                        var nonmclUrl = pageScope.url_for('pwi.nonmutantcellline', '');
			console.log(nonmclUrl);
                        window.open(nonmclUrl, '_blank');
                }

		// link out to relationships using clipboard keys
                function relationshipsLink() {
			console.log("relationshipsLink");

			var params = [];

			if (vm.results.length > 0) {
				for(var i=0;i<vm.results.length; i++) {
					params.push(vm.results[i].alleleKey);
				}
			}
			else {
				params.push("0");
			}

			console.log(params);
                        var relationshipsUrl = pageScope.url_for('pwi.allelefear', '?searchKeys=' + params.join(","));
			console.log(relationshipsUrl);

                        window.open(relationshipsUrl, '_blank');
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
                $scope.changeStrainOfOrigin = changeStrainOfOrigin;
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
		$scope.addImagePaneRow = addImagePaneRow;
		$scope.changeImagePaneRow = changeImagePaneRow;
		$scope.selectImagePaneRow = selectImagePaneRow;
		$scope.clearDetailClip = clearDetailClip;
		$scope.changeDetailClip = changeDetailClip;
                $scope.doannotLink = doannotLink;
                $scope.mutantCellLineLink = mutantCellLineLink;
                $scope.nonmutantCellLineLink = nonmutantCellLineLink;
                $scope.relationshipsLink = relationshipsLink;
		$scope.attachInducibleNote = attachInducibleNote;

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
		$scope.hideShowProjectidNote = hideShowProjectidNote;

		// other functions: buttons, onBlurs and onChanges
		$scope.selectResult = selectResult;
                $scope.selectParentCellLine = selectParentCellLine;
		$scope.validateJnum = validateJnum;
		$scope.validateMarker = validateMarker;
		$scope.validateDriverGene = validateDriverGene;
		$scope.validateMutantCellLine = validateMutantCellLine;
		$scope.validateParentCellLine = validateParentCellLine;
		$scope.validateStrainOfOrigin = validateStrainOfOrigin;
		$scope.validateImagePaneByMgiID = validateImagePaneByMgiID;
		$scope.validateImagePaneByPixID = validateImagePaneByPixID;
		
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

