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
			MarkerSearchAPI,
			MarkerKeySearchAPI,
			MarkerCreateAPI,
			MarkerUpdateAPI,
			MarkerDeleteAPI,
			MarkerHistorySymbolValidationAPI,
			MarkerHistoryJnumValidationAPI,
			MarkerAssocRefsAPI
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {}

		// mapping of marker data 
		vm.markerData = {};

		// count, and list of results data (fills summary)
		vm.resultCount = 0;
		vm.results = [];
		
		// Used to track which summary marker is highlighted / active
		vm.selectedIndex = 0;
		
		// default booleans for page functionality 
		vm.hideData = true;            // JSON data
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
		}


		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI via buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////		

        // mapped to 'Clear' button; called from init();  resets page
		function eiClear() {		
			vm.oldRequest = {};
			resetData();
			setFocus();
		}		

		// mapped to query 'Search' button
		function eiSearch() {				
		
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
				loadMarker();

			}, function(err) { // server exception
				handleError("Error searching for markers.");
			});
		}		

		// mapped to 'Reset Search' button
		function resetSearch() {		
			resetData();
			vm.markerData = vm.oldRequest;
		}		

        // called when user clicks a row in the marker summary
		function setMarker(index) {
			vm.markerData = {};
			vm.selectedIndex = index;
			loadMarker();
		}		

        // mapped to 'Create' button
		function createMarker() {

			// assume we're creating a mouse marker
			vm.markerData.organismKey = "1";
			
			// call API to create marker
			console.log("Submitting to marker creation endpoint");
			//console.log(vm.markerData);
			MarkerCreateAPI.create(vm.markerData, function(data) {
				
				// check for API returned error
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					// update marker data
					vm.markerData = data.items[0];
					postMarkerLoad();

					// update summary section
					var result={
						markerKey:vm.markerData.markerKey, 
						symbol:vm.markerData.symbol};
					vm.results[0] = result;
					alert("Marker Created!");
				}
				
			}, function(err) {
				handleError("Error creating marker.");
			});

		}		

        // mapped to 'Update' button
		function updateMarker() {
			
			// call API to update marker
			console.log("Submitting to marker update endpoint");
			//console.log(vm.markerData);
			MarkerUpdateAPI.update(vm.markerData, function(data) {
				
				// check for API returned error
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					// update marker data
					vm.markerData = data.items[0];
					postMarkerLoad();
				}
				
			}, function(err) {
				handleError("Error updating marker.");
			});

		}		
		
        // mapped to 'Delete' button
		function deleteMarker() {

			if ($window.confirm("Are you sure you want to delete this marker?")) {
			
				// call API to delete marker
				MarkerDeleteAPI.delete({ key: vm.markerData.markerKey }, function(data) {


					// check for API returned error
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						// success
						alert("Marker Deleted!");
						vm.markerData = {};
						vm.results = [];
					}
				
				}, function(err) {
					handleError("Error deleting marker.");
				});
			}
		}		

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
		
		 // called when history row is clicked for editing
		function editHistoryRow(index) {
			// set row as 'updated' (but not if already flagged for delete)
			if (vm.markerData.history[index].processStatus != "d") {
				vm.markerData.history[index].processStatus = "u";
			}
			// reset tracking, and set the given field to editable
			resetHistoryEventTracking();
			vm.historyEventTracking[index] = {"showEdit":1};
		}

		 // called to delete a given history row
		function deleteHistoryRow(index) {
			if ($window.confirm("Are you sure you want to delete this history row?")) {
				vm.markerData.history[index].processStatus = "d";
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

		function historySymbolOnBlur(index) {
			
			MarkerHistorySymbolValidationAPI.query({ symbol: vm.markerData.history[index].markerHistorySymbol }, function(data) {

				vm.historySymbolValidation = data;
				if (data.length == 0) {
					alert("Marker Symbol could not be validated: " + vm.markerData.history[index].markerHistorySymbol);
					vm.allowModify = false;
				} else {
					vm.allowModify = true;
					vm.markerData.history[index].markerHistorySymbolKey = data[0].markerKey;
				}

			}, function(err) {
				handleError("Error validating history marker.");
			});

		}

		function historySymbolOnChange() {
			vm.allowModify = false;
		}
		
		function historyJnumOnBlur(index) {
			
			MarkerHistoryJnumValidationAPI.query({ jnum: vm.markerData.history[index].jnumid }, function(data) {

				vm.historySymbolValidation = data;
				if (data.length == 0) {
					alert("Marker jnum could not be validated: " + vm.markerData.history[index].jnumid);
					vm.allowModify = false;
				} else {
					vm.allowModify = true;
					vm.markerData.history[index].refsKey = data[0].refsKey;
					vm.markerData.history[index].short_citation = data[0].short_citation;
				}

			}, function(err) {
				handleError("Error validating history marker.");
			});
		}
		
		function historyJnumOnChange() {
			vm.allowModify = false;
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
			
			MarkerHistoryJnumValidationAPI.query({ jnum: vm.synonymTmp.jnumid }, function(data) {

				if (data.length == 0) {
					alert("Synonym jnum could not be validated: " + vm.synonymTmp.jnumid);
				} else {
					vm.synonymTmp.refsKey = data[0].refsKey;
					vm.synonymTmp.short_citation = data[0].short_citation;
					vm.allowSynonymCommit = true;			
				}

			}, function(err) {
				handleError("Error validating synonym J:#.");
			});
		}

		function commitSynonymRow() {

			if (vm.allowSynonymCommit == false) {
				alert("J:# is not validated")
			}
			else {
				var typeText = $("#addMarkerSynonymTypeID option:selected").text();
				vm.synonymTmp.synonymType = typeText;
	
				// add to core marker object
				var thisSynonym = vm.synonymTmp;
				vm.markerData.synonyms.unshift(thisSynonym);
	
				// scroll to top of tab
				var elmnt = document.getElementById("refTableWrapper");
				elmnt.scrollTop = 0; 

				// reset values for insertion of next row
				vm.addingSynonymRow = false;			
				vm.synonymTmp = {"synonymTypeKey":"1004", "processStatus":"c"}; 
			}
		}

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
			
			MarkerHistoryJnumValidationAPI.query({ jnum: vm.newRefRow.jnumid }, function(data) {

				if (data.length == 0) {
					alert("Ref jnum could not be validated: " + vm.newRefRow.jnumid);
				} else {
					vm.newRefRow.refsKey = data[0].refsKey;
					vm.newRefRow.short_citation = data[0].short_citation;
					vm.allowRefCommit = true;			
				}
			}, function(err) {
				handleError("Error validating ref J:#.");
			});
		}

		function disallowRefCommit() {
			vm.allowRefCommit = false;			
		}

		function commitRefRow() {

			if (vm.allowRefCommit == false) {
				alert("J:# is not validated")
			}
			else {
				var typeText = $("#addMarkerRefTypeID option:selected").text();
				vm.newRefRow.refAssocType = typeText;
	
				// add to core marker object
				var thisRefRow = vm.newRefRow;
				vm.markerData.refAssocs.unshift(thisRefRow);

				// scroll to top of tab
				var elmnt = document.getElementById("refTableWrapper");
				elmnt.scrollTop = 0; 
				
				// reset values for insertion of next row
				vm.addingRefRow = false;			
				vm.newRefRow = {"refAssocTypeKey":"1018", "processStatus":"c"}; 
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
			vm.resultCount = 0;
			vm.activeTab = 1;

			// rebuild empty markerData submission object, else bindings fail
			vm.markerData = {};
			vm.markerData.mgiAccessionIds = [];
			vm.markerData.mgiAccessionIds[0] = {"accID":""};
			vm.markerData.editAccessionIds = [];
			vm.markerData.editAccessionIds[0] = {"accID":""};
			vm.markerData.synonyms = [];
			vm.markerData.synonyms[0] = {"synonym":""};
			vm.markerData.refAssocs = [];
			vm.markerData.refAssocs[0] = {"jnumid":""};
			vm.markerData.history = [];
			vm.markerData.history[0] = {
					"markerHistorySymbol":"",
					"markerHistoryName":"",
					"modifiedBy":"",
					"modification_date":"",
					"jnumid":"",
					"markerEvent":"",
					"markerEventReason":"",
					"short_citation":""
			};
			
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

			// tmp storage for new rows; pre-set type and creation status
			vm.synonymTmp = {"synonymTypeKey":"1004", "processStatus":"c"}; 
			vm.newRefRow = {"refAssocTypeKey":"1018", "processStatus":"c"}; 

			
			resetHistoryEventTracking();
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
			var input = document.getElementById ("markerSymbol");
			input.focus ();
		}
		
		// load a marker from summary 
		function loadMarker() {

			// derive the key of the selected result summary marker
			vm.summaryMarkerKey = vm.results[vm.selectedIndex].markerKey;
			
			// call API to gather marker for given key
			MarkerKeySearchAPI.get({ key: vm.summaryMarkerKey }, function(data) {
				vm.markerData = data;
				postMarkerLoad();
			}, function(err) {
				handleError("Error retrieving marker.");
			});

		}		
		
		// error handling
		function handleError(msg) {
			vm.errorMsg = msg;
			vm.hideErrorContents = false;
			vm.hideLoadingHeader = true;
		}

		// a marker can be loaded from a search or create or modify - this shared 
		// processing is called after endpoint data is loaded
		function postMarkerLoad() {
			vm.editableField = false;
			vm.hideHistoryQuery = true;
			vm.queryMode = false;
			resetHistoryEventTracking();

			// ...and load the references if this ref tab is open
			if (vm.activeTab==2 && vm.markerData.markerKey != null) {
				loadRefsForMarker();
			}

		}

		// load a references for a given marker 
		function loadRefsForMarker() {

			vm.loadingRefs = true;
			
			// call API 
			MarkerAssocRefsAPI.query({ key: vm.markerData.markerKey }, function(data) {
				if (data.length == 0) {
					alert("No References found for key: " + vm.markerData.markerKey);
				} else {
					vm.markerData.refAssocs = data;
					vm.loadingRefs = false;
				}
			}, function(err) {				
				handleError("Error retrieving references for this marker");
				vm.loadingRefs = false;
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
		$scope.historyJnumOnChange = historyJnumOnChange;
		$scope.historyEventChange = historyEventChange;
		$scope.historyEventReasonChange = historyEventReasonChange;
		$scope.historySeqNumOnChange = historySeqNumOnChange;
		
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

		
		// call to initialize the page, and start the ball rolling...
		init();
	}

})();

