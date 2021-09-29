(function() {
	'use strict';
	angular.module('pwi.assay').controller('AssayController', AssayController);

	function AssayController(
			// angular tools
			$document,
			$filter,
			$http,  
			$q,
			$scope, 
			$timeout,
			$window, 
			// assay purpose utilities
			ErrorMessage,
			FindElement,
			Focus,
			// resource APIs
			AssaySearchAPI,
			AssayGetAPI,
			AssayCreateAPI,
			AssayUpdateAPI,
			AssayDeleteAPI,
			AssayTotalCountAPI,
                        GenotypeBySetUserAPI,
                        ImagePaneByReferenceAPI,
                        EmapaInSituBySetUserAPI,
                        EmapaGelBySetUserAPI,
                        AddToEmapaClipboardAPI,
                        ReplaceGenotypeAPI,
			// global APIs
                        ValidateMarkerAPI,
                        ValidateJnumAPI,
                        ValidateAntibodyAPI,
                        ValidateAntibodyMarkerAPI,
                        ValidateProbeAPI,
                        ValidateProbeMarkerAPI,
                        ValidateGenotypeAPI,
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
		vm.selectedSpecimenIndex = 0;
		vm.selectedSpecimenResultIndex = 0;
		vm.selectedGelLaneIndex = 0;
		
                // if new vm.apiDomain.specimens[i].sresults[j] new but vm.apiDomain.specimens[i] new is not complete
                // then true, else false
                // set during changeSpecimenRow, changeSpecimenResult
                // used during create/modify
                //vm.specimenResultsAlert = false;
                 
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		// Initializes the needed page values 
                this.$onInit = function () { 
                        console.log("onInit")
                };

                this.$postLink = function () { 
                        console.log("postLink")
			resetData();
			refreshTotalCount();
                        clearReplaceGenotype(false, '');
			loadVocabs();
                        loadGenotype();
                        loadImagePane();
                        loadEmapa();
                        setFocus();
                };

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        	// mapped to 'Clear' button; reset page
		function clear() {		
			resetData();
                        refreshTotalCount();
                        clearReplaceGenotype(false, '');
			loadGenotype();
                        loadImagePane();
                        loadEmapa();
			setFocus();
		}		

		// mapped to query 'Search' button
		// default is to select first result
		function search() {				
			console.log("search()");
		
			pageScope.loadingStart();
			
                        //stDeleteProperties();

			AssaySearchAPI.search(vm.apiDomain, function(data) {
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
			        pageScope.handleError(vm, "API ERROR: AssaySearchAPI.search");
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
				//vm.apiDomain = {};
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
			resetDataDeselect();
                        loadGenotype();
                        loadImagePane();
                        loadEmapa();
			setFocus();
		}
	
		// refresh the total count
                function refreshTotalCount() {
                        AssayTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////
		
        	// create
		function create() {
			console.log("create() -> AssayCreateAPI()");

			// verify if record selected
			if (vm.selectedIndex >= 0) {
				alert("Cannot Add if a record is already selected.");
                                return;
			}

                        if (vm.apiDomain.assayTypeKey == "") {
				alert("Required Field:  Assay Type");
                                return;
			}
                        if (vm.apiDomain.detectionKey == "2" && vm.apiDomain.antibodyPrep.antibodyKey == "") {
				alert("Required Field:  Antibody Prep");
                                return;
			}
                        if (vm.apiDomain.detectionKey == "1" && vm.apiDomain.probePrep.probeKey == "") {
				alert("Required Field:  Probe Prep");
                                return;
			}
                        if (vm.apiDomain.detectionKey == "") {
				alert("Required Field:  Detection Method");
                                return;
			}

                        // remove extra/blank specimen rows
                        // verify agePrefix/ageStage
                        if (vm.apiDomain.isInSitu == true) {
                                for(var i=0;i<vm.apiDomain.specimens.length;i++) {
        
                                        if (
                                                vm.apiDomain.specimens[i].processStatus == "c" &&
                                                vm.apiDomain.specimens[i].specimenLabel == ""
                                        ) {
                                                vm.apiDomain.specimens.splice(i, 1);
                                                continue;
                                        }
                                        else if (vm.apiDomain.specimens[i].processStatus == "d") {
                                                continue;
                                        }

                                        // default agePrefix
                                        else if (vm.apiDomain.specimens[i].agePrefix == "") {
                                                vm.apiDomain.specimens[i].agePrefix = "embryonic day";
                                        }

                                        if (
                                        (
                                                vm.apiDomain.specimens[i].agePrefix == "embryonic day" ||
                                                vm.apiDomain.specimens[i].agePrefix == "postnatal day" ||
                                                vm.apiDomain.specimens[i].agePrefix == "postnatal week" ||
                                                vm.apiDomain.specimens[i].agePrefix == "postnatal month" ||
                                                vm.apiDomain.specimens[i].agePrefix == "postnatal year"
                                                )
                                                && vm.apiDomain.specimens[i].ageStage == ""
                                        ) {
				                alert("Invalid Age Value: " + vm.apiDomain.specimens[i].agePrefix);
				                document.getElementById('sageStage-' + i).focus();
                                                return;
                                        }
                                }
                        }
                        else {
                                for(var i=0;i<vm.apiDomain.gelLanes.length;i++) {
        
                                        if (
                                                vm.apiDomain.gelLanes[i].processStatus == "c" &&
                                                vm.apiDomain.gelLanes[i].gelControlKey == ""
                                        ) {
                                                vm.apiDomain.gelLanes.splice(i, 1);
                                                continue;
                                        }
                                        else if (vm.apiDomain.gelLanes[i].processStatus == "d") {
                                                continue;
                                        }

                                        // default agePrefix
                                        if (vm.apiDomain.gelLanes[i].agePrefix == "") {
                                                vm.apiDomain.gelLanes[i].agePrefix = "embryonic day";
                                        }

                                        if (
                                        (
                                                vm.apiDomain.gelLanes[i].agePrefix == "embryonic day" ||
                                                vm.apiDomain.gelLanes[i].agePrefix == "postnatal day" ||
                                                vm.apiDomain.gelLanes[i].agePrefix == "postnatal week" ||
                                                vm.apiDomain.gelLanes[i].agePrefix == "postnatal month" ||
                                                vm.apiDomain.gelLanes[i].agePrefix == "postnatal year"
                                                )
                                                && vm.apiDomain.gelLanes[i].ageStage == ""
                                        ) {
				                alert("Invalid Age Value: " + vm.apiDomain.gelLanes[i].agePrefix);
				                document.getElementById('gageStage-' + i).focus();
                                                allowModify = false;
                                                return;
                                        }
                                }
                        }

			pageScope.loadingStart();

			AssayCreateAPI.create(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					vm.apiDomain = data.items[0];
                                        vm.selectedIndex = vm.results.length;
                                        vm.results[vm.selectedIndex] = [];
                                        vm.results[vm.selectedIndex].assayKey = vm.apiDomain.assayKey;
                                        vm.results[vm.selectedIndex].assayDisplay = vm.apiDomain.assayDisplay;
					loadObject();
					refreshTotalCount();
				}
				pageScope.loadingEnd();
                                setFocus();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AssayCreateAPI.create");
				pageScope.loadingEnd();
                                setFocus();
			});
		}		

        	// modify
		function modify() {
			console.log("modify() -> AssayUpdateAPI()");

			// verify if record selected
                        if (vm.selectedIndex < 0) {
				alert("Cannot Modify if a record is already selected.");
                                return;
			}

                        if (vm.apiDomain.assayTypeKey == "") {
				alert("Required Field:  Assay Type");
                                return;
			}
                        if (vm.apiDomain.detectionKey == "2" && vm.apiDomain.antibodyPrep.antibodyKey == "") {
				alert("Required Field:  Antibody Prep");
                                return;
			}
                        if (vm.apiDomain.detectionKey == "1" && vm.apiDomain.probePrep.probeKey == "") {
				alert("Required Field:  Probe Prep");
                                return;
			}
                        if (vm.apiDomain.detectionKey == "") {
				alert("Required Field:  Detection Method");
                                return;
			}

                        // remove extra/blank specimen rows
                        // verify agePrefix/ageStage
                        if (vm.apiDomain.isInSitu == true) {
                                for(var i=0;i<vm.apiDomain.specimens.length;i++) {
        
                                        if (
                                                vm.apiDomain.specimens[i].processStatus == "c" &&
                                                vm.apiDomain.specimens[i].specimenLabel == ""
                                        ) {
                                                // if vm.apiDomain.specimens[i].sresults being added, then alert
                                                for(var j=0;j<vm.apiDomain.specimens[i].sresults.length;j++) {
                                                        if (
                                                                vm.apiDomain.specimens[i].sresults[j].processStatus == "c"
                                                                && vm.apiDomain.specimens[i].sresults[j].strengthKey != ""
                                                                && vm.apiDomain.specimens[i].sresults[j].patternKey != ""
                                                        ) {
                                                            alert("A specimen record does not exist on this row. Add the specimen record, then enter the results");
                                                            return;
                                                        }
                                                }
                                                // else, splice out and continue
                                                vm.apiDomain.specimens.splice(i, 1);
                                                continue;
                                        }
                                        else if (vm.apiDomain.specimens[i].processStatus == "d") {
                                                continue;
                                        }

                                        // default agePrefix
                                        else if (vm.apiDomain.specimens[i].agePrefix == "") {
                                                vm.apiDomain.specimens[i].agePrefix = "embryonic day";
                                        }

                                        if (
                                        (
                                                vm.apiDomain.specimens[i].agePrefix == "embryonic day" ||
                                                vm.apiDomain.specimens[i].agePrefix == "postnatal day" ||
                                                vm.apiDomain.specimens[i].agePrefix == "postnatal week" ||
                                                vm.apiDomain.specimens[i].agePrefix == "postnatal month" ||
                                                vm.apiDomain.specimens[i].agePrefix == "postnatal year"
                                                )
                                                && vm.apiDomain.specimens[i].ageStage == ""
                                        ) {
				                alert("Invalid Age Value: " + vm.apiDomain.specimens[i].agePrefix);
				                document.getElementById('sageStage-' + i).focus();
                                                return;
                                        }
                                }
                        }
                        else {
                                for(var i=0;i<vm.apiDomain.gelLanes.length;i++) {
        
                                        if (
                                                vm.apiDomain.gelLanes[i].processStatus == "c" &&
                                                vm.apiDomain.gelLanes[i].gelControlKey == ""
                                        ) {
                                                vm.apiDomain.gelLanes.splice(i, 1);
                                                continue;
                                        }
                                        else if (vm.apiDomain.gelLanes[i].processStatus == "d") {
                                                continue;
                                        }

                                        // default agePrefix
                                        if (vm.apiDomain.gelLanes[i].agePrefix == "") {
                                                vm.apiDomain.gelLanes[i].agePrefix = "embryonic day";
                                        }

                                        if (
                                        (
                                                vm.apiDomain.gelLanes[i].agePrefix == "embryonic day" ||
                                                vm.apiDomain.gelLanes[i].agePrefix == "postnatal day" ||
                                                vm.apiDomain.gelLanes[i].agePrefix == "postnatal week" ||
                                                vm.apiDomain.gelLanes[i].agePrefix == "postnatal month" ||
                                                vm.apiDomain.gelLanes[i].agePrefix == "postnatal year"
                                                )
                                                && vm.apiDomain.gelLanes[i].ageStage == ""
                                        ) {
				                alert("Invalid Age Value: " + vm.apiDomain.gelLanes[i].agePrefix);
				                document.getElementById('gageStage-' + i).focus();
                                                return;
                                        }

                                        // Gel Band defaults/checks
                                        if (vm.apiDomain.gelLanes[i].gelBands != null) {
                                                for(var j=0;j<vm.apiDomain.gelLanes[i].gelBands.length;j++) {
                                                        //if gelLane/control != No, set gelBands.strengthKey = -2 (Not Applicable)
                                                        if (
                                                                vm.apiDomain.gelLanes[i].gelControlKey != "1"
                                                                && vm.apiDomain.gelLanes[i].gelBands[j].strengthKey == ""
                                                        ) {
                                                                vm.apiDomain.gelLanes[i].gelBands[j].strengthKey = "-2";
                                                                changeGelBandRow(i, j);
                                                        }
                                                }
                                        }
                                }

                                for(var i=0;i<vm.apiDomain.gelLanes.length;i++) {
                                        for(var j=0;j<vm.apiDomain.gelLanes[i].gelBands.length;j++) {
                                                if (vm.apiDomain.gelLanes[i].gelBands[j].strengthKey == "") {
				                        alert("Gel Band Strength must be selected: " + vm.apiDomain.gelLanes[i].laneLabel);
                                                        return;
                                                }
                                        }
                                }

                                for(var i=0;i<vm.apiDomain.gelRows.length;i++) {
                                        // default Gel Units = Not Specified (-1)
                                        if (vm.apiDomain.gelRows[i].gelUnitsKey == "") {
                                                vm.apiDomain.gelRows[i].gelUnitsKey = "-1";
                                                changeGelRow(i);
                                        }
                                }
                        }

			pageScope.loadingStart();

			AssayUpdateAPI.update(vm.apiDomain, function(data) {
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
				pageScope.handleError(vm, "API ERROR: AssayUpdateAPI.update");
				pageScope.loadingEnd();
                                setFocus();
			});
		}		
		
        	// delete
		function deleteIt() {
			console.log("deleteIt() -> AssayDeleteAPI() : " + vm.selectedIndex);

			// check if record selected
			if (vm.selectedIndex < 0) {
				alert("Cannot Delete if a record is not selected.");
				return;
			}

			if ($window.confirm("Are you sure you want to delete this record?")) {
			
				pageScope.loadingStart();

				AssayDeleteAPI.delete({key: vm.apiDomain.assayKey}, function(data) {
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
					pageScope.handleError(vm, "API ERROR: AssayDeleteAPI.delete");
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
			scrollToObject("resultTableWrapper", "#resultsTable");
		}
		
		function nextSummaryObject() {
			console.log("nextSummaryObject()");
			if(vm.results.length == 0) return;
			if(vm.selectedIndex + 1 >= vm.results.length) return;
			vm.selectedIndex++;
			loadObject();
			scrollToObject("resultTableWrapper", "#resultsTable");
		}		

	    	function firstSummaryObject() {
			console.log("firstSummaryObject()");
	        	if(vm.results.length == 0) return;
	        	vm.selectedIndex = 0;
			loadObject();
			scrollToObject("resultTableWrapper", "#resultsTable");
	      	}

	    	function lastSummaryObject() {
			console.log("lastSummaryObject()");
	        	if(vm.results.length == 0) return;
	        	vm.selectedIndex = vm.results.length - 1;
			loadObject();
			scrollToObject("resultTableWrapper", "#resultsTable");
	      	}

	    	// ensure we keep the selected row in view
		function scrollToObject(targetWrapper, targetTable) {
			$q.all([
			   FindElement.byId(targetWrapper),
			   FindElement.byQuery(targetTable + " .selectedRow")
			 ]).then(function(elements) {
				 var table = angular.element(elements[0]);
				 var selected = angular.element(elements[1]);
				 var offset = 30;
				 table.scrollToElement(selected, offset, 0);
			 });
                         // turn off to prevent screen from moving up
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
                        resetDataDeselect();
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");

                        var saveIsInSitu = true;
                        var saveIsReporter = false;
                        var saveIsGel = false;
                        var saveIsAntibodyPrep = false;
                        var saveIsProbePrep = true;

		        vm.selectedSpecimenIndex = 0;
		        vm.selectedSpecimenResultIndex = 0;
		        vm.selectedGelLaneIndex = 0;
                        resetBoolean();

                        // use current assay type
                        if (vm.apiDomain.isInSitu != null) {
                                saveIsInSitu = vm.apiDomain.isInSitu;
                                saveIsReporter = vm.apiDomain.isReporter;
                                saveIsGel = vm.apiDomain.isGel;

                                if (vm.apiDomain.isAntibodyPrep == false && vm.apiDomain.isProbePrep == false) {
                                        saveIsAntibodyPrep = false;
                                        saveIsProbePrep = true;
                                }
                                else {
                                        saveIsAntibodyPrep = vm.apiDomain.isAntibodyPrep;
                                        saveIsProbePrep = vm.apiDomain.isProbePrep;
                                }
                        }

                        vm.apiDomain = {};
			vm.apiDomain.assayKey = "";	
			vm.apiDomain.assayDisplay = "";	
                        vm.apiDomain.assayTypeKey = "";
                        vm.apiDomain.assayType = "";
                        vm.apiDomain.isInSitu = saveIsInSitu;
                        vm.apiDomain.isReporter = saveIsReporter;
                        vm.apiDomain.isGel = saveIsGel;
                        vm.apiDomain.isAntibodyPrep = saveIsAntibodyPrep;
                        vm.apiDomain.isProbePrep = saveIsProbePrep;
                        vm.apiDomain.markerKey = "";
                        vm.apiDomain.markerSymbol = "";
                        vm.apiDomain.refsKey = "";
                        vm.apiDomain.jnumid = "";
                        vm.apiDomain.jnum = "";
                        vm.apiDomain.short_citation = "";
                        vm.apiDomain.accID = "";   
                        vm.apiDomain.imagePaneKey = "";
                        vm.apiDomain.reporterGeneKey = "";
                        vm.apiDomain.reporterGeneTerm = "";
                        vm.apiDomain.detectionKey = "";
			vm.apiDomain.createdBy = "";
			vm.apiDomain.creation_date = "";
			vm.apiDomain.modifiedBy = "";
			vm.apiDomain.modification_date = "";
                        vm.apiDomain.antibodyPrep = null;
                        vm.apiDomain.probePrep = null;
                        vm.apiDomain.assayNote = null;
                        vm.apiDomain.specimens = null;
                        vm.apiDomain.gelLanes = null;
                        vm.apiDomain.gelRows = null;

                        addAntibodyPrep();
                        addProbePrep();
                        addAssayNote();

                        for(var i=0;i<24; i++) {
                                addSpecimenRow();
                        }
                        for(var i=0;i<20; i++) {
                                addGelLaneRow(false);
                        }
                        addGelRow(true);
		}

		// reset booleans
	        function resetBoolean() {
			vm.hideErrorContents = true;
                        vm.hideAssayNote = true;
                        vm.activeReplaceGenotype = false;
		}

                // set to Specimen or to Results
		function setSpecimenOrResults() {
                        console.log("setSpecimenOrResults()");

                        var id = document.activeElement.id;
                        console.log("setSpecimenOrResults():" + id);
                        if (
                                id.includes("structure") ||
                                id.includes("strength") ||
                                id.includes("pattern") ||
                                id.includes("imagePane") ||
                                id.includes("resultNote")
                                )
                        {
                                changeSpecimenRow(vm.selectedSpecimenIndex, true);
                        }
                        else {
		                changeSpecimenResultRow(vm.selectedSpecimenResultIndex, true);
                        }
		}

		// load vocabularies
                function loadVocabs() {
                        console.log("loadVocabs()");

			vm.labelLookup = {};
			VocTermSearchAPI.search({"vocabKey":"152"}, function(data) { vm.labelLookup = data.items[0].terms});;

			vm.visualizationLookup = {};
			VocTermSearchAPI.search({"vocabKey":"157"}, function(data) { vm.visualizationLookup = data.items[0].terms});;

			vm.assayTypeLookup = {};
			VocTermSearchAPI.search({"vocabKey":"158"}, function(data) { vm.assayTypeLookup = data.items[0].terms});;

			vm.probeSenseLookup = {};
			VocTermSearchAPI.search({"vocabKey":"159"}, function(data) { vm.probeSenseLookup = data.items[0].terms});;

			vm.secondaryLookup = {};
			VocTermSearchAPI.search({"vocabKey":"160"}, function(data) { vm.secondaryLookup = data.items[0].terms});;

			vm.reporterGeneLookup = {};
			VocTermSearchAPI.search({"vocabKey":"14"}, function(data) { vm.reporterGeneLookup = data.items[0].terms});;

                        vm.ageLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"161"}, function(data) { vm.ageLookup = data.items[0].terms});;

                        vm.genderLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"17"}, function(data) { 
                                vm.genderLookup = data.items[0].terms;
			        for(var i=0;i<vm.genderLookup.length; i++) {
                                        if (vm.genderLookup[i].term == 'Not Resolved') {
                                                vm.genderLookup.splice(i, 1);
                                        }
                                }
                        });;

                        vm.fixationLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"156"}, function(data) { vm.fixationLookup = data.items[0].terms});;

                        vm.embeddingLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"155"}, function(data) { vm.embeddingLookup = data.items[0].terms});;

                        vm.hybridizationLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"162"}, function(data) { vm.hybridizationLookup = data.items[0].terms});;

                        vm.strengthLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"163"}, function(data) { 
                                vm.strengthLookup = data.items[0].terms;
			        for(var i=0;i<vm.strengthLookup.length; i++) {
                                        if (vm.strengthLookup[i].term == 'Not Applicable') {
                                                vm.strengthLookup.splice(i, 1);
                                        }
                                }
			        for(var i=0;i<vm.strengthLookup.length; i++) {
                                        if (vm.strengthLookup[i].term == 'Not Specified') {
                                                vm.strengthLookup.splice(i, 1);
                                        }
                                }
                        });;

                        vm.patternLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"153"}, function(data) { vm.patternLookup = data.items[0].terms});;

                        vm.gelControlLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"154"}, function(data) { vm.gelControlLookup = data.items[0].terms});;

                        vm.gelRNATypeLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"172"}, function(data) { vm.gelRNATypeLookup = data.items[0].terms});;

                        vm.gelUnitsLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"173"}, function(data) { vm.gelUnitsLookup = data.items[0].terms});;

                        vm.gelStrengthLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"163"}, function(data) { vm.gelStrengthLookup = data.items[0].terms; });;

			vm.detectionLookup = {};
                        vm.detectionLookup[0] = {
                                "termKey": "1",
                                "term": "nucleotide"
                        }
                        vm.detectionLookup[1] = {
                                "termKey": "2",
                                "term": "antibody"
                        }
                        vm.detectionLookup[2] = {
                                "termKey": "3",
                                "term": "direct detection"
                        }

			vm.probeprepTypeLookup = {};
                        vm.probeprepTypeLookup[0] = {
                                "termKey": "1",
                                "term": "DNA"
                        }
                        vm.probeprepTypeLookup[1] = {
                                "termKey": "2",
                                "term": "RNA"
                        }
                        vm.probeprepTypeLookup[2] = {
                                "termKey": "3",
                                "term": "Not Specified"
                        }

                        vm.imagePaneLookup = {}
                        // see loadObject
                        //
                        
                        vm.emapaLookup = {}
                        // see loadObject
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

			AssayGetAPI.get({ key: vm.results[vm.selectedIndex].assayKey }, function(data) {

				vm.apiDomain = data;
				vm.apiDomain.assayKey = vm.results[vm.selectedIndex].assayKey;

                                addAssayNote();
                                addAntibodyPrep();
                                addProbePrep();
				vm.results[vm.selectedIndex].assayDisplay = vm.apiDomain.assayDisplay;

                                if (vm.apiDomain.isInSitu == true) {
			                vm.selectedSpecimenIndex = 0;
                                        selectSpecimenRow(0);
                                        var newSpecimenRows = 10;

			                if (vm.apiDomain.specimens == null) {
				                vm.apiDomain.specimens = [];
                                                newSpecimenRows = 24;
			                }
			                for(var i=0;i<vm.apiDomain.specimens.length; i++) {
                                                for(var j=0;j<8; j++) {
                                                        addSpecimenResultRow(i);
                                                }
                                        }
                                        for(var i=0;i<newSpecimenRows; i++) {
                                                addSpecimenRow();
                                        }

                                        setTimeout(function() {
                                                if (vm.apiDomain.specimens != null) {
                                                        loadImagePane();
                                                        document.getElementById("specimenLabel-0").focus({preventScroll:true});
                                                }
                                        }, (300));
                                }
                                else {
			                vm.selectedGelLaneIndex = 0;
                                        selectGelLaneRow(0);
                                        var newGelLaneRows = 1;

			                if (vm.apiDomain.gelLanes == null) {
				                vm.apiDomain.gelLanes = [];
                                                newGelLaneRows = 20;
			                }
                                        for(var i=0;i<newGelLaneRows; i++) {
                                                addGelLaneRow(true);
                                        }
                                        if (vm.apiDomain.gelRows == null) {
                                                addGelRow(false);
                                        }
                                        // gelBands.sequenceNum must be not null
			                for(var i=0;i<vm.apiDomain.gelLanes.length; i++) {
			                        for(var j=0;j<vm.apiDomain.gelLanes[i].gelBands.length; j++) {
                                                        if (vm.apiDomain.gelLanes[i].gelBands[j].sequenceNum == null) {
                                                                vm.apiDomain.gelLanes[i].gelBands[j].sequenceNum = vm.apiDomain.gelRows[j].sequenceNum;
                                                        }
                                                }
                                        }
                                        setTimeout(function() {
                                                if (vm.apiDomain.gelLanes != null) {
                                                        loadImagePane();
                                                        document.getElementById("laneLabel-0").focus({preventScroll:true});
                                                }
                                        }, (300));
                                }
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AssayGetAPI.get");
			});
		}	
		
		// when an object is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove object, if it exists)
			removeSearchResultsItem(vm.apiDomain.assayKey);

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
				if (vm.results[i].assayKey == keyToRemove) {
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
                                document.getElementById("jnumID").focus({preventScroll:false});
                        }, (300));
		}

                // set next row for specimen
		function setSpecimenNextRow(event, index) {
			console.log("setSpecimenNextRow: " + index);
                        setNextRow(event, index, vm.apiDomain.specimens.length, vm.selectedSpecimenIndex, "specimenLabel-");
                }

                // set next row for specimen results
		function setSpecimenResultNextRow(event, index) {
			console.log("setSpecimenResultNextRow: " + index);
                        setNextRow(event, index, vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults.length, vm.selectedSpecimenResultIndex, "sstructure-");
                }

                // set next row for gel lane
		function setGelLaneNextRow(event, index) {
			console.log("setGelLaneNextRow: " + index);
                        setNextRow(event, index, vm.apiDomain.gelLanes.length, vm.selectedGelLaneIndex, "laneLabel-");
                }

                // set next row for gel band
		function setGelBandNextRow(event, gellaneindex, gelbandindex) {
			console.log("setGelBandNextRow: " + gellaneindex + "," + gelbandindex);
			console.log("setGelBandNextRow: " + vm.apiDomain.gelLanes.length + "," + vm.apiDomain.gelRows.length);
                        if (gellaneindex == vm.apiDomain.gelLanes.length-1 && gelbandindex == vm.apiDomain.gelRows.length) {
                                setNextRow(event, gelbandindex, vm.apiDomain.gelRows.length, 0, "size-");
                        }
                }

                // set next row
		function setNextRow(event, index, tblDomainLength, tblIndex, tblLabel) {
			console.log("setNextRow: " + index + ", " + tblDomainLength + ", " + tblIndex);
			//console.log(event);

                        // if the key pressed was not a TAB, do nothing and return.
                        if (event.keyCode !== 9) {
                                return;
                        }
                        // if shift-tab/tab, return
                        if (event.shiftKey && event.keyCode == 9) {
                                return;
                        }

                        if (tblLabel == "size-") {
			        tblIndex = 0;
                        }
                        else if (tblDomainLength - 1 == index) {
			        tblIndex = 0;
                        }
                        else {
			        tblIndex = tblIndex + 1;
                        }

                        var firstLabel = tblLabel + tblIndex;
			document.getElementById(firstLabel).focus({preventScroll:false});
                        document.getElementById(firstLabel).scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
                        event.stopPropagation()
                        event.preventDefault()

                        if (tblLabel == "specimenLabel-") {
                                selectSpecimenRow(tblIndex);
                        }
                        else if (tblLabel == "sstructure-") {
                                selectSpecimenResultRow(tblIndex);
                        }
                        else if (tblLabel == "laneLabel-") {
                                selectGelLaneRow(tblIndex);
                        }
                        //do nothing
                        //else if (tblLabel == "size-") {
                        //}
                }

		/////////////////////////////////////////////////////////////////////
                // sorting
		/////////////////////////////////////////////////////////////////////
                
                vm.sortSpecimenTableOrder = "desc";

                // sort specimen table
                function sortSpecimenTable(id) {
			console.log("sortSpecimenTable: " + id);

                        vm.apiDomain.specimens.sort(sortTable(id, vm.sortSpecimenTableOrder));

                        if (vm.sortSpecimenTableOrder == "desc") {
                                vm.sortSpecimenTableOrder = "asc";
                        }
                        else if (vm.sortSpecimenTableOrder == "asc") {
                                vm.sortSpecimenTableOrder = "desc";
                        }
                }

                vm.sortGelLaneTableOrder = "desc";

                // sort gellane table
                function sortGelLaneTable(id) {
			console.log("sortGelLaneTable: " + id);

                        vm.apiDomain.gelLanes.sort(sortTable(id, vm.sortGelLaneTableOrder));

                        if (vm.sortGelLaneTableOrder == "desc") {
                                vm.sortGelLaneTableOrder = "asc";
                        }
                        else if (vm.sortGelLaneTableOrder == "asc") {
                                vm.sortGelLaneTableOrder = "desc";
                        }
                }

                // sort table by specified id, order
                function sortTable(id, order) {
                        var sort_order = 1;

                        if (order === "desc"){
                                sort_order = -1;
                        }

                        return function (a, b){

                                if (id == "sequenceNum") {
                                        // a should come before b in the sorted order
                                        if (a[id] < b[id]) {
                                                return -1 * sort_order;
                                        // a should come after b in the sorted order
                                        } else if(a[id] > b[id]) {
                                                return 1 * sort_order;
                                        // a and b are the same
                                        } else{
                                                return 0 * sort_order;
                                        }
                                }
                                else {
                                        // a and b are the same
                                        if (a[id] == null || b[id] == null) {
                                                return 0 * sort_order;
                                        }
                                        // a should come before b in the sorted order
                                        else if (a[id].toLowerCase() < b[id].toLowerCase()) {
                                                return -1 * sort_order;
                                        // a should come after b in the sorted order
                                        } else if(a[id].toLowerCase() > b[id].toLowerCase()) {
                                                return 1 * sort_order;
                                        // a and b are the same
                                        } else{
                                                return 0 * sort_order;
                                        }
                                }
                        }
                }
        
                //
                // table header functions
                // to handle collapsing/uncollapsing table header/columns
                //
                
                // removes 'collapse' from all table headers
                function showAllColumns(tbl) {
                        console.log("showAllColumns():" + tbl);

                        var id = document.getElementById(tbl);

                        for (var i = 1; i <= 100; i++) {
                                id.classList.remove('collapse' + i)
                        }
                }

                // collapses columns for table header target
                function collapseColumnHandler (event) {
                        console.log("collapseColumnHandler");

                        const th = event.target.closest('th')
                        const t = th.closest('table[id]')
                        var i = th.cellIndex + 1
                        t.classList.toggle('collapse' + i)
                }

		/////////////////////////////////////////////////////////////////////
		//
                // probePrep
		// antibodyPrep
                //
                // probePrep (1)
                //              1 | RNA in situ
                //              2 | Northern blot
                //              3 | Nuclease S1
                //              4 | RNase protection
                //              5 | RT-PCR
                //
                // antibodyPrep (2)
                //              6 | Immunohistochemistry
                //              8 | Western blot
                //
                // reporters/may be nucleotide (1), antibody (2) or direct detection (3)
                //              9 | In situ reporter (knock in)
                //              10 | In situ reporter (transgenic)
                //              11 | Recombinase reporter
                //
		/////////////////////////////////////////////////////////////////////		

		// change assay type
		function changeAssayType() {
			console.log("changeAssayType()");

                        // assayType
                        if (
                                vm.apiDomain.assayTypeKey == "2" ||
                                vm.apiDomain.assayTypeKey == "3" ||
                                vm.apiDomain.assayTypeKey == "4" ||
                                vm.apiDomain.assayTypeKey == "5" ||
                                vm.apiDomain.assayTypeKey == "8"
                        ) {        
                                if (vm.apiDomain.assayKey != "" && vm.apiDomain.isInSitu == true) {
			                alert("Cannot change Assay Type from InSitu to Gel, or from Gel to InSitu");
				        loadObject();
                                        return;
                                }
                                vm.apiDomain.isInSitu = false;
                                vm.apiDomain.isGel = true;
                        }
                        else if (
                                vm.apiDomain.assayTypeKey == "1" ||
                                vm.apiDomain.assayTypeKey == "6" ||
                                vm.apiDomain.assayTypeKey == "9" ||
                                vm.apiDomain.assayTypeKey == "10" ||
                                vm.apiDomain.assayTypeKey == "11"
                        ) {        
                                if (vm.apiDomain.assayKey != "" && vm.apiDomain.isGel == true) {
			                alert("Cannot change Assay Type from InSitu to Gel, or fromGel to InSitu");
				        loadObject();
                                        return;
                                }
                                vm.apiDomain.isInSitu = true;
                                vm.apiDomain.isGel = false;
                        }

                        // reporter
                        if (
                                vm.apiDomain.assayTypeKey == "9" ||
                                vm.apiDomain.assayTypeKey == "10" ||
                                vm.apiDomain.assayTypeKey == "11"
                        ) {        
                                vm.apiDomain.isReporter = true;
                        }
                        else {
                                vm.apiDomain.isReporter = false;
                        }

                        // detection/antibodyPrep/probePrep
                        if (
                                vm.apiDomain.assayTypeKey == "1" ||
                                vm.apiDomain.assayTypeKey == "2" ||
                                vm.apiDomain.assayTypeKey == "3" ||
                                vm.apiDomain.assayTypeKey == "4" ||
                                vm.apiDomain.assayTypeKey == "5"
                        ) {        
                                vm.apiDomain.detectionKey = "1";
                                vm.apiDomain.isAntibodyPrep = false;
                                vm.apiDomain.isProbePrep = true;
                        }
                        else if (
                                vm.apiDomain.assayTypeKey == "6" ||
                                vm.apiDomain.assayTypeKey == "8"
                        ) {        
                                vm.apiDomain.detectionKey = "2";
                                vm.apiDomain.isAntibodyPrep = true;
                                vm.apiDomain.isProbePrep = false;
                        }
                        else {
                                vm.apiDomain.detectionKey = "";
                                vm.apiDomain.isAntibodyPrep = false;
                                vm.apiDomain.isProbePrep = true;
                        }
                }
                
		// change detection
		function changeDetection() {
			console.log("changeDetection()");

                        if (vm.apiDomain.detectionKey == "" || vm.apiDomain.detectionKey == "1") {
                                vm.apiDomain.detectionKey = "1";
                                vm.apiDomain.isAntibodyPrep = false;
                                vm.apiDomain.isProbePrep = true;
                        }
                        else if (vm.apiDomain.detectionKey == "2") {
                                vm.apiDomain.isAntibodyPrep = true;
                                vm.apiDomain.isProbePrep = false;
                        }
                        else {
                                vm.apiDomain.isAntibodyPrep = false;
                                vm.apiDomain.isProbePrep = false;
                        }
                }

		function addAntibodyPrep() {
			console.log("addAntibodyPrep()");

                        if (vm.apiDomain.antibodyPrep != null) {
                                return;
                        }

                        vm.apiDomain.antibodyPrep = {};
			vm.apiDomain.antibodyPrep = {
                                "processStatus" : "c",
                                "antibodyPrepKey" : "",
                                "antibodyKey" : "",
                                "antibodyName" : "",
                                "antibodyAccID" : "",
                                "secondaryKey" : "",
                                "secondaryName" : "",
                                "labelKey" : "",
                                "labelName" : ""
                        }
                }

		function addProbePrep() {
			console.log("addProbePrep()");

                        if (vm.apiDomain.probePrep != null) {
                                return;
                        }

                        vm.apiDomain.probePrep = {};
			vm.apiDomain.probePrep = {
                                "processStatus" : "c",
                                "probePrepKey" : "",
                                "probeKey" : "",
                                "probeName" : "",
                                "probeAccID" : "",
                                "probeSenseKey" : "",
                                "probeSenseName" : "",
                                "labelKey" : "",
                                "labelName" : "",
                                "visualizationMethodKey" : "",
                                "visualiationMethod" : "",
                                "prepType" : ""
                        }
                }

		// antibodyprep changed
		function changeAntibodyPrep() {
			console.log("changeAntibodyPrep()");

			if (vm.apiDomain.antibodyPrep.processStatus == "x") {
				vm.apiDomain.antibodyPrep.processStatus = "u";
			}
                }

		// probeprep changed
		function changeProbePrep() {
			console.log("changeProbePrep()");

			if (vm.apiDomain.probePrep.processStatus == "x") {
				vm.apiDomain.probePrep.processStatus = "u";
			}
                }

		/////////////////////////////////////////////////////////////////////
		// notes
		/////////////////////////////////////////////////////////////////////		
		
		// add assay note
		function addAssayNote() {
			console.log("addAssayNote()");

                        if (vm.apiDomain.assayNote != null) {
                                return;
                        }

			vm.apiDomain.assayNote = {
                                "processStatus": "c",
                                "assayNoteKey" : "",
                                "assayKey" : vm.apiDomain.assayKey,
                                "assayNote" : ""
			}
		}

		// clear assay note
		function clearAssayNote() {
                        console.log("clearAssayNote()");

			if (vm.apiDomain.assayNote.processStatus == "x") {
                                vm.apiDomain.assayNote.processStatus = "d";
                        };
                        vm.apiDomain.assayNote.assayNote = "";
		}

		// if assay note has changed
		function changeAssayNote() {
                        console.log("changeAssayNote()");
 
			if (vm.apiDomain.assayNote.processStatus == "x") {
                                if (vm.apiDomain.assayNote.assayNote == null 
                                        || vm.apiDomain.assayNote.assayNote == "") {
                                        vm.apiDomain.assayNote.processStatus = "d";
                                }
                                else {
                                        vm.apiDomain.assayNote.processStatus = "u";
                                }
                        };
		}

		// attach to assay note
		function attachAssayNote() {
			console.log("attachAssayNote()");

                        if (vm.apiDomain.assayNote.assayNote == null || vm.apiDomain.assayNote.note == "") {
			        vm.apiDomain.assayNote.assayNote = vm.attachAssayNote;
                        }
                        else {
			        vm.apiDomain.assayNote.assayNote = 
                                        vm.apiDomain.assayNote.assayNote + " " + vm.attachAssayNote;
                        }

			if (vm.apiDomain.assayNote.processStatus == "x") {
                                vm.apiDomain.assayNote.processStatus = "u";
                        }
		}

                // Hide/Show note sections
                function hideShowAssayNote() {
                        vm.hideAssayNote = !vm.hideAssayNote;
                }

		/////////////////////////////////////////////////////////////////////
		// specimens
		/////////////////////////////////////////////////////////////////////		
		
		// set current row
		function selectSpecimenRow(index) {
			console.log("selectSpecimenRow: " + index);

			vm.selectedSpecimenIndex = index;

			if (vm.apiDomain.specimens == null || vm.apiDomain.specimens == null) {
                                return;
                        }

			if (vm.apiDomain.specimens[index].assayKey != "" && vm.apiDomain.specimens.length == 0) {
				addSpecimenRow();
			}

                        loadGenotype();

                        setTimeout(function() {
                                selectSpecimenResultRow(0);
                                setGenotypeUsed();
                        }, (300));
		}

		// if current row has changed
		function changeSpecimenRow(index, setResultFocus) {
			console.log("changeSpecimenRow: " + index);

			vm.selectedSpecimenIndex = index;

                        if (setResultFocus == true) {
                                document.getElementById("specimenLabel-" + index).focus({preventScroll:true});
                        }

                        //document.getElementById("ageNote-" + index).scrollTop(0);

			if (vm.apiDomain.specimens[index] == null) {
				vm.selectedSpecimenIndex = 0;
				return;
			}

			if (vm.apiDomain.specimens[index].processStatus == "x") {
				vm.apiDomain.specimens[index].processStatus = "u";
			}

                }

		// add new row
		function addSpecimenRow() {
			console.log("addSpecimenRow");

			if (vm.apiDomain.specimens == null) {
				vm.apiDomain.specimens = [];
			}

                        var i = vm.apiDomain.specimens.length;

			var item = {
				"processStatus": "c",
                                "specimenKey": "",
                                "assayKey": vm.apiDomain.assayKey,
                                "embeddingKey": "",
                                "embeddingMethod": "",
                                "fixationKey": "",
                                "fixationMethod": "",
                                "genotypeKey": "",
                                "genotypeAccID": "",
                                "sequenceNum": i + 1,
                                "specimenLabel": "",
                                "sex": "",
                                "agePrefix": "",
                                "ageStage": "",
                                "age": "",
                                "ageNote": "",
                                "hybridization": "",
                                "specimenNote": "",
                                "creation_date": "",
                                "modification_date": "",
                                "sresultsCount" : 0
			}

                        vm.apiDomain.specimens[i] = item;

                        for(var j=0;j<8; j++) {
                                addSpecimenResultRow(i);
                        }
		}		

                // insert new row
                function insertSpecimenRow() {
			console.log("insertSpecimenRow()");

			var item = {
				"processStatus": "c",
                                "sequenceNum": 1,
                                "assayKey": vm.apiDomain.assayKey,
                                "embeddingKey": "",
                                "embeddingMethod": "",
                                "fixationKey": "",
                                "fixationMethod": "",
                                "genotypeKey": "",
                                "genotypeAccID": "",
                                "specimenLabel": "",
                                "sex": "",
                                "agePrefix": "",
                                "ageStage": "",
                                "age": "",
                                "ageNote": "",
                                "hybridization": "",
                                "specimenNote": "",
                                "creation_date": "",
                                "modification_date": "",
                                "sresultsCount" : 0
			}

                        vm.apiDomain.specimens.splice(vm.selectedSpecimenIndex, 0, item);

                        // add specimen result rows
                        for(var j=0;j<8; j++) {
                                addSpecimenResultRow(vm.selectedSpecimenIndex);
                        }

                        // reset sequenceNum
                        for(var i=0;i<vm.apiDomain.specimens.length;i++) {
                                vm.apiDomain.specimens[i].sequenceNum = i + 1;

                                if (vm.apiDomain.specimens[i].processStatus == "x") {
                                        vm.apiDomain.specimens[i].processStatus = "u";
                                }
                        }

                        var nextLabel = "specimenLabel-" + vm.selectedSpecimenIndex;
                        setTimeout(function() {
			        document.getElementById(nextLabel).focus();
                                setImagePaneUsed();
                                loadEmapa();
                        }, (300));
                }

                // copy column of existing row up to top of table
		function copyColumnSpecimenRow(id) {
			console.log("copyColumnSpecimen = " + id + '-' + vm.selectedSpecimenIndex);

                        var index = vm.selectedSpecimenIndex;

                        for(var i=0;i<vm.apiDomain.specimens.length;i++) {

                                if (vm.apiDomain.specimens[i].processStatus == "c") {
                                        break;
                                }

                                if (id == 'specimenLabel') {
                                        vm.apiDomain.specimens[i].specimenLabel = vm.apiDomain.specimens[index].specimenLabel;
                                }
                                else if (id == 'genotypeAccID') {
                                        vm.apiDomain.specimens[i].genotypeAccID = vm.apiDomain.specimens[index].genotypeAccID;
                                        vm.apiDomain.specimens[i].genotypeKey = vm.apiDomain.specimens[index].genotypeKey;
                                }
                                else if (id == 'embeddingKey') {
                                        vm.apiDomain.specimens[i].embeddingKey = vm.apiDomain.specimens[index].embeddingKey;
                                }
                                else if (id == 'fixationKey') {
                                        vm.apiDomain.specimens[i].fixationKey = vm.apiDomain.specimens[index].fixationKey;
                                }
                                else if (id == 'sex') {
                                        vm.apiDomain.specimens[i].sex = vm.apiDomain.specimens[index].sex;
                                }
                                else if (id == 'hybridization') {
                                        vm.apiDomain.specimens[i].hybridization = vm.apiDomain.specimens[index].hybridization;
                                }
                                else if (id == 'agePrefix') {
                                        vm.apiDomain.specimens[i].agePrefix = vm.apiDomain.specimens[index].agePrefix;
                                }
                                else if (id == 'ageStage') {
                                        vm.apiDomain.specimens[i].ageStage = vm.apiDomain.specimens[index].ageStage;
                                }
                                else if (id == 'ageNote') {
                                        vm.apiDomain.specimens[i].ageNote = vm.apiDomain.specimens[index].ageNote;
                                }
                                else if (id == 'specimenNote') {
                                        vm.apiDomain.specimens[i].specimenNote = vm.apiDomain.specimens[index].specimenNote;
                                }

                                if (vm.apiDomain.specimens[i].processStatus == "x") {
                                        vm.apiDomain.specimens[i].processStatus = "u";
                                }
                        }
                }

		// attach to age note
		function attachAgeNote(note) {
			console.log("attachAgeNote: ", note);

                        if (vm.apiDomain.isInSitu == true) {
			        for(var i=0;i<vm.apiDomain.specimens.length; i++) {
                                        if (vm.apiDomain.specimens[i].ageNote == null || vm.apiDomain.specimens[i].ageNote == "") {
                                                vm.apiDomain.specimens[i].ageNote = note;
                                        }
                                        else {
                                                vm.apiDomain.specimens[i].ageNote = vm.apiDomain.specimens[i].ageNote + " " + note;
                                        }
                                        if (vm.apiDomain.specimens[i].processStatus == "x") {
                                                vm.apiDomain.specimens[i].processStatus = "u";
                                        }
                                }
                                var id = "sageNote-" + vm.selectedSpecimenIndex;
                                console.log("attachAgeNote: " + id);
			        document.getElementById(id).focus();
                        }
                        else {
			        for(var i=0;i<vm.apiDomain.gelLanes.length; i++) {
                                        if (vm.apiDomain.gelLanes[i].ageNote == null || vm.apiDomain.gelLanes[i].ageNote == "") {
                                                vm.apiDomain.gelLanes[i].ageNote = note;
                                        }
                                        else {
                                                vm.apiDomain.gelLanes[i].ageNote = vm.apiDomain.gelLanes[i].ageNote + " " + note;
                                        }
                                        if (vm.apiDomain.gelLanes[i].processStatus == "x") {
                                                vm.apiDomain.gelLanes[i].processStatus = "u";
                                        }
                                }
                                var id = "gageNote-" + vm.selectedGelLaneIndex;
                                console.log("attachAgeNote: " + id);
			        document.getElementById(id).focus();
                        }
		}

		/////////////////////////////////////////////////////////////////////
		// specimen results
		/////////////////////////////////////////////////////////////////////		
                
		// set current row
		function selectSpecimenResultRow(index) {
			console.log("selectSpecimenResultRow: " + index);

			vm.selectedSpecimenResultIndex = index;

			if (
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults == null || 
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults == null
                        ) {
                                return;
                        }

			if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults.length == 0) {
				addSpecimenResultRow(vm.selectedSpecimenIndex);
			}

                        setImagePaneUsed();
                        loadEmapa();
		}

		// if current row has changed
		function changeSpecimenResultRow(index, setResultFocus) {
			console.log("changeSpecimenResultRow: " + index);

			vm.selectedSpecimenResultIndex = index;

                        if (setResultFocus == true) {
                                document.getElementById("sstructure-" + index).focus({preventScroll:true});
                        }
                        
			if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults == null) {
				vm.selectedSpecimenResultIndex = 0;
				return;
			}

			if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].processStatus == "x") {
				vm.apiDomain.specimens[vm.selectedSpecimenIndex].processStatus = "u";
			}

			if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[index].processStatus == "x") {
				vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[index].processStatus = "u";
			}

                        // If Strength = Absent default Pattern = Not Applicable
			if (
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[index].strengthKey == "1"
                        ) {
			        vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[index].patternKey = "-2";
                        }

                        // If Strength != Absent and Pattern = Not Applicable, then alert
			if (
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[index].strengthKey != ""  &&
			        vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[index].strengthKey != "1" &&
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[index].patternKey == "-2"
                        ) {
			        alert("Strenght != Absent and Pattern = Not Applicable is not allowed");
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[index].patternKey = "";
                        }

		}

		// add new row
		function addSpecimenResultRow(index) {
			console.log("addSpecimenResultRow: " + index);

                        var sequenceNum = 0;

			if (vm.apiDomain.specimens[index].sresults == null) {
				vm.apiDomain.specimens[index].sresults = [];
			}

                        var i = vm.apiDomain.specimens[index].sresults.length;
                        var sequenceNum = i + 1;

			var item = {
				"processStatus": "c",
                                "resultKey": "",
                                "specimenKey": vm.apiDomain.specimens[index].specimenKey,
                                "sequenceNum": sequenceNum,
                                "strengthKey": "",
                                "strength": "",
                                "patternKey": "",
                                "pattern": "",
                                "resultNote": "",
                                "creation_date": "",
                                "modification_date": "",
                                "structuresCount": 0,
                                "imagePanesCount": 0,
                                "imagePanesString": ""
			}
                        vm.apiDomain.specimens[index].sresults[i] = item;

                        // structures
			if (vm.apiDomain.specimens[index].sresults[i].structures == null) {
				vm.apiDomain.specimens[index].sresults[i].structures = [];
			}
                        
                        // imagePanes
			if (vm.apiDomain.specimens[index].sresults[i].imagePanes == null) {
				vm.apiDomain.specimens[index].sresults[i].imagePanes = [];
			}
		}		

                // insert new row
                function insertSpecimenResultRow(index) {
			console.log("insertSpecimenResultRow: " + index);

                        var sindex = vm.selectedSpecimenResultIndex;

			var item = {
				"processStatus": "c",
                                "resultKey": "",
                                "specimenKey": vm.apiDomain.specimens[index].specimenKey,
                                "sequenceNum": 1,
                                "strengthKey": "",
                                "strength": "",
                                "patternKey": "",
                                "pattern": "",
                                "resultNote": "",
                                "creation_date": "",
                                "modification_date": "",
                                "structuresCount": 0,
                                "imagePanesCount": 0,
                                "imagePanesString": ""
			}

                        vm.apiDomain.specimens[index].sresults.splice(sindex, 0, item);
			vm.apiDomain.specimens[index].sresults[sindex].structures = [];
			vm.apiDomain.specimens[index].sresults[sindex].imagePanes = [];

                        // reset sequenceNum
                        for(var i=0;i<vm.apiDomain.specimens[index].sresults.length;i++) {
                                vm.apiDomain.specimens[index].sresults[i].sequenceNum = i + 1;

                                if (vm.apiDomain.specimens[index].sresults[i].processStatus == "x") {
                                        vm.apiDomain.specimens[index].sresults[i].processStatus = "u";
                                }
                        }

                        var nextLabel = "sstructure-" + sindex;
                        setTimeout(function() {
			        document.getElementById(nextLabel).focus();
                        }, (300));

                }

                // insert new row
                function deleteSpecimenResultRow(index) {
			console.log("deleteSpecimenResultRow: " + index);

                        var sindex = vm.selectedSpecimenIndex;

                        if (vm.apiDomain.specimens[sindex].processStatus == "x") {
                                vm.apiDomain.specimens[sindex].processStatus = "u";
                        }

                        vm.apiDomain.specimens[sindex].sresults[index].processStatus = "d";
                }

                // copy column of existing row up to top of table
		function copyColumnSpecimenResultRow(id) {
			console.log("copyColumnSpecimenResult = " + id + '-' + vm.selectedSpecimenResultIndex);

                        var sindex = vm.selectedSpecimenIndex;
                        // selected source row
                        var rindex = vm.selectedSpecimenResultIndex;

                        if (vm.apiDomain.specimens[sindex].sresults[rindex].imagePanes == null) {
                                vm.apiDomain.specimens[sindex].sresults[rindex].imagePanes = [];
                        }

                        var currentIndex = vm.apiDomain.specimens[sindex].sresults[rindex].imagePanes.length;

                        for(var i=0;i<vm.apiDomain.specimens[sindex].sresults.length;i++) {

                                if (i != rindex && vm.apiDomain.specimens[sindex].sresults[i].processStatus == "c") {
                                        break;
                                }

                                if (id == 'strengthKey') {
                                        vm.apiDomain.specimens[sindex].sresults[i].strengthKey = vm.apiDomain.specimens[sindex].sresults[rindex].strengthKey;
                                }
                                else if (id == 'patternKey') {
                                        vm.apiDomain.specimens[sindex].sresults[i].patternKey = vm.apiDomain.specimens[sindex].sresults[rindex].patternKey;
                                }
                                else if (id == 'resultNote') {
                                        vm.apiDomain.specimens[sindex].sresults[i].resultNote = vm.apiDomain.specimens[sindex].sresults[rindex].resultNote;
                                }
                                else if (id == 'imagePanes') {

                                        // skip over source row
                                        if (i == rindex && vm.apiDomain.specimens[sindex].sresults[i].processStatus != "c") {
                                                continue;
                                        }
                                        // break if new row
                                        else if (i != rindex && vm.apiDomain.specimens[sindex].sresults[i].processStatus == "c") {
                                                break;
                                        }

                                        // image pane target row
                                        if (vm.apiDomain.specimens[sindex].sresults[i].imagePanes == null) {
                                                vm.apiDomain.specimens[sindex].sresults[i].imagePanes = [];
                                        }
                                        var targetIndex = vm.apiDomain.specimens[sindex].sresults[i].imagePanes.length;

                                        // delete any existing image panes
			                for(var j=0;j<targetIndex; j++) {
                                                vm.apiDomain.specimens[sindex].sresults[i].imagePanes[j].processStatus = "d";
                                        }

                                        // add new image panes using current image panes
			                for(var j=0;j<currentIndex; j++) {
                                                // do not change value of source
                                                var item = Object.assign({}, vm.apiDomain.specimens[sindex].sresults[rindex].imagePanes[j]);
                                                item.processStatus = "c";
                                                vm.apiDomain.specimens[sindex].sresults[i].imagePanes.splice(targetIndex, 0, item);
                                                targetIndex += 1;
                                        }
                                        vm.apiDomain.specimens[sindex].sresults[i].imagePanesString = vm.apiDomain.specimens[sindex].sresults[rindex].imagePanesString;
                                        setImagePaneUsed();
                                }

                                if (vm.apiDomain.specimens[sindex].processStatus == "x") {
                                        vm.apiDomain.specimens[sindex].processStatus = "u";
                                }

                                if (vm.apiDomain.specimens[sindex].sresults[i].processStatus == "x") {
                                        vm.apiDomain.specimens[sindex].sresults[i].processStatus = "u";
                                }

                                if (vm.apiDomain.specimens[sindex].sresults[i].processStatus == "c") {
                                        break;
                                }
                        }
                }

		/////////////////////////////////////////////////////////////////////
		// gel lanes
		/////////////////////////////////////////////////////////////////////		
		
		// set current row
		function selectGelLaneRow(index) {
			console.log("selectGelLaneRow: " + index);

			vm.selectedGelLaneIndex = index;

			if (vm.apiDomain.gelLanes == null || vm.apiDomain.gelLanes == null) {
                                return;
                        }

			if (vm.apiDomain.gelLanes[index].assayKey != "" && vm.apiDomain.gelLanes.length == 0) {
				addGelLaneRow(false);
			}

                        loadGenotype();

                        setTimeout(function() {
                                //selectGelBandRow(0);
                                setGenotypeUsed();
                                loadEmapa();
                        }, (300));
		}

		// if current row has changed
		function changeGelLaneRow(index, setResultFocus) {
			console.log("changeGelLaneRow: " + index);

			vm.selectedGelLaneIndex = index;

                        if (setResultFocus == true) {
                                document.getElementById("laneLabel-" + index).focus({preventScroll:true});
                        }
                        
			if (vm.apiDomain.gelLanes[index] == null) {
				vm.selectedGelLaneIndex = 0;
				return;
			}

			if (vm.apiDomain.gelLanes[index].processStatus == "x") {
				vm.apiDomain.gelLanes[index].processStatus = "u";
			}

                        // gel control
                        if (
                                vm.apiDomain.gelLanes[index].gelControlKey == "1" && 
                                vm.apiDomain.assayTypeKey != 8 && 
                                vm.apiDomain.gelLanes[index].gelRNATypeKey == "-2"
                            ) {
                                alert("Invalid RNA Type for this Assay Type and Control value");
                                vm.apiDomain.gelLanes[index].gelRNATypeKey = "";
                                vm.apiDomain.gelLanes[index].gelRNAType = "";
                        }
                }

		function changeGelControlRow(index) {
			console.log("changeGelControlRow: " + index);

			vm.selectedGelLaneIndex = index;

                        // Control = 'No'
                        if (vm.apiDomain.gelLanes[index].gelControlKey == "1") {
                                vm.apiDomain.gelLanes[index].genotypeKey = "";
                                vm.apiDomain.gelLanes[index].genotypeAccID = "";
                                vm.apiDomain.gelLanes[index].sampleAmount = "";
                                vm.apiDomain.gelLanes[index].gelRNATypeKey = "";
                                vm.apiDomain.gelLanes[index].gelRNAType = "";
                                vm.apiDomain.gelLanes[index].agePrefix = "";
                                vm.apiDomain.gelLanes[index].ageStage = "";
                                vm.apiDomain.gelLanes[index].age = "";
                                vm.apiDomain.gelLanes[index].sex = "";

                                if (vm.apiDomain.assayTypeKey == 8) {
                                        vm.apiDomain.gelLanes[index].gelRNATypeKey = "-2";
                                        vm.apiDomain.gelLanes[index].gelRNAType = "Not Applicable";
                                }
                        }
                        //  Control != 'No
                        else {
                                vm.apiDomain.gelLanes[index].genotypeKey = "-2";
                                vm.apiDomain.gelLanes[index].genotypeAccID = "MGI:2166309";
                                vm.apiDomain.gelLanes[index].sampleAmount = "";
                                vm.apiDomain.gelLanes[index].gelRNATypeKey = "-2";
                                vm.apiDomain.gelLanes[index].gelRNAType = "Not Applicable";
                                vm.apiDomain.gelLanes[index].agePrefix = "Not Applicable";
                                vm.apiDomain.gelLanes[index].ageStage = "";
                                vm.apiDomain.gelLanes[index].age = "Not Applicable";
                                vm.apiDomain.gelLanes[index].sex = "Not Applicable";
                        }
                }

		// if current row has changed
		function changeGelBandRow(laneIndex, bandIndex) {
			console.log("changeGelBandRow: " + laneIndex + "," + bandIndex);

			if (vm.apiDomain.gelLanes[laneIndex].gelBands[bandIndex] == null) {
				return;
			}

			if (vm.apiDomain.gelLanes[laneIndex].gelBands[bandIndex].processStatus == "x") {
				vm.apiDomain.gelLanes[laneIndex].processStatus = "u";
				vm.apiDomain.gelLanes[laneIndex].gelBands[bandIndex].processStatus = "u";
			}
			else if (vm.apiDomain.gelLanes[laneIndex].gelBands[bandIndex].processStatus == "c") {
                                if (vm.apiDomain.gelLanes[laneIndex].processStatus == "x") {
				        vm.apiDomain.gelLanes[laneIndex].processStatus = "u";
                                }
                                if (
                                        vm.apiDomain.gelLanes[laneIndex].gelBands[bandIndex].sequenceNum == null
                                        || vm.apiDomain.gelLanes[laneIndex].gelBands[bandIndex].sequenceNum == null
                                ) {
                                        vm.apiDomain.gelLanes[laneIndex].gelBands[bandIndex].sequenceNum = bandIndex + 1;
                                }
			}

                        //iterate thru gelRows for the specific gelRowKey/processStatus
                        for(var i=0;i<vm.apiDomain.gelRows.length;i++) {
                                if (vm.apiDomain.gelRows[i].processStatus == "x") {
                                        if (
                                                vm.apiDomain.gelLanes[laneIndex].gelBands[bandIndex].gelRowKey == vm.apiDomain.gelRows[i].gelRowKey
                                                || vm.apiDomain.gelLanes[laneIndex].gelBands[bandIndex].sequenceNum == vm.apiDomain.gelRows[i].sequenceNum
                                        ) {
				                vm.apiDomain.gelRows[i].processStatus = "u";
                                        }
                                }
                        }
                }

		// if current row has changed
		function changeGelRow(index) {
			console.log("changeGelRow: " + index);

			if (vm.apiDomain.gelRows[index] == null) {
				return;
			}

			if (vm.apiDomain.gelRows[index].processStatus == "x") {
				vm.apiDomain.gelRows[index].processStatus = "u";
			}
                }

		// add new row
		function addGelLaneRow(addGelBandToo) {
			console.log("addGelLaneRow():" + addGelBandToo);

			if (vm.apiDomain.gelLanes == null) {
				vm.apiDomain.gelLanes = [];
			}

                        var i = vm.apiDomain.gelLanes.length;

			var item = {
				"processStatus": "c",
                                "gelLaneKey": "",
                                "assayKey": vm.apiDomain.assayKey,
                                "genotypeKey": "",
                                "genotypeAccID": "",
                                "gelRNATypeKey": "",
                                "gelRNAType": "",
                                "gelControlKey": "",
                                "gelControl": "",
                                "sequenceNum": i + 1,
                                "laneLabel": "",
                                "sampleAmount": "",
                                "sex": "",
                                "agePrefix": "",
                                "ageStage": "",
                                "age": "",
                                "ageNote": "",
                                "laneNote": "",
                                "structuresCount": 0,
                                "creation_date": "",
                                "modification_date": ""
			}

                        vm.apiDomain.gelLanes[i] = item;

                        // structures
			if (vm.apiDomain.gelLanes[i].structures == null) {
				vm.apiDomain.gelLanes[i].structures = [];
			}

                        // gelBand 
			if (addGelBandToo == true && vm.apiDomain.gelLanes[i].gelBands == null) {
                                addGelBandRow(i);
                        }

                        //vm.selectedGelLaneIndex = i;
                        //var nextLabel = "laneLabel-" + vm.selectedGelLaneIndex;
                        //setTimeout(function() {
			        //document.getElementById(nextLabel).focus();
                                //setImagePaneUsed();
                                //loadEmapa();
                        //}, (300));
		}

                // insert new row
                function insertGelLaneRow() {
			console.log("insertGelLaneRow()");

			var item = {
				"processStatus": "c",
                                "gelLaneKey": "",
                                "assayKey": vm.apiDomain.assayKey,
                                "genotypeKey": "",
                                "genotypeAccID": "",
                                "gelRNATypeKey": "",
                                "gelRNAType": "",
                                "gelControlKey": "",
                                "gelControl": "",
                                "sequenceNum": i + 1,
                                "laneLabel": "",
                                "sampleAmount": "",
                                "sex": "",
                                "agePrefix": "",
                                "ageStage": "",
                                "age": "",
                                "ageNote": "",
                                "laneNote": "",
                                "structuresCount": 0,
                                "creation_date": "",
                                "modification_date": ""
			}

                        vm.apiDomain.gelLanes.splice(vm.selectedGelLaneIndex, 0, item);

                        // structures
			if (vm.apiDomain.gelLanes[vm.selectedGelLaneIndex].structures == null) {
				vm.apiDomain.gelLanes[vm.selectedGelLaneIndex].structures = [];
			}

                        // add new band to each gel rows
                        for(var i=0;i<vm.apiDomain.gelRows.length;i++) {
                                addGelBandRow(vm.selectedGelLaneIndex);
                        }

                        // reset sequenceNum
                        for(var i=0;i<vm.apiDomain.gelLanes.length;i++) {
                                vm.apiDomain.gelLanes[i].sequenceNum = i + 1;

                                if (vm.apiDomain.gelLanes[i].processStatus == "x") {
                                        vm.apiDomain.gelLanes[i].processStatus = "u";
                                }
                        }

                        var nextLabel = "laneLabel-" + vm.selectedGelLaneIndex;
                        setTimeout(function() {
			        document.getElementById(nextLabel).focus();
                                setImagePaneUsed();
                                loadEmapa();
                        }, (300));
                }

                // copy column of existing row up to top of table
		function copyColumnGelLaneRow(id) {
			console.log("copyColumnGelLaneRow = " + id + '-' + vm.selectedGelLaneIndex);

                        var index = vm.selectedGelLaneIndex;

                        for(var i=0;i<vm.apiDomain.gelLanes.length;i++) {

                                if (vm.apiDomain.gelLanes[i].processStatus == "c") {
                                        break;
                                }

                                if (id == 'laneLabel') {
                                        vm.apiDomain.gelLanes[i].laneLabel = vm.apiDomain.gelLanes[index].laneLabel;
                                }
                                else if (id == 'genotypeAccID') {
                                        vm.apiDomain.gelLanes[i].genotypeAccID = vm.apiDomain.gelLanes[index].genotypeAccID;
                                        vm.apiDomain.gelLanes[i].genotypeKey = vm.apiDomain.gelLanes[index].genotypeKey;
                                }
                                else if (id == 'gelRNATypeKey') {
                                        vm.apiDomain.gelLanes[i].gelRNATypeKey = vm.apiDomain.gelLanes[index].gelRNATypeKey;
                                }
                                else if (id == 'gelControlKey') {
                                        vm.apiDomain.gelLanes[i].gelControlKey = vm.apiDomain.gelLanes[index].gelControlKey;
                                }
                                else if (id == 'sex') {
                                        vm.apiDomain.gelLanes[i].sex = vm.apiDomain.gelLanes[index].sex;
                                }
                                else if (id == 'agePrefix') {
                                        vm.apiDomain.gelLanes[i].agePrefix = vm.apiDomain.gelLanes[index].agePrefix;
                                }
                                else if (id == 'ageStage') {
                                        vm.apiDomain.gelLanes[i].ageStage = vm.apiDomain.gelLanes[index].ageStage;
                                }
                                else if (id == 'ageNote') {
                                        vm.apiDomain.gelLanes[i].ageNote = vm.apiDomain.gelLanes[index].ageNote;
                                }
                                else if (id == 'sampleAmount') {
                                        vm.apiDomain.gelLanes[i].sampleAmount = vm.apiDomain.gelLanes[index].sampleAmount;
                                }
                                else if (id == 'laneNote') {
                                        vm.apiDomain.gelLanes[i].laneNote = vm.apiDomain.gelLanes[index].laneNote;
                                }
                                else if (id == 'structures') {

                                        // skip over source row
                                        if (i == index && vm.apiDomain.gelLanes[index].processStatus != "c") {
                                                continue;
                                        }
                                        // break if new row
                                        else if (i != index && vm.apiDomain.gelLanes[index].processStatus == "c") {
                                                break;
                                        }

                                        var currentIndex = vm.apiDomain.gelLanes[index].structures.length;

                                        // target row
                                        if (vm.apiDomain.gelLanes[index].structures == null) {
                                                vm.apiDomain.gelLanes[index].structures = [];
                                        }
                                        var targetIndex = vm.apiDomain.gelLanes[index].structures.length;

                                        // delete any existing structures
			                for(var j=0;j<targetIndex; j++) {
                                                vm.apiDomain.gelLanes[index].structures[j].processStatus = "d";
                                        }

                                        // add new structures using current structures
			                for(var j=0;j<currentIndex; j++) {
                                                // do not change value of source
                                                var item = Object.assign({}, vm.apiDomain.gelLanes[index].structures[j]);
                                                item.processStatus = "c";
                                                vm.apiDomain.gelLanes[index].structures.splice(targetIndex, 0, item);
                                                targetIndex += 1;
                                        }
                                        vm.apiDomain.gelLanes[index].structuresCount = vm.apiDomain.gelLanes[index].imagePanesCount;
                                        setEmapaUsed();
                                }

                                if (vm.apiDomain.gelLanes[i].processStatus == "x") {
                                        vm.apiDomain.gelLanes[i].processStatus = "u";
                                }
                        }
                }

                // copy data from previous row
		function validateGelLane(event, row, index, id) {
			console.log("validateGelLane = " + id + '-' + index + ':' + event.keyCode);

			vm.selectedGelLaneIndex = index;

                        // if the key pressed was not a TAB, do nothing and return.
                        if (event.keyCode !== 9) {
                                return;
                        }

                        if (index <= 0) {
                                console.log("validateGelLane/do nothing: " + index);
                                return;
                        }

                        // Control != 'No'
                        if (vm.apiDomain.gelLanes[index-1].gelControlKey != "1") {
                                console.log("validateGelLane/control is not No/do nothing: " + index-1);
                                return;
                        }

                        if (id == 'laneLabel' && row.laneLabel == "") {
                                row.laneLabel = vm.apiDomain.gelLanes[index-1].laneLabel;
                        }
                        else if (id == 'gelRNATypeKey' && row.gelRNATypeKey == "") {
                                row.gelRNATypeKey = vm.apiDomain.gelLanes[index-1].gelRNATypeKey;
                        }
                        else if (id == 'sex' && row.sex == "") {
                                row.sex = vm.apiDomain.gelLanes[index-1].sex;
                        }
                        else if (id == 'sampleAmount' && row.sampleAmount == "") {
                                row.sampleAmount = vm.apiDomain.gelLanes[index-1].sampleAmount;
                        }
                        else if (id == 'agePrefix' && row.agePrefix == "") {
                                row.agePrefix = vm.apiDomain.gelLanes[index-1].agePrefix;
                                row.age = row.agePrefix;
                        }
                        else if (
                                id == 'ageStage' && 
                                (row.ageStage == "" || row.ageStage == null) &&
                                (
                                        vm.apiDomain.gelLanes[index].agePrefix == "embryonic day" ||
                                        vm.apiDomain.gelLanes[index].agePrefix == "postnatal day" ||
                                        vm.apiDomain.gelLanes[index].agePrefix == "postnatal week" ||
                                        vm.apiDomain.gelLanes[index].agePrefix == "postnatal month" ||
                                        vm.apiDomain.gelLanes[index].agePrefix == "postnatal year"
                                )
                        ) {
                                row.ageStage = vm.apiDomain.gelLanes[index-1].ageStage;
                                row.age = row.agePrefix + " " + row.ageStage;
                        }
                        else if (
                                id == 'ageStage' && 
                                row.ageStage != "" && 
                                row.ageState != null &&
                                (
                                        vm.apiDomain.gelLanes[index].agePrefix == "postnatal" ||
                                        vm.apiDomain.gelLanes[index].agePrefix == "postnatal adult" ||
                                        vm.apiDomain.gelLanes[index].agePrefix == "postnatal newborn"
                                )
                        ) {
				alert("Invalid Age Value: " + vm.apiDomain.gelLanes[index].agePrefix);
				document.getElementById(id + '-' + index).focus();
                                row.ageStage = "";
                        }
                        else if (id == 'structures' && row.structures == "") {
                                if (vm.apiDomain.gelLanes[index-1].structures == null) {
                                        return;
                                }
                                // set processStatus = "c"
			        for(var i=0;i<vm.apiDomain.gelLanes[index-1].structures.length; i++) {
                                        // do not change value of source
                                        var item = Object.assign({}, vm.apiDomain.gelLanes[index-1].structures[i]);
                                        item.gelLaneKey = "";
                                        item.processStatus = "c";
                                        vm.apiDomain.gelLanes[index].structures.splice(i, 0, item);
                                }
                                if (row.structures == "") {
                                        row.structuresCount = 0;
                                }
                                else {
                                        row.structuresCount = vm.apiDomain.gelLanes[index].structures.length;
                                }
                                setEmapaUsed();
                        }

                        else if (id == 'gelControlKey' && row.gelControlKey == "") {
                                row.gelControlKey = vm.apiDomain.gelLanes[index-1].gelControlKey;
                        }
                }

		/////////////////////////////////////////////////////////////////////
		// gel rows/bands
		/////////////////////////////////////////////////////////////////////		
		
		// add new row
		function addGelRow(addGelBandToo) {
			console.log("addGelRow():" + addGelBandToo);

			if (vm.apiDomain.gelRows == null) {
				vm.apiDomain.gelRows = [];
			}

                        var i = vm.apiDomain.gelRows.length;

			var item = {
				"processStatus": "c",
                                "gelRowKey": "",
                                "assayKey": vm.apiDomain.assayKey,
                                "gelUnitsKey": "",
                                "gelUnits": "",
                                "sequenceNum": i + 1,
                                "size": null,
                                "rowNote": "",
                                "creation_date": "",
                                "modification_date": ""
			}

                        vm.apiDomain.gelRows[i] = item;

                        if (addGelBandToo == true) {
			        for(var i=0;i<vm.apiDomain.gelLanes.length; i++) {
                                        if (vm.apiDomain.gelLanes[i].processStatus != "c") {
                                                addGelBandRow(i);
                                        }
                                        //else if (vm.apiDomain.gelLanes[i].gelBands == null) {
                                                //addGelBandRow(i);
                                        //}
                                }
                        }
		}

		function addGelBandRow(index) {
			console.log("addGelBandRow():" + index);

                        if (vm.apiDomain.gelLanes[index].gelBands == null) {
				vm.apiDomain.gelLanes[index].gelBands = [];
			}

                        if (vm.apiDomain.gelLanes[index].processStatus == "c") {
                                return;
                        }

                        var i = vm.apiDomain.gelLanes[index].gelBands.length;

			var item = {
				"processStatus": "c",
                                "gelBandKey": "",
                                "gelLaneKey": vm.apiDomain.gelLanes[index].gelLaneKey,
                                "strengthKey": "",
                                "strength": "",
                                "bandNote": "",
                                "gelRowKey": "",
                                "assayKey": vm.apiDomain.assayKey,
                                "sequenceNum": i + 1,
                                "creation_date": "",
                                "modification_date": ""
			}

                        vm.apiDomain.gelLanes[index].gelBands[i] = item;
		}

		/////////////////////////////////////////////////////////////////////
		// notes
		/////////////////////////////////////////////////////////////////////		
                
		// attach acc/mgi tag to assay note
		function addAssayAccMGITag() {
                        console.log("addAssayAccMGITag()");

                        if (vm.apiDomain.assayNote.assayNote == "" || vm.apiDomain.assayNote.assayNote == null) {
                                vm.apiDomain.assayNote.assayNote = "\\Acc(MGI:||)";
                        }
                        else {
                                vm.apiDomain.assayNote.assayNote = vm.apiDomain.assayNote.assayNote + " \\Acc(MGI:||)";
                        }
		}
		
		// attach acc/mgi tag to assay note
		function addSpecimenAccMGITag() {
                        console.log("addSpecimenAccMGITag()");

                        if (
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].specimenNote == "" || 
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].specimenNote == null
                        ) {
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].specimenNote = "(assay \\Acc(MGI:||))";
                        }
                        else {
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].specimenNote = vm.apiDomain.specimens[vm.selectedSpecimenIndex].specimenNote + " (assay \Acc(MGI:||))";
                        }

                        changeSpecimenRow(vm.selectedSpecimenIndex, false);
		}
		
		/////////////////////////////////////////////////////////////////////
		// validations
		/////////////////////////////////////////////////////////////////////		
		
		function validateMarker(row, id) {
			console.log("validateMarker = " + id);

			if (row.markerSymbol == null || row.markerSymbol == "") {
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
					alert("Invalid Marker Symbol: " + row.markerSymbol);
					document.getElementById(id).focus();
					row.markerKey = "";
					row.markerSymbol = "";
				} else if (data.length > 1) {
					alert("This marker requires a Chr.\nSelect a Chr, then Marker, and try again:\n\n" + row.markerSymbol);
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

        	// validate jnum
		function validateJnum(row, id) {		
			console.log("validateJnum = " + id);

			if (row.jnumid == null || row.jnumid == "") {
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
                                        if (vm.imagePaneLookup.length == 0) {
                                                loadImagePane();
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

		function validateStrain() {
			console.log("validateStrain()");

			if (vm.apiDomain.assay == "") {
				vm.apiDomain.assayKey = "";
				vm.apiDomain.assay = "";
				return;
			}

			if (vm.apiDomain.assay.includes("%")) {
				return;
			}

			if (vm.apiDomain.assayKey != "") {
				return;
                        }

			var params = {};
			params.assay = vm.apiDomain.assay;

			AssaySearchAPI.search(params, function(data) {
			        if (data.length > 0) {
					alert("This Strain already exists in MGI.");
			        }
		                pageScope.loadingEnd();
			}, function(err) {
			        pageScope.handleError(vm, "API ERROR: AssaySearchAPI.search");
		                pageScope.loadingEnd();
			});
		}

		function validateAntibody(row, id) {
			console.log("validateAntibody()");

			if (row.antibodyAccID == "") {
				row.antibodyKey = "";
				row.antibodyName = "";
                                row.antibodyAccID = "";
				return;
			}

                        if (vm.apiDomain.markerKey == "") {
			        alert("There is no Marker to verify against this Antibody.");
                                return;
                        }

			// params if used for the validation search only
			var params = {};
			params.accID = row.antibodyAccID;
			console.log(params);
			
			ValidateAntibodyAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Antibody: " + row.antibodyAccID);
					document.getElementById(id).focus();
					row.antibodyKey = "";
					row.antibodyName = "";
                                        row.antibodyAccID = "";
				} else {
					row.antibodyKey = data[0].antibodyKey;
					row.antibodyName = data[0].antibodyName;
                                        row.antibodyAccID = data[0].accID;
                                        setTimeout(function() {
                                                validateAntibodyMarker(row, id);
                                        }, (300));
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateAntibodyAPI.search");
				document.getElementById(id).focus();
				row.antibodyKey = "";
				row.antibodyName = "";
                                row.antibodyAccID = "";
			});
		}

		function validateAntibodyMarker(row, id) {
			console.log("validateAntibodyMarker()");

			if (row.antibodyAccID == "") {
				row.antibodyKey = "";
				row.antibodyName = "";
                                row.antibodyAccID = "";
				return;
			}

                        // for reporter assay, skip validation
                        if (
                                vm.apiDomain.assayTypeKey == "9" || 
                                vm.apiDomain.assayTypeKey == "10" || 
                                vm.apiDomain.assayTypeKey == "11"
                        ) {
                                vm.apiDomain.isReporter = true;
                                return;
                        }
                        else {
                                vm.apiDomain.isReporter = false;
                        }

			// params if used for the validation search only
			var params = {};
			params.antibodyKey = row.antibodyKey;
			params.markerKey = vm.apiDomain.markerKey;
			console.log(params);
			
			ValidateAntibodyMarkerAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("The Marker ‘" + vm.apiDomain.markerSymbol + "’ is not cross-referenced to this primary Antibody Accession ID");
					document.getElementById(id).focus();
					row.antibodyKey = "";
					row.antibodyName = "";
                                        row.antibodyAccID = "";
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateAntibodyMarkerAPI.search");
				document.getElementById(id).focus();
				row.antibodyKey = "";
				row.antibodyName = "";
                                row.antibodyAccID = "";
			});
		}

		function validateProbe(row, id) {
			console.log("validateProbe()");

			if (row.probeAccID == "") {
				row.probeKey = "";
				row.probeName = "";
                                row.probeAccID = "";
				return;
			}

                        if (vm.apiDomain.markerKey == "") {
			        alert("There is no Marker to verify against this Probe.");
                                return;
                        }

			// params if used for the validation search only
			var params = {};
			params.accID = row.probeAccID;
			console.log(params);
			
			ValidateProbeAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Probe: " + row.probeAccID);
					document.getElementById(id).focus();
					row.probeKey = "";
					row.probeName = "";
                                        row.probeAccID = "";
				} else {
					row.probeKey = data[0].probeKey;
					row.probeName = data[0].name;
                                        row.probeAccID = data[0].accID;
                                        setTimeout(function() {
                                                validateProbeMarker(row, id);
                                        }, (300));
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateProbeAPI.search");
				document.getElementById(id).focus();
				row.probeKey = "";
				row.probeName = "";
                                row.probeAccID = "";
			});
		}

		function validateProbeMarker(row, id) {
			console.log("validateProbeMarker()");

			if (row.probeAccID == "") {
				row.probeKey = "";
				row.probeName = "";
                                row.probeAccID = "";
				return;
			}

                        // for reporter assay, skip validation
                        if (
                                vm.apiDomain.assayTypeKey == "9" || 
                                vm.apiDomain.assayTypeKey == "10" || 
                                vm.apiDomain.assayTypeKey == "11"
                        ) {
                                vm.apiDomain.isReporter = true;
                                return;
                        }
                        else {
                                vm.apiDomain.isReporter = false;
                        }

			// params if used for the validation search only
			var params = {};
			params.probeKey = row.probeKey;
			params.markerKey = vm.apiDomain.markerKey;
			console.log(params);
			
			ValidateProbeMarkerAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("The Marker '" + vm.apiDomain.markerSymbol + "’ either does not have a relationship with this Probe Accession ID or does not have the appropriate relationship (E,H,A) to this Probe Accession ID");
					document.getElementById(id).focus();
					row.probeKey = "";
					row.probeName = "";
                                        row.probeAccID = "";
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateProbeMarkerAPI.search");
				document.getElementById(id).focus();
				row.probeKey = "";
				row.probeName = "";
                                row.probeAccID = "";
			});
		}

		function validateGenotype(row, index, id) {
			console.log("validateGenotype = " + id + index);

                        // if the key pressed was not a TAB, do nothing and return.
                        if (event.keyCode !== 9) {
                                return;
                        }

			id = id + index;

			if (row.genotypeAccID == "") {
                                if (index > 0) {
                                        if (vm.apiDomain.isInSitu == true) {
				                row.genotypeKey = vm.apiDomain.specimens[index-1].genotypeKey;
                                                row.genotypeAccID = vm.apiDomain.specimens[index-1].genotypeAccID;
                                        }
                                        else {

                                                // Gel/Control
                                                
                                                //If Control = No, Genotype = null, above row is not No, and Genotype = Not Specified
                                                if (
                                                        vm.apiDomain.gelLanes[index].gelControlKey == "1"
                                                        && vm.apiDomain.gelLanes[index].genotypeKey == ""
                                                        && index > 0
                                                        && vm.apiDomain.gelLanes[index-1].gelControlKey != "1"
                                                ) {
                                                        row.genotypeKey = "-1";
                                                        row.genotypeAccID = "MGI:2166310";
                                                }

                                                //If Control = No, Genotype = null, above row is No, copy above row Genotype
                                                else if (
                                                        vm.apiDomain.gelLanes[index].gelControlKey == "1"
                                                        && vm.apiDomain.gelLanes[index].genotypeKey == ""
                                                        && index > 0
                                                        && vm.apiDomain.gelLanes[index-1].gelControlKey == "1"
                                                ) {
				                        row.genotypeKey = vm.apiDomain.gelLanes[index-1].genotypeKey;
                                                        row.genotypeAccID = vm.apiDomain.gelLanes[index-1].genotypeAccID;
                                                }
                                                
                                                //If Control = No, Genotype = not null, then nothing happens
                                        }
                                        setGenotypeUsed();
				        return;
                                }
                                else {
				        row.genotypeKey = "";
                                        row.genotypeAccID = "";
				        return;
                                }
			}

			// params if used for the validation search only
			var params = {};
			params.accID = row.genotypeAccID;
			console.log("validateGenotype:" + params.accID);
			
			ValidateGenotypeAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Genotype: " + row.genotypeAccID);
					document.getElementById(id).focus();
					row.genotypeKey = "";
                                        row.genotypeAccID = "";
				} else {
					row.genotypeKey = data[0].genotypeKey;
                                        row.genotypeAccID = data[0].accID;
                                        setGenotypeUsed();
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateGenotypeAPI.search");
				document.getElementById(id).focus();
				row.genotypeKey = "";
                                row.genotypeAccID = "";
			});
		}

                //
                // replace genotype
                //
                
                // set activeReplaceGenotype
		function setActiveReplaceGenotype() {
			console.log("setActiveReplaceGenotype()");

			vm.activeReplaceGenotype = !vm.activeReplaceGenotype;
                        setTimeout(function() {
                                clearReplaceGenotype(vm.activeReplaceGenotype, "replaceGenoJnumID");
                        }, (300));
		}

        	// clear replaceGenoDomain
		function clearReplaceGenotype(setFocus, id) {		
			console.log("clearReplaceGenotype():" + setFocus + "," + id);

                        addReplaceGenotype();

                        if (setFocus) {
			        document.getElementById(id).focus();
                        }
		}		

		// add new replaceGenoDomain
		function addReplaceGenotype() {
			console.log("addReplaceGenotype()");

		        vm.replaceGenoDomain = {};
			vm.replaceGenoDomain.createdBy = USERNAME;
			vm.replaceGenoDomain.refsKey = "";
			vm.replaceGenoDomain.jnumid = "";
			vm.replaceGenoDomain.jnum = null;
			vm.replaceGenoDomain.short_citation = "";
                        vm.replaceGenoDomain.currentKey = "";
			vm.replaceGenoDomain.currentDisplay = "";
			vm.replaceGenoDomain.currentAccID = "";
                        vm.replaceGenoDomain.newKey = "";
			vm.replaceGenoDomain.newDisplay = "";
			vm.replaceGenoDomain.newAccID = "";
		}		

                // process replacedGenotype
		function processReplaceGenotype(id) {
			console.log("processReplaceGenotype():" + id);

                        if (vm.replaceGenoDomain.refsKey == "") {
			        alert("Invalid Reference: " + vm.replaceGenoDomain.jnumid);
			        document.getElementById(id).focus();
				return;
                        }

                        if (vm.replaceGenoDomain.currentKey == "") {
			        alert("Invalid Current Genotype ID: " + vm.replaceGenoDomain.currentAccID);
			        document.getElementById(id).focus();
				return;
                        }

                        if (vm.replaceGenoDomain.newKey == "") {
			        alert("Invalid New Genotype ID: " + vm.replaceGenoDomain.newAccID);
			        document.getElementById(id).focus();
				return;
                        }

			ReplaceGenotypeAPI.search(vm.replaceGenoDomain, function(data) {
			        alert("Replace Genotype successful");
		                vm.replaceGenoDomain = {};
				loadObject();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ReplaceGenotypeAPI.search");
		                document.getElementById(id).focus();
			});
                }

                // validate current genotype
		function validateReplaceGeno1(id) {
			console.log("validateReplaceGeno1():" + id);

                        // if the key pressed was not a TAB, do nothing and return.
                        if (event.keyCode !== 9) {
                                return;
                        }

			if (vm.replaceGenoDomain.currentAccID == "") {
                                vm.replaceGenoDomain.currentKey = "";
			        vm.replaceGenoDomain.currentDisplay = "";
			        vm.replaceGenoDomain.currentAccID = "";
				return;
			}

			// params if used for the validation search only
			var params = {};
			params.accID = vm.replaceGenoDomain.currentAccID;
			
			ValidateGenotypeAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Genotype: " + vm.replaceGenoDomain.currentAccID);
					document.getElementById(id).focus();
                                        vm.replaceGenoDomain.currentKey = "";
			                vm.replaceGenoDomain.currentDisplay = "";
			                vm.replaceGenoDomain.currentAccID = "";
				} else {
                                        vm.replaceGenoDomain.currentKey = data[0].genotypeKey;
			                vm.replaceGenoDomain.currentDisplay = data[0].genotypeDisplay;
			                vm.replaceGenoDomain.currentAccID = data[0].accID;
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateGenotypeAPI.search");
				document.getElementById(id).focus();
                                vm.replaceGenoDomain.currentKey = "";
			        vm.replaceGenoDomain.currentDisplay = "";
			        vm.replaceGenoDomain.currentAccID = "";
			});
		}

                // validate new genotype
		function validateReplaceGeno2(id) {
			console.log("validateReplaceGeno2():" + id);

                        // if the key pressed was not a TAB, do nothing and return.
                        if (event.keyCode !== 9) {
                                return;
                        }

			if (vm.replaceGenoDomain.newAccID == "") {
                                vm.replaceGenoDomain.newKey = "";
			        vm.replaceGenoDomain.newDisplay = "";
			        vm.replaceGenoDomain.newAccID = "";
				return;
			}

			// params if used for the validation search only
			var params = {};
			params.accID = vm.replaceGenoDomain.newAccID;
			
			ValidateGenotypeAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Genotype: " + vm.replaceGenoDomain.currentAccID);
					document.getElementById(id).focus();
                                        vm.replaceGenoDomain.newKey = "";
			                vm.replaceGenoDomain.newDisplay = "";
			                vm.replaceGenoDomain.newAccID = "";
				} else {
                                        vm.replaceGenoDomain.newKey = data[0].genotypeKey;
			                vm.replaceGenoDomain.newDisplay = data[0].genotypeDisplay;
			                vm.replaceGenoDomain.newAccID = data[0].accID;
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateGenotypeAPI.search");
				document.getElementById(id).focus();
                                vm.replaceGenoDomain.newKey = "";
			        vm.replaceGenoDomain.newDisplay = "";
			        vm.replaceGenoDomain.newAccID = "";
			});
		}

                // copy data from previous row
		function validateSpecimen(event, row, index, id) {
			console.log("validateSpecimen = " + id + '-' + index + ':' + event.keyCode);

			vm.selectedSpecimenIndex = index;

                        // if the key pressed was not a TAB, do nothing and return.
                        if (event.keyCode !== 9) {
                                return;
                        }

                        if (index <= 0) {
                                console.log("validateSpecimen/do nothing: " + index);
                                return;
                        }

                        if (id == 'specimenLabel' && row.specimenLabel == "") {
                                row.specimenLabel = vm.apiDomain.specimens[index-1].specimenLabel;
                        }
                        else if (id == 'embeddingKey' && row.embeddingKey == "") {
                                row.embeddingKey = vm.apiDomain.specimens[index-1].embeddingKey;
                        }
                        else if (id == 'fixationKey' && row.fixationKey == "") {
                                row.fixationKey = vm.apiDomain.specimens[index-1].fixationKey;
                        }
                        else if (id == 'sex' && row.sex == "") {
                                row.sex = vm.apiDomain.specimens[index-1].sex;
                        }
                        else if (id == 'hybridization' && row.hybridization == "") {
                                row.hybridization = vm.apiDomain.specimens[index-1].hybridization;
                        }
                        else if (id == 'agePrefix' && row.agePrefix == "") {
                                row.agePrefix = vm.apiDomain.specimens[index-1].agePrefix;
                                row.age = row.agePrefix;
                        }

                        else if (
                                id == 'ageStage' && 
                                (row.ageStage == "" || row.ageStage == null) &&
                                (
                                        vm.apiDomain.specimens[index].agePrefix == "embryonic day" ||
                                        vm.apiDomain.specimens[index].agePrefix == "postnatal day" ||
                                        vm.apiDomain.specimens[index].agePrefix == "postnatal week" ||
                                        vm.apiDomain.specimens[index].agePrefix == "postnatal month" ||
                                        vm.apiDomain.specimens[index].agePrefix == "postnatal year"
                                )
                        ) {
                                row.ageStage = vm.apiDomain.specimens[index-1].ageStage;
                                row.age = row.agePrefix + " " + row.ageStage;
                        }

                        else if (
                                id == 'ageStage' && 
                                row.ageStage != "" && 
                                row.ageState != null &&
                                (
                                        vm.apiDomain.specimens[index].agePrefix == "postnatal" ||
                                        vm.apiDomain.specimens[index].agePrefix == "postnatal adult" ||
                                        vm.apiDomain.specimens[index].agePrefix == "postnatal newborn"
                                )
                        ) {
				alert("Invalid Age Value: " + vm.apiDomain.specimens[index].agePrefix);
				document.getElementById(id + '-' + index).focus();
                                row.ageStage = "";
                        }
                }

                // copy data from previous row
		function validateSresults(row, index, id) {
			console.log("validateSresults = " + id + '-' + index);

			var sindex = vm.selectedSpecimenIndex;
			vm.selectedSpecimenResultIndex = index;

                        if (index <= 0) {
                                return;
                        }

                        if (id == 'strength' && row.strengthKey == "") {
                                row.strengthKey = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[index-1].strengthKey;
                        }

                        else if (id == 'pattern' && row.patternKey == "") {
                                row.patternKey = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[index-1].patternKey;
                        }

                        else if (id == 'imagePane' && row.imagePanes == "") {
                                if (vm.apiDomain.specimens[sindex].sresults[index-1].imagePanes == null) {
                                        return;
                                }
                                // set processStatus = "c"
			        for(var i=0;i<vm.apiDomain.specimens[sindex].sresults[index-1].imagePanes.length; i++) {
                                        // do not change value of source
                                        var item = Object.assign({}, vm.apiDomain.specimens[sindex].sresults[index-1].imagePanes[i]);
                                        item.resultKey = "";
                                        item.processStatus = "c";
                                        vm.apiDomain.specimens[sindex].sresults[index].imagePanes.splice(i, 0, item);
                                }
                                row.imagePanesString = vm.apiDomain.specimens[sindex].sresults[index-1].imagePanesString;
                                setImagePaneUsed();
                        }

                        if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].processStatus === "x") {
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].processStatus = "u";
                        }
                }

		/////////////////////////////////////////////////////////////////////
		// genotype lookup
		/////////////////////////////////////////////////////////////////////		
	
		// reset genotype lookup
		function resetGenotype() {
			console.log("resetGenotype()");
                        vm.genotypeLookup = {};
		}

		// set current genotype row
		function selectGenotypeRow(index) {
			console.log("selectGenotypeRow()");

                        if (vm.apiDomain.isInSitu == true) {
                                var index = vm.selectedSpecimenIndex;
			        if (vm.apiDomain.specimens == null) {
                                        return;
                                }

			        if (vm.apiDomain.specimens[index].assayKey != "" && vm.apiDomain.specimens.length == 0) {
				        addSpecimenRow();
			        }

                                loadGenotype();
        
                                setTimeout(function() {
                                        selectSpecimenResultRow(0);
                                        setGenotypeUsed();
                                }, (300));
                        }
                        else {
                                var index = vm.selectedGelLaneIndex;
			        if (vm.apiDomain.gelLanes == null) {
                                        return;
                                }

			        if (vm.apiDomain.gelLanes[index].assayKey != "" && vm.apiDomain.gelLanes.length == 0) {
				        addGelLaneRow(false);
			        }

                                loadGenotype();
        
                                setTimeout(function() {
                                        //selectGelLaneResultRow(0);
                                        setGenotypeUsed();
                                }, (300));
                        }
		}

		// selected genotype row
		function selectGenotype(index) {
			console.log("selectGenotype(): " + index);

                        if (vm.apiDomain.isInSitu == true) {
                                if (vm.apiDomain.specimens == null || vm.apiDomain.specimens == "") {
                                        return;
                                }

		                vm.apiDomain.specimens[vm.selectedSpecimenIndex].genotypeKey = vm.genotypeLookup[index].objectKey;
		                vm.apiDomain.specimens[vm.selectedSpecimenIndex].genotypeAccID = vm.genotypeLookup[index].label;
                                changeSpecimenRow(vm.selectedSpecimenIndex, false);
                                setGenotypeUsed();
                                setTimeout(function() {
                                        var id = "sgenotypeAccID-" + vm.selectedSpecimenIndex;
                                        console.log("selectGenotype() focus:" + id);
                                        document.getElementById(id).focus();
                                }, (300));
                        }
                        else {
                                if (vm.apiDomain.gelLanes == null || vm.apiDomain.gelLanes == "") {
                                        return;
                                }

		                vm.apiDomain.gelLanes[vm.selectedGelLaneIndex].genotypeKey = vm.genotypeLookup[index].objectKey;
		                vm.apiDomain.gelLanes[vm.selectedGelLaneIndex].genotypeAccID = vm.genotypeLookup[index].label;
                                changeGelLaneRow(vm.selectedGelLaneIndex, false);
                                setGenotypeUsed();
                                setTimeout(function() {
                                        var id = "ggenotypeAccID-" + vm.selectedGelLaneIndex;
                                        console.log("selectGenotype() focus:" + id);
                                        document.getElementById(id).focus();
                                }, (300));
                        }
		}		

                // set selected genotype clipboard to yellow
                function setGenotypeUsed() {
			console.log("setGenotypeUsed()");

                        if (vm.apiDomain.isInSitu == true) {
                                if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].genotypeKey == "") {
                                        return;
                                }
                        }
                        else {
                                if (vm.apiDomain.gelLanes[vm.selectedGelLaneIndex].genotypeKey == "") {
                                        return;
                                }
                        }

                        var genotypeKey = "";
                        if (vm.apiDomain.isInSitu == true) {
                                genotypeKey = vm.apiDomain.specimens[vm.selectedSpecimenIndex].genotypeKey;
                        }
                        else {
                                genotypeKey = vm.apiDomain.gelLanes[vm.selectedGelLaneIndex].genotypeKey;
                        }

                        // iterate thru genotypeLookup
			for(var i=0;i<vm.genotypeLookup.length; i++) {
                                var id = "genotypeTerm-" + i;

                                if (vm.genotypeLookup[i].objectKey == genotypeKey) {
                                        document.getElementById(id).style.backgroundColor = "rgb(252,251,186)";
                                        document.getElementById(id).scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
                                }
                                else {
                                        document.getElementById(id).style.backgroundColor = "rgb(238,238,238)";
                                }
                        }
                }

		// load genotype clipboard by assay
		function loadGenotype() {
			console.log("loadGenotype()");

			resetGenotype();

			var params = {};
			params.createdBy = USERNAME;

			if (vm.apiDomain.assayKey != "") {
			        params.assayKey = vm.apiDomain.assayKey;
                        }

			GenotypeBySetUserAPI.search(params, function(data) {
				if (data.length > 0) {
                                        console.log(data);
					vm.genotypeLookup = data;
				}
				else {
					vm.genotypeLookup = {};
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: GenotypeBySetUserAPI.search");
			});
		}	

		/////////////////////////////////////////////////////////////////////
		// image pane lookup
		/////////////////////////////////////////////////////////////////////		
                
		// reset image pane lookup
		function resetImagePane() {
			console.log("resetImagePane()");
			vm.imagePaneLookup = [];
		}

                // refresh the imagePane when clicking on Image Pane/results button
		function refreshImagePane() {
			console.log("refreshImagePane()");
			loadImagePane();
                        setTimeout(function() {
                                setImagePaneUsed();
                        }, (300));
		}

                // re-set vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanesString
                function resetImagePaneString() {
                        console.log("resetImagePaneString()");

                        var newImageString = []

                        if (vm.apiDomain.isInSitu == true) {
			        for(var i=0;i<vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanes.length; i++) {
                                        if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanes[i].imagePaneKey != "") {
                                                if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanes[i].processStatus != "d") {
                                                        newImageString.push(vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanes[i].figurepaneLabel);
                                                }
                                        }
                                }
                                newImageString.sort();
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanesString = newImageString.join(",");
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanesCount = newImageString.length;
                        }
                        else {
                        }

		}		

		// select/de-select image pane items
		function selectImagePane(index) {
			console.log("selectImagePane(): " + index);

                        if (vm.apiDomain.isInSitu == true) {
                                if (vm.apiDomain.specimens == null || vm.apiDomain.specimens == "") {
                                        return;
                                }
        
                                if (
                                        vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults == null ||  
                                        vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults == "") 
                                {
                                        return;
                                }

                                selectImagePaneInSitu(index);
                        }
                        else {
                                selectImagePaneGel(index);
                        }
                }

		// select/de-select image pane item row from sresults/imagePanes
		function selectImagePaneInSitu(index) {
			console.log("selectImagePaneInSitu(): " + index);

                        // set imagePaneLookup/index
                        var id = "imagePaneTerm-" + index;
                        console.log(id);

                        if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanes == null) {
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanes = [];
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanesString = "";
                        }

                        // set dKey = current sresults[].imagePane row
                        // where imagePaneLookup[eKey].imagePaneKey = sresults[].imagePanes[sKey].imagePaneKey
                        var eKey = vm.imagePaneLookup[index].imagePaneKey;
                        var dKey = -1;
			for(var i=0;i<vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanes.length; i++) {
                                var sKey = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanes[i].imagePaneKey;
                                if (eKey == sKey) {
                                        dKey = i;
                                        break;
                                }
                        }

                        // if imagePaneLookup item is not being used by sresults/imagePanes, then add
                        if (vm.imagePaneLookup[index].isUsed == false) {

                                var item = {
                                        "processStatus": "c",
                                        "resultImageKey": "",
                                        "resultKey": vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].resultKey,
                                        "imagePaneKey": vm.imagePaneLookup[index].imagePaneKey,
                                        "figurepaneLabel": vm.imagePaneLookup[index].figurepaneLabel,
                                        "creation_date": "",
                                        "modification_date": ""
                                }

                                // add term to sresults.imagePanes
                                if (dKey < 0) {
                                        vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanes.push(item);
                                }
                                // else, set exiting item.processStatus == "x"
                                else {
                                        vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanes[dKey].processStatus = "x";
                                }

                                // update display
                                // set style = yellow
                                // set 'isUsed = true'
                                
                                document.getElementById(id).style.backgroundColor = "rgb(252,251,186)";
                                vm.imagePaneLookup[index].isUsed = true;
                                resetImagePaneString();
                        }

                        // de-selecting item
                        else {
                                // if existing item (has resultImage primary key
                                if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanes[dKey].resultImageKey != "") {
                                        vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanes[dKey].processStatus = "d";
                                }
                                // else remove the new item entirely
                                else {
                                        vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanes.splice(dKey, 1);
                                }

                                // update count
                                // set style = normal
                                // set 'isUsed = false'
                                //
                                document.getElementById(id).style.backgroundColor = "rgb(238,238,238)";
                                vm.imagePaneLookup[index].isUsed = false;
                                resetImagePaneString();
                        }

                        setTimeout(function() {
                                document.getElementById("imagePane-" + vm.selectedSpecimenResultIndex).focus({preventScroll:true});
                        }, (300));
                }

		// select/de-select image pane item; only 1 per Gel
		function selectImagePaneGel(index) {
			console.log("selectImagePaneGel(): " + index);

                        // remove yellow from all imagePaneLookup
                        var id = "imagePaneTerm-";
			for(var j=0;j<vm.imagePaneLookup.length; j++) {
                                id = "imagePaneTerm-" + j;
                                document.getElementById(id).style.backgroundColor = "rgb(238,238,238)";
                        }

                        if (vm.imagePaneLookup[index].isUsed == false) {
                                id = "imagePaneTerm-" + index;
                                vm.apiDomain.imagePaneKey = vm.imagePaneLookup[index].imagePaneKey;
                                document.getElementById(id).style.backgroundColor = "rgb(252,251,186)";
                                vm.imagePaneLookup[index].isUsed = true;
                        }
                        else {
                                vm.apiDomain.imagePaneKey = null;
                                vm.imagePaneLookup[index].isUsed = false;
                        }

                        setTimeout(function() {
                                document.getElementById("laneLabel-" + vm.selectedGelLaneIndex).focus({preventScroll:true});
                        }, (300));
                }

                // set used image panes to yellow
                function setImagePaneUsed() {
			console.log("setImagePaneUsed()");

                        var imagePaneLength = 0;
                        var id = "";
                        var sKey = "";
                        var eKey = "";
                        var index

                        if (vm.apiDomain.isInSitu == true) {
                                if (vm.apiDomain.specimens == null) {
                                        return;
                                }
                                if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanes != null) {
                                        imagePaneLength = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanes.length;
                                }
                        }
                        else {
                                if (vm.apiDomain.gelLanes == null) {
                                        return;
                                }
                                imagePaneLength = 1;
                        }

			for(var j=0;j<vm.imagePaneLookup.length; j++) {
                                var id = "imagePaneTerm-" + j;
                                document.getElementById(id).style.backgroundColor = "rgb(238,238,238)";
                                vm.imagePaneLookup[j].isUsed = false;
                        }

                        if (imagePaneLength == 0) {
                                return;
                        }

                        // iterate thru sresults.imagePanes
			for(var i=0;i<imagePaneLength; i++) {

                                if (vm.apiDomain.isInSitu == true) {
                                        if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanes[i].processStatus == "d") {
                                                continue;
                                        }
                                }

                                if (vm.apiDomain.isInSitu == true) {
                                        sKey = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanes[i].imagePaneKey;
                                }
                                else {
                                        sKey = vm.apiDomain.imagePaneKey;
                                }

                                // iterate thru imagePaneLookup
			        for(var j=0;j<vm.imagePaneLookup.length; j++) {
                                        id = "imagePaneTerm-" + j;
                                        eKey = vm.imagePaneLookup[j].imagePaneKey;
                                        if (sKey == eKey) {
                                                document.getElementById(id).style.backgroundColor = "rgb(252,251,186)";
                                                document.getElementById(id).scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
                                                vm.imagePaneLookup[j].isUsed = true;
                                        }
                                }
                        }
                }

		// load image pane by reference
		function loadImagePane() {
			console.log("loadImagePane()");

			resetImagePane();

                        if (vm.apiDomain.refsKey == "") {
                                return;
                        }

                        setTimeout(function() {
			        ImagePaneByReferenceAPI.search(vm.apiDomain.refsKey, function(data) {
				        if (data.length > 0) {
                                                console.log(data);
					        vm.imagePaneLookup = data;
				        }
				        else {
					        vm.imagePaneLookup = {};
				        }
                                        setTimeout(function() {
                                                setImagePaneUsed();
                                        }, (500));
			        }, function(err) {
				        pageScope.handleError(vm, "API ERROR: ImagePaneByReferenceAPI.search");
			        });
                        }, (500));
		}	

		/////////////////////////////////////////////////////////////////////
		// emapa lookup
		/////////////////////////////////////////////////////////////////////		
                
                // refresh the emapa lookup when clicking on EMAPA/results button
		function refreshEmapa() {
			console.log("refreshEmapa()");

                        if (vm.apiDomain.isInSitu == true) {
                                selectSpecimenResultRow(vm.selectedSpecimenResultIndex);
                        }
                        else {
                                selectGelLaneRow(vm.selectedGelLaneIndex);
                        }
		}

		// reset emapa lookup
		function resetEmapa() {
			console.log("resetEmapa()");
			vm.emapaLookup = {};
		}

		// select/de-select emapa items
		function selectEmapa(index) {
			console.log("selectEmapa(): " + index);

                        if (vm.apiDomain.isInSitu == true) {
                                if (vm.apiDomain.specimens == null || vm.apiDomain.specimens == "") {
                                        return;
                                }

                                if (
                                        vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults == null ||  
                                        vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults == ""
                                ) {
                                        return;
                                }

                                selectEmapaInSitu(index);
                        }
                        else {
                                if (vm.apiDomain.gelLanes == null || vm.apiDomain.gelLanes == "") {
                                        return;
                                }

                                selectEmapaGel(index);
                        }
                }

		// if isInSitu
		// select/de-select emapa item row from sresults/structures
		function selectEmapaInSitu(index) {
			console.log("selectEmapaInSitu(): " + index);

                        // set emapaLookup/index
                        var id = "emapaTerm-" + index;

                        if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].structures == null) {
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].structures = [];
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].structuresCount = 0;
                        }

                        // set dKey = current sresults[].structures row
                        // where emapaLookup[eKey].emapaTermKey/stage = sresults[].structures[sKey].emapaTermKey/stage
                        var elKey = vm.emapaLookup[index].objectKey;
                        var slKey = vm.emapaLookup[index].stage;
                        var dKey = -1;
                        // find the index of the de-selected item
			for(var i=0;i<vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].structures.length; i++) {
                                var esKey = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].structures[i].emapaTermKey;
                                var ssKey = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].structures[i].theilerStageKey;
                                console.log(elKey + ":" + esKey + "," + ssKey);
                                if (elKey == esKey && slKey == ssKey) {
                                        dKey = i;
                                        break;
                                }
                        }

                        // if emapaLookup item is not being used by sresults/structures, then add
                        if (vm.emapaLookup[index].isUsed == false) {

			        var item = {
				        "processStatus": "c",
                                        "resultStructureKey": "",
                                        "resultKey": vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].resultKey,
                                        "emapaTermKey": vm.emapaLookup[index].objectKey,
                                        "emapaTerm": vm.emapaLookup[index].term,
                                        "theilerStageKey" : vm.emapaLookup[index].stage,
                                        "theilerStage" : vm.emapaLookup[index].stage,
                                        "creation_date": "",
                                        "modification_date": ""
			        }

                                // add term to sresults.structures
                                if (dKey < 0) {
                                        vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].structures.push(item);
                                }
                                // else, set exiting item.processStatus == "x"
                                else {
                                        vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].structures[dKey].processStatus = "x";
                                }

                                // set style = yellow
                                // set 'isUsed = true'
                                document.getElementById(id).style.backgroundColor = "rgb(252,251,186)";
                                vm.emapaLookup[index].isUsed = true;
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].structuresCount += 1;
                        }

                        // de-selecting item
                        else {
                                // if existing item (has resultImage primary key
                                if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].structures[dKey].resultStructureKey != "") {
                                        vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].structures[dKey].processStatus = "d";
                                }
                                // else remove the new item entirely
                                else {
                                        vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].structures.splice(dKey, 1);
                                }

                                // set style = un-yellow
                                // set 'isUsed = false'
                                document.getElementById(id).style.backgroundColor = "rgb(238,238,238)";
                                vm.emapaLookup[index].isUsed = false;
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].structuresCount -= 1;
                        }

                        setTimeout(function() {
                                changeSpecimenResultRow(vm.selectedSpecimenResultIndex, true);
                        }, (300));
		}		

		// if isGel
		// select/de-select emapa item row from gelLanes/structures
		function selectEmapaGel(index) {
			console.log("selectEmapaGel(): " + index);

                        // set emapaLookup/index
                        var id = "emapaTerm-" + index;

                        if (vm.apiDomain.gelLanes[vm.selectedGelLaneIndex].structures == null) {
                                vm.apiDomain.gelLanes[vm.selectedGelLaneIndex].structures = [];
                                vm.apiDomain.gelLanes[vm.selectedGelLaneIndex].structuresCount = 0;
                        }

                        // set dKey = current structures row
                        // where emapaLookup[eKey].emapaTermKey/stage = structures[sKey].emapaTermKey/stage
                        var elKey = vm.emapaLookup[index].objectKey;
                        var slKey = vm.emapaLookup[index].stage;
                        var dKey = -1;
                        // find the index of the de-selected item
			for(var i=0;i<vm.apiDomain.gelLanes[vm.selectedGelLaneIndex].structures.length; i++) {
                                var esKey = vm.apiDomain.gelLanes[vm.selectedGelLaneIndex].structures[i].emapaTermKey;
                                var ssKey = vm.apiDomain.gelLanes[vm.selectedGelLaneIndex].structures[i].theilerStageKey;
                                console.log(elKey + ":" + esKey + "," + ssKey);
                                if (elKey == esKey && slKey == ssKey) {
                                        dKey = i;
                                        break;
                                }
                        }

                        // if emapaLookup item is not being used by structures, then add
                        if (vm.emapaLookup[index].isUsed == false) {

			        var item = {
				        "processStatus": "c",
                                        "gelLaneStructureKey": "",
                                        "gelLaneKey": vm.apiDomain.gelLanes[vm.selectedGelLaneIndex].gelLaneKey,
                                        "emapaTermKey": vm.emapaLookup[index].objectKey,
                                        "emapaTerm": vm.emapaLookup[index].term,
                                        "theilerStageKey" : vm.emapaLookup[index].stage,
                                        "theilerStage" : vm.emapaLookup[index].stage,
                                        "creation_date": "",
                                        "modification_date": ""
			        }

                                // add term to structures
                                if (dKey < 0) {
                                        vm.apiDomain.gelLanes[vm.selectedGelLaneIndex].structures.push(item);
                                }
                                // else, set exiting item.processStatus == "x"
                                else {
                                        vm.apiDomain.gelLanes[vm.selectedGelLaneIndex].structures[dKey].processStatus = "x";
                                }

                                // set style = yellow
                                // set 'isUsed = true'
                                document.getElementById(id).style.backgroundColor = "rgb(252,251,186)";
                                vm.emapaLookup[index].isUsed = true;
                                vm.apiDomain.gelLanes[vm.selectedGelLaneIndex].structuresCount += 1;
                        }

                        // de-selecting item
                        else {
                                // if existing item (has resultImage primary key
                                if (vm.apiDomain.gelLanes[vm.selectedGelLaneIndex].structures[dKey].resultStructureKey != "") {
                                        vm.apiDomain.gelLanes[vm.selectedGelLaneIndex].structures[dKey].processStatus = "d";
                                }
                                // else remove the new item entirely
                                else {
                                        vm.apiDomain.gelLanes[vm.selectedGelLaneIndex].structures.splice(dKey, 1);
                                }

                                // set style = un-yellow
                                // set 'isUsed = false'
                                document.getElementById(id).style.backgroundColor = "rgb(238,238,238)";
                                vm.emapaLookup[index].isUsed = false;
                                vm.apiDomain.gelLanes[vm.selectedGelLaneIndex].structuresCount -= 1;
                        }

                        // don't change the focus
                        setTimeout(function() {
                                changeGelLaneRow(vm.selectedGelLaneIndex, false);
				document.getElementById('gstructure-' + vm.selectedGelLaneIndex).focus();
                        }, (300));
		}		

                // find which emapaLookup values are being used by sresults/structures
                // and set emapaLookup.isUsed and background
                function setEmapaUsed() {
			console.log("setEmapaUsed()");

                        var structureLength = 0;

                        if (vm.apiDomain.isInSitu == true) {
                                if (vm.apiDomain.specimens == null) {
                                        return;
                                }
                                if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].structures != null) {
                                        structureLength = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].structures.length;
                                }
                        }
                        else {
                                if (vm.apiDomain.gelLanes == null) {
                                        return;
                                }
                                if (vm.apiDomain.gelLanes[vm.selectedGelLaneIndex].structures != null) {
                                        structureLength = vm.apiDomain.gelLanes[vm.selectedGelLaneIndex].structures.length;
                                }
                        }

			for(var j=0;j<vm.emapaLookup.length; j++) {
                                var id = "emapaTerm-" + j;
                                document.getElementById(id).style.backgroundColor = "rgb(238,238,238)";
                                vm.emapaLookup[j].isUsed = 0;
                        }

                        if (structureLength == 0) {
                                return;
                        }

                        // iterate thru results/structures
			for(var i=0;i<structureLength; i++) {

                                var esKey = "";
                                var ssKey = "";

                                if (vm.apiDomain.isInSitu == true) {
                                        esKey = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].structures[i].emapaTermKey;
                                        ssKey = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].structures[i].theilerStageKey;
                                }
                                else {
                                        esKey = vm.apiDomain.gelLanes[vm.selectedGelLaneIndex].structures[i].emapaTermKey;
                                        ssKey = vm.apiDomain.gelLanes[vm.selectedGelLaneIndex].structures[i].theilerStageKey;
                                }

                                // iterate thru structures
			        for(var j=0;j<vm.emapaLookup.length; j++) {
                                        var id = "emapaTerm-" + j;
                                        var elKey = vm.emapaLookup[j].objectKey;
                                        var slKey = vm.emapaLookup[j].stage;
                                        if ((elKey == esKey) && (slKey == ssKey)) {
                                                document.getElementById(id).style.backgroundColor = "rgb(252,251,186)";
                                                vm.emapaLookup[j].isUsed = 1;
                                        }
                                }
                        }
                }

		// load emapa by InSitu or Gel
		function loadEmapa() {
			console.log("loadEmapa()");

			resetEmapa();

                        if (vm.apiDomain.isGel == true) {
                                loadEmapaGel();
                        }
                        else {
                                loadEmapaInSitu();
                        }
                }

		// load emapa by InSitu 
		function loadEmapaInSitu() {
			console.log("loadEmapaInSitu()");

			var params = {};

                        if (vm.apiDomain.specimens != null && vm.apiDomain.specimens.length > 0) {
                                if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].specimenKey != "") {
			                params.specimenKey = vm.apiDomain.specimens[vm.selectedSpecimenIndex].specimenKey;
                                }
                        }
                        else {
                                return;
                        }

			params.createdBy = USERNAME;

			EmapaInSituBySetUserAPI.search(params, function(data) {
				if (data.length > 0) {
					vm.emapaLookup = data;
				}
				else {
					vm.emapaLookup = {};
				}
                                setTimeout(function() {
                                        setEmapaUsed();
                                }, (500));
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: EmapaBySetUserAPI.search");
			});
		}	

		// load emapa by Assay
		function loadEmapaGel() {
			console.log("loadEmapaGel()");

			var params = {};

                        if (vm.apiDomain.assayKey == null || vm.apiDomain.assayKey == "") {
                                params.assayKey = null;
                        }
                        else {
			        params.assayKey = vm.apiDomain.assayKey;
                        }

			params.createdBy = USERNAME;

			EmapaGelBySetUserAPI.search(params, function(data) {
				if (data.length > 0) {
					vm.emapaLookup = data;
				}
				else {
					vm.emapaLookup = {};
				}
                                setTimeout(function() {
                                        setEmapaUsed();
                                }, (500));
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: EmapaBySetUserAPI.search");
			});
		}	

		function addToEmapa() {
			console.log("addToEmapa()");

                        if (vm.apiDomain.assayKey == "") {
                                return;
                        }

			var params = {};
                        params.assayKey = vm.apiDomain.assayKey;
			params.createdBy = USERNAME;

			AddToEmapaClipboardAPI.search(params, function(data) {
				loadObject();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AddToEmapaClipboardAPI.search");
			});
                }

                ///
                // duplicate prep, partial, all
                // duplicateType = 1 -> all
                // duplicateType = 2 -> partial (specimen/gel)
                // duplicateType = 3 -> prep (preps & note)
                //
                
                function duplicateAssay(duplicateType) {
                        console.log("duplicateAssay():" + duplicateType);

                        var newAssay = vm.apiDomain;
                        vm.selectedIndex = -1;

                        newAssay.assayKey = "";
                        newAssay.accID = "";
                        newAssay.imagePaneKey = "";
                        newAssay.createdBy = "";
                        newAssay.createdByKey = "";
                        newAssay.creation_date = "";
                        newAssay.modifiedBy = "";
                        newAssay.modifiedByKey = "";
                        newAssay.modification_date = "";
                        newAssay.assayDisplay = newAssay.jnumid + "; " + newAssay.assayTypeAbbrev + "; " + newAssay.markerSymbol;
                        newAssay.antibodyPrep.processStatus = "c";
                        newAssay.probePrep.processStatus = "c";
                        newAssay.assayNote.processStatus = "c";
                        newAssay.assayNote.assayKey = "";

                        if (duplicateType == 1 || duplicateType == 2) {

                                // specimen
                                if (vm.apiDomain.isInSitu == true) {
			                for(var i=0;i<newAssay.specimens.length; i++) {
                                                newAssay.specimens[i].processStatus = "c";
                                                newAssay.specimens[i].assayKey = "";
                                                newAssay.specimens[i].specimenKey = "";

                                                if (duplicateType == 1) {

                                                        // specimen/result
			                                for(var j=0;j<newAssay.specimens[i].sresults.length; j++) {
                                                                newAssay.specimens[i].sresults[j].processStatus = "c";
                                                                newAssay.specimens[i].sresults[j].resultKey = "";
                                                                newAssay.specimens[i].sresults[j].specimenKey = "";
			                                        for(var k=0;k<newAssay.specimens[i].sresults[j].structures.length; k++) {
                                                                        newAssay.specimens[i].sresults[j].structures[k].processStatus = "c";
                                                                        newAssay.specimens[i].sresults[j].structures[k].resultStructureKey = "";
                                                                        newAssay.specimens[i].sresults[j].structures[k].resultKey = "";
                                                                }
                                                                if (newAssay.specimens[i].sresults[j].imagePanes != null) {
			                                                for(var k=0;k<newAssay.specimens[i].sresults[j].imagePanes.length; k++) {
                                                                                newAssay.specimens[i].sresults[j].imagePanes[k].processStatus = "c";
                                                                                newAssay.specimens[i].sresults[j].imagePanes[k].resultImageKey = "";
                                                                                newAssay.specimens[i].sresults[j].imagePanes[k].resultKey = "";
                                                                        }
                                                                }
                                                        }

                                                }
                                        }
                                }

                                // gel
                                else {
                                        // gelLanes
			                for(var i=0;i<newAssay.gelLanes.length; i++) {
                                                newAssay.gelLanes[i].processStatus = "c";
                                                newAssay.gelLanes[i].assayKey = "";
                                                newAssay.gelLanes[i].gelLaneKey = "";
			                        if (newAssay.gelLanes[i].structures != null) {
			                                for(var k=0;k<newAssay.gelLanes[i].structures.length; k++) {
                                                                newAssay.gelLanes[i].structures[k].processStatus = "c";
                                                                newAssay.gelLanes[i].structures[k].gelLaneStructureKey = "";
                                                                newAssay.gelLanes[i].structures[k].gelLaneKey = "";
                                                        }
                                                }

                                                // gelBands
                                                if (duplicateType == 1) {
			                                for(var j=0;j<newAssay.gelLanes[i].gelBands.length; j++) {
                                                                newAssay.gelLanes[i].gelBands[j].processStatus = "c";
                                                                newAssay.gelLanes[i].gelBands[j].gelBandKey = "";
                                                                newAssay.gelLanes[i].gelBands[j].gelLaneKey = "";
                                                        }
                                                }
                                        }
                                        // gelRows
                                        if (duplicateType == 1) {
			                        for(var i=0;i<newAssay.gelRows.length; i++) {
                                                        newAssay.gelRows[i].processStatus = "c";
                                                        newAssay.gelRows[i].gelRowKey = "";
                                                        newAssay.gelRows[i].assayKey = "";
                                                }
                                        }
                                }
                        }

                        vm.apiDomain = newAssay;
                        create();
                        lastSummaryObject();
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

                // insitu specimens, results
                $scope.selectSpecimenRow = selectSpecimenRow;
                $scope.changeSpecimenRow = changeSpecimenRow;
                $scope.addSpecimenRow = addSpecimenRow;
                $scope.insertSpecimenRow = insertSpecimenRow;
                $scope.copyColumnSpecimenRow = copyColumnSpecimenRow;
                $scope.attachAgeNote = attachAgeNote;
                $scope.setSpecimenNextRow = setSpecimenNextRow;
                $scope.setSpecimenResultNextRow = setSpecimenResultNextRow;
                $scope.setSpecimenOrResults = setSpecimenOrResults;
                $scope.sortSpecimenTable = sortSpecimenTable;
                $scope.selectSpecimenResultRow = selectSpecimenResultRow;
                $scope.changeSpecimenResultRow = changeSpecimenResultRow;
                $scope.addSpecimenResultRow = addSpecimenResultRow;
                $scope.insertSpecimenResultRow = insertSpecimenResultRow;
                $scope.deleteSpecimenResultRow = deleteSpecimenResultRow;
                $scope.copyColumnSpecimenResultRow = copyColumnSpecimenResultRow;

                // gel lanes, results (rows & bands)
                $scope.selectGelLaneRow = selectGelLaneRow;
                $scope.changeGelLaneRow = changeGelLaneRow;
                $scope.changeGelControlRow = changeGelControlRow;
                $scope.changeGelBandRow = changeGelBandRow;
                $scope.changeGelRow = changeGelRow;
                $scope.addGelLaneRow = addGelLaneRow;
                $scope.insertGelLaneRow = insertGelLaneRow;
                $scope.addGelRow = addGelRow;
                $scope.addGelBandRow = addGelBandRow;
                $scope.copyColumnGelLaneRow = copyColumnGelLaneRow;
                $scope.sortGelLaneTable = sortGelLaneTable;
                $scope.setGelLaneNextRow = setGelLaneNextRow;
                $scope.setGelBandNextRow = setGelBandNextRow;
                
                // assay type/antibody prep/probe prep
                $scope.changeAssayType = changeAssayType;
                $scope.changeDetection = changeDetection;
                $scope.changeAntibodyPrep = changeAntibodyPrep;
                $scope.changeProbePrep = changeProbePrep;

                // Replace Genotype
                $scope.setActiveReplaceGenotype = setActiveReplaceGenotype;
                $scope.clearReplaceGenotype = clearReplaceGenotype;
                $scope.addReplaceGenotype = addReplaceGenotype;
                $scope.processReplaceGenotype = processReplaceGenotype;
                $scope.validateReplaceGeno1 = validateReplaceGeno1;
                $scope.validateReplaceGeno2 = validateReplaceGeno2;

                // Validate
                $scope.validateMarker = validateMarker;
                $scope.validateJnum = validateJnum;
                $scope.validateStrain = validateStrain;
                $scope.validateAntibody = validateAntibody;
                $scope.validateProbe = validateProbe;
                $scope.validateGenotype = validateGenotype;
                $scope.validateSpecimen = validateSpecimen;
                $scope.validateSresults = validateSresults;
                $scope.validateGelLane = validateGelLane;

                // note functions
                $scope.attachAssayNote = attachAssayNote;
                $scope.clearAssayNote = clearAssayNote;
                $scope.changeAssayNote = changeAssayNote;
                $scope.addAssayAccMGITag = addAssayAccMGITag;
                $scope.addSpecimenAccMGITag = addSpecimenAccMGITag;
                $scope.hideShowAssayNote = hideShowAssayNote;

		// clipboard: genotype, image pane, emapa functions
                $scope.selectGenotypeRow = selectGenotypeRow;
                $scope.selectGenotype = selectGenotype;
                $scope.selectImagePane = selectImagePane;
                $scope.refreshImagePane = refreshImagePane;
                $scope.selectEmapa = selectEmapa;
                $scope.addToEmapa = addToEmapa;
                $scope.refreshEmapa = refreshEmapa;

                // duplicate prep, partial, all
                $scope.duplicateAssay = duplicateAssay;

                // setting columns as hideable
                $scope.showAllColumns = showAllColumns;
                $scope.collapseColumnHandler = collapseColumnHandler;

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

		// other functions: buttons, onBlurs and onChanges
		$scope.selectResult = selectResult;

		// global shortcuts
		$scope.Kclear = function() { $scope.clear(); $scope.$apply(); }
		$scope.Ksearch = function() { $scope.search(); $scope.$apply(); }
		$scope.Kfirst = function() { $scope.firstSummaryObject(); $scope.$apply(); }
		$scope.Knext = function() { $scope.nextSummaryObject(); $scope.$apply(); }
		$scope.Kprev = function() { $scope.prevSummaryObject(); $scope.$apply(); }
		$scope.Klast = function() { $scope.lastSummaryObject(); $scope.$apply(); }
		$scope.Kadd = function() { $scope.create(); $scope.$apply(); }
		$scope.Kmodify = function() { $scope.modify(); $scope.$apply(); }
		$scope.Kdelete = function() { $scope.deleteIt(); $scope.$apply(); }
		$scope.Ksresult = function() { $scope.setSpecimenOrResults(); $scope.$apply(); }

		var globalShortcuts = Mousetrap($document[0].body);
		globalShortcuts.bind(['ctrl+alt+c'], $scope.Kclear);
		globalShortcuts.bind(['ctrl+alt+s'], $scope.Ksearch);
		globalShortcuts.bind(['ctrl+alt+f'], $scope.Kfirst);
		globalShortcuts.bind(['ctrl+alt+p'], $scope.Kprev);
		globalShortcuts.bind(['ctrl+alt+n'], $scope.Knext);
		globalShortcuts.bind(['ctrl+alt+l'], $scope.Klast);
		globalShortcuts.bind(['ctrl+alt+a'], $scope.Kadd);
		globalShortcuts.bind(['ctrl+alt+m'], $scope.Kmodify);
		globalShortcuts.bind(['ctrl+alt+d'], $scope.Kdelete);
		globalShortcuts.bind(['ctrl+alt+r'], $scope.Ksresult);
	}

})();

