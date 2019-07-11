(function() {
	'use strict';
	angular.module('pwi.foo').controller('FooController', FooController);

	function FooController(
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
			FooSearchAPI,
			FooGatherByKeyAPI,
			FooCreateAPI,
			FooUpdateAPI,
			FooDeleteAPI,
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
			loadVocabs();
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
		
			pageScope.loadingStart();
			vm.hideLoadingHeader = false;
			vm.queryMode = false;
			
			// save off old request
			vm.oldRequest = vm.objectData;
	
			// call API to search; pass query params (vm.selected)
			FooSearchAPI.search(vm.objectData, function(data) {
				
				vm.results = data;
				vm.hideLoadingHeader = true;
				vm.selectedIndex = 0;
				loadObject();
				pageScope.loadingFinished();
				setFocus();

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
			loadObject();
		}		

        // mapped to 'Create' button
		function createObject() {

			console.log("Submitting to object creation endpoint");
			pageScope.loadingStart();

// EXAMPLE
			// call API for creation
//			FooCreateAPI.create(vm.objectData, function(data) {
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
//				pageScope.loadingFinished();
//				setFocus();
//			}, function(err) {
//				handleError("Error creating marker.");
//				pageScope.loadingFinished();
//				setFocus();
//			});

		}		

        // mapped to 'Update' button
		function modifyObject() {

			console.log("Submitting to update endpoint");
			pageScope.loadingStart();
			
// EXAMPLE
			// call update API
//			FooUpdateAPI.update(vm.objectData, function(data) {
//				// check for API returned error
//				if (data.error != null) {
//					alert("ERROR: " + data.error + " - " + data.message);
//				}
//				else {
//					// update data
//					vm.objectData = data.items[0];
//					postObjectLoad();
//				}
//				pageScope.loadingFinished();
//				setFocus();
//			}, function(err) {
//				handleError("Error updating marker.");
//				pageScope.loadingFinished();
//				setFocus();
//			});

		}		
		
        // mapped to 'Delete' button
		function deleteObject() {

			if ($window.confirm("Are you sure you want to delete this object?")) {
			
// EXAMPLE
//				pageScope.loadingStart();
				// call API to delete marker
//				FooDeleteAPI.delete({ key: vm.objectData.markerKey }, function(data) {
//					// check for API returned error
//					if (data.error != null) {
//						alert("ERROR: " + data.error + " - " + data.message);
//					}
//					else {
//						// success
//						alert("Marker Deleted!");
//						eiClear();
//					}
//					pageScope.loadingFinished();
//					setFocus();
//				}, function(err) {
//					handleError("Error deleting marker.");
//					pageScope.loadingFinished();
//					setFocus();
//				});
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
		
                function firstSummaryObject() {
                        console.log("First summary object");
                	if(vm.results.length == 0) return;
                	vm.selectedIndex = 0;
                        loadObject();
                        scrollToObject();
                }

                function lastSummaryObject() {
                        console.log("Last summary object");
                	if(vm.results.length == 0) return;
                	vm.selectedIndex = vm.results.length - 1;
                        loadObject();
                        scrollToObject();
                }

		// ensure we keep the selected row in view
		function scrollToObject() {

			$q.all([
			   FindElement.byId("resultTableWrapper"),
			   FindElement.byQuery("#resultsTableHeader .resultsTableSelectedRow")
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
			vm.objectData.mgiAccessionIds = [];
			vm.objectData.mgiAccessionIds[0] = {"accID":""};			

			// reset display booleans
			vm.hideErrorContents = true;
			vm.hideLoadingHeader = true;
			vm.queryMode = true;

			// used in pre-loading term lists 
			vm.vocabRequest = {"vocabKey":"79"}; 			
		}

		// load a selected object from summary 
		function loadObject() {

			console.log("into loadObject");

			// derive the key of the selected result summary object
			vm.summaryObjectKey = vm.results[vm.selectedIndex].markerKey;
			
			// call API to gather object for given key
			FooGatherByKeyAPI.get({ key: vm.summaryObjectKey }, function(data) {
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
			var input = document.getElementById ("objectAccId");
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

		function loadVocabs() {
			console.log("into loadVocabs");

			// call API
			VocabSearchAPI.search(vm.vocabRequest, function(data) {
				if (data.error != null) {
					console.log(data.message);
					alert("Error initializing page.  Unable to load vocab.");
				} else {
					console.log("success loadVocabs");
					console.log(data);
					var termsList = data.items;
					vm.vocabTerms = termsList[0].terms;
				}

			}, function(err) { // server exception
				handleError("Error gathering vocab.");
			});
			
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

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

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

















