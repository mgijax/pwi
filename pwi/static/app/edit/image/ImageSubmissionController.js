(function() {
	'use strict';
	angular.module('pwi.image').controller('ImageSubmissionController', ImageSubmissionController);

	function ImageSubmissionController(
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
			ImageSubmissionSearchAPI,
			ImageSubmissionGatherByKeyAPI,
			ImageSubmissionCreateAPI,
			ImageSubmissionUpdateAPI,
			ImageSubmissionDeleteAPI,
			VocabSearchAPI,
			JnumValidationAPI
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {};

		// mapping of object data 
		vm.objectData = {};

		// results list and data
		vm.resultCount = 0;
		vm.results = [];
		vm.selectedIndex = 0;
		
		// default booleans for page functionality 
		vm.hideVmData = true;            // JSON data
		vm.hideObjectData = true;		// Display JSON package of object
		vm.hideLoadingHeader = true;   // display loading header
		vm.hideErrorContents = true;   // display error message
		
		// error message
		vm.errorMsg = '';
		
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			resetData();
		}


		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        	// mapped to 'Clear' button; called from init();  resets page
		function eiClear() {		
			vm.oldRequest = null;
			resetData();
			setFocus();
		}		

		// mapped to query 'Search' button
		// default is to select first result
		function eiSearch() {				
		
			pageScope.loadingStart();
			vm.hideLoadingHeader = false;
			
			// save off old request
			vm.oldRequest = vm.objectData;
	
			// call API to search; pass query params (vm.selected)
			ImageSubmissionSearchAPI.search(vm.objectData, function(data) {
				
				vm.results = data;
				vm.hideLoadingHeader = true;
				vm.selectedIndex = 0;

				if (vm.results.length > 0) {
					vm.queryMode = false;
				}
				else {
					vm.queryMode = true;
				}
				pageScope.loadingFinished();

			}, function(err) { // server exception
				handleError("Error while searching");
				pageScope.loadingFinished();
				setFocus();
			});
		}		

		// mapped to 'Reset Search' button
		function resetSearch() {		
			resetData();
			if (vm.oldRequest != null) {
				vm.objectData = vm.oldRequest;
			}
		}		

        	// called when user clicks a row in the summary
		function setObject(index) {
			vm.objectData = {};
			vm.selectedIndex = index;
		}		


		// clear the results selection
		function clearResultsSelection() {
			vm.selectedIndex = -1;
		}

        	// mapped to 'Create' button
		function createObject() {
			// not implemented
		}		

        	// mapped to 'Update' button
		function modifyObject() {

			console.log("Submitting to update endpoint");
			var allowCommit = true;

			if (allowCommit){

				pageScope.loadingStart();

				// call update API
				ImageSubmissionUpdateAPI.update(vm.objectData, function(data) {
					// check for API returned error
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						// update data
						vm.objectData = data.items[0];
						postObjectLoad();
						var summaryDisplay = createSummaryDisplay();
						vm.results[vm.selectedIndex].figureLabel = summaryDisplay;
					}
					pageScope.loadingFinished();
				}, function(err) {
					handleError("Error updating image.");
					pageScope.loadingFinished();
				});
			}

		}		
		
        	// mapped to 'Delete' button
		function deleteObject() {
			// not implemented/not used
		}		
		
        	// verifing jnum & citation
		function jnumOnBlur() {		
			console.log("Into jnumOnBlur()");

			// ensure we want to send the validation request
			var validate = true;

			if (vm.objectData.jnumid == "")
			{
				validate = false;
			}
			if (vm.objectData.jnumid.includes("%"))
			{
				validate = false;
			}

			// create local JSON package for validation submission
			var jsonPackage = {"jnumid":""}; 
			jsonPackage.jnumid = vm.objectData.jnumid;

			// validate against DB
			if (validate) {
				JnumValidationAPI.validate(jsonPackage, function(data) {
					if (data.length == 0) {
						alert("Invalid Reference: " + vm.objectData.jnumid);
					} else {
						console.log("jnum validated");
						vm.objectData.refsKey = data[0].refsKey;
						vm.objectData.jnumid = data[0].jnumid;
						if (data[0].short_citation != null) {
							vm.objectData.short_citation = data[0].short_citation;
						}
						eiSearch();
					}
					vm.hideErrorContents = true;

				}, function(err) {
					handleError("Invalid Reference");
				});
			}
		}		
		
		/////////////////////////////////////////////////////////////////////
		// SUMMARY NAVIGATION
		/////////////////////////////////////////////////////////////////////

		// move to previous object in summary
		function prevSummaryObject() {
			console.log("Previous summary object");

			// ensure we have data
			if(vm.results.length == 0) return;

			// ensure we're not at the first reference
			if(vm.selectedIndex == 0) return;

			// we're safe -- increment & load reference
			vm.selectedIndex--;
			scrollToObject();
		}
		
		// move to next object in summary
		function nextSummaryObject() {
			console.log("Next summary object");

			// ensure we have data
			if(vm.results.length == 0) return;

			// ensure we're not past the end of the data
			if(vm.selectedIndex + 1 >= vm.results.length) return;

			// we're safe -- increment & load reference
			vm.selectedIndex++;
			scrollToObject();
		}		

	    function firstSummaryObject() {
			console.log("First summary object");
	        if(vm.results.length == 0) return;
	        vm.selectedIndex = 0;
			scrollToObject();
	      }

	    function lastSummaryObject() {
			console.log("Last summary object");
	        if(vm.results.length == 0) return;
	        vm.selectedIndex = vm.results.length - 1;
			scrollToObject();
	      }

	    // ensure we keep the selected row in view
		function scrollToObject() {

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
		
		
		/////////////////////////////////////////////////////////////////////
		// Utility methods
		/////////////////////////////////////////////////////////////////////
		
		// reset non-editable accession ids
		function resetNonEditableAccessionIds() {
			vm.objectData.nonEditAccessionIds = [];
			vm.objectData.nonEditAccessionIds[0] = {"accID":""};
		}

		// reset other stuff
		function resetOther() {
			console.log("into resetOther");

			//
			// reset display booleans
			vm.hideErrorContents = true;
			vm.hideLoadingHeader = true;
			vm.queryMode = true;
		}

		// resets page data
		function resetData() {
			console.log("into resetData");

			// reset submission/summary values
			vm.results = [];
			vm.selectedIndex = 0;
			vm.errorMsg = '';
			vm.resultCount = 0;

			// rebuild empty objectData submission object, else bindings fail
			vm.objectData = {};
			vm.objectData.processStatus = "x";
			vm.objectData.imageStatus = "";
			vm.objectData.imageKey = "";	
			vm.objectData.imageClassKey = "";	
			vm.objectData.imageClass = "";	
			vm.objectData.imageTypeKey = "";	
			vm.objectData.imageType = "";	
			vm.objectData.figureLabel = "";	
			vm.objectData.thumbnailFigureLabel = "";	
			vm.objectData.refsKey = "";	
			vm.objectData.jnumid = "";	
			vm.objectData.short_citation = "";
			vm.objectData.xdim = "";	
			vm.objectData.ydim = "";	
			//vm.objectData.pixID = "";

			resetOther()
		}

		// an object can be loaded from a search or create or modify - this shared 
		// processing is called after endpoint data is loaded
		function postObjectLoad() {
			vm.editableField = false;
			vm.queryMode = false;
		}

		// creates a display string to be used in summary (normally supplied by endpoint) 
		function createSummaryDisplay() {
			var displayStr = vm.objectData.jnumid + "; " + vm.objectData.imageType + "; " + vm.objectData.figureLabel;
			return displayStr;
		}

		// handle removal from summary list
		function removeSearchResultsItem(keyToRemove) {
			
			// first find the item to remove
			var removeIndex = -1;
			for(var i=0;i<vm.results.length; i++) {
				if (vm.results[i].imageKey == keyToRemove) {
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
			var input = document.getElementById ("JNumID");
			input.focus ();
		}

		// error handling
		function handleError(msg) {
			vm.errorMsg = msg;
			vm.hideErrorContents = false;
			vm.hideLoadingHeader = true;
		}

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.eiSearch = eiSearch;
		$scope.eiClear = eiClear;
		$scope.resetSearch = resetSearch;
		$scope.createObject = createObject;
		$scope.modifyObject = modifyObject;
		$scope.deleteObject = deleteObject;

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

		// other functions: buttons, onBlurs and onChanges
		$scope.setObject = setObject;
		$scope.jnumOnBlur = jnumOnBlur;
		
		// global shortcuts
		$scope.KclearAll = function() { $scope.eiClear(); $scope.$apply(); }
		$scope.Ksearch = function() { $scope.eiSearch(); $scope.$apply(); }
		$scope.Kfirst = function() { $scope.firstSummaryObject(); $scope.$apply(); }
		$scope.Knext = function() { $scope.nextSummaryObject(); $scope.$apply(); }
		$scope.Kprev = function() { $scope.prevSummaryObject(); $scope.$apply(); }
		$scope.Klast = function() { $scope.lastSummaryObject(); $scope.$apply(); }
		$scope.Kadd = function() { $scope.createObject(); $scope.$apply(); }
		$scope.Kmodify = function() { $scope.modifyObject(); $scope.$apply(); }
		$scope.Kdelete = function() { $scope.deleteObject(); $scope.$apply(); }

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

