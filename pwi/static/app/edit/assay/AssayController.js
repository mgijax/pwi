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
                        EmapaBySetUserAPI,
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

        	// mapped to 'Clear' button; called from init();  resets page
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

                        // remove extra/blank specimen rows
                        // verify agePrefix/ageStage
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
				        document.getElementById('ageStage-' + i).focus();
                                        return;
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

                        // remove extra/blank specimen rows
                        // verify agePrefix/ageStage
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
				        document.getElementById('ageStage-' + i).focus();
                                        return;
                                }
                        }

			pageScope.loadingStart();

                        // perhaps remove all extra/blank/"c" specimens that are not being used?
                        // to speed things up

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

		        vm.selectedSpecimenIndex = 0;
		        vm.selectedSpecimenResultIndex = 0;
                        resetBoolean();

                        vm.apiDomain = {};
			vm.apiDomain.assayKey = "";	
			vm.apiDomain.assayDisplay = "";	
                        vm.apiDomain.assayTypeKey = "";
                        vm.apiDomain.assayType = "";
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

                        addAntibodyPrep();
                        addProbePrep();
                        addAssayNote();

                        for(var i=0;i<24; i++) {
                                addSpecimenRow();
                        }
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
                        if (
                                id.includes("structure") ||
                                id.includes("strength") ||
                                id.includes("pattern") ||
                                id.includes("imagePane") ||
                                id.includes("resultNote")
                                )
                        {
                                changeSpecimenRow(vm.selectedSpecimenIndex, false);
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
                                vm.genderLookup = data.items[0].terms
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
                                vm.strengthLookup = data.items[0].terms
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
			        vm.selectedSpecimenIndex = 0;
				vm.results[vm.selectedIndex].assayDisplay = vm.apiDomain.assayDisplay;
                                selectSpecimenRow(0);

                                if (vm.apiDomain.specimens != null) {
			                for(var i=0;i<vm.apiDomain.specimens.length; i++) {
                                                for(var j=0;j<8; j++) {
                                                        addSpecimenResultRow(i);
                                                }
                                        }
                                        for(var i=0;i<10; i++) {
                                                addSpecimenRow();
                                        }
                                }
                                else {
                                        for(var i=0;i<10; i++) {
                                                addSpecimenRow();
                                        }
                                }

                                setTimeout(function() {
                                        if (vm.apiDomain.specimens != null) {
                                                document.getElementById("specimenLabel-0").focus({preventScroll:true});
                                                loadImagePane();
                                        }
                                }, (300));
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
                        setNextRow(event, index, vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults.length, vm.selectedSpecimenResultIndex, "structure-");
                }

                // set next row
		function setNextRow(event, index, tblDomainLength, tblIndex, tblLabel) {
			console.log("setNextRow: " + index + ", " + tblDomainLength + ", " + tblIndex);
			console.log(event);

                        // if the key pressed was not a TAB, do nothing and return.
                        if (event.keyCode !== 9) {
                                return;
                        }

                        if (tblDomainLength - 1 == index) {
			        tblIndex = 0;
                        }
                        else {
			        tblIndex = tblIndex + 1;
                        }

                        var firstLabel = tblLabel + tblIndex;
			document.getElementById(firstLabel).focus();
                        document.getElementById(firstLabel).scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
                        event.stopPropagation()
                        event.preventDefault()

                        if (tblLabel == "specimenLabel-") {
                                selectSpecimenRow(tblIndex);
                        }
                        else if (tblLabel == "structure-") {
                                selectSpecimenResultRow(tblIndex);
                        }
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

                        if (
                                vm.apiDomain.assayTypeKey == "1" ||
                                vm.apiDomain.assayTypeKey == "2" ||
                                vm.apiDomain.assayTypeKey == "3" ||
                                vm.apiDomain.assayTypeKey == "4" ||
                                vm.apiDomain.assayTypeKey == "5"
                        ) {        
                                vm.apiDomain.detectionKey = "1";
                        }
                        else if (
                                vm.apiDomain.assayTypeKey == "6" ||
                                vm.apiDomain.assayTypeKey == "8"
                        ) {        
                                vm.apiDomain.detectionKey = "2";
                        }
                        else if (vm.apiDomain.detectionKey != "") {
                                vm.apiDomain.detectionKey = "3";
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

			if (vm.apiDomain.specimens == null || vm.apiDomain.specimens == undefined) {
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

			if (vm.apiDomain.specimens == undefined) {
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

			for(var i=0;i<vm.apiDomain.specimens.length; i++) {
                                if (vm.apiDomain.specimens[i].ageNote == null || vm.apiDomain.specimens[i].ageNote == "") {
                                        vm.apiDomain.specimens[i].ageNote = note;
                                        if (vm.apiDomain.specimens[i].processStatus == "x") {
                                                vm.apiDomain.specimens[i].processStatus = "u";
                                        }
                                }
                        }
                        var id = "ageNote-" + vm.selectedSpecimenIndex;
                        console.log("attachAgeNote: " + id);
			document.getElementById(id).focus();
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
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults == undefined
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
                                document.getElementById("structure-" + index).focus({preventScroll:true});
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
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[index].strengthKey == "1" &&
			        vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[index].patternKey == ""
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

			if (vm.apiDomain.specimens[index].sresults == undefined) {
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
			if (vm.apiDomain.specimens[index].sresults[i].structures == undefined) {
				vm.apiDomain.specimens[index].sresults[i].structures = [];
			}
                        
                        // imagePanes
			if (vm.apiDomain.specimens[index].sresults[i].imagePanes == undefined) {
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

                        var nextLabel = "structure-" + sindex;
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
                        var index = vm.selectedSpecimenResultIndex;

                        for(var i=0;i<vm.apiDomain.specimens[sindex].sresults.length;i++) {

                                if (vm.apiDomain.specimens[sindex].sresults[i].processStatus == "c") {
                                        break;
                                }

                                if (id == 'strengthKey') {
                                        vm.apiDomain.specimens[sindex].sresults[i].strengthKey = vm.apiDomain.specimens[sindex].sresults[index].strengthKey;
                                }
                                else if (id == 'patternKey') {
                                        vm.apiDomain.specimens[sindex].sresults[i].patternKey = vm.apiDomain.specimens[sindex].sresults[index].patternKey;
                                }
                                else if (id == 'resultNote') {
                                        vm.apiDomain.specimens[sindex].sresults[i].resultNote = vm.apiDomain.specimens[sindex].sresults[index].resultNote;
                                }
                                else if (id == 'imagePanes') {
                                        vm.apiDomain.specimens[sindex].sresults[i].imagePanes = vm.apiDomain.specimens[sindex].sresults[index].imagePanes;
                                        vm.apiDomain.specimens[sindex].sresults[i].imagePanesString = vm.apiDomain.specimens[sindex].sresults[index].imagePanesString;
                                        setImagePaneUsed();
                                }

                                if (vm.apiDomain.specimens[sindex].processStatus == "x") {
                                        vm.apiDomain.specimens[sindex].processStatus = "u";
                                }
                                if (vm.apiDomain.specimens[sindex].sresults[i].processStatus == "x") {
                                        vm.apiDomain.specimens[sindex].sresults[i].processStatus = "u";
                                }
                        }
                }

		/////////////////////////////////////////////////////////////////////
		// notes
		/////////////////////////////////////////////////////////////////////		
                
		// attach acc/mgi tag to assay note
		function addAssayAccMGITag() {
                        console.log("addAssayAccMGITag()");

                        if (vm.apiDomain.assayNote.assayNote == "" || vm.apiDomain.assayNote.assayNote == null) {
                                vm.apiDomain.assayNote.assayNote = "\Acc(MGI:||)";
                        }
                        else {
                                vm.apiDomain.assayNote.assayNote = vm.apiDomain.assayNote.assayNote + " \Acc(MGI:||)";
                        }
		}
		
		// attach acc/mgi tag to assay note
		function addSpecimenAccMGITag() {
                        console.log("addSpecimenAccMGITag()");

                        if (
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].specimenNote == "" || 
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].specimenNote == null
                        ) {
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].specimenNote = "(assay \Acc(MGI:||))";
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
                                return;
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
                                return;
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
				        row.genotypeKey = vm.apiDomain.specimens[index-1].genotypeKey;
                                        row.genotypeAccID = vm.apiDomain.specimens[index-1].genotypeAccID;
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

                        // clear the form
                        
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
                                row.ageStage == "" &&
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

			vm.selectedSpecimenResultIndex = index;

                        if (index <= 0) {
                                return;
                        }

                        if (id == 'strength' && row.strengthKey == "") {
                                row.strengthKey = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[index-1].strengthKey;
                        }

                        if (id == 'pattern' && row.patternKey == "") {
                                row.patternKey = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[index-1].patternKey;
                        }

                        if (id == 'imagePane' && row.imagePanes == "") {
                                row.imagePanes = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[index-1].imagePanes;
                                row.imagePanesString = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[index-1].imagePanesString;
                                setImagePaneUsed();
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

		// selected genotype row
		function selectGenotype(index) {
			console.log("selectGenotype(): " + index);

                        if (vm.apiDomain.specimens == null || vm.apiDomain.specimens == "") {
                                return;
                        }

		        vm.apiDomain.specimens[vm.selectedSpecimenIndex].genotypeKey = vm.genotypeLookup[index].objectKey;
		        vm.apiDomain.specimens[vm.selectedSpecimenIndex].genotypeAccID = vm.genotypeLookup[index].label;
                        changeSpecimenRow(vm.selectedSpecimenIndex, false);
                        setGenotypeUsed();
                        setTimeout(function() {
                                var id = "genotypeAccID-" + vm.selectedSpecimenIndex;
                                console.log("selectGenotype() focus:" + id);
                                document.getElementById(id).focus();
                        }, (300));
		}		

                // set selected genotype clipboard to yellow
                function setGenotypeUsed() {
			console.log("setGenotypeUsed()");

                        if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].genotypeKey == "") {
                                return;
                        }

                        // iterate thru genotypeLookup
			for(var i=0;i<vm.genotypeLookup.length; i++) {
                                var id = "genotypeTerm-" + i;

                                if (vm.genotypeLookup[i].objectKey == vm.apiDomain.specimens[vm.selectedSpecimenIndex].genotypeKey) {
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
			//var item = {
                        //        "specimenKey": "",
                        //        "refsKey": "",
                        //        "imagePaneKey": "",
                        //        "figurepaneLabel": "",
                        //        "isUsed": false
                        //};
                        //vm.imagePaneLookup[0] = item;
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

		// select/de-select image pane item row from sresults/imagePanes
		function selectImagePane(index) {
			console.log("selectImagePane(): " + index);

                        if (vm.apiDomain.specimens == null || vm.apiDomain.specimens == "") {
                                return;
                        }

                        if (
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults == null ||  
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults == "") 
                        {
                                return;
                        }

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
                                changeSpecimenResultRow(vm.selectedSpecimenResultIndex, true);
                        }, (300));
                }

                // set used image panes to yellow
                function setImagePaneUsed() {
			console.log("setImagePaneUsed()");

                        var imagePaneLength = 0;
                        var id = "";
                        var sKey = "";
                        var eKey = "";

                        if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanes != null) {
                                imagePaneLength = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanes.length;
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

                                if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanes[i].processStatus == "d") {
                                        continue;
                                }

                                sKey = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanes[i].imagePaneKey;
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
                                        }, (800));
			        }, function(err) {
				        pageScope.handleError(vm, "API ERROR: ImagePaneByReferenceAPI.search");
			        });
                        }, (500));
		}	

		/////////////////////////////////////////////////////////////////////
		// emapa lookup
		/////////////////////////////////////////////////////////////////////		
                
		// reset emapa lookup
		function resetEmapa() {
			console.log("resetEmapa()");
			vm.emapaLookup = {};
		}

		// select/de-select emapa item row from sresults/structures
		function selectEmapa(index) {
			console.log("selectEmapa(): " + index);

                        if (vm.apiDomain.specimens == null || vm.apiDomain.specimens == "") {
                                return;
                        }

                        if (
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults == null ||  
                                vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults == ""
                        ) {
                                return;
                        }

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

                // find which emapaLookup values are being used by sresults/structures
                // and set emapaLookup.isUsed and background
                function setEmapaUsed() {
			console.log("setEmapaUsed()");

                        var structureLength = 0;

                        if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].structures != null) {
                                structureLength = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].structures.length;
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
                                var esKey = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].structures[i].emapaTermKey;
                                var ssKey = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].structures[i].theilerStageKey;

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

		// load emapa by assay/result
		function loadEmapa() {
			console.log("loadEmapa()");

			resetEmapa();

			var params = {};

                        if (vm.apiDomain.specimens != null) {
                                if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].specimenKey != "") {
			                params.specimenKey = vm.apiDomain.specimens[vm.selectedSpecimenIndex].specimenKey;
                                }
                        }
			params.createdBy = USERNAME;

			EmapaBySetUserAPI.search(params, function(data) {
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
			                                for(var k=0;k<newAssay.specimens[i].sresults[j].imagePanes.length; k++) {
                                                                newAssay.specimens[i].sresults[j].imagePanes[k].processStatus = "c";
                                                                newAssay.specimens[i].sresults[j].imagePanes[k].resultImageKey = "";
                                                                newAssay.specimens[i].sresults[j].imagePanes[k].resultKey = "";
                                                        }
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

                // assay type/antibody prep/probe prep
                $scope.changeAssayType = changeAssayType;
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

                // note functions
                $scope.attachAssayNote = attachAssayNote;
                $scope.clearAssayNote = clearAssayNote;
                $scope.changeAssayNote = changeAssayNote;
                $scope.addAssayAccMGITag = addAssayAccMGITag;
                $scope.addSpecimenAccMGITag = addSpecimenAccMGITag;
                $scope.hideShowAssayNote = hideShowAssayNote;

		// clipboard: genotype, image pane, emapa functions
                $scope.selectGenotype = selectGenotype;
                $scope.selectImagePane = selectImagePane;
                $scope.refreshImagePane = refreshImagePane;
                $scope.selectEmapa = selectEmapa;

                // duplicate prep, partial, all
                $scope.duplicateAssay = duplicateAssay;

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

