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
			MarkerFeatureTypeValidationAPI,
			MarkerSearchAPI,
			MarkerKeySearchAPI,
			MarkerCreateAPI,
			MarkerUpdateAPI,
			MarkerDeleteAPI,
			MarkerHistorySymbolValidationAPI,
			MarkerAssocRefsAPI,
			MarkerTotalCountAPI,
			// global APIs
			ValidateJnumAPI,
			VocTermSearchAPI
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {}

		// mapping of marker data 
		vm.markerData = {};

		// count, and list of results data (fills summary)
		vm.total_count = 0;
		vm.resultCount = 0;
		vm.results = [];
		
		// Used to track which summary marker is highlighted / active
		vm.selectedIndex = 0;
		
		// default booleans for page functionality 
		vm.hideData = true;            // JSON data
		vm.hideMarkerData = true;      // JSON data (just marker data package)
		vm.hideLoadingHeader = true;   // display loading header
		vm.hideErrorContents = true;   // display error message
		vm.editableField = true;       // used to disable field edits
		
		// error message
		vm.errorMsg = '';
		
		// used to enable a single field in the history table
		vm.historyEventTracking = [];

		
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			resetData();
			refreshTotalCount();
			loadFeatureTypeVocab();
		}


		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI via buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////		

        	// mapped to 'Clear' button; called from init();  resets page
		function eiClear() {		
			vm.oldRequest = null;
			resetData();
			refreshTotalCount();
			setFocus();
		}		

		// mapped to query 'Search' button
		function eiSearch(deselect) {				
		
			pageScope.loadingStart();
			vm.hideLoadingHeader = false;
			vm.hideHistoryQuery = true;
			vm.queryMode = false;
			
			// save off old request
			vm.oldRequest = vm.markerData;
			
			// call API to search; pass query params (vm.selected)
			MarkerSearchAPI.search(vm.markerData, function(data) {
				
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
				vm.markerData = vm.oldRequest;
			}
		}		

        	// called when user clicks a row in the summary
		function setMarker(index) {
			if (index == vm.selectedIndex) {
				deselectObject();
			}
			else {
				vm.markerData = {};
				vm.selectedIndex = index;
				loadMarker();
				setFocus();
			}
		}		

 		// Deselect current item from the searchResults.
 		function deselectObject() {
			console.log("deselectObject()");
			var newObject = angular.copy(vm.markerData);
                        vm.markerData = newObject;
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
			pageScope.loadingStart();

			// default organismKey = mouse
			vm.markerData.organismKey = "1";
			
			// default history reference = J:23000
			if (vm.markerData.history[0].refsKey == "") {
				vm.markerData.history[0].refsKey = "22864";
			}
			
			MarkerCreateAPI.create(vm.markerData, function(data) {
				
				pageScope.loadingEnd();

				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					vm.markerData = data.items[0];
                			vm.selectedIndex = vm.results.length;
					vm.results[vm.selectedIndex] = [];
					vm.results[vm.selectedIndex].markerKey = vm.markerData.markerKey;
					vm.results[vm.selectedIndex].symbol = vm.markerData.symbol;
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
			
			MarkerUpdateAPI.update(vm.markerData, function(data) {
				
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					vm.markerData = data.items[0];
					postMarkerLoad();
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

				MarkerDeleteAPI.delete({ key: vm.markerData.markerKey }, function(data) {
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						alert("Marker Deleted!");
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
		
		// HISTORY SECTION
		
		// called when history row is clicked for editing
		function editHistoryRow(index) {
			// set row as 'updated' (but not if already flagged for delete)
			if (vm.markerData.history[index].processStatus != "d" && vm.markerData.history[index].processStatus != "c") {
				vm.markerData.history[index].processStatus = "u";
			}
			// reset tracking, and set the given field to editable
			resetHistoryEventTracking();
			vm.historyEventTracking[index] = {"showEdit":1};
		}

		 // called to delete a given history row
		function deleteHistoryRow(index) {

			if ($window.confirm("Are you sure you want to delete this history row?")) {
				if (vm.markerData.history[index].processStatus == "c") { 
					// remove row newly added but not yet saved
					vm.markerData.history.splice(index, 1);
				} 
				else { // flag pre-existing row for deletion
					vm.markerData.history[index].processStatus = "d";
				}
			}
		}

		// called if history event field changes
		function historyEventChange(index) {

			// update display text 
			if(vm.markerData.history[index].markerEventKey == 4) {
				vm.markerData.history[index].markerEvent = "allele of"
			}
			if(vm.markerData.history[index].markerEventKey == 1) {
				vm.markerData.history[index].markerEvent = "assigned"
			}
			if(vm.markerData.history[index].markerEventKey == 6) {
				vm.markerData.history[index].markerEvent = "deleted"
			}
			if(vm.markerData.history[index].markerEventKey == 3) {
				vm.markerData.history[index].markerEvent = "merged"
			}
			if(vm.markerData.history[index].markerEventKey == -1) {
				vm.markerData.history[index].markerEvent = "Not Specified"
			}
			if(vm.markerData.history[index].markerEventKey == 2) {
				vm.markerData.history[index].markerEvent = "rename"
			}
			if(vm.markerData.history[index].markerEventKey == 5) {
				vm.markerData.history[index].markerEvent = "split"
			}

		}
		
		function historyEventReasonChange(index) {
			
			// update display text 
			if(vm.markerData.history[index].markerEventReasonKey == -1) {
				vm.markerData.history[index].markerEventReason = "Not Specified"
			}
			if(vm.markerData.history[index].markerEventReasonKey == 1) {
				vm.markerData.history[index].markerEventReason = "to conform w/Human Nomenclature"
			}
			if(vm.markerData.history[index].markerEventReasonKey == 2) {
				vm.markerData.history[index].markerEventReason = "per gene family revision"
			}
			if(vm.markerData.history[index].markerEventReasonKey == 3) {
				vm.markerData.history[index].markerEventReason = "per personal comm w/Authors(s)"
			}
			if(vm.markerData.history[index].markerEventReasonKey == 4) {
				vm.markerData.history[index].markerEventReason = "per personal comm w/Chromosome Committee"
			}
			if(vm.markerData.history[index].markerEventReasonKey == 5) {
				vm.markerData.history[index].markerEventReason = "to conform to current nomenclature guidelines"
			}
			if(vm.markerData.history[index].markerEventReasonKey == 6) {
				vm.markerData.history[index].markerEventReason = "sequence removed by provider"
			}
			if(vm.markerData.history[index].markerEventReasonKey == 7) {
				vm.markerData.history[index].markerEventReason = "problematic sequences"
			}
		}

		// FEATURE TYPE SECTION

		function addFeatureType() {
			console.log("addFeatureType()");
			
			var markerTypeFeatureTypes = {"markerTypeKey":"", "featureTypes":[]}; 

			markerTypeFeatureTypes.markerTypeKey = vm.markerData.markerTypeKey;
			markerTypeFeatureTypes.featureTypes[0] = {"termKey": vm.newFeatureTypeRow.termKey};

			MarkerFeatureTypeValidationAPI.validate(markerTypeFeatureTypes, function(data) {
				
				if (data.error != null) {
					console.log(data.message);
					alert("Invalid Marker Type/Feature Type combination. ");
				} else {

					var featureTypeText = $("#tdcAddList option:selected").text();
					vm.newFeatureTypeRow.term = featureTypeText.trim();

					// add to core marker object
					var thisFeatureTypeRow = vm.newFeatureTypeRow;
					console.log(thisFeatureTypeRow);
					if (vm.markerData.featureTypes == null){
						vm.markerData.featureTypes = [];
					}
					vm.markerData.featureTypes.unshift(thisFeatureTypeRow);
					
					// reset values for insertion of next row
					resetFeatureTypeAdd();
				}
			}, function(err) {
				pageScope.handleError(vm, "Error Validating Marker/FeatureType");
			});		
		
		}

		function deleteFeatureType(index) {
			if ($window.confirm("Are you sure you want to delete this feature type annotation?")) {

				if (vm.markerData.featureTypes[index].processStatus == "c") { 
					// remove row newly added but not yet saved
					vm.markerData.featureTypes.splice(index, 1);
				} 
				else { // flag pre-existing row for deletion
					vm.markerData.featureTypes[index].processStatus = "d";
				}
			}
		}

		function markerTypeOnChange() {
			console.log("markerTypeOnChange()");
			
			if (!vm.queryMode) {
				var markerTypeFeatureTypes = {"markerTypeKey":"", "featureTypes":[]}; 

				markerTypeFeatureTypes.markerTypeKey = vm.markerData.markerTypeKey;
				markerTypeFeatureTypes.featureTypes[0] = {"termKey": vm.markerData.featureTypes[0].termKey};

				MarkerFeatureTypeValidationAPI.validate(markerTypeFeatureTypes, function(data) {
					
					if (data.error != null) {
						console.log(data.message);
						alert("Invalid Marker Type/Feature Type combination. ");
					} 
				}, function(err) {
					pageScope.handleError(vm, "Error Validating Marker/FeatureType");
				});		
				
			}
		}
		
		
		// HISTORY SECTION
		
		function historySymbolOnBlur(index) {
			
			MarkerHistorySymbolValidationAPI.query({ symbol: vm.markerData.history[index].markerHistorySymbol }, function(data) {

				vm.historySymbolValidation = data;
				if (data.length == 0) {
					alert("Invalid Marker Symbol: " + vm.markerData.history[index].markerHistorySymbol);
					vm.allowModify = false;
				} else {
					vm.allowModify = true;
					vm.markerData.history[index].markerHistorySymbolKey = data[0].markerKey;
				}

			}, function(err) {
				pageScope.handleError(vm, "Invalid Marker Symbol");
			});

		}

		function historySymbolOnChange() {
			vm.allowModify = false;
		}
		
		function historyJnumOnBlur(index) {
			
			ValidateJnumAPI.query({ jnum: vm.markerData.history[index].jnumid }, function(data) {

				vm.historySymbolValidation = data;
				if (data.length == 0) {
					alert("Invalid Reference: " + vm.markerData.history[index].jnumid);
					vm.allowModify = false;
				} else {
					vm.allowModify = true;
					vm.markerData.history[index].refsKey = data[0].refsKey;
					vm.markerData.history[index].short_citation = data[0].short_citation;
				}

			}, function(err) {
				pageScope.handleError(vm, "Invalid Reference");
			});
		}

		
		function historyJnumOnChange() {
			vm.allowModify = false;
		}

		function historyQueryJnumOnBlur() {
			
			ValidateJnumAPI.query({ jnum: vm.markerData.history[0].jnumid }, function(data) {

				vm.historySymbolValidation = data;
				if (data.length == 0) {
					alert("Invalid Reference: " + vm.markerData.history[0].jnumid);
				} else {
					vm.markerData.history[0].refsKey = data[0].refsKey;
				}

			}, function(err) {
				pageScope.handleError(vm, "Invalid Reference");
			});
		}

		function historySeqNumOnChange() {
			
			var seqNums = [];
			var i = 0;
			var hasError = false;
			
			// gather all seqNums
			for (i = 0; i < vm.markerData.history.length; i++) {
				seqNums.push( parseInt(vm.markerData.history[i].sequenceNum) );
			}
			
			// ensure we aren't missing any expected values
			for (i = 1; i < seqNums.length + 1; i++) {
				if ( !seqNums.includes(i) ) {
					hasError = true;
				}
			}
			
			if (hasError){
				vm.allowModify = false;				
			}
			else {
				vm.allowModify = true;
			}
		}

		function addHistoryRow() {
			vm.addingHistoryRow = true;	
		}
		function cancelAddHistoryRow() {
			vm.addingHistoryRow = false;		
			resetHistoryAdd();
		}
		function historyAddJnumOnBlur() {
			console.log("historyAddJnumOnBlur()");
			
			ValidateJnumAPI.query({ jnum: vm.newHistoryRow.jnumid }, function(data) {

				if (data.length == 0) {
					alert("Invalid Reference: " + vm.newHistoryRow.jnum);
				} else {
					vm.newHistoryRow.refsKey = data[0].refsKey;
					vm.newHistoryRow.short_citation = data[0].short_citation;
				}

			}, function(err) {
				pageScope.handleError(vm, "Invalid Reference");
			});
		}

		function historyAddSymbolOnBlur() {
			console.log("historyAddSymbolOnBlur()");
			
			MarkerHistorySymbolValidationAPI.query({ symbol: vm.newHistoryRow.markerHistorySymbol }, function(data) {

				if (data.length == 0) {
					alert("Invalid Marker Symbol: " + vm.newHistoryRow.markerHistorySymbol);
				} else {
					vm.newHistoryRow.markerHistorySymbolKey = data[0].markerKey;
				}
			}, function(err) {
				pageScope.handleError(vm, "Invalid Marker Symbol");
			});
		}
		
		function commitHistoryRow() {
			console.log("commitHistoryRow()");

			var eventText = $("#markerAddHistoryEventID option:selected").text();
			var eventReasonText = $("#markerAddHistoryEventReasonID option:selected").text();
			vm.newHistoryRow.markerEvent = eventText;
			vm.newHistoryRow.markerEventReason = eventReasonText;
			
			// add to core marker object
			var thisHistoryRow = vm.newHistoryRow;
			console.log(thisHistoryRow);
			vm.markerData.history.unshift(thisHistoryRow);
			
			// reset values for insertion of next row
			resetHistoryAdd();
		}		
		
		/////////////////////////////////////////////////////////////////////
		// Tab section
		/////////////////////////////////////////////////////////////////////		
		
		function setActiveTab(tabIndex) {
			vm.activeTab=tabIndex;			
			
			// if reference tab, we need to load reference objects separately
			if (tabIndex==2 && vm.markerData.markerKey != null) {
				loadRefsForMarker();
			}
		}

		function addSynonymRow() {
			vm.addingSynonymRow = true;			
		}
		
		function cancelAddSynonymRow() {
			vm.addingSynonymRow = false;		
			vm.synonymTmp = {"synonymTypeKey":"1004", "processStatus":"c"}; 
		}

		function deleteSynonymRow(index) {
			if ($window.confirm("Are you sure you want to delete this synonym?")) {

				if (vm.markerData.synonyms[index].processStatus == "c") { 
					// remove row newly added but not yet saved
					vm.markerData.synonyms.splice(index, 1);
				} 
				else { // flag pre-existing row for deletion
					vm.markerData.synonyms[index].processStatus = "d";
				}
			}
		}

		function disallowSynonymCommit() {
			vm.allowSynonymCommit = false;			
		}

		function synonymJnumOnBlur() {
			
			ValidateJnumAPI.query({ jnum: vm.synonymTmp.jnumid }, function(data) {

				if (data.length == 0) {
					alert("Invalid Reference: " + vm.synonymTmp.jnumid);
				} else {
					vm.synonymTmp.refsKey = data[0].refsKey;
					vm.synonymTmp.short_citation = data[0].short_citation;
					vm.allowSynonymCommit = true;			
				}

			}, function(err) {
				pageScope.handleError(vm, "Invalid Reference");
			});
		}

		function commitSynonymRow() {

			if (vm.allowSynonymCommit == false) {
				alert("Invalid Reference")
			}
			else {
				var typeText = $("#addMarkerSynonymTypeID option:selected").text();
				vm.synonymTmp.synonymType = typeText;

				// add to core marker object
				var thisSynonym = vm.synonymTmp;
				if (vm.markerData.synonyms == null){
					vm.markerData.synonyms = [];
				}
				vm.markerData.synonyms.unshift(thisSynonym);
	
				// reset values for insertion of next row
				vm.addingSynonymRow = false;			
				vm.synonymTmp = {}; 
				vm.synonymTmp = {"synonymTypeKey":"1004", "processStatus":"c"}; 
			}
		}

		// Reference Tab
		
		function deleteRefRow(index) {
			if ($window.confirm("Are you sure you want to remove this reference association?")) {

				if (vm.markerData.refAssocs[index].processStatus == "c") { 
					// remove row newly added but not yet saved
					vm.markerData.refAssocs.splice(index, 1);
				} 
				else { // flag pre-existing row for deletion
					vm.markerData.refAssocs[index].processStatus = "d";
				}
			}
		}
		function addRefRow() {
			vm.addingRefRow = true;		
		}
		
		function cancelAddRefRow() {
			vm.addingRefRow = false;		
			vm.newRefRow = {"refAssocTypeKey":"1018", "processStatus":"c"}; 
		}

		function refJnumOnBlur() {
			
			ValidateJnumAPI.query({ jnum: vm.newRefRow.jnumid }, function(data) {

				if (data.length == 0) {
					alert("Invalid Reference: " + vm.newRefRow.jnumid);
				} else {
					vm.newRefRow.refsKey = data[0].refsKey;
					vm.newRefRow.short_citation = data[0].short_citation;
					vm.allowRefCommit = true;			
				}
			}, function(err) {
				pageScope.handleError(vm, "Invalid Reference");
			});
		}

		function disallowRefCommit() {
			vm.allowRefCommit = false;			
		}

		function commitRefRow() {

			if (vm.allowRefCommit == false) {
				alert("Invalid Reference")
			}
			else {
				var typeText = $("#addMarkerRefTypeID option:selected").text();
				vm.newRefRow.refAssocType = typeText;
				
				// add to core marker object
				var thisRefRow = vm.newRefRow;
				if (vm.markerData.refAssocs == null){
					vm.markerData.refAssocs = [];
				}				
				vm.markerData.refAssocs.unshift(thisRefRow);
				
				// scroll to top of tab
				var elmnt = document.getElementById("tabTableWrapper");
				elmnt.scrollTop = 0; 
				
				// reset values for insertion of next row
				vm.addingRefRow = false;			
				vm.newRefRow = {"refAssocTypeKey":"1018", "processStatus":"c"}; 
			}
		}

		// ACC TAB
		
		function deleteAccRow(index) {
			if ($window.confirm("Are you sure you want to delete this accession relationship?")) {

				if (vm.markerData.editAccessionIds[index].processStatus == "c") { 
					// remove row newly added but not yet saved
					vm.markerData.editAccessionIds.splice(index, 1);
				} 
				else { // flag pre-existing row for deletion
					vm.markerData.editAccessionIds[index].processStatus = "d";
				}
			}
		}

		function disallowAccCommit() {
			vm.allowAccCommit = false;			
		}
		
		function addAccRow() {
			vm.addingAccRow = true;	
		}
		function cancelAddAccRow() {
			vm.addingAccRow = false;		
			resetAccIdTab();
		}
		function commitAccRow() {
			console.log("commitAccRow()");

			// ensure new AccID is unique 
			var newAccIsUnique = true;
			var accidCount;
			for (accidCount in vm.markerData.editAccessionIds) {
				console.log(vm.markerData.editAccessionIds[accidCount].accID);
				if (vm.newAccRow.accID == vm.markerData.editAccessionIds[accidCount].accID) {
					newAccIsUnique = false;
				}
			} 
			
			// if all validations have been met, add row to marker accid list
			if (vm.allowAccCommit == false) {
				alert("Invalid Reference")
			}
			else if (newAccIsUnique != true) {
				alert("AccID is not unique: " + vm.newAccRow.accID);			
			}
			else {
				var typeText = $("#addMarkerAccTypeID option:selected").text();
				vm.newAccRow.logicaldb = typeText;
	
				// add to core marker object
				var thisAccRow = vm.newAccRow;
				if (vm.markerData.editAccessionIds == null){
					vm.markerData.editAccessionIds = [];
				}
				console.log(thisAccRow);
				vm.markerData.editAccessionIds.unshift(thisAccRow);
				
				// reset values for insertion of next row
				vm.addingAccRow = false;			
				resetAccIdTab();
			}
		}

		function accJnumOnBlur() {
			console.log("accJnumOnBlur()");
			ValidateJnumAPI.query({ jnum: vm.newAccRow.references[0].jnumid }, function(data) {

				if (data.length == 0) {
					alert("Invalid Reference: " + vm.newAccRow.references[0].jnumid);
					vm.allowAccCommit = false;
				} else {
					vm.newAccRow.references[0].refsKey = data[0].refsKey;
					vm.newAccRow.references[0].short_citation = data[0].short_citation;
					vm.allowAccCommit = true;			
				}
			}, function(err) {
				pageScope.handleError(vm, "Error validating Acc Tab J:#.");
				vm.allowAccCommit = false;			

			});
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
				pageScope.handleError(vm, "Error Validating Util Tab J:#.");
				vm.allowUtilSubmit = false;			
			});

		}

		function utilSymbolAccidOnBlur() {
			console.log("utilSymbolAccidOnBlur()");

			// ensure user has changed values since last validation
			if (vm.utilMergeValidationData.mgiAccId2 != vm.utilDisplay.accid || vm.utilMergeValidationData.symbol2 != vm.utilData.newSymbol){
			
				// fill submission package
				vm.utilMergeValidationData.markerKey1 = vm.markerData.markerKey;
				vm.utilMergeValidationData.symbol1 = vm.markerData.symbol;
				vm.utilMergeValidationData.chromosome1 = vm.markerData.chromosome;
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
		
		/////////////////////////////////////////////////////////////////////
		// Utility methods
		/////////////////////////////////////////////////////////////////////
		
		function resetData() {
			// reset submission/summary values
			vm.results = [];
			vm.selectedIndex = 0;
			vm.errorMsg = '';
			vm.total_count = 0;
			vm.resultCount = 0;
			vm.activeTab = 1;

			resetBoolean();
			resetMarker();
			resetFeatureTypeAdd();
			resetHistoryAdd();
			resetUtils();
			resetAccIdTab();
			resetHistoryEventTracking();
		}

		function resetDataDeselect() {
			resetBoolean();
			resetMarker();
			resetFeatureTypeAdd();
			resetHistoryAdd();
			resetUtils();
			resetAccIdTab();
			resetHistoryEventTracking();
		}

		// reset booleans
	        function resetBoolean() {
			// reset booleans for editable fields and display
			vm.hideErrorContents = true;
			vm.hideLoadingHeader = true;
			vm.hideEditorNote = true;
			vm.hideSequenceNote = true;
			vm.hideMarkerRevisionNote = true;
			vm.hideStrainSpecificNote = true;
			vm.hideLocationNote = true;
			vm.hideHistoryQuery = false;
			vm.queryMode = true;
			vm.editableField = true;
			vm.allowModify = true;
			vm.addingSynonymRow = false;
			vm.allowSynonymCommit = true;
			vm.addingRefRow = false;
			vm.allowRefCommit = true;
			vm.loadingRefs = false;
			vm.addingAccRow = false;
			vm.allowAccCommit = true;
			vm.addingHistoryRow = false;
		}
	
		// reset main marker fields
		function resetMarker() {

			vm.markerData = {};
			vm.markerData.mgiAccessionIds = [];
			vm.markerData.mgiAccessionIds[0] = {"accID":""};
			vm.markerData.editAccessionIds = [];
			vm.markerData.editAccessionIds[0] = {"accID":""};
			vm.markerData.editAccessionIds[0].references = [];
			vm.markerData.editAccessionIds[0].references[0] = {"jnumid":""};
			vm.markerData.synonyms = [];
			vm.markerData.synonyms[0] = {"synonym":""};
			vm.markerData.refAssocs = [];
			vm.markerData.refAssocs[0] = {"jnumid":""};
			vm.markerData.featureTypes = [];
			vm.markerData.featureTypes[0] = {"termKey":"", "annotTypeKey":"1011", "processStatus":"c"};
			vm.markerData.history = [];
			vm.markerData.history[0] = {
					"processStatus": "c",
					"markerHistorySymbol":"",
					"markerHistoryName":"",
					"modifiedBy":"",
					"modification_date":"",
					"jnumid":"",
					"refsKey":"",
					"markerEvent":"",
					"markerEventReason":"",
					"short_citation":""
			};

			// tmp storage for new rows; pre-set type and creation status
			vm.synonymTmp = {"synonymTypeKey":"1004", "processStatus":"c"}; 
			vm.newRefRow = {"refAssocTypeKey":"1018", "processStatus":"c"}; 

			// used in pre-loading feature types
			vm.featureTypeRequest = {"vocabKey":"79"}; 
		}

		// resets the feature type row submission
		function resetFeatureTypeAdd () {
			vm.newFeatureTypeRow = {"processStatus":"c", "termKey":"6238160", "annotTypeKey": "1011",}; 
		}

		// resets the feature type row submission
		function resetFeatureTypeAdd () {
			vm.newFeatureTypeRow = {"processStatus":"c", "termKey":"6238160", "annotTypeKey": "1011",}; 
		}

		// resets the history row submission
		function resetHistoryAdd () {
			vm.allowHistoryAdd = false;
			vm.newHistoryRow = {"markerEventKey":"-1", "markerEventReasonKey":"-1", "processStatus":"c", "markerHistorySymbolKey":"", "refsKey":""}; 
		}

		// resets the history 
		function resetUtils () {
			vm.allowUtilSubmit = false;
			vm.utilShowLoading = false;
			vm.utilData = {"eventKey":"2", "eventReasonKey":"-1", 
					"refKey": "","addAsSynonym": "1", 
					"oldKey": "", "newName": "", "newSymbol": ""}; 
			vm.utilDisplay = {"jnumid":"", "accid":""};
			vm.utilMergeValidationData = {"markerKey1":"", "symbol2": "", "mgiAccId2": ""}; 
		}
		
		// resets acc tab 
		function resetAccIdTab () {
			var tmpAccRef = [];
			tmpAccRef[0] = {"jnumid": "", "short_citation":""}
			vm.newAccRow = {"logicaldbKey":"8", "processStatus":"c", "references": tmpAccRef}; 
		}

		// resets the history 
		function resetHistoryEventTracking () {
			// initialize & seed empty index 
			// for some reason, databinding fails if we don't
			vm.historyEventTracking = [];
			vm.historyEventTracking[0] = {"showEdit":0};
		}
		
		// setting of mouse focus
		function setFocus () {
			document.getElementById("markerSymbol").focus();
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
				vm.markerData = data;
				postMarkerLoad();
			}, function(err) {
				pageScope.handleError(vm, "Error retrieving marker.");
			});
		}

		// a marker can be loaded from a search or create or modify - this shared 
		// processing is called after endpoint data is loaded
		function postMarkerLoad() {
			vm.editableField = false;
			vm.queryMode = false;
			vm.hideHistoryQuery = true;
			resetHistoryEventTracking();

			// ...and load the references if this ref tab is open
			if (vm.activeTab==2 && vm.markerData.markerKey != null) {
				loadRefsForMarker();
			}

		}

		// when an object is deleted, remove it from the summary
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove object
			removeSearchResultsItem(vm.markerData.markerKey);

			// clear if now empty; otherwise, load next image
			if (vm.results.length == 0) {
				eiClear();
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
			MarkerAssocRefsAPI.query({ key: vm.markerData.markerKey }, function(data) {
				if (data.length == 0) {
					console.log("No References found for key: " + vm.markerData.markerKey);
				} else {
					vm.markerData.refAssocs = data;
				}
				vm.loadingRefs = false;

			}, function(err) {				
				pageScope.handleError(vm, "Error retrieving references for this marker");
				vm.loadingRefs = false;
			});

		}		

		function loadFeatureTypeVocab() {
			console.log("loadFeatureTypeVocab()");

			// call API
			VocTermSearchAPI.search(vm.featureTypeRequest, function(data) {
				if (data.error != null) {
					console.log(data.message);
					alert("Error initializing page.  Unable to load feature type list.");
				} else {
					console.log("success loadFeatureTypeVocab");
					console.log(data);
					var termsList = data.items;
					vm.featureTypeTerms = termsList[0].terms;
				}

			}, function(err) { // server exception
				pageScope.handleError(vm, "Error gathering feature types vocab.");
			});
			
		}		
		
		// linkout to marker detail		
		function mrkLink() {
                FindElement.byId("accIdQuery").then(function(element){
                        var mrkUrl = pageScope.PWI_BASE_URL + "detail/marker/" + element.value;
                        window.open(mrkUrl, '_blank');
                });
                }

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.eiSearch = eiSearch;
		$scope.eiClear = eiClear;
		$scope.resetSearch = resetSearch;
		$scope.setMarker = setMarker;
		$scope.createMarker = createMarker;
		$scope.updateMarker = updateMarker;
		$scope.deleteMarker = deleteMarker;
		$scope.prevSummaryMarker = prevSummaryMarker;
		$scope.nextSummaryMarker = nextSummaryMarker;
		$scope.firstSummaryMarker = firstSummaryMarker;
		$scope.lastSummaryMarker = lastSummaryMarker;

		// Marker / Feature Type Handling
		$scope.addFeatureType = addFeatureType;
		$scope.deleteFeatureType = deleteFeatureType;
		$scope.markerTypeOnChange = markerTypeOnChange;
		$scope.mrkLink = mrkLink;

		// Note Buttons
		$scope.hideShowEditorNote = hideShowEditorNote;
		$scope.hideShowSequenceNote = hideShowSequenceNote;
		$scope.hideShowMarkerRevisionNote = hideShowMarkerRevisionNote;
		$scope.hideShowStrainSpecificNote = hideShowStrainSpecificNote;
		$scope.hideShowLocationNote = hideShowLocationNote;
		
		// History tracking
		$scope.editHistoryRow = editHistoryRow;
		$scope.deleteHistoryRow = deleteHistoryRow;
		$scope.historySymbolOnBlur = historySymbolOnBlur;
		$scope.historySymbolOnChange = historySymbolOnChange;
		$scope.historyJnumOnBlur = historyJnumOnBlur;
		$scope.historyQueryJnumOnBlur = historyQueryJnumOnBlur;
		$scope.historyJnumOnChange = historyJnumOnChange;
		$scope.historyEventChange = historyEventChange;
		$scope.historyEventReasonChange = historyEventReasonChange;
		$scope.historySeqNumOnChange = historySeqNumOnChange;
		$scope.addHistoryRow = addHistoryRow;
		$scope.cancelAddHistoryRow = cancelAddHistoryRow;
		$scope.historyAddJnumOnBlur = historyAddJnumOnBlur;
		$scope.historyAddSymbolOnBlur = historyAddSymbolOnBlur;
		$scope.commitHistoryRow = commitHistoryRow;
		
		// Tabs
		$scope.setActiveTab = setActiveTab;
		$scope.addSynonymRow = addSynonymRow;
		$scope.cancelAddSynonymRow = cancelAddSynonymRow;
		$scope.commitSynonymRow = commitSynonymRow;
		$scope.synonymJnumOnBlur = synonymJnumOnBlur;
		$scope.deleteSynonymRow = deleteSynonymRow;
		$scope.disallowSynonymCommit = disallowSynonymCommit;
		
		$scope.deleteRefRow = deleteRefRow;
		$scope.addRefRow = addRefRow;
		$scope.cancelAddRefRow = cancelAddRefRow;
		$scope.refJnumOnBlur = refJnumOnBlur;
		$scope.commitRefRow = commitRefRow;
		$scope.disallowRefCommit = disallowRefCommit;

		$scope.deleteAccRow = deleteAccRow;
		$scope.addAccRow = addAccRow;
		$scope.cancelAddAccRow = cancelAddAccRow;
		$scope.commitAccRow = commitAccRow;
		$scope.accJnumOnBlur = accJnumOnBlur;

		$scope.utilRenameProcess = utilRenameProcess;
		$scope.utilDeleteProcess = utilDeleteProcess;
		$scope.utilMergeProcess = utilMergeProcess;
		$scope.utilJnumOnBlur = utilJnumOnBlur;
		$scope.utilSymbolAccidOnBlur = utilSymbolAccidOnBlur;
		
		// global shortcuts
                $scope.KclearAll = function() { $scope.eiClear(); $scope.$apply(); }
                $scope.Ksearch = function() { $scope.eiSearch(); $scope.$apply(); }
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

