(function() {
	'use strict';
	angular.module('pwi.image').controller('ImageController', ImageController);

	function ImageController(
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
			ImageSearchAPI,
			ImageGatherByKeyAPI,
			ImageCreateAPI,
			ImageUpdateAPI,
			ImageDeleteAPI,
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
		
		vm.isGxd = isGxd;
		vm.isMgd = isMgd;
		
		
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
		function eiSearch() {				
		
			vm.hideLoadingHeader = false;
			vm.queryMode = false;
			
			// save off old request
			vm.oldRequest = vm.objectData;
	
			// call API to search; pass query params (vm.selected)
			ImageSearchAPI.search(vm.objectData, function(data) {
				
				vm.results = data;
				vm.hideLoadingHeader = true;
				vm.selectedIndex = 0;
				loadObject();

			}, function(err) { // server exception
				handleError("Error while searching");
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
			loadObject();
		}		

        // mapped to 'Create' button
		function createObject() {
			console.log("Submitting to object creation endpoint");
			
			var allowCommit = true;
			
			// GXD pre-creation status checks
			if (vm.isGxd){
				// ensure it's the correct type
				if (vm.objectData.imageClassKey != "6481781") {
					alert("GXD can only create expression images.")
					allowCommit = false;
				}
			}
			// MGD pre-creation status checks
			if (vm.isMgd){
				// ensure it's the correct type
				if (vm.objectData.imageClassKey != "6481782" && vm.objectData.imageClassKey != "6481783") {
					alert("MGD can only create phenotype or molecular images.")
					allowCommit = false;
				}
			}

// EXAMPLE
			// call API for creation
//			ImageCreateAPI.create(vm.objectData, function(data) {
//				// check for API returned error
//				if (data.error != null) {
//					alert("ERROR: " + data.error + " - " + data.message);
//				}
//				else {
//					vm.objectData = data.items[0];
//					postObjectLoad();
//					// update summary section
//					var result={
//						markerKey:vm.objectData.markerKey, 
//						symbol:vm.objectData.symbol};
//					vm.results[0] = result;
//				}
//			}, function(err) {
//				handleError("Error creating marker.");
//			});

		}		

        // mapped to 'Update' button
		function modifyObject() {
			console.log("Submitting to update endpoint");
			
// EXAMPLE
			// call update API
//			ImageUpdateAPI.update(vm.objectData, function(data) {
//				// check for API returned error
//				if (data.error != null) {
//					alert("ERROR: " + data.error + " - " + data.message);
//				}
//				else {
//					// update data
//					vm.objectData = data.items[0];
//					postObjectLoad();
//				}
//			}, function(err) {
//				handleError("Error updating marker.");
//			});

		}		
		
        // mapped to 'Delete' button
		function deleteObject() {

			if ($window.confirm("Are you sure you want to delete this object?")) {
			
// EXAMPLE
				// call API to delete marker
//				ImageDeleteAPI.delete({ key: vm.objectData.markerKey }, function(data) {
//					// check for API returned error
//					if (data.error != null) {
//						alert("ERROR: " + data.error + " - " + data.message);
//					}
//					else {
//						// success
//						alert("Marker Deleted!");
//						eiClear();
//					}
//				}, function(err) {
//					handleError("Error deleting marker.");
//				});
			}
		}		

        // verifing jnum & citation
		function jnumOnBlur() {		

			// ensure we want to send the validation request
			var validate = true;
			if (vm.objectData.jnumid == ""){validate = false;}
			if (vm.objectData.jnumid.includes("%")){validate = false;}
			
			// create local JSON package for validation submission
			var jsonPackage = {"jnumid":"", "copyright":""}; 
			jsonPackage.jnumid    = vm.objectData.jnumid;
			jsonPackage.copyright = vm.objectData.copyrightNote.noteChunk;

			// validate against DB
			if (validate) {
				JnumValidationAPI.validate(jsonPackage, function(data) {
					if (data.length == 0) {
						alert("Ref jnum could not be validated: " + vm.newRefRow.jnumid);
					} else {
						console.log("jnum validated");
						vm.objectData.jnumid = data[0].jnumid;
						if (data[0].short_citation != null) {
							vm.objectData.short_citation = data[0].short_citation;
						}
						if (data[0].copyright != null) {
							vm.objectData.copyrightNote.noteChunk = data[0].copyright;
						}
						vm.needsDXDOIid = data[0].needsDXDOIid;
						vm.displayCreativeCommonsWarning = data[0].isCreativeCommons;
					}
					vm.hideErrorContents = true;

				}, function(err) {
					handleError("Error validating ref J:#.");
				});
			}
		
		}		
		
	
		
		/////////////////////////////////////////////////////////////////////
		// SUMMARY NAVIGATION
		/////////////////////////////////////////////////////////////////////

		// move to previous object in summary
		function prevSummaryObject() {
			
			// ensure we have data
			if(vm.results.length == 0) return;

			// ensure we're not at the first reference
			if(vm.selectedIndex == 0) return;

			// we're safe -- increment & load reference
			vm.selectedIndex--;
			loadObject();
			scrollToObject();
		}
		
		// move to next object in summary
		function nextSummaryObject() {

			// ensure we have data
			if(vm.results.length == 0) return;

			// ensure we're not past the end of the data
			if(vm.selectedIndex + 1 >= vm.results.length) return;

			// we're safe -- increment & load reference
			vm.selectedIndex++;
			loadObject();
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
		
		// resets page data
		function resetData() {
			// reset submission/summary values
			vm.results = [];
			vm.selectedIndex = 0;
			vm.errorMsg = '';
			vm.resultCount = 0;

			// rebuild empty objectData submission object, else bindings fail
			vm.objectData = {};
			vm.objectData.jnumid = "";	
			vm.objectData.mgiAccessionIds = [];
			vm.objectData.mgiAccessionIds[0] = {"accID":""};			
			vm.objectData.thumbnailImage = {};
			vm.objectData.thumbnailImage.mgiAccessionIds = [];
			vm.objectData.thumbnailImage.mgiAccessionIds[0] = {"accID":""};			
			vm.objectData.captionNote = {};	
			vm.objectData.captionNote.noteChunk = "";	
			vm.objectData.copyrightNote = {};	
			vm.objectData.copyrightNote.noteChunk = "";	
			vm.objectData.privateCuratorialNote = {};	
			vm.objectData.privateCuratorialNote.noteChunk = "";	
			vm.objectData.externalLinkNote = {};	
			vm.objectData.externalLinkNote.noteChunk = "";	
			vm.objectData.imagePanes = [];
			vm.objectData.imagePanes[0] = {"paneLabel":""};			
			
			
			// reset display booleans
			vm.hideErrorContents = true;
			vm.hideLoadingHeader = true;
			vm.queryMode = true;
			vm.needsDXDOIid = false;
			vm.displayCreativeCommonsWarning = false;
			
			// MGD vs GXD handling
			if (isGxd){ vm.objectData.imageClassKey = "6481781"; }
			if (isMgd){ vm.objectData.imageClassKey = "6481782"; }
			
		}

		// load a selected object from summary 
		function loadObject() {

			console.log("into loadObject");

			// derive the key of the selected result summary object
			vm.summaryObjectKey = vm.results[vm.selectedIndex].imageKey;
			
			// call API to gather object for given key
			ImageGatherByKeyAPI.get({ key: vm.summaryObjectKey }, function(data) {
				vm.objectData = data;
				postObjectLoad();
			}, function(err) {
				handleError("Error retrieving data object.");
			});

		}	
		
		// an object can be loaded from a search or create or modify - this shared 
		// processing is called after endpoint data is loaded
		function postObjectLoad() {
			vm.editableField = false;
			vm.queryMode = false;
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

		// returns value of 's' with any non-printing characters removed
		function stripNonPrintingCharacters(s) {
			// Printable characters range from a space up to the tilde, so keep anything between them plus
			// standard whitespace characters like newline and tab.
			return s.replace(/[^\x00-\x7F]/g, "");
		}		

		
		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.eiSearch = eiSearch;
		$scope.eiClear = eiClear;
		$scope.resetSearch = resetSearch;
		$scope.setObject = setObject;
		$scope.createObject = createObject;
		$scope.modifyObject = modifyObject;
		$scope.deleteObject = deleteObject;
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;

		// onBlurs
		$scope.jnumOnBlur = jnumOnBlur;
		
		
		// global shortcuts
		$scope.KclearAll = function() { $scope.eiClear(); $scope.$apply(); }
		$scope.Ksearch = function() { $scope.eiSearch(); $scope.$apply(); }
		$scope.Knext = function() { $scope.nextSummaryObject(); $scope.$apply(); }
		$scope.Kprev = function() { $scope.prevSummaryObject(); $scope.$apply(); }
		$scope.Kmodify = function() { $scope.modifyObject(); $scope.$apply(); }

		var globalShortcuts = Mousetrap($document[0].body);
		globalShortcuts.bind(['ctrl+alt+c'], $scope.KclearAll);
		globalShortcuts.bind(['ctrl+alt+s'], $scope.Ksearch);
		globalShortcuts.bind(['ctrl+alt+p'], $scope.Kprev);
		globalShortcuts.bind(['ctrl+alt+n'], $scope.Knext);
		globalShortcuts.bind(['ctrl+alt+m'], $scope.Kmodify);

		
		// call to initialize the page, and start the ball rolling...
		init();
	}

})();

















