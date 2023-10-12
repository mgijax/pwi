(function() {
	'use strict';
	angular.module('pwi.marker').controller('MarkerController', MarkerController);

	function MarkerController(
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
			MarkerUtilAPI,
			MarkerUtilValidationAPI,
			MarkerStatusSearchAPI,
			MarkerTypeSearchAPI,
			MarkerSearchAPI,
			MarkerKeySearchAPI,
			MarkerCreateAPI,
			MarkerUpdateAPI,
			MarkerDeleteAPI,
			MarkerAssocRefsAPI,
			MarkerTotalCountAPI,
			MarkerFeatureTypeValidationAPI,
                        MarkerNextGmSequenceAPI,
                        MarkerNextRrSequenceAPI,
			// global APIs
			ChromosomeSearchAPI,
			ReferenceAssocTypeSearchAPI,
			SynonymTypeSearchAPI,
			OrganismSearchMarkerAPI,
			ValidateJnumAPI,
			ValidateMarkerAnyStatusAPI,
			VocTermSearchAPI
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {}

		// api/json input/output
		vm.apiDomain = {};

		// count, and list of results data (fills summary)
		vm.total_count = 0;
		vm.resultCount = 0;
		vm.results = [];
		
		// Used to track which summary marker is highlighted / active
		vm.selectedIndex = 0;
		
		// default booleans for page functionality 
		vm.hideApiDomain = true;       // JSON package
		vm.hideVmData = true;          // JSON package + other vm objects
		vm.hideLoadingHeader = true;   // display loading header
		vm.hideErrorContents = true;   // display error message
		
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
		// Functions bound to UI via buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////		

        	// mapped to 'Clear' button; called from init();  resets page
		function clear() {		
			vm.oldRequest = null;
			resetData();
			refreshTotalCount();
			setFocus();
		}		

		// mapped to query 'Search' button
		function search(deselect) {				
		
			pageScope.loadingStart();
			vm.hideLoadingHeader = false;
			
			// save off old request
			vm.oldRequest = vm.apiDomain;
			
			// call API to search; pass query params (vm.selected)
			MarkerSearchAPI.search(vm.apiDomain, function(data) {
				
				vm.results = data;
				vm.hideLoadingHeader = true;
				vm.selectedIndex = 0;

				if (deselect) {
					deselectObject();
				}
				else {
					loadMarker();
				}
				pageScope.loadingEnd();
				setFocus();

			}, function(err) { // server exception
				pageScope.handleError(vm, "Error searching for markers.");
				pageScope.loadingEnd();
				setFocus();
			});

		}		

		// mapped to 'Reset Search' button
		function resetSearch() {		
			resetData();
			refreshTotalCount();
			if (vm.oldRequest != null) {
				vm.apiDomain = vm.oldRequest;
			}
		}		

        	// called when user clicks a row in the summary
		function setMarker(index) {
			if (index == vm.selectedIndex) {
				deselectObject();
			}
			else {
				vm.apiDomain = {};
				vm.selectedIndex = index;
				loadMarker();
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
                        MarkerTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

        	// mapped to 'Create' button
		function createMarker() {
			console.log("createMarker() -> MarkerCreateAPI()");

			// verify if record selected
                        if (vm.apiDomain.markerKey != null && vm.apiDomain.markerKey != "") {
				alert("Cannot Add if a record is already selected.");
                                return;
			}

			// default history reference = J:23000
			if (vm.apiDomain.history[0].refsKey == "") {
				vm.apiDomain.history[0].refsKey = "22864";
			}
			
                        if (vm.apiDomain.symbol == null || vm.apiDomain.symbol == "") {
				alert("Required Field:  Symbol");
                                return;
			}
                        if (vm.apiDomain.name == null || vm.apiDomain.name == "") {
				alert("Required Field:  Name");
                                return;
			}

                        if (vm.apiDomain.chromosome == null || vm.apiDomain.chromosome == "") {
				alert("Required Field:  Chromosome");
                                return;
			}

			// defaults needed here due to feature type validation
			if (vm.apiDomain.markerTypeKey == null || vm.apiDomain.markerTypeKey == "") {
				vm.apiDomain.markerTypeKey = "1";
			}

			if (vm.apiDomain.markerStatusKey == null || vm.apiDomain.markerStatusKey == "") {
				vm.apiDomain.markerStatusKey = "1";
			}

			// feature type validation
                        if (
                               	vm.apiDomain.markerTypeKey == "1"
                               	|| vm.apiDomain.markerTypeKey == "3"
                               	|| vm.apiDomain.markerTypeKey == "7"
                               	|| vm.apiDomain.markerTypeKey == "9"
                               	)
			{
				if (vm.apiDomain.featureTypes[0].termKey == "") {
					alert("Invalid Marker Type/Feature Type combination.");
					return;
				}
				else {
					validateFeatureTypeRow(0);
				}
			}
			else {
				vm.apiDomain.featureTypes = null;
			}

			pageScope.loadingStart();

			MarkerCreateAPI.create(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					vm.apiDomain = data.items[0];
                			vm.selectedIndex = vm.results.length;
					vm.results[vm.selectedIndex] = [];
					vm.results[vm.selectedIndex].markerKey = vm.apiDomain.markerKey;
					vm.results[vm.selectedIndex].symbol = vm.apiDomain.symbol;
					loadMarker();
					refreshTotalCount();
				}
				pageScope.loadingEnd();
				setFocus();
			}, function(err) {
				pageScope.handleError(vm, "Error creating marker.");
				pageScope.loadingEnd();
				setFocus();
			});
		}		

        	// mapped to 'Update' button
		function updateMarker() {
			console.log("updateMarker() -> MarkerUpdateAPI()");
			pageScope.loadingStart();
			
                        // change marker
                        changeMarker();

			// check for missing sequenceNum
			var seqNums = [];
			var isMissingSeqNum = false;
			if (vm.apiDomain.history != null) {
				for (var i=0;i<vm.apiDomain.history.length; i++) {
					seqNums.push(parseInt(vm.apiDomain.history[i].sequenceNum));
				}
			}
			for(var i=1;i<=seqNums.length;i++) {
    				if(seqNums.indexOf(i) == -1){
            				isMissingSeqNum = true;
	        		}
			}
			if (isMissingSeqNum){
				alert("Missing sequence number.  Cannot Modify.");
				vm.allowModify = false;
			}

			// check for duplicate sequenceNum
			var hasDuplicateOrder = false;
			var orderList = [];
			var s = 0;
			if (vm.apiDomain.history != null) {
				for(var i=0;i<vm.apiDomain.history.length; i++) {
					s = vm.apiDomain.history[i].sequenceNum;
					if (orderList.includes(s)) {
						hasDuplicateOrder = true;
					}
					else {
						orderList.push(s);
					}
				}
				if (hasDuplicateOrder) {
					alert("Duplicate Order Detected in Table.  Cannot Modify.");
					allowModify = false;
				}
			}

			if (!vm.allowModify) { return; }

			MarkerUpdateAPI.update(vm.apiDomain, function(data) {
				
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					vm.apiDomain = data.items[0];
                                        loadMarker();
				}
				pageScope.loadingEnd();
				setFocus();
				
			}, function(err) {
				pageScope.handleError(vm, "Error updating marker.");
				pageScope.loadingEnd();
				setFocus();
			});
		}		
		
        	// mapped to 'Delete' button
		function deleteMarker() {
			console.log("deleteMarker() -> MarkerDeleteAPI()");

			if ($window.confirm("Are you sure you want to delete this record?")) {
			
				pageScope.loadingStart();

				MarkerDeleteAPI.delete({ key: vm.apiDomain.markerKey }, function(data) {
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
					pageScope.handleError(vm, "Error deleting marker.");
					pageScope.loadingEnd();
					setFocus();
				});
			}
		}		

		// SUMMARY NAVIGATION

		// move to previous marker in summary
		function prevSummaryMarker() {
			console.log("prevSummaryMarker()");
			if(vm.selectedIndex == 0) return;
			vm.selectedIndex--;
			loadMarker();
			scrollToMarker();
		}
		
		// move to next marker in summary
		function nextSummaryMarker() {
			console.log("nextSummaryMarker()");
			if(vm.results.length == 0) return;
			if(vm.selectedIndex + 1 >= vm.results.length) return;
			vm.selectedIndex++;
			loadMarker();
			scrollToMarker();
		}		
		
            	function firstSummaryMarker() {
                        console.log("firstSummaryMarker()");
                	if(vm.results.length == 0) return;
                	vm.selectedIndex = 0;
                        loadMarker();
                        scrollToMarker();
              	}

            	function lastSummaryMarker() {
                        console.log("lastSummaryMarker()");
                	if(vm.results.length == 0) return;
                	vm.selectedIndex = vm.results.length - 1;
                        loadMarker();
                        scrollToMarker();
              	}

		// ensure we keep the selected row in view
		function scrollToMarker() {

			$q.all([
			   FindElement.byId("resultTableWrapper"),
			   FindElement.byQuery("#resultsTable .resultsTableSelectedRow")
			 ]).then(function(elements) {
				 var table = angular.element(elements[0]);
				 var selected = angular.element(elements[1]);
				 var offset = 30;
				 table.scrollToElement(selected, offset, 0);
			 });
		}
		
		// NOTES
		
		// Hide/Show note sections
		function hideShowEditorNote() {
			vm.hideEditorNote = !vm.hideEditorNote;
		}
		function hideShowSequenceNote() {
			vm.hideSequenceNote = !vm.hideSequenceNote;
		}
		function hideShowMarkerRevisionNote() {
			vm.hideMarkerRevisionNote = !vm.hideMarkerRevisionNote;
		}
		function hideShowStrainSpecificNote() {
			vm.hideStrainSpecificNote = !vm.hideStrainSpecificNote;
		}
		function hideShowLocationNote() {
			vm.hideLocationNote = !vm.hideLocationNote;
		}
		
		/////////////////////////////////////////////////////////////////////
		// Tab section
		/////////////////////////////////////////////////////////////////////		
		
		function setActiveTab(tabIndex) {
			vm.activeTab=tabIndex;			
			
			// if reference tab, we need to load reference objects separately
			if (tabIndex==2 && vm.apiDomain.markerKey != null) {
				loadRefsForMarker();
			}
		}

		// validate jnum
		function validateJnum(row, index, id) {		
			console.log("validateJnum = " + id + index);

			id = id + index;

			if (row.jnumid == undefined || row.jnumid == "") {
				row.refsKey = "";
				row.jnumid = "";
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
					row.short_citation = "";
				} else {
					row.refsKey = data[0].refsKey;
					row.jnumid = data[0].jnumid;
					row.short_citation = data[0].short_citation;
				}
			}, function(err) {
				pageScope.handleError(vm, "Invalid Reference");
				document.getElementById(id).focus();
				row.refsKey = "";
                                row.jnumid = ""; 
				row.short_citation = "";
			});
		}		
		
		function utilJnumOnBlur() {
			console.log("utilJnumOnBlur()");

			ValidateJnumAPI.query({ jnum: vm.utilDisplay.jnumid }, function(data) {

				if (data.length == 0) {
					alert("Invalid Reference: " + vm.utilDisplay.jnumid);
				} else {
			  		vm.utilData.refKey = data[0].refsKey;
					vm.utilDisplay.jnumid = data[0].jnumid;
					vm.utilDisplay.short_citation = data[0].short_citation;
					vm.allowUtilSubmit = true;			
				}
			}, function(err) {
				pageScope.handleError(vm, "Error Validating Util Tab J#.");
				vm.allowUtilSubmit = false;			
			});
		}

		// ORGANISM SECTION
                
		function changeOrganism() {
                        console.log("changeOrganism");

			vm.logicaldbLookup = [];
			vm.logicaldbLookup[0] = {
				"logicaldbKey": "8",
				"logicaldb": "EC"
			}
			vm.logicaldbLookup[1] = {
				"logicaldbKey": "9",
				"logicaldb":"Sequence DB"
			}

                        // yeast (114)
                        if (vm.apiDomain.organismKey == "144") {
			        vm.logicaldbLookup[2] = {
				        "logicaldbKey": "114",
				        "logicaldb":"SGD"
                                }
			        vm.logicaldbLookup[3] = {
				        "logicaldbKey": "55",
				        "logicaldb":"Entrez Gene"
			        }
                                return;
                        }

                        // entrezgeneload organisms cannot edit EG/55 accession ids
                        // cattle (11), chicken (63), chimp (10), dog (13), human (2), 
                        // monkey (94), rat (40), frog/tropicalis (95), frog/xenopuslaevis (86), zebrafish (84)
			if (
                                vm.apiDomain.organismKey != "1"
                                && vm.apiDomain.organismKey != "2"
                                && vm.apiDomain.organismKey != "10"
                                && vm.apiDomain.organismKey != "11"
                                && vm.apiDomain.organismKey != "13"
                                && vm.apiDomain.organismKey != "40"
                                && vm.apiDomain.organismKey != "63"
                                && vm.apiDomain.organismKey != "84"
                                && vm.apiDomain.organismKey != "86"
                                && vm.apiDomain.organismKey != "94"
                                && vm.apiDomain.organismKey != "95"
                           ) {
			        vm.logicaldbLookup[2] = {
				        "logicaldbKey": "55",
				        "logicaldb":"Entrez Gene"
			        }
                        }
		}

		// MARKER SECTION
		
		function changeMarker() {
                        console.log("changeMarker");

			if (vm.apiDomain.markerKey == null) {
				return;
			}

			if (vm.apiDomain.featureTypes == null) {
				return;
			}

			if (vm.apiDomain.featureTypes.length > 0) {
				for(var i=0;i<vm.apiDomain.featureTypes.length; i++) {
					validateFeatureTypeRow(i);
				}
			}
			else {
				vm.allowModify = true;
			}
		}

		// NOTE SECTION
		
		// add new note row
		function addNote(note, noteType) {
			console.log("addNote:" + note);

			if (note != undefined) { return; }

			var noteTypeKey = "";

			if (noteType == "Editor") {
				noteTypeKey = "1004";
			}
			if (noteType == "Sequence") {
				noteTypeKey = "1009";
			}
			if (noteType == "Revision") {
				noteTypeKey = "1030";
			}
			if (noteType == "Strain") {
				noteTypeKey = "1035";
			}
			if (noteType == "Location") {
				noteTypeKey = "1049";
			}

			note = {
				"processStatus": "c",
				"noteKey": "",
				"objectKey": vm.apiDomain.markerKey,
				"mgiTypeKey": "2",
				"noteTypeKey": noteTypeKey,
				"noteChunk": ""
			}

			if (noteType == "Editor") {
				vm.apiDomain.editorNote = note;
			}
			if (noteType == "Sequence") {
				vm.apiDomain.sequenceNote = note;
			}
			if (noteType == "Revision") {
				vm.apiDomain.revisionNote = note;
			}
			if (noteType == "Strain") {
				vm.apiDomain.strainNote = note;
			}
			if (noteType == "Location") {
				vm.apiDomain.locationNote = note;
			}
		}

		function addNotes() {
			console.log("addNotes");

			addNote(vm.apiDomain.editorNote, "Editor");
			addNote(vm.apiDomain.sequenceNote, "Sequence");
			addNote(vm.apiDomain.revisionNote, "Revision");
			addNote(vm.apiDomain.strainNote, "Strain");
			addNote(vm.apiDomain.locationNote, "Location");
		}


		// FEATURE TYPE SECTION

		function addFeatureTypeRow() {
			console.log("addFeatureTypeRow()");
			
                        if (vm.apiDomain.featureTypes == undefined) {
                                vm.apiDomain.featureTypes = [];
                        }

                        if (vm.apiDomain.featureTypes.length == 1) {
                                return;
                        }

                        var i = vm.apiDomain.featureTypes.length;

			vm.apiDomain.featureTypes[i] = {
					"processStatus": "c",
					"annotTypeKey": "1011",
					"termKey":"",
					"term":""
			};

		}

		function validateFeatureTypeRow(index) {
                        console.log("validateFeatureTypeRow : " + index);

                        if (vm.apiDomain.markerTypeKey == null) {
				return;
			}

                        // if marker type does not require a feature type, then skip
                        if (
                                vm.apiDomain.markerTypeKey == "2"
                                || vm.apiDomain.markerTypeKey == "6"
                                || vm.apiDomain.markerTypeKey == "8"
                                || vm.apiDomain.markerTypeKey == "10"
                                || vm.apiDomain.markerTypeKey == "12"
                                )
                        {
                                return;
                        }

                        if (vm.apiDomain.featureTypes[index] == null) {
                                return;
                        }

                        var featureTypes = {
				"markerTypeKey":"", 
				"featureTypes":[]
			};

                        featureTypes.markerTypeKey = vm.apiDomain.markerTypeKey;
                        featureTypes.featureTypes[0] = {"termKey": vm.apiDomain.featureTypes[index].termKey};


			MarkerFeatureTypeValidationAPI.validate(featureTypes, function(data) {
				if (data.error != null) {
					console.log(data.message);
					alert("Invalid Marker Type/Feature Type combination.");
					vm.apiDomain.featureTypes[index].term = "";
					vm.apiDomain.featureTypes[index].termKey = "";
					//vm.allowModify = false;
				} else {
					if (vm.apiDomain.featureTypes[index].processStatus != "d" 
						&& vm.apiDomain.featureTypes[index].processStatus != "c") {
                                		vm.apiDomain.featureTypes[index].processStatus = "u";
						//vm.allowModify = true;
                        		};
				}
			}, function(err) {
				handleError("Error Validating Marker/FeatureType");
			});
		}

		// HISTORY SECTION
		
		function validateHistorySymbol(row, index, id) {
			console.log("validateHistorySymbol = " + id + index);

			id = id + index;
			
			if (row.markerHistorySymbol == undefined || row.markerHistorySymbol == "") {
				row.markerHistorySymbolKey = "";
				row.markerHistorySymbol = "";
				return;
			}

			if (row.markerHistorySymbol.includes("%")) {
				return;
			}

			ValidateMarkerAnyStatusAPI.query({symbol: row.markerHistorySymbol }, function(data) {

				if (data.length == 0) {
					alert("Invalid Marker Symbol: " + row.markerHistorySymbol);
					document.getElementById(id).focus();
					vm.allowModify = false;
					row.markerHistorySymbolKey = "";
					row.markerHistorySymbol = "";
					row.markerHistoryName = "";
				} else {
					vm.allowModify = true;
					row.markerHistorySymbolKey = data[0].markerKey;
					row.markerHistorySymbol = data[0].symbol;
				}
			}, function(err) {
				pageScope.handleError(vm, "Invalid Marker Symbol");
				document.getElementById(id).focus();
				vm.allowModify = false;
				row.markerHistorySymbolKey = "";
				row.markerHistorySymbol = "";
				row.markerHistoryName = "";
			});
		}

		function addHistoryRow () {
			console.log("addHistoryRow");

                        if (vm.apiDomain.history == undefined) {
                                vm.apiDomain.history = [];
                        }

                        var i = vm.apiDomain.history.length;

			vm.apiDomain.history[i] = {
					"processStatus": "c",
					"sequenceNum": String(i + 1),
					"markerHistorySymbolKey":"",
					"markerHistorySymbol":"",
					"markerHistoryName":"",
					"event_date":"",
					"modifiedBy":"",
					"modification_date":"",
					"refsKey":"",
					"jnumid":"",
					"markerEventKey":"",
					"markerEventReasonKey":"",
					"short_citation":""
			};
		}

		function changeHistoryRow(index) {
                        console.log("changeHistoryRow: " + index);

                        if (vm.apiDomain.history[index] == null) {
                                return;
                        }

			if (vm.apiDomain.history[index].processStatus != "d" && vm.apiDomain.history[index].processStatus != "c") {
                                vm.apiDomain.history[index].processStatus = "u";
				vm.allowModify = true;
                        };
		}

		// SYNONYM SECTION
		
		function addSynonymRow () {
			console.log("addSynonymRow");

                        if (vm.apiDomain.synonyms == undefined) {
                                vm.apiDomain.synonyms = [];
                        }

			var newObject = {
					"processStatus": "c",
					"objectKey":vm.apiDomain.markerKey,
					"synonymKey":"",
					"synonym":"",
					"mgiTypeKey":"2",
					"synonymTypeKey":"",
					"refsKey":""
			};
			vm.apiDomain.synonyms.unshift(newObject);
		}

		function changeSynonymRow(index) {
                        console.log("changeSynonymRow: " + index);

                        if (vm.apiDomain.synonyms[index] == null) {
                                return;
                        }

			if (vm.apiDomain.synonyms[index].processStatus != "d" && vm.apiDomain.synonyms[index].processStatus != "c") {
                                vm.apiDomain.synonyms[index].processStatus = "u";
				vm.allowModify = true;
                        };
		}

		// REFERENCE SECTION
		//if ($window.confirm("Are you sure you want to delete this accession relationship?")) {
		
		function addRefRow() {
			console.log("addRefRow");

                        if (vm.apiDomain.refAssocs == undefined) {
                                vm.apiDomain.refAssocs = [];
                        }

			var newObject = {
					"processStatus": "c",
					"objectKey":vm.apiDomain.markerKey,
					"refAssocTypeKey":"",
					"refAssocType":"",
					"mgiTypeKey":"2",
					"refsKey":""
			};
			vm.apiDomain.refAssocs.unshift(newObject);
		}

		function changeRefRow(index) {
                        console.log("changeRefRow: " + index);

                        if (vm.apiDomain.refAssocs[index] == null) {
                                return;
                        }

			if (vm.apiDomain.refAssocs[index].processStatus != "d" && vm.apiDomain.refAssocs[index].processStatus != "c") {
                                vm.apiDomain.refAssocs[index].processStatus = "u";
				vm.allowModify = true;
                        };
		}
		
		// ACC TAB

		function addAccRow () {
			console.log("addAccRow");

                        if (vm.apiDomain.editAccessionIds == undefined) {
                                vm.apiDomain.editAccessionIds = [];
                        }

			var newObject = {
					"processStatus": "c",
					"objectKey":vm.apiDomain.markerKey,
					"mgiTypeKey":"2",
					"logicaldbKey":"",
			                "accID":""
			};

			newObject.references = [];
			newObject.references[0] = {
			                "refsKey":"",
			                "jnumid":""
			}
			console.log(newObject);
			vm.apiDomain.editAccessionIds.unshift(newObject);
		}

		function changeAccRow(index) {
                        console.log("changeAccRow: " + index);

                        if (vm.apiDomain.editAccessionIds[index] == null) {
                                return;
                        }

			if (vm.apiDomain.editAccessionIds[index].processStatus != "d" && vm.apiDomain.editAccessionIds[index].processStatus != "c") {
                                vm.apiDomain.editAccessionIds[index].processStatus = "u";
				vm.allowModify = true;
                        };
		}
		
		// Utils TAB
		
		function utilRenameProcess() {
			console.log("utilRenameProcess()");
			vm.utilShowLoading = true;
			
			// copy active marker key to util submission package
			vm.utilData.oldKey = vm.summaryMarkerKey;

			// call API utils
			MarkerUtilAPI.process(vm.utilData, function(data) {
				if (data.error != null) {
					console.log(data.message);
					alert("UTIL Error: " + data.error);
				} else {
					loadMarker();
					vm.results[vm.selectedIndex].symbol = vm.utilData.newSymbol;
				}

				// reset things back
				resetUtils();

			}, function(err) { // server exception
				pageScope.handleError(vm, "Error renaming marker.");
			});
			
		}		

		function utilDeleteProcess() {
			console.log("utilDeleteProcess()");
			vm.utilShowLoading = true;
			
			// copy active marker key to util submission package
			vm.utilData.oldKey = vm.summaryMarkerKey;

			// call API utils
			MarkerUtilAPI.process(vm.utilData, function(data) {
				if (data.error != null) {
					console.log(data.message);
					alert("UTIL Error: " + data.error);
				} else {
					loadMarker();
				}

				// reset things back
				resetUtils ();

			}, function(err) { // server exception
				pageScope.handleError(vm, "Error deleting marker.");
			});
			
		}		

		function utilMergeProcess() {
			console.log("utilMergeProcess()");
			vm.utilShowLoading = true;
			
			// copy active marker key to util submission package
			vm.utilData.oldKey = vm.summaryMarkerKey;

			// call API utils
			MarkerUtilAPI.process(vm.utilData, function(data) {
				if (data.error != null) {
					console.log(data.message);
					alert("UTIL Error: " + data.error);
				} else {
					loadMarker();
				}

				// reset things back
				resetUtils ();

			}, function(err) { // server exception
				pageScope.handleError(vm, "Error deleting marker.");
			});
			
		}		

		function utilSymbolAccidOnBlur() {
			console.log("utilSymbolAccidOnBlur()");

			// ensure user has changed values since last validation
			if (vm.utilMergeValidationData.mgiAccId2 != vm.utilDisplay.accid || vm.utilMergeValidationData.symbol2 != vm.utilData.newSymbol){
			
				// fill submission package
				vm.utilMergeValidationData.markerKey1 = vm.apiDomain.markerKey;
				vm.utilMergeValidationData.symbol1 = vm.apiDomain.symbol;
				vm.utilMergeValidationData.chromosome1 = vm.apiDomain.chromosome;
				vm.utilMergeValidationData.symbol2 = vm.utilData.newSymbol;
				vm.utilMergeValidationData.mgiAccId2 = vm.utilDisplay.accid;
	
				MarkerUtilValidationAPI.validate(vm.utilMergeValidationData, function(data) {
					
					if (data.error != null) {
						console.log(data.message);
						alert("UTIL Error: " + data.error + " - " + data.message);
					} else {
						console.log(data.items[0]);
						vm.utilData.newKey = data.items[0].markerKey2;
						vm.utilDisplay.symbol2 = data.items[0].symbol2;
						vm.utilDisplay.accid = data.items[0].mgiAccId2;
					}
				}, function(err) {
					pageScope.handleError(vm, "Error Validating Util Tab Symbol/AccID");
				});
			}

		}
		
		// OTHER THINGS
                
		function getNextGmSequence() {
                        console.log("getNextGmSequence()");

			MarkerNextGmSequenceAPI.search(function(data) {
                                vm.nextGmSequence = data[0].symbol;
			}, function(err) {
				pageScope.handleError("Error MarkerNextGmSequenceAPI");
			});

                        console.log(vm.nextGmSequence);
		}

		function getNextRrSequence() {
                        console.log("getNextRrSequence()");

			MarkerNextRrSequenceAPI.search(function(data) {
                                vm.nextRrSequence = data[0].symbol;
			}, function(err) {
				pageScope.handleError("Error MarkerNextRrSequenceAPI");
			});

                        console.log(vm.nextRrSequence);
		}

		/////////////////////////////////////////////////////////////////////
		// Utility methods
		/////////////////////////////////////////////////////////////////////
		
		function resetData() {
			// reset submission/summary values
			vm.results = [];
			vm.selectedIndex = 0;
			vm.total_count = 0;
			vm.resultCount = 0;
			vm.activeTab = 1;

			resetMarker();
			resetBoolean();
			resetUtils();

                        getNextGmSequence();
                        getNextRrSequence();
		}

		function resetDataDeselect() {
			resetBoolean();
			resetMarker();
			resetUtils();
		}

		// reset booleans
	        function resetBoolean() {
			vm.hideErrorContents = true;
			vm.hideLoadingHeader = true;
			vm.hideEditorNote = true;
			vm.hideSequenceNote = true;
			vm.hideMarkerRevisionNote = true;
			vm.hideStrainSpecificNote = true;
			vm.hideLocationNote = true;
			vm.allowModify = true;
			vm.loadingRefs = false;
		}
	
		// reset main marker fields
		function resetMarker() {

			vm.apiDomain = {};
			vm.apiDomain.markerKey = "";
			vm.apiDomain.organismKey = "1";
                        vm.apiDomain.symbol = "";
                        vm.apiDomain.name = "";
                        vm.apiDomain.markerTypeKey = "";
                        vm.apiDomain.markerStatusKey = "";
                        vm.apiDomain.chromosome = "";
			vm.apiDomain.mgiAccessionIds = [];
			vm.apiDomain.mgiAccessionIds[0] = {"accID":""};

			addNotes();
			addFeatureTypeRow();
			addHistoryRow();
			addSynonymRow();
			addRefRow();
			addAccRow();
		}

		// resets the history 
		function resetUtils () {
			vm.allowUtilSubmit = false;
			vm.utilShowLoading = false;
			vm.utilData = {"eventKey":"106563605", "eventReasonKey":"106563610", 
					"refKey": "","addAsSynonym": "1", 
					"oldKey": "", "newName": "", "newSymbol": ""}; 
			vm.utilDisplay = {"jnumid":"", "accid":""};
			vm.utilMergeValidationData = {"markerKey1":"", "symbol2": "", "mgiAccId2": ""}; 
		}
		
		// setting of mouse focus
		function setFocus () {
                        console.log("setFocus()");
                        // must pause for a bit...then it works
                        setTimeout(function() {
                                document.getElementById("markerSymbol").focus();
                        }, (200));
		}
		
		// load a marker from summary 
		function loadMarker() {
			console.log("loadMarker()");

			if (vm.results.length == 0) {
				return;
			}

			// derive the key of the selected result summary marker
			vm.summaryMarkerKey = vm.results[vm.selectedIndex].markerKey;
			
			// call API to gather marker for given key
			MarkerKeySearchAPI.get({ key: vm.summaryMarkerKey }, function(data) {
				vm.apiDomain = data;
				postMarkerLoad();
			}, function(err) {
				pageScope.handleError(vm, "Error retrieving marker.");
			});
		}

		// a marker can be loaded from a search or create or modify - this shared 
		// processing is called after endpoint data is loaded
		function postMarkerLoad() {
			// ...and load the references if this ref tab is open
			if (vm.activeTab==2 && vm.apiDomain.markerKey != null) {
				loadRefsForMarker();
			}

			addNotes();
			addFeatureTypeRow();
                        changeOrganism();
		}

		// when an object is deleted, remove it from the summary
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove object
			removeSearchResultsItem(vm.apiDomain.markerKey);

			// clear if now empty; otherwise, load next image
			if (vm.results.length == 0) {
				clear();
			}
			else {
				// adjust selected summary index as needed, and load image
				if (vm.selectedIndex > vm.results.length - 1) {
					vm.selectedIndex = vm.results.length - 1;
				}
				loadMarker();
			}
		}

		// handle removal from summary list
		function removeSearchResultsItem(keyToRemove) {
			
			// first find the item to remove
			var removeIndex = -1;
			for(var i=0;i<vm.results.length; i++) {
				if (vm.results[i].markerKey == keyToRemove) {
					removeIndex = i;
				}
			}
			// if found, remove it
			if (removeIndex >= 0) {
				vm.results.splice(removeIndex, 1);
			}
		}

		// load a references for a given marker 
		function loadRefsForMarker() {

			vm.loadingRefs = true;
			
			// call API 
			MarkerAssocRefsAPI.query({ key: vm.apiDomain.markerKey }, function(data) {
				if (data.length == 0) {
					console.log("No References found for key: " + vm.apiDomain.markerKey);
				} else {
					vm.apiDomain.refAssocs = data;
				}
				vm.loadingRefs = false;

			}, function(err) {				
				pageScope.handleError(vm, "Error retrieving references for this marker");
				vm.loadingRefs = false;
			});

		}		

		// load vocabularies
                function loadVocabs() {
                        console.log("loadVocabs()");

			vm.chromosomeLookup = [];
			ChromosomeSearchAPI.search({"organismKey":"1"}, function(data) { vm.chromosomeLookup = data});;
			
			vm.markerStatusLookup = [];
                        MarkerStatusSearchAPI.search({}, function(data) { vm.markerStatusLookup = data; });;

			vm.markerTypeLookup = [];
                        MarkerTypeSearchAPI.search({}, function(data) { vm.markerTypeLookup = data; });;

			vm.eventLookup = [];
                        VocTermSearchAPI.search({"vocabKey":"33"}, function(data) {vm.eventLookup = data.items[0].terms})     ;;

			vm.eventReasonLookup = [];
                        VocTermSearchAPI.search({"vocabKey":"34"}, function(data) {vm.eventReasonLookup = data.items[0].terms})     ;;

			vm.refAssocTypeLookup = [];
			ReferenceAssocTypeSearchAPI.search({"mgiTypeKey":"2"}, function(data) { vm.refAssocTypeLookup = data.items});;

			vm.synonymTypeLookup = [];
			SynonymTypeSearchAPI.search({"organismKey":"1","mgiTypeKey":"2"}, function(data) { vm.synonymTypeLookup = data});;

			vm.organismLookup = [];
			OrganismSearchMarkerAPI.search({}, function(data) { vm.organismLookup = data});;

			vm.logicaldbLookup = [];
			vm.logicaldbLookup[0] = {
				"logicaldbKey": "8",
				"logicaldb": "EC"
			}
			vm.logicaldbLookup[1] = {
				"logicaldbKey": "9",
				"logicaldb":"Sequence DB"
			}

			vm.featureTypeLookup = [];
			VocTermSearchAPI.search({"vocabKey":"79"}, function(data) { vm.featureTypeLookup = data.items[0].terms});;
			
                }

		// linkout to marker detail		
		function mrkLink() {
                FindElement.byId("accIdQuery").then(function(element){
                        var mrkUrl = pageScope.url_for('pwi.markerdetail', '?id=' + element.value);
                        window.open(mrkUrl, '_blank');
                });
                }

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.prevSummaryMarker = prevSummaryMarker;
		$scope.nextSummaryMarker = nextSummaryMarker;
		$scope.firstSummaryMarker = firstSummaryMarker;
		$scope.lastSummaryMarker = lastSummaryMarker;

		$scope.search = search;
		$scope.clear = clear;
		$scope.resetSearch = resetSearch;
		$scope.changeOrganism = changeOrganism;
		$scope.setMarker = setMarker;
		$scope.createMarker = createMarker;
		$scope.updateMarker = updateMarker;
		$scope.deleteMarker = deleteMarker;
		$scope.changeMarker = changeMarker;

		// Note Buttons
		$scope.hideShowEditorNote = hideShowEditorNote;
		$scope.hideShowSequenceNote = hideShowSequenceNote;
		$scope.hideShowMarkerRevisionNote = hideShowMarkerRevisionNote;
		$scope.hideShowStrainSpecificNote = hideShowStrainSpecificNote;
		$scope.hideShowLocationNote = hideShowLocationNote;
		
		$scope.validateJnum = validateJnum;

		// Feature Type
		$scope.addFeatureTypeRow = addFeatureTypeRow;
		$scope.validateFeatureTypeRow = validateFeatureTypeRow;
		$scope.mrkLink = mrkLink;

		// History
		$scope.validateHistorySymbol = validateHistorySymbol;
		$scope.addHistoryRow = addHistoryRow;
		$scope.changeHistoryRow = changeHistoryRow;
		
		// ActiveTab
		$scope.setActiveTab = setActiveTab;

		// Synonym
		$scope.addSynonymRow = addSynonymRow;
		$scope.changeSynonymRow = changeSynonymRow;
		
		// Reference
		$scope.addRefRow = addRefRow;
		$scope.changeRefRow = changeRefRow;

		// Edit-Accession
		$scope.addAccRow = addAccRow;
		$scope.changeAccRow = changeAccRow;

		// Utilities
		$scope.utilRenameProcess = utilRenameProcess;
		$scope.utilDeleteProcess = utilDeleteProcess;
		$scope.utilMergeProcess = utilMergeProcess;
		$scope.utilJnumOnBlur = utilJnumOnBlur;
		$scope.utilSymbolAccidOnBlur = utilSymbolAccidOnBlur;
		
                // Other Things
		$scope.getNextGmSequence = getNextGmSequence;
		$scope.getNextRrSequence = getNextRrSequence;
                
		// global shortcuts
                $scope.KclearAll = function() { $scope.clear(); $scope.$apply(); }
                $scope.Ksearch = function() { $scope.search(); $scope.$apply(); }
                $scope.Kfirst = function() { $scope.firstSummaryMarker(); $scope.$apply(); }
                $scope.Knext = function() { $scope.nextSummaryMarker(); $scope.$apply(); }
                $scope.Kprev = function() { $scope.prevSummaryMarker(); $scope.$apply(); }
                $scope.Klast = function() { $scope.lastSummaryMarker(); $scope.$apply(); }
                $scope.Kadd = function() { $scope.createMarker(); $scope.$apply(); }
                $scope.Kmodify = function() { $scope.updateMarker(); $scope.$apply(); }
                $scope.Kdelete = function() { $scope.deleteMarker(); $scope.$apply(); }

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

