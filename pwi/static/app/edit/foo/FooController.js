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
			FooTotalCountAPI,
			VocTermSearchAPI
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {};

		// mapping of object data 
		vm.objectData = {};

		// results list and data
		vm.total_count = 0;
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
			refreshTotalCount();
		}

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        	// mapped to 'Clear' button; called from init();  resets page
		function eiClear() {		
			vm.oldRequest = null;
			resetData();
			refreshTotalCount()
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

                                // after add/create, eiSearch/by J: is run & results returned
                                // then deselect so form is ready for next add
                                if (deselect) {
                                        deselectObject();
                                        pageScope.loadingEnd();
                                }
                                else {
                                        if (vm.results.length > 0) {
                                                vm.queryMode = false;
                                                loadObject();
                                        }
                                        else {
                                                vm.queryMode = true;
                                        }
                                        pageScope.loadingEnd();
                                        setFocus();
                                }

			}, function(err) { // server exception
				pageScope.handleError(vm, "Error while searching");
				pageScope.loadingEnd();
				setFocus();
			});
		}		

		// mapped to 'Reset Search' button
		function resetSearch() {		
			resetData();
			refreshTotalCount()
			if (vm.oldRequest != null) {
				vm.objectData = vm.oldRequest;
			}
		}		

        	// called when user clicks a row in the summary
		function setObject(index) {
                        console.log("setObject()");

                        if (index == vm.selectedIndex) {
                                deselectObject();
                        }
                        else {
                                vm.objectData = {}; 
                                vm.selectedIndex = index;
                                loadObject();
                                setFocus();
                        }
		}		

        	// Deselect current item from the searchResults.
                function deselectObject() {
                        console.log("deselectObject()");
                        var newObject = angular.copy(vm.objectData);
                        vm.objectData = newObject;
                        vm.selectedIndex = -1; 
                        resetDataDeselect();
                        setFocus()
                 }

		// refresh the total count
                function refreshTotalCount() {
                        FooTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

        	// mapped to 'Create' button
		function createObject() {
			console.log("createObject() -> CreateAPI()");

			var allowCommit = true;

                        if (vm.objectData.refsKey == '') {
                                alert("Must have a validated reference")
                                allowCommit = false;
                        }

                        if (allowCommit){

                                pageScope.loadingStart();

                                // call API for creation
                                ImageCreateAPI.create(vm.objectData, function(data) {
                                        // check for API returned error
                                        if (data.error != null) {
                                                alert("ERROR: " + data.error + " - " + data.message);
                                        }
                                        else {
                                                // after add/create, eiSearch/by J: is run & results returned
                                                // then deselect so form is ready for next add
                                                resetDataDeselect();
                                                eiSearch(true);
                                                postObjectLoad();
                                                refreshTotalCount();
                                        }
                                        pageScope.loadingEnd();
					setFocus();
                                }, function(err) {
                                        pageScope.handleError(vm, "Error creating image.");
                                        pageScope.loadingEnd();
					setFocus();
                                });
			}
		}		

        	// mapped to 'Update' button
		function modifyObject() {
			console.log("modifyObject() -> UpdateAPI()");

			pageScope.loadingStart();

                        //if (vm.??) {
                        //        alert("??")
                        //        allowCommit = false;
			//}

                        if (allowCommit){

                                pageScope.loadingStart();

                                ImageUpdateAPI.update(vm.objectData, function(data) {
                                        if (data.error != null) {
                                                alert("ERROR: " + data.error + " - " + data.message);
                                        }
                                        else {
                                                vm.objectData = data.items[0];
                                                postObjectLoad();
                                                var summaryDisplay = createSummaryDisplay();
                                                vm.results[vm.selectedIndex].imageDisplay = summaryDisplay;
                                        }
                                        pageScope.loadingEnd();
                                }, function(err) {
                                        pageScope.handleError(vm, "Error updating image.");
                                        pageScope.loadingEnd();
                                });
                        }
		}		
		
        	// mapped to 'Delete' button
		function deleteObject() {
                        console.log("deleteObject() -> DeleteAPI()");

                        if ($window.confirm("Are you sure you want to delete this image stub?")) {

                                pageScope.loadingStart();

                                ImageDeleteAPI.delete({ key: vm.objectData.imageKey }, function(data) {
                                        if (data.error != null) {
                                                alert("ERROR: " + data.error + " - " + data.message);
                                        } else {
                                                postObjectDelete();
                                                refreshTotalCount();
                                        }
                                        pageScope.loadingEnd();
                                }, function(err) {
                                        pageScope.handleError(vm, "Error deleting image.");
                                        pageScope.loadingEnd();
                                });
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
			   FindElement.byQuery("#resultsTableHeader .resultsTableSelectedRow")
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

			console.log("loadObject()");

			// derive the key of the selected result summary object
			vm.summaryObjectKey = vm.results[vm.selectedIndex].markerKey;
			
			// call API to gather object for given key
			FooGatherByKeyAPI.get({ key: vm.summaryObjectKey }, function(data) {
				vm.objectData = data;
				postObjectLoad();
			}, function(err) {
				pageScope.handleError(vm, "Error retrieving data object.");
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
		
		// load vocabularies
                function loadVocabs() {

                        console.log("loadVocabs()");

                        var loadTerm;

                        loadTerm = "??";
                        VocTermSearchAPI.search(vm.vocabRequest, function(data) {
                                if (data.error != null) {
                                        console.log(data.message);
                                        alert("Error initializing vocabulary : " + loadTerm);
                                } else {
                                        var termsList = data.items;
                                        vm.vocabTerms = termsList[0].terms;
                                }

                        }, function(err) {
                                handleError(vm, "Error loading vocabulary: " + loadTerm);
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

















