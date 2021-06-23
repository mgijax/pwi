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
			// global APIs
                        ValidateMarkerAPI,
                        ValidateJnumAPI,
                        ValidateStrainAPI,
                        ValidateAntibodyAPI,
                        ValidateProbeAPI,
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
		vm.selectedGenotypeIndex = 0;
		vm.selectedImagePaneIndex = 0;
		vm.selectedEmapaIndex = 0;
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
			loadVocabs();
                        loadGenotype();
                        loadImagePane();
                        //loadEmapa();
                        setFocus();
                };

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        	// mapped to 'Clear' button; called from init();  resets page
		function clear() {		
			resetData();
                        refreshTotalCount();
			loadGenotype();
                        loadImagePane();
                        //loadEmapa();
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

			vm.results = [];
			vm.selectedIndex = -1;
                        vm.total_count = 0;
                        resetDataDeselect();
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");

		        vm.selectedSpecimenIndex = 0;

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

                        for(var i=0;i<10; i++) {
                                addSpecimenRow();
                        }
		}

		// reset booleans
	        function resetBoolean() {
			vm.hideErrorContents = true;
                        vm.hideAssayNote = true;
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
                        VocTermSearchAPI.search({"vocabKey":"17"}, function(data) { vm.genderLookup = data.items[0].terms});;

                        vm.fixationLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"156"}, function(data) { vm.fixationLookup = data.items[0].terms});;

                        vm.embeddingLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"155"}, function(data) { vm.embeddingLookup = data.items[0].terms});;

                        vm.hybridizationLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"162"}, function(data) { vm.hybridizationLookup = data.items[0].terms});;

                        vm.strengthLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"163"}, function(data) { vm.strengthLookup = data.items[0].terms});;

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
                                if (vm.apiDomain.specimens != null) {
                                        addSpecimenRow();
			                vm.selectedSpecimenIndex = 0;
                                }
				vm.results[vm.selectedIndex].assayDisplay = vm.apiDomain.assayDisplay;
                                loadGenotype();
                                loadImagePane();
                                //loadEmapa();

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
                                document.getElementById("jnumID").focus();
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
                function sortSpecimenTable(property) {
			console.log("sortSpecimenTable: " + property);

                        vm.apiDomain.specimens.sort(sortTable(property, vm.sortSpecimenTableOrder));

                        if (vm.sortSpecimenTableOrder == "desc") {
                                vm.sortSpecimenTableOrder = "asc";
                        }
                        else if (vm.sortSpecimenTableOrder == "asc") {
                                vm.sortSpecimenTableOrder = "desc";
                        }
                }

                // sort table by specified property, order
                function sortTable(property, order) {
                        var sort_order = 1;

                        if (order === "desc"){
                                sort_order = -1;
                        }

                        return function (a, b){

                                if (property == "sequenceNum") {
                                        // a should come before b in the sorted order
                                        if (a[property] < b[property]) {
                                                return -1 * sort_order;
                                        // a should come after b in the sorted order
                                        } else if(a[property] > b[property]) {
                                                return 1 * sort_order;
                                        // a and b are the same
                                        } else{
                                                return 0 * sort_order;
                                        }
                                }
                                else {
                                        // a and b are the same
                                        if (a[property] == null || b[property] == null) {
                                                return 0 * sort_order;
                                        }
                                        // a should come before b in the sorted order
                                        else if (a[property].toLowerCase() < b[property].toLowerCase()) {
                                                return -1 * sort_order;
                                        // a should come after b in the sorted order
                                        } else if(a[property].toLowerCase() > b[property].toLowerCase()) {
                                                return 1 * sort_order;
                                        // a and b are the same
                                        } else{
                                                return 0 * sort_order;
                                        }
                                }
                        }
                }
        
		/////////////////////////////////////////////////////////////////////
		// antibody prep
                // probePrep
                //
                //vm.apiDomain.assayTypeKey=='9','10','11'
                //      reporter
                //vm.apiDomain.assayTypeKey=='6','8'
                //      antibody prep
                // rest = probe prep
		/////////////////////////////////////////////////////////////////////		

		function addAntibodyPrep() {
			console.log("addAntibodyPrep()");

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

			if (vm.apiDomain.specimens.length == 0) {
				addSpecimenRow();
			}
                        else {
                                setGenotypeUsed();
                        }
		}

		// if current row has changed
		function changeSpecimenRow(index) {
			console.log("changeSpecimenRow: " + index);

			vm.selectedSpecimenIndex = index;

			if (vm.apiDomain.specimens[index] == null) {
				vm.selectedSpecimenIndex = 0;
				return;
			}

			if (vm.apiDomain.specimens[index].processStatus == "x") {
				vm.apiDomain.specimens[index].processStatus = "u";
			}

                        // if current row/column is empty then copy previous row/column value
                        if (vm.apiDomain.specimens[index].specimenLabel == null || vm.apiDomain.specimens[index].specimenLabel == undefined) {
                                vm.apiDomain.specimens[index].specimenLabel == vm.apiDomain.specimens[index-1].specimenLabel;
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
                                "sequenceNum": i + 1,
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

                        vm.apiDomain.specimens[i] = item;

                        for(var j=0;j<8; j++) {
                                addSpecimenResultRow(i);
                        }
		}		

		// attach to age note
		function attachAgeNote(note) {
			console.log("attachAgeNote: ", note);

			for(var i=0;i<vm.apiDomain.specimens.length; i++) {
                                if (vm.apiDomain.specimens[i].ageNote == null || vm.apiDomain.specimens[i].ageNote == "") {
                                        vm.apiDomain.specimens[i].ageNote = note;
                                        if (vm.apiDomain.specimens[i].processStatus = "x") {
                                                vm.apiDomain.specimens[i].processStatus = "u";
                                        }
                                }
                        }
		}

		/////////////////////////////////////////////////////////////////////
		// specimen results
		/////////////////////////////////////////////////////////////////////		
                
		// set current row
		function selectSpecimenResultRow(index) {
			console.log("selectSpecimenResultRow: " + index);

			vm.selectedSpecimenResultIndex = index;

			if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults == null || vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults == undefined) {
                                return;
                        }

			if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults.length == 0) {
				addSpecimenResultRow(vm.selectedSpecimenIndex);
			}

                        loadEmapa();

                        setTimeout(function() {
                                setImagePaneUsed();
                                setEmapaUsed();
                        }, (300));

		}

		// if current row has changed
		function changeSpecimenResultRow(index) {
			console.log("changeSpecimenResultRow: " + index);

			vm.selectedSpecimenResultIndex = index;

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
                                "specimenKey": vm.apiDomain.specimens[vm.selectedSpecimenIndex].specimenKey,
                                "sequenceNum": sequenceNum,
                                "strengthKey": "",
                                "strength": "",
                                "patternKey": "",
                                "pattern": "",
                                "resultNote": "",
                                "creation_date": "",
                                "modification_date": "",
                                "structuresCount": 0,
                                "imagePanesCount": 0
			}
                        vm.apiDomain.specimens[index].sresults[i] = item;

                        // structures
			if (vm.apiDomain.specimens[index].sresults[i].structures == undefined) {
				vm.apiDomain.specimens[index].sresults[i].structures = [];
			}
                        var j = vm.apiDomain.specimens[index].sresults[i].structures.length;
			item = {
				"processStatus": "c",
                                "resultStructureKey": "",
                                "resultKey": "",
                                "emapaTermKey": "",
                                "emapaTerm": "",
                                "theilerStageKey" : "",
                                "theilerStage" : "",
                                "creation_date": "",
                                "modification_date": ""
			}
                        vm.apiDomain.specimens[index].sresults[i].structures[j] = item;
                        
                        // image panes
			if (vm.apiDomain.specimens[index].sresults[i].imagePanes == undefined) {
				vm.apiDomain.specimens[index].sresults[i].imagePanes = [];
			}
                        var k = vm.apiDomain.specimens[index].sresults[i].imagePanes.length;
			item = {
			        "processStatus": "c",
                                "resultImageKey": "",
                                "resultKey": "",
                                "imagePaneKey": "",
                                "figurepaneLabel": "",
                                "creation_date": "",
                                "modification_date": ""
			}
                        vm.apiDomain.specimens[index].sresults[i].imagePanes[k] = item;
		}		

		// delete row
		function deleteSpecimenResultRow(index) {
			console.log("deleteSpecimenResultRow: " + index);
			if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].processStatus == "x") {
				vm.apiDomain.specimens[vm.selectedSpecimenIndex].processStatus = "u";
			}
			vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[index].processStatus = "d";
		}

		/////////////////////////////////////////////////////////////////////
		// notes
		/////////////////////////////////////////////////////////////////////		
                
		// attach tag text to specific note chunk
		function addTag(tagText, inputElement, outputElement) {

			// inserted text

			// add tagText based on current focus
			var textField = document.getElementById(inputElement);
			var textTmp = textField.value; 
			var start = textField.selectionStart
			var end = textField.selectionEnd
			var before = textTmp.substring(0, start)
			var after  = textTmp.substring(end, textTmp.length)

			// add the text, and set focus
			textField.value = (before + tagText + after); 
			textField.selectionStart = textField.selectionEnd = start + tagText.length
			textField.focus();

			if (outputElement == null) {
				outputElement = {};	
			}
			outputElement = textField.value;
		}

		// attach acc/mgi tag to assay note
		function addAccMGITag() {
			addTag("(assay \Acc(MGI:||)) ", "assayNoteID", vm.apiDomain.assayNote.assayNote);
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
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateAntibodyAPI.search");
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
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateProbeAPI.search");
				document.getElementById(id).focus();
				row.probeKey = "";
				row.probeName = "";
                                row.probeAccID = "";
			});
		}

		function validateGenotype(row, index, id) {
			console.log("validateGenotype = " + id + index);

			id = id + index;

			if (row.genotypeAccID == "") {
                                if (index > 0) {
				        row.genotypeKey = vm.apiDomain.specimens[index-1].genotypeKey;
                                        row.genotypeAccID = vm.apiDomain.specimens[index-1].genotypeAccID;
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
			console.log(params);
			
			ValidateGenotypeAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Genotype: " + row.genotypeAccID);
					document.getElementById(id).focus();
					row.genotypeKey = "";
                                        row.genotypeAccID = "";
				} else {
					row.genotypeKey = data[0].genotypeKey;
                                        row.genotypeAccID = data[0].accID;
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateGenotypeAPI.search");
				document.getElementById(id).focus();
				row.genotypeKey = "";
                                row.genotypeAccID = "";
			});
		}

                // copy data from previous row
		function validateSpecimen(row, index, id) {
			console.log("validateSpecimen = " + id + '-' + index);

			vm.selectedSpecimenIndex = index;

                        if (index <= 0) {
                                console.log("validateSpecimen/do nothing: " + index);
                                return;
                        }

                        if (id == 'specimenLabel' && row.specimenLabel == "") {
                                row.specimenLabel = vm.apiDomain.specimens[index-1].specimenLabel;
                        }
                        if (id == 'embeddingKey' && row.embeddingKey == "") {
                                row.embeddingKey = vm.apiDomain.specimens[index-1].embeddingKey;
                        }
                        if (id == 'fixationKey' && row.fixationKey == "") {
                                row.fixationKey = vm.apiDomain.specimens[index-1].fixationKey;
                        }
                        if (id == 'sex' && row.sex == "") {
                                row.sex = vm.apiDomain.specimens[index-1].sex;
                        }
                        if (id == 'hybridization' && row.hybridization == "") {
                                row.hybridization = vm.apiDomain.specimens[index-1].hybridization;
                        }
                        if (id == 'agePrefix' && row.agePrefix == "") {
                                row.agePrefix = vm.apiDomain.specimens[index-1].agePrefix;
                                row.age = row.agePrefix;
                        }
                        if (id == 'ageStage' && row.ageStage == "") {
                                row.ageStage = vm.apiDomain.specimens[index-1].ageStage;
                                row.age = row.agePrefix + " " + row.ageStage;
                        }

                }

                // copy data from previous row
		function validateSresults(row, index, id) {
			console.log("validateSresults = " + id + '-' + index);

			vm.selectedSpecimenResultIndex = index;

                        if (index <= 0) {
                                return;
                        }

                        if (id == 'strength' && row.strength == "") {
                                row.strengthKey = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[index-1].strengthKey;
                        }
                        if (id == 'pattern' && row.pattern == "") {
                                row.patternKey = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[index-1].patternKey;
                        }
                        //if (id == 'imagePanes' && row.imagePanes == "") {
                        //        row.patternKey = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[index-1].patternKey;
                        //}
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

		        vm.selectedSpecimenIndex = 0;
			vm.selectedGenotypeIndex = index;

                        if (vm.apiDomain.specimens != "") {
                                console.log("selectGenotype():set genotype");
		                vm.apiDomain.specimens[vm.selectedSpecimenIndex].genotypeKey = vm.genotypeLookup[vm.selectedGenotypeIndex].objectKey;
		                vm.apiDomain.specimens[vm.selectedSpecimenIndex].genotypeAccID = vm.genotypeLookup[vm.selectedGenotypeIndex].label;
                                changeSpecimenRow(vm.selectedSpecimenIndex);
                        }
		}		

                function setGenotypeUsed() {
			console.log("setGenotypeUsed()");

			var table = document.getElementById("genotypeTable");
                        var x = table.getElementsByTagName("td");

			for(var i=0;i<vm.genotypeLookup.length; i++) {
                                if (vm.genotypeLookup[i].objectKey == vm.apiDomain.specimens[vm.selectedSpecimenIndex].genotypeKey) {
                                        x[i].style.backgroundColor = "rgb(252,251,186)";
                                        break;
                                }
                        }
                }

		// load genotype cipboard by assay
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
			vm.imagePaneLookup = {};
		}

		// selected imagePane row
		function selectImagePane(index) {
			console.log("selectImagePane(): " + index);
			vm.selectedImagePaneIndex = index;
		}		

                function setImagePaneUsed() {
			console.log("setImagePaneUsed()");

			var table = document.getElementById("imagePaneTable");
                        var x = table.getElementsByTagName("td");

                        if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanes == null) {
                                return;
                        }

                        var imageLength = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanes.length;

			for(var i=0;i<vm.imagePaneLookup.length; i++) {
                                //console.log("imagePaneLookup:" + i);
                                //console.log("imageLength:" + imageLength);
			        for(var j=0;j<imageLength; j++) {
                                        var ipKey = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].imagePanes[j].imagePaneKey;
                                        if (vm.imagePaneLookup[i].imagePaneKey == ipKey) {
                                                x[i].style.backgroundColor = "rgb(252,251,186)";
                                                break;
                                                //console.log("ipKey:" + ipKey);
                                                //console.log("imagePaneLookup:" + vm.imagePaneLookup[i].imagePaneKey);
                                        }
                                }
                        }
                }

		// load image pane by reference
		function loadImagePane() {
			console.log("loadImagePane()");

			resetImagePane();

			ImagePaneByReferenceAPI.search(vm.apiDomain.refsKey, function(data) {
				if (data.length > 0) {
                                        console.log(data);
					vm.imagePaneLookup = data;
				}
				else {
					vm.imagePaneLookup = {};
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ImagePaneByReferenceAPI.search");
			});
		}	

		/////////////////////////////////////////////////////////////////////
		// emapa lookup
		/////////////////////////////////////////////////////////////////////		
                
		// reset emapa lookup
		function resetEmapa() {
			console.log("resetEmapa()");
			vm.emapaLookup = {};
		}

		// selected emapa row
		function selectEmapa(index) {
			console.log("selectEmapa(): " + index);
			vm.selectedEmapaIndex = index;
		}		

                function setEmapaUsed() {
			console.log("setEmapaUsed()");

			var table = document.getElementById("emapaTable");
                        var x = table.getElementsByTagName("td");

                        if (vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].structures == null) {
                                return;
                        }

                        var emapaLength = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].structures.length;

			for(var i=0;i<vm.emapaLookup.length; i++) {
                                //console.log("emapaLookup:" + i);
                                //console.log("emapaLength:" + emapaLength);
			        for(var j=0;j<emapaLength; j++) {
                                        var eKey = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].structures[j].emapaTermKey;
                                        var sKey = vm.apiDomain.specimens[vm.selectedSpecimenIndex].sresults[vm.selectedSpecimenResultIndex].structures[j].theilerStageKey;
                                        //console.log("eKey:" + eKey);
                                        //console.log("objectKey:" + vm.emapaLookup[i].objectKey);
                                        //console.log("sKey:" + sKey);
                                        //console.log("stage:" + vm.emapaLookup[i].stage);
                                        if (vm.emapaLookup[i].objectKey == eKey && vm.emapaLookup[i].stage == sKey) {
                                                x[i].style.backgroundColor = "rgb(252,251,186)";
                                                break;
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
			        params.specimenKey = vm.apiDomain.specimens[vm.selectedSpecimenIndex].specimenKey;
                        }
			params.createdBy = USERNAME;

			EmapaBySetUserAPI.search(params, function(data) {
				if (data.length > 0) {
					vm.emapaLookup = data;
				}
				else {
					vm.emapaLookup = {};
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: EmapaBySetUserAPI.search");
			});
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

                $scope.selectSpecimenRow = selectSpecimenRow;
                $scope.changeSpecimenRow = changeSpecimenRow;
                $scope.addSpecimenRow = addSpecimenRow;
                $scope.attachAgeNote = attachAgeNote;
                $scope.setSpecimenNextRow = setSpecimenNextRow;
                $scope.setSpecimenResultNextRow = setSpecimenResultNextRow;
                $scope.sortSpecimenTable = sortSpecimenTable;

                $scope.selectSpecimenResultRow = selectSpecimenResultRow;
                $scope.changeSpecimenResultRow = changeSpecimenResultRow;
                $scope.addSpecimenResultRow = addSpecimenResultRow;
                $scope.deleteSpecimenResultRow = deleteSpecimenResultRow;

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
                $scope.addAccMGITag = addAccMGITag;
                $scope.hideShowAssayNote = hideShowAssayNote;

		// clipboard: genotype, image pane, emapa functions
                $scope.selectGenotype = selectGenotype;
                $scope.selectImagePane = selectImagePane;
                $scope.selectEmapa = selectEmapa;

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
	}

})();

