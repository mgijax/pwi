(function() {
	'use strict';
	angular.module('pwi.strain').controller('StrainController', StrainController);

	function StrainController(
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
			StrainSearchAPI,
			StrainSearchDuplicatesAPI,
			StrainGetAPI,
			StrainCreateAPI,
			StrainUpdateAPI,
			StrainDeleteAPI,
			StrainTotalCountAPI,
                        StrainGetDataSetsAccAPI,
                        StrainGetDataSetsRefAPI,
                        StrainGetByRefAPI,
                        LogicalDBSearchAPI,
			StrainProcessMergeAPI,
                        ValidateStrainAccIdAPI,
                        ValidateStrainPrivateAPI,
			// global APIs
                        ChromosomeSearchAPI,
                        ReferenceAssocTypeSearchAPI,
                        SynonymTypeSearchAPI,
                        ValidateAlleleAPI,
                        ValidateMarkerAPI,
                        ValidateJnumAPI,
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
		vm.selectedAttributeIndex = 0;
		vm.selectedNeedsReviewIndex = 0;
		vm.selectedAccIndex = 0;
		vm.selectedMarkerIndex = 0;
                vm.selectedSynonymIndex = 0;
                vm.selectedGenotypeIndex = 0;
                vm.selectedRefAssocIndex = 0;
                vm.searchByJDataSet = false;
                vm.saveIsPrivate = "0";
		
		vm.accIdCounts = {};

		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			resetData();
                        clearMerge();
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
                        clearMerge();
			setFocus();
		}		

        	// clear merge
		function clearMerge() {		
                        addMerge();
		}		

		// mapped to query 'Search' button
		// default is to select first result
		function search() {				
			console.log(vm.apiDomain);
		
			pageScope.loadingStart();
			
                        if (vm.dataSetRef.dataSets[0].refsKey.length > 0) {
                                console.log("getByRef: " + vm.dataSetRef.dataSets[0].refsKey);
			        StrainGetByRefAPI.query({key: vm.dataSetRef.dataSets[0].refsKey}, function(data) {
				        vm.results = data;
				        vm.selectedIndex = 0;
				        if (vm.results.length > 0) {
                                                vm.searchByJDataSet = true;
					        loadObject();
				        }
				        else {
					        clear();
				        }
		                        pageScope.loadingEnd();
			                setFocus();
			        }, function(err) {
				        pageScope.handleError(vm, "API ERROR: StrainSearchAPI.search");
		                        pageScope.loadingEnd();
			                setFocus();
			        });
                        }
                        else {
			        StrainSearchAPI.search(vm.apiDomain, function(data) {
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
				        pageScope.handleError(vm, "API ERROR: StrainSearchAPI.search");
		                        pageScope.loadingEnd();
			                setFocus();
			        });
                        }
		}		

                // search duplicates
		function searchDuplicates() {				
			console.log("searchDuplicates()");
		
			pageScope.loadingStart();
			
			StrainSearchDuplicatesAPI.search(function(data) {
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
		                pageScope.handleError(vm, "API ERROR: StrainSearchDuplicatesAPI.search");
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
                        StrainTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////
		
        	// create
		function create() {
			console.log("create() -> StrainCreateAPI()");

			// verify if record selected
                        if (vm.apiDomain.strainKey != null && vm.apiDomain.strainKey != "") {
				alert("Cannot Add if a record is already selected.");
                                return;
			}

                        // only 1 accession id per registory (ldb) per Strain
                        // JAX Mice Registry (ldb = 22)
                        setAccIdCounts();
			for(var i=0;i<vm.apiDomain.otherAccIds.length; i++) {
                                if (vm.apiDomain.otherAccIds[i].accID == "") {
                                        continue;
                                }
                                var key = vm.apiDomain.otherAccIds[i].logicaldbKey;
                                if (key == 22 && vm.accIdCounts[key] > 1) {
				        alert("JAX Mice Registry: Only 1 Accession ID per Strain");
                                        return;
                                }
                        }

                        // isPrivate default = 0
                        if (vm.apiDomain.isPrivate == "") {
                                vm.apiDomain.isPrivate = "0";
                        }
                        if (vm.apiDomain.isPrivate == "") {
                                vm.apiDomain.isPrivate = "0";
                        }
                        for(var i=0;i<vm.apiDomain.otherAccIds.length; i++) {
                                if (vm.apiDomain.otherAccIds[i].accID == "") {
                                        continue;
                                }
                                if (vm.apiDomain.otherAccIds[i].isPrivate == "") {
                                        vm.apiDomain.otherAccIds[i].isPrivate = vm.apiDomain.isPrivate;
                                }
                        }

			pageScope.loadingStart();

			StrainCreateAPI.create(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					vm.apiDomain = data.items[0];
                                               vm.selectedIndex = vm.results.length;
                                               vm.results[vm.selectedIndex] = [];
                                               vm.results[vm.selectedIndex].strainKey = vm.apiDomain.strainKey;
					vm.results[vm.selectedIndex].strain = vm.apiDomain.strain;
					loadObject();
					refreshTotalCount();
				}
				pageScope.loadingEnd();
                                setFocus();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: StrainCreateAPI.create");
				pageScope.loadingEnd();
                                setFocus();
			});
		}		

        	// modify
		function modify() {
			console.log("modify() -> StrainUpdateAPI()");

			// verify if record selected
                        if (vm.selectedIndex < 0) {
				alert("Cannot Modify if a record is already selected.");
                                return;
			}

                        // only 1 accession id per registory (ldb) per Strain
                        // JAX Mice Registry (ldb = 22)
                        setAccIdCounts();
			for(var i=0;i<vm.apiDomain.otherAccIds.length; i++) {
                                if (vm.apiDomain.otherAccIds[i].accID == "") {
                                        continue;
                                }
                                var key = vm.apiDomain.otherAccIds[i].logicaldbKey;
                                if (key == 22 && vm.accIdCounts[key] > 1) {
				        alert("JAX Mice Registry: Only 1 Accession ID per Strain");
                                        return;
                                }
                        }

                        if (vm.apiDomain.isPrivate != vm.saveIsPrivate) {
			        if ($window.confirm("Are you sure you want to change the private flag?")) {
                                        console.log("modify()/change isPrivate");
			                for(var i=0;i<vm.apiDomain.mgiAccessionIds.length; i++) {
                                                if (vm.apiDomain.mgiAccessionIds[i].accID == "") {
                                                        continue;
                                                }
                                                if (vm.apiDomain.mgiAccessionIds[i].processStatus == "x") {
                                                        vm.apiDomain.mgiAccessionIds[i].processStatus = "u";
                                                }
                                                vm.apiDomain.mgiAccessionIds[i].isPrivate = vm.apiDomain.isPrivate;
                                        }
			                for(var i=0;i<vm.apiDomain.otherAccIds.length; i++) {
                                                if (vm.apiDomain.otherAccIds[i].accID == "") {
                                                        continue;
                                                }
                                                if (vm.apiDomain.otherAccIds[i].processStatus == "x") {
                                                        vm.apiDomain.otherAccIds[i].processStatus = "u";
                                                }
                                                vm.apiDomain.otherAccIds[i].isPrivate = vm.apiDomain.isPrivate;
                                        }
                                }
                                else {
                                        vm.apiDomain.isPrivate = vm.saveIsPrivate;
				        return;
                                }
			}

			pageScope.loadingStart();

			StrainUpdateAPI.update(vm.apiDomain, function(data) {
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
				pageScope.handleError(vm, "API ERROR: StrainUpdateAPI.update");
				pageScope.loadingEnd();
                                setFocus();
			});
		}		
		
        	// delete
		function deleteIt() {
			console.log("deleteIt() -> StrainDeleteAPI() : " + vm.selectedIndex);

			// check if record selected
			if (vm.selectedIndex < 0) {
				alert("Cannot Delete if a record is not selected.");
				return;
			}

			if ($window.confirm("Are you sure you want to delete this record?")) {
			
				pageScope.loadingStart();

				StrainDeleteAPI.delete({key: vm.apiDomain.strainKey}, function(data) {
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
					pageScope.handleError(vm, "API ERROR: StrainDeleteAPI.delete");
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
                        vm.searchByJDataSet = false;
                        resetDataDeselect();
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");

		        vm.selectedAttributeIndex = 0;
		        vm.selectedNeedsReviewIndex = 0;
		        vm.selectedAccIndex = 0;
		        vm.selectedMarkerIndex = 0;
                        vm.selectedSynonymIndex = 0;
                        vm.selectedGenotypeIndex = 0;
                        vm.selectedRefAssocIndex = 0;
                        vm.selectedAccIndex = 0;

                        resetBoolean();

                        vm.apiDomain = {};
			vm.apiDomain.strainKey = "";	
                        vm.apiDomain.strain = "";
                        vm.apiDomain.standard = "";
                        vm.apiDomain.isPrivate = "";
                        vm.apiDomain.geneticBackground = "";
                        vm.apiDomain.speciesKey = "";
                        vm.apiDomain.species = "";
                        vm.apiDomain.strainTypeKey = "";
                        vm.apiDomain.strainType = "";
			vm.apiDomain.createdBy = "";
			vm.apiDomain.creation_date = "";
			vm.apiDomain.modifiedBy = "";
			vm.apiDomain.modification_date = "";
                        vm.apiDomain.accID = "";

                        addAttributeRow();
                        addNeedsReviewRow();
                        addAccRow();
                        addMarkerRow();
                        addSynonymRow();
                        addGenotypeRow();
                        addRefAssocRow();
                        addNotes();
                        addDataSetAccRow();
                        addDataSetRefRow();
		}

		// reset booleans
	        function resetBoolean() {
			vm.hideErrorContents = true;
                        vm.hideStrainOriginNote = true;
                        vm.hideImpcNote = true;
                        vm.hideNomenNote = true;
                        vm.hideMCLNote = true;
                        vm.hideMGIIds = true;
		}

		// load vocabularies
                function loadVocabs() {
                        console.log("loadVocabs()");

			vm.strainSpeciesLookup = {};
			VocTermSearchAPI.search({"vocabKey":"26"}, function(data) { vm.strainSpeciesLookup = data.items[0].terms});;

			vm.strainTypeLookup = {};
			VocTermSearchAPI.search({"vocabKey":"55"}, function(data) { vm.strainTypeLookup = data.items[0].terms});;

			vm.strainAttributeLookup = {};
			VocTermSearchAPI.search({"vocabKey":"27"}, function(data) { vm.strainAttributeLookup = data.items[0].terms});;

			vm.strainNeedsReviewLookup = {};
			VocTermSearchAPI.search({"vocabKey":"56"}, function(data) { vm.strainNeedsReviewLookup = data.items[0].terms});;

			vm.logicaldbLookup = [];
			LogicalDBSearchAPI.search({}, function(data) { vm.logicaldbLookup = data});;

                        vm.isPrivateLookup = [];
                        vm.isPrivateLookup[0] = {
                                "termKey": "1",
                                "term": "Yes"
                        }
                        vm.isPrivateLookup[1] = {
                                "termKey": "0",
                                "term": "No"
                        }

                        //vm.isAccPrivateLookup = [];
                        //vm.isAccPrivateLookup[0] = {
                                //"termKey": "1",
                                //"term": "Yes"
                        //}
                        //vm.isAccPrivateLookup[1] = {
                                //"termKey": "0",
                                //"term": "No"
                        //}

                        vm.isStandardLookup = [];
                        vm.isStandardLookup[0] = {
                                "termKey": "1",
                                "term": "Yes"
                        }
                        vm.isStandardLookup[1] = {
                                "termKey": "0",
                                "term": "No"
                        }

                        vm.isPrefixLookup = [];
                        vm.isPrefixLookup[0] = {
                                "termKey": "1",
                                "term": "Yes"
                        }
                        vm.isPrefixLookup[1] = {
                                "termKey": "0",
                                "term": "No"
                        }

                        vm.chromosomeLookup = [];
                        ChromosomeSearchAPI.search({"organismKey":"1"}, function(data) { vm.chromosomeLookup = data});;

			vm.markerQualifierLookup = {};
			VocTermSearchAPI.search({"vocabKey":"31"}, function(data) { vm.markerQualifierLookup = data.items[0].terms});;

			vm.genotypeQualifierLookup = {};
			VocTermSearchAPI.search({"vocabKey":"32"}, function(data) { vm.genotypeQualifierLookup = data.items[0].terms});;

			vm.synonymTypeLookup = [];
			SynonymTypeSearchAPI.search({"mgiTypeKey":"10"}, function(data) { vm.synonymTypeLookup = data});;

                        vm.refAssocTypeLookup = [];
		        ReferenceAssocTypeSearchAPI.search({"mgiTypeKey":"10"}, function(data) { vm.refAssocTypeLookup = data.items});;

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

			StrainGetAPI.get({ key: vm.results[vm.selectedIndex].strainKey }, function(data) {
				vm.apiDomain = data;
				vm.apiDomain.strainKey = vm.results[vm.selectedIndex].strainKey;
                                addAttributeRow();
                                addNeedsReviewRow();
                                addAccRow();
                                addMarkerRow();
                                addSynonymRow();
                                addGenotypeRow();
                                addRefAssocRow();
                                addNotes();
                                addDataSetAccRow();
                                addDataSetRefRow();
                                setAccIdCounts();
				vm.results[vm.selectedIndex].strain = vm.apiDomain.strain;
                                vm.saveIsPrivate = vm.apiDomain.isPrivate;

                                if (vm.searchByJDataSet) {
		                        getDataSetsAcc();
		                        getDataSetsRef();
                                }

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: StrainGetAPI.get");
			});
		}	
		
		// when an object is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove object, if it exists)
			removeSearchResultsItem(vm.apiDomain.strainKey);

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
				if (vm.results[i].strainKey == keyToRemove) {
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
                                document.getElementById("strain").focus();
                        }, (200));
		}

		/////////////////////////////////////////////////////////////////////
		// notes
		/////////////////////////////////////////////////////////////////////		
		
		// Hide/Show note sections
		function hideShowStrainOriginNote() {
			vm.hideStrainOriginNote = !vm.hideStrainOriginNote;
		}
		function hideShowImpcNote() {
			vm.hideImpcNote = !vm.hideImpcNote;
		}
		function hideShowNomenNote() {
			vm.hideNomenNote = !vm.hideNomenNote;
		}
		function hideShowMCLNote() {
			vm.hideMCLNote = !vm.hideMCLNote;
		}
		function hideShowMGIIds() {
			vm.hideMGIIds = !vm.hideMGIIds;
		}

		// add new note row
		function addNote(note, noteType) {
			console.log("addNote():" + note);

			if (note != null) { return; }

			var noteTypeKey = "";

			if (noteType == "StrainOrigin") {
				noteTypeKey = "1011";
			}
			if (noteType == "IMPC") {
				noteTypeKey = "1012";
			}
			if (noteType == "Nomenclature") {
				noteTypeKey = "1013";
			}
			if (noteType == "MCL") {
				noteTypeKey = "1038";
			}

			note = {
                                "processStatus": "c",
				"noteKey": "",
				"objectKey": vm.apiDomain.strainKey,
				"mgiTypeKey": "10",
				"noteTypeKey": noteTypeKey,
				"noteChunk": ""
			}

			if (noteType == "StrainOrigin") {
				vm.apiDomain.strainOriginNote = note;
			}
			if (noteType == "IMPC") {
				vm.apiDomain.impcNote = note;
			}
			if (noteType == "Nomenclature") {
				vm.apiDomain.nomenNote = note;
			}
			if (noteType == "MCL") {
				vm.apiDomain.mclNote = note;
			}
		}

		function addNotes() {
			console.log("addNotes()");

			addNote(vm.apiDomain.strainOriginNote, "StrainOrigin");
			addNote(vm.apiDomain.impcNote, "IMPC");
			addNote(vm.apiDomain.nomenNote, "Nomenclature");
			addNote(vm.apiDomain.mclNote, "MCL");
		}

		/////////////////////////////////////////////////////////////////////
		// is priviate
		/////////////////////////////////////////////////////////////////////		
                
                // turned off/not used at the moment
		// if current isPrivate changes
		function validateStrainPrivate() {
			console.log("validateStrainPrivate()");

                        if (vm.apiDomain.strainKey == "") {
                                return;
                        }

                        if (vm.apiDomain.isPrivate == "0") {
                                return;
                        }

			var params = {};
			params.strainKey = vm.apiDomain.strainKey;
			console.log(params);

			ValidateStrainPrivateAPI.search(params, function(data) {
			        if (data.length == 0) {
				        alert("This Strain is associated with other MGI objects.\nChanging Private = Yes is not allowed.");
                                        vm.apiDomain.isPrivate = "0";
                                }
			}, function(err) {
			        pageScope.handleError(vm, "API ERROR: ValidateStrainPrivateAPI.search");
			});
                }

		/////////////////////////////////////////////////////////////////////
		// attributes
		/////////////////////////////////////////////////////////////////////		
		
		// set current row
		function selectAttributeRow(index) {
			console.log("selectAttributeRow: " + index);
			vm.selectedAttributeIndex = index;

			if (vm.apiDomain.attributes == null | vm.apiDomain.attributes == undefined) {
                                return;
                        }

			if (vm.apiDomain.attributes.length == 0) {
				addAttributeRow();
			}
		}

		// if current row has changed
		function changeAttributeRow(index) {
			console.log("changeAttributeRow: " + index);

			vm.selectedAttributeIndex = index;

			if (vm.apiDomain.attributes[index] == null) {
				vm.selectedAttributeIndex = 0;
				return;
			}

			if (vm.apiDomain.attributes[index].processStatus == "x") {
				vm.apiDomain.attributes[index].processStatus = "u";
			};
                }

		// add new row
		function addAttributeRow() {
			console.log("addAttributeRow()");

			if (vm.apiDomain.attributes == undefined) {
				vm.apiDomain.attributes = [];
			}

			var i = vm.apiDomain.attributes.length;

			vm.apiDomain.attributes[i] = {
				"processStatus": "c",
                                "annotKey": "",
                                "annotTypeKey": "1009",
                                "objectKey": vm.apiDomain.strainKey,
                                "termKey": "",
                                "term": "",
                                "qualifierKey": "1614158",
                                "creation_date": "",
                                "modification_date": ""
			}
		}		

		/////////////////////////////////////////////////////////////////////
		// needsReview
		/////////////////////////////////////////////////////////////////////		
		
		// set current row
		function selectNeedsReviewRow(index) {
			console.log("selectNeedsReviewRow: " + index);
			vm.selectedNeedsReviewIndex = index;

			if (vm.apiDomain.needsReview == null | vm.apiDomain.needsReview == undefined) {
                                return;
                        }

			if (vm.apiDomain.needsReview.length == 0) {
				addNeedsReviewRow();
			}
		}

		// if current row has changed
		function changeNeedsReviewRow(index) {
			console.log("changeNeedsReviewRow: " + index);

			vm.selectedNeedsReviewIndex = index;

			if (vm.apiDomain.needsReview[index] == null) {
				vm.selectedNeedsReviewIndex = 0;
				return;
			}

			if (vm.apiDomain.needsReview[index].processStatus == "x") {
				vm.apiDomain.needsReview[index].processStatus = "u";
			};
                }

		// add new row
		function addNeedsReviewRow() {
			console.log("addNeedsReviewRow()");

			if (vm.apiDomain.needsReview == undefined) {
				vm.apiDomain.needsReview = [];
			}

			var i = vm.apiDomain.needsReview.length;

			vm.apiDomain.needsReview[i] = {
				"processStatus": "c",
                                "annotKey": "",
                                "annotTypeKey": "1008",
                                "objectKey": vm.apiDomain.strainKey,
                                "termKey": "",
                                "term": "",
                                "qualifierKey": "1614158",
                                "creation_date": "",
                                "modification_date": ""
			}
		}		

		/////////////////////////////////////////////////////////////////////
		// otherAccIds
		/////////////////////////////////////////////////////////////////////		
		
		// set other accession id counts
		function setAccIdCounts() {
			console.log("setAccIdCounts()");

                        vm.accIdCounts = {};

			for(var i=0;i<vm.apiDomain.otherAccIds.length; i++) {
                                if (vm.apiDomain.otherAccIds[i].accID == "") {
                                        continue;
                                }
                                var key = vm.apiDomain.otherAccIds[i].logicaldbKey;
                                if (vm.accIdCounts[key]) {
		                        vm.accIdCounts[key] += 1;
                                }
                                else {
		                        vm.accIdCounts[key] = 1;
                                }
                        }
                        console.log(vm.accIdCounts);
                }

		// check other accession id counts
		function checkAccIdCounts() {
			console.log("checkAccIdCounts()");

			for(var i=0;i<vm.apiDomain.otherAccIds.length; i++) {
                                if (vm.apiDomain.otherAccIds[i].accID == "") {
                                        continue;
                                }
                                if (vm.accIdCounts[key] > 1) {
				        alert("Only 1 Repository allowed, per Strain");
                                }
                        }
                        console.log(vm.accIdCounts);
                }

		// set current row
		function selectAccRow(index) {
			console.log("selectAccRow: " + index);
			vm.selectedAccIndex = index;

			if (vm.apiDomain.otherAccIds == null | vm.apiDomain.otherAccIds == undefined) {
                                return;
                        }

			if (vm.apiDomain.otherAccIds.length == 0) {
				addAccRow();
			}
		}

		// if current row has changed
		function changeAccRow(index) {
			console.log("changeAccRow: " + index);

			vm.selectedAccIndex = index;

			if (vm.apiDomain.otherAccIds == null) {
				vm.selectedAccIndex = 0;
				return;
			}

			if (vm.apiDomain.otherAccIds[index].processStatus == "x") {
				vm.apiDomain.otherAccIds[index].processStatus = "u";
			}

                        if (vm.apiDomain.isPrivate != "" && vm.apiDomain.otherAccIds[index].isPrivate == "") {
                                vm.apiDomain.otherAccIds[index].isPrivate = vm.apiDomain.isPrivate;
                        }

                        if (vm.apiDomain.otherAccIds[index].accID == "" || vm.apiDomain.otherAccIds[index].accID.includes("%")) {
                                return;
                        }

                        //
                        // may process ValidateStrainAccIdAPI.search()
                        // strainKey, accID, logicaldbKey must all be given for the validation to process
                        //
                        if (vm.apiDomain.strainKey == "" || vm.apiDomain.otherAccIds[index].logicaldbKey == "") {
                                return;
                        }

			var params = {};
			params.objectKey = vm.apiDomain.otherAccIds[index].objectKey;
			params.logicaldbKey = vm.apiDomain.otherAccIds[index].logicaldbKey;
			params.accID = vm.apiDomain.otherAccIds[index].accID;
			console.log(params);

			ValidateStrainAccIdAPI.search(params, function(data) {
			        if (data.length > 0) {
				        alert("This Accession ID is already used by another Strain");
                                        vm.apiDomain.otherAccIds[index].accID = "";
				        document.getElementById("acc-" + index).focus();
                                }
			}, function(err) {
			        pageScope.handleError(vm, "API ERROR: ValidateStrainAccIdAPI.search");
                                vm.apiDomain.otherAccIds[index].accID = "";
				document.getElementById("acc-" + index).focus();
			});
		}

		// add new row
		function addAccRow() {
			console.log("addAccRow()");

			if (vm.apiDomain.otherAccIds == undefined) {
				vm.apiDomain.otherAccIds = [];
			}

			var i = vm.apiDomain.otherAccIds.length;
			
			vm.apiDomain.otherAccIds[i] = {
				"processStatus": "c",
				"objectKey": vm.apiDomain.strainKey,
				"accessionKey": "",
				"logicaldbKey": "",
                                "isPrivate": vm.apiDomain.isPrivate,
				"accID": ""
			}
		}		

		// delete row
		function deleteAccRow(index) {
			console.log("deleteAccRow: " + index);
			vm.apiDomain.otherAccIds[index].processStatus = "d";
		}

		/////////////////////////////////////////////////////////////////////
		// markers
		/////////////////////////////////////////////////////////////////////		
		
		// set current row
		function selectMarkerRow(index) {
			console.log("selectMarkerRow: " + index);
			vm.selectedMarkerIndex = index;
		}

		//
		// change of row/field detected
		//
		
		// if current row has changed
		function changeMarkerRow(index) {
			console.log("changeMarkerRow: " + index);

			vm.selectedMarkerIndex = index;

			if (vm.apiDomain.markers[index] == null) {
				vm.selectedMarkerIndex = 0;
				return;
			}

			if (vm.apiDomain.markers[index].alleleKey == ""
				|| vm.apiDomain.markers[index].markerKey == "") {
				return;
			}

			if (vm.apiDomain.markers[index].processStatus == "x") {
				vm.apiDomain.markers[index].processStatus = "u";
			};
		}

		// add new row
		function addMarkerRow() {

			if (vm.apiDomain.markers == undefined) {
				vm.apiDomain.markers = [];
			}

			var i = vm.apiDomain.markers.length;

			vm.apiDomain.markers[i] = {
				"processStatus": "c",
				"strainKey": vm.apiDomain.strainKey,
				"strainMarkerKey": "",
				"markerKey": "",
				"markerSymbol": "",
				"chromosome": "",
				"markerAccID": "",
				"alleleKey": "",
				"alleleSymbol": "",
				"strainOfOrigin": "",
				"qualifierKey": "",
				"qualifierTerm": "",
				"createdBy": "",
				"creation_date": "",
				"modifiedBy": "",
				"modification_date": ""
			}
		}

		/////////////////////////////////////////////////////////////////////
		// synonyms
		/////////////////////////////////////////////////////////////////////		
		
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

		// add new synonyms row
		function addSynonymRow() {
			console.log("addSynonymRow()");

			if (vm.apiDomain.synonyms == undefined) {
				vm.apiDomain.synonyms = [];
			}

			var i = vm.apiDomain.synonyms.length;

			vm.apiDomain.synonyms[i] = {
				"processStatus": "c",
				"objectKey":vm.apiDomain.strainKey,
				"synonymKey":"",
				"synonym":"",
				"mgiTypeKey":"10",
				"synonymTypeKey":"",
				"refsKey":""
			};
		}

		/////////////////////////////////////////////////////////////////////
		// genotypes
		/////////////////////////////////////////////////////////////////////		
		
		// set current row
		function selectGenotypeRow(index) {
			console.log("selectGenotypeRow: " + index);
			vm.selectedGenotypeIndex = index;
		}

		//
		// change of row/field detected
		//
		
		// if current row has changed
		function changeGenotypeRow(index) {
			console.log("changeGenotypeRow: " + index);

			vm.selectedGenotypeIndex = index;

			if (vm.apiDomain.genotypes[index] == null) {
				vm.selectedGenotypeIndex = 0;
				return;
			}

			if (vm.apiDomain.genotypes[index].markerKey == "") {
				return;
			}

			if (vm.apiDomain.genotypes[index].processStatus == "x") {
				vm.apiDomain.genotypes[index].processStatus = "u";
			};
		}

		// add new row
		function addGenotypeRow() {

			if (vm.apiDomain.genotypes == undefined) {
				vm.apiDomain.genotypes = [];
			}

			var i = vm.apiDomain.genotypes.length;

			vm.apiDomain.genotypes[i] = {
				"processStatus": "c",
				"strainKey": vm.apiDomain.strainKey,
				"strainGenotypeKey": "",
				"genotypeKey": "",
				"genotypeDisplay": "",
				"genotypeAccId": "",
				"qualifierKey": "",
				"qualifierTerm": "",
				"createdBy": "",
				"creation_date": "",
				"modifiedBy": "",
				"modification_date": ""
			}
		}

		/////////////////////////////////////////////////////////////////////
		// refAssocs
		/////////////////////////////////////////////////////////////////////		
		
		// set current row
		function selectRefAssocRow(index) {
			console.log("selectRefAssocRow: " + index);
			vm.selectedRefAssocIndex = index;
		}

		//
		// change of row/field detected
		//
		
		// if current row has changed
		function changeRefAssocRow(index) {
			console.log("changeRefAssocRow: " + index);

			vm.selectedRefAssocIndex = index;

			if (vm.apiDomain.refAssocs[index] == null) {
				vm.selectedRefAssocIndex = 0;
				return;
			}

			if (vm.apiDomain.refAssocs[index].alleleKey == ""
				|| vm.apiDomain.refAssocs[index].assocKey == "") {
				return;
			}

			if (vm.apiDomain.refAssocs[index].processStatus == "x") {
				vm.apiDomain.refAssocs[index].processStatus = "u";
			};
		}

		// add new row
		function addRefAssocRow() {

			if (vm.apiDomain.refAssocs == undefined) {
				vm.apiDomain.refAssocs = [];
			}

			var i = vm.apiDomain.refAssocs.length;

			vm.apiDomain.refAssocs[i] = {
				"processStatus": "c",
				"objectKey": vm.apiDomain.strainKey,
				"assocKey": "",
				"mgiTypeKey": "",
				"refAssocTypeKey": "",
				"refAssocType": "",
				"refsKey": "",
				"allowOnlyOne": "",
				"jnumid": "",
				"jnum": "",
				"short_citation": "",
				"createdBy": "",
				"creation_date": "",
				"modifiedBy": "",
				"modification_date": ""
			}
		}

		/////////////////////////////////////////////////////////////////////
		// data sets
		/////////////////////////////////////////////////////////////////////		
		
		// add new data sets row
		function addDataSetAccRow() {
			console.log("addDataSetAcc()");

			vm.dataSetAcc = {}
			vm.dataSetAcc.total_count = 0;
			vm.dataSetAcc.dataSets = [];

                        vm.dataSetAcc.dataSets[0] = {
      				"refsKey": "",
      				"jnum": "",
      				"jnumid": "",
      				"accid": ""
    			}
		}		

		// get data sets/references by strain key
		function getDataSetsAcc() {
			console.log("getDataSetsAcc: " + vm.apiDomain.strainKey);

			pageScope.loadingStart();
			StrainGetDataSetsAccAPI.query({key: vm.apiDomain.strainKey}, function(data) {
				vm.dataSetAcc.dataSets = data;
				vm.dataSetAcc.total_count = vm.dataSetAcc.dataSets.length;
				pageScope.loadingEnd();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: StrainGetDataSetsAccAPI.query");
				pageScope.loadingEnd();
			});
		}	
		
		// add new data sets row
		function addDataSetRefRow() {
			console.log("addDataSetRef()");

			vm.dataSetRef = {}
			vm.dataSetRef.total_count = 0;
			vm.dataSetRef.dataSets = [];

                        vm.dataSetRef.dataSets[0] = {
      				"refsKey": "",
      				"jnum": "",
      				"jnumid": "",
      				"accid": ""
    			}
		}		

		// get data sets/references by strain key
		function getDataSetsRef() {
			console.log("getDataSetsRef: " + vm.apiDomain.strainKey);

			pageScope.loadingStart();
			StrainGetDataSetsRefAPI.query({key: vm.apiDomain.strainKey}, function(data) {
				vm.dataSetRef.dataSets = data;
				vm.dataSetRef.total_count = vm.dataSetRef.dataSets.length;
				pageScope.loadingEnd();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: StrainGetDataSetsRefAPI.query");
				pageScope.loadingEnd();
			});
		}	
		
		/////////////////////////////////////////////////////////////////////
		// data merge
		/////////////////////////////////////////////////////////////////////		
		
		// add new data merge
		function addMerge() {
			console.log("addMerge()");

			vm.merge = {}
                        vm.merge.incorrectStrainKey = "";
                        vm.merge.incorrectStrain = "";
                        vm.merge.correctStrainKey = "";
                        vm.merge.correctStrain = "";
		}		

		// process merge
		function processMerge() {
			console.log("processMerge()");

                        if (vm.merge.incorrectStrainKey == "" || vm.merge.correctStrainKey == "") {
                                alert("Incorrect Strain/Correct Strain cannot be empty");
                                return;
                        }

                        // if incorrect = correct
                        if (vm.merge.incorrectStrainKey == vm.merge.correctStrainKey) {
                                alert("Incorrect Strain cannot equal Correct Strain");
                                return;
                        }
                        
			pageScope.loadingStart();
			StrainProcessMergeAPI.search(vm.merge, function(data) {
				if (data.error != null) {
					alert("Strain Merge was unsuccessful\n\nERROR: " + data.error + " - " + data.message);
		                        pageScope.loadingEnd();
					document.getElementById("mergeTable").focus();
				}
				else {
				        vm.results = data.items;
				        vm.selectedIndex = 0;
			                loadObject();
                                        addMerge();
                                        alert("Strain Merge was successful");
		                        pageScope.loadingEnd();
			                setFocus();
			        }
			}, function(err) {
			        pageScope.handleError(vm, "API ERROR: StrainProcessMergeAPI");
		                pageScope.loadingEnd();
			        setFocus();
			});
		}	
		
		/////////////////////////////////////////////////////////////////////
		// validations
		/////////////////////////////////////////////////////////////////////		
		
		function validateStrain() {
			console.log("validateStrain()");

			if (vm.apiDomain.strain == "") {
				vm.apiDomain.strainKey = "";
				vm.apiDomain.strain = "";
				return;
			}

			if (vm.apiDomain.strain.includes("%")) {
				return;
			}

			if (vm.apiDomain.strainKey != "") {
				return;
                        }

			var params = {};
			params.strain = vm.apiDomain.strain;

			StrainSearchAPI.search(params, function(data) {
			        if (data.length > 0) {
					alert("This Strain already exists in MGI.");
			        }
		                pageScope.loadingEnd();
			}, function(err) {
			        pageScope.handleError(vm, "API ERROR: StrainSearchAPI.search");
		                pageScope.loadingEnd();
			});
		}

		function validateIncorrectStrain(id) {
			console.log("validateIncorrectStrain()");

			if (vm.merge.incorrectStrain == "") {
				vm.merge.incorrectStrainKey = "";
				vm.merge.incorrectStrain = "";
				return;
			}

			var params = {};
			params.strain = vm.merge.incorrectStrain;

			StrainSearchAPI.search(params, function(data) {
			        if (data.length > 0) {
				        vm.merge.incorrectStrainKey = data[0].strainKey;
				        vm.merge.incorrectStrain = data[0].strain;
			        }
                                else {
					alert("Invalid Incorrect Strain");
					document.getElementById(id).focus();
				        vm.merge.incorrectStrainKey = "";
				        vm.merge.incorrectStrain = "";
                                }
		                pageScope.loadingEnd();
			}, function(err) {
			        pageScope.handleError(vm, "API ERROR: StrainSearchAPI.search");
		                pageScope.loadingEnd();
			});
                }

		function validateCorrectStrain(id) {
			console.log("validateCorrectStrain()");

			if (vm.merge.correctStrain == "") {
				vm.merge.correctStrainKey = "";
				vm.merge.correctStrain = "";
				return;
			}

			var params = {};
			params.strain = vm.merge.correctStrain;

			StrainSearchAPI.search(params, function(data) {
			        if (data.length > 0) {
				        vm.merge.correctStrainKey = data[0].strainKey;
				        vm.merge.correctStrain = data[0].strain;
			        }
                                else {
					alert("Invalid Correct Strain");
					document.getElementById(id).focus();
				        vm.merge.correctStrainKey = "";
				        vm.merge.correctStrain = "";
                                }
		                pageScope.loadingEnd();
			}, function(err) {
			        pageScope.handleError(vm, "API ERROR: StrainSearchAPI.search");
		                pageScope.loadingEnd();
			});
                }

		function validateAllele(row, index, id) {
			console.log("validateAllele = " + id + index);

			id = id + index;

			if (row.alleleSymbol == "") {
				row.alleleKey = "";
				row.alleleSymbol = "";
				return;
			}

			if (row.alleleSymbol.includes("%")) {
				return;
			}

			// params if used for the validation search only
			var params = {};
			params.symbol = row.alleleSymbol;
			params.markerKey = row.markerKey;
			console.log(params);
			
			ValidateAlleleAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Allele Symbol: " + row.alleleSymbol);
					document.getElementById(id).focus();
					row.alleleKey = "";
					row.alleleSymbol = "";
				} else {
					row.alleleKey = data[0].alleleKey;
					row.alleleSymbol = data[0].symbol;
					row.markerKey = data[0].markerKey; 
					row.markerSymbol = data[0].markerSymbol;
					row.chromosome = data[0].chromosome;
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateAlleleAPI.search");
				document.getElementById(id).focus();
				row.alleleKey = "";
				row.alleleSymbol = "";
			});
		}

		function validateMarker(row, index, id) {
			console.log("validateMarker = " + id + index);

			id = id + index;
			
			if ((row.markerAccID == undefined || row.markerAccID == "")
			   && (row.markerSymbol == undefined || row.markerSymbol == "")) {
				row.markerKey = "";
				row.markerSymbol = "";
				row.chromosome = "";
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
			        params.chromosome = row.chromosome;
			        params.accID = "";
                        }
                        
			ValidateMarkerAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Marker Symbol: " + row.markerSymbol);
					document.getElementById(id).focus();
					row.markerKey = "";
					row.markerSymbol = "";
					row.chromosome = "";
				        row.markerAccID = "";
				} else if (data.length > 1) {
					alert("This marker requires a Chr.\nSelect a Chr, then Marker, and try again:\n\n" + row.markerSymbol);
					document.getElementById(id).focus();
					row.markerKey = "";
					row.markerSymbol = "";
					row.chromosome = "";
				        row.markerAccID = "";
				} else {
					console.log(data);
					row.markerKey = data[0].markerKey;
					row.markerSymbol = data[0].symbol;
					row.chromosome = data[0].chromosome;
				        row.markerAccID = data[0].accID;
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateMarkerAPI.search");
				document.getElementById(id).focus();
				row.markerKey = "";
				row.markerSymbol = "";
				row.chromosome = "";
				row.markerAccID = "";
			});
		}

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

		function validateGenotype(row, index, id) {
			console.log("validateGenotype = " + id + index);

			id = id + index;

			if (row.genotypeAccId == "") {
				row.genotypeKey = "";
				row.genotypeDisplay = "";
                                row.genotypeAccId = "";
				return;
			}

			// params if used for the validation search only
			var params = {};
			params.accID = row.genotypeAccId;
			console.log(params);
			
			ValidateGenotypeAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Genotype: " + row.genotypeAccId);
					document.getElementById(id).focus();
					row.genotypeKey = "";
					row.genotypeDisplay = "";
                                        row.genotypeAccId = "";
				} else {
					row.genotypeKey = data[0].genotypeKey;
					row.genotypeDisplay = data[0].genotypeDisplay;
                                        row.genotypeAccId = data[0].accID;
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateGenotypeAPI.search");
				document.getElementById(id).focus();
				row.genotypeKey = "";
				row.genotypeDisplay = "";
                                row.genotypeAccId = "";
			});
		}

                //
		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
		$scope.clear = clear;
		$scope.clearMerge = clearMerge;
		$scope.create = create;
		$scope.modify = modify;
		$scope.deleteIt = deleteIt;
		$scope.searchDuplicates = searchDuplicates;

                $scope.changeAttributeRow = changeAttributeRow;
                $scope.addAttributeRow = addAttributeRow;
                $scope.selectAttributeRow = selectAttributeRow;

                $scope.changeNeedsReviewRow = changeNeedsReviewRow;
                $scope.addNeedsReviewRow = addNeedsReviewRow;
                $scope.selectNeedsReviewRow = selectNeedsReviewRow;

                $scope.changeAccRow = changeAccRow;
                $scope.addAccRow = addAccRow;
                $scope.selectAccRow = selectAccRow;

                $scope.changeMarkerRow = changeMarkerRow;
                $scope.addMarkerRow = addMarkerRow;
                $scope.selectMarkerRow = selectMarkerRow;

                $scope.changeSynonymRow = changeSynonymRow;
                $scope.addSynonymRow = addSynonymRow;
                $scope.selectSynonymRow = selectSynonymRow;

                $scope.changeGenotypeRow = changeGenotypeRow;
                $scope.addGenotypeRow = addGenotypeRow;
                $scope.selectGenotypeRow = selectGenotypeRow;

                $scope.changeRefAssocRow = changeRefAssocRow;
                $scope.addRefAssocRow = addRefAssocRow;
                $scope.selectRefAssocRow = selectRefAssocRow;

		// Note Buttons
		$scope.hideShowStrainOriginNote = hideShowStrainOriginNote;
		$scope.hideShowImpcNote = hideShowImpcNote;
		$scope.hideShowNomenNote = hideShowNomenNote;
		$scope.hideShowMCLNote = hideShowMCLNote;
                $scope.hideShowMGIIds = hideShowMGIIds;

                // Validate
                $scope.validateStrain = validateStrain;
                $scope.validateStrainPrivate = validateStrainPrivate;
                $scope.validateIncorrectStrain = validateIncorrectStrain;
                $scope.validateCorrectStrain = validateCorrectStrain;
                $scope.validateAllele = validateAllele;
                $scope.validateMarker = validateMarker;
                $scope.validateJnum = validateJnum;
                $scope.validateGenotype = validateGenotype;

		// Data Sets
		$scope.getDataSetsAcc = getDataSetsAcc;
		$scope.getDataSetsRef = getDataSetsRef;

                // Merge
		$scope.processMerge = processMerge;

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

		// call to initialize the page, and start the ball rolling...
		init();
	}

})();

