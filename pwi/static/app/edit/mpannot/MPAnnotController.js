(function() {
	'use strict';
	angular.module('pwi.mpannot').controller('MPAnnotController', MPAnnotController);

	function MPAnnotController(
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
			MPAnnotSearchAPI,
			MPAnnotGatherByKeyAPI,
			MPAnnotCreateAPI,
			MPAnnotUpdateAPI,
			MPAnnotDeleteAPI,
			MPAnnotTotalCountAPI,
			// global APIs
			VocTermSearchAPI
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {};

		// mapping of object data 
		vm.objectData = {};

		// results list and data
		vm.total_count = 0;
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
			refreshTotalCount();
			loadVocabs();
		}


		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        	// mapped to 'Clear' button; called from init();  resets page
		function eiClear() {		
			vm.oldRequest = null;
			resetData();
                        refreshTotalCount();
			setFocus();
		}		

		// mapped to query 'Search' button
		// default is to select first result
		// if deselect = true, then see below
		function eiSearch(deselect) {				
		
			pageScope.loadingStart();
			vm.hideLoadingHeader = false;
			
			// save off old request
			vm.oldRequest = vm.objectData;
	
			// call API to search; pass query params (vm.selected)
			MPAnnotSearchAPI.search(vm.objectData, function(data) {
				
				vm.results = data;
				vm.hideLoadingHeader = true;
				vm.selectedIndex = 0;

				// after add/create, eiSearch/by J: is run & results returned
				// then deselect so form is ready for next add
				if (deselect) {
					deselectObject();
				}
				else {
					if (vm.results.length > 0) {
						vm.queryMode = false;
						loadObject();
					}
					else {
						vm.queryMode = true;
					}
				}
				pageScope.loadingEnd();
				setFocusFigureLabel();

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
			if (index == vm.selectedIndex) {
				deselectObject();
			}
			else {
				vm.objectData = {};
				vm.selectedIndex = index;
				loadObject();
				setFocusFigureLabel();
			}
		}		

 		// Deselect current item from the searchResults.
 		function deselectObject() {
			console.log("deselectObject()");
			var newObject = angular.copy(vm.objectData);
                        vm.objectData = newObject;
			vm.selectedIndex = -1;
			resetDataDeselect();
			setFocusFigureLabel();
		}
	
		// refresh the total count
                function refreshTotalCount() {
                        MPAnnotTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

        	// mapped to 'Create' button
		function createObject() {
			console.log("createObject() -> MPAnnotCreateAPI()");
			var allowCommit = true;
			
			if (vm.isGxd){ // GXD pre-creation status checks
				if (vm.objectData.mpannotClassKey != "6481781") {
					alert("GXD can only use expression mpannots.");
					allowCommit = false;
				}
				// if no mpannot class on add, then default = Expression
				if (vm.objectData.mpannotClassKey == null || vm.objectData.mpannotClassKey == "") {
					vm.objectData.mpannotClassKey = "6481781";
				}
			}
			if (vm.isMgd){ // MGD pre-creation status checks
				// for MGD, mpannotClass "Expression" is not allowed
				// all other instances are allowed (null, Phenotypes, Molecular
				if (vm.objectData.mpannotClassKey == "6481781") {
					alert("MGD can only use phenotype or molecular mpannots.")
					allowCommit = false;
				}
				// if no mpannot class on add, then default = Phenotypes
				if (vm.objectData.mpannotClassKey == null || vm.objectData.mpannotClassKey == "") {
					vm.objectData.mpannotClassKey = "6481782";
				}
			}
			if (vm.objectData.refsKey == ''){
				alert("Must have a validated reference")
				allowCommit = false;
			}
			if (vm.objectData.figureLabel == ''){
				alert("Required Field Figure Label")
				allowCommit = false;
			}

			if (allowCommit){

				pageScope.loadingStart();

				MPAnnotCreateAPI.create(vm.objectData, function(data) {
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
				}, function(err) {
					pageScope.handleError(vm, "Error creating mpannot.");
					pageScope.loadingEnd();
				});
			}

		}		

        	// mapped to 'Update' button
		function modifyObject() {
			console.log("modifyObject() -> MPAnnotUpdateAPI()");
			var allowCommit = true;

			if (vm.objectData.figureLabel == ''){
					alert("Required Field Figure Label")
					allowCommit = false;
			}
			if (vm.isGxd){ // GXD pre-creation status checks
				if (vm.objectData.mpannotClassKey != "6481781") {
					alert("GXD can only use expression mpannots.");
					allowCommit = false;
				}
				// if no mpannot class on add, then default = Expression
				if (vm.objectData.mpannotClassKey == null || vm.objectData.mpannotClassKey == "") {
					vm.objectData.mpannotClassKey = "6481781";
				}
			}
			if (vm.isMgd){ // MGD pre-creation status checks
				// for MGD, mpannotClass "Expression" is not allowed
				// all other instances are allowed (null, Phenotypes, Molecular
				if (vm.objectData.mpannotClassKey == "6481781") {
					alert("MGD can only use phenotype or molecular mpannots.")
					allowCommit = false;
				}
				// if no mpannot class on add, then default = Phenotypes
				if (vm.objectData.mpannotClassKey == null || vm.objectData.mpannotClassKey == "") {
					vm.objectData.mpannotClassKey = "6481782";
				}
			}

			// must be at least 1 pane label
			var paneLength = vm.objectData.mpannotPanes.length;
			var paneDelete = 0;
			for(var i=0;i<paneLength; i++) {
				if (vm.objectData.mpannotPanes[i].processStatus == 'd'){
					paneDelete += 1;
				}
			}
			if (paneLength == 0 || paneLength == paneDelete){
					alert("There must be at least 1 Pane Label")
					allowCommit = false;
			}
			
			// can process delete, but not create/update
			if (vm.objectData.editAccessionIds != null) {
				if (vm.objectData.editAccessionIds[0].processStatus != "d") {
					vm.objectData.editAccessionIds[0].processStatus = "x";
				}
			}

			if (allowCommit){

				pageScope.loadingStart();

				MPAnnotUpdateAPI.update(vm.objectData, function(data) {
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						vm.objectData = data.items[0];
						postObjectLoad();
						var summaryDisplay = createSummaryDisplay();
						vm.results[vm.selectedIndex].mpannotDisplay = summaryDisplay;
					}
					pageScope.loadingEnd();
				}, function(err) {
					pageScope.handleError(vm, "Error updating mpannot.");
					pageScope.loadingEnd();
				});
			}

		}		
		
        	// mapped to 'Delete' button
		function deleteObject() {
			console.log("deleteObject() -> MPAnnotDeleteAPI()");

			if ($window.confirm("Are you sure you want to delete this record?")) {
				
				pageScope.loadingStart();

				MPAnnotDeleteAPI.delete({ key: vm.objectData.mpannotKey }, function(data) {
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					} else {
						postObjectDelete();
						refreshTotalCount();
					}
					pageScope.loadingEnd();
					setFocus();
				}, function(err) {
					pageScope.handleError(vm, "Error deleting mpannot.");
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
			   FindElement.byQuery("#resultsTable .resultsTableSelectedRow")
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

			// reset submission/summary values
			vm.results = [];
			vm.selectedIndex = 0;
			vm.errorMsg = '';
			vm.total_count = 0;

			// rebuild empty objectData submission object, else bindings fail
			vm.objectData = {};
			//vm.objectData.mpannotKey = "";	
			//vm.objectData.refsKey = "";	
			//vm.objectData.jnumid = "";	
			//vm.objectData.figureLabel = "";	
			//vm.objectData.mgiAccessionIds = [];
			//vm.objectData.mgiAccessionIds[0] = {"accID":""};			
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");

			//vm.objectData.mpannotKey = "";	
			//vm.objectData.mgiAccessionIds = [];
			//vm.objectData.mgiAccessionIds[0] = {"accID":""};			

			vm.queryMode = true;
		}

		// load vocabularies
                function loadVocabs() {

                        console.log("loadVocabs()");

			var loadTerm;

			//loadTerm = "MPAnnot Class";
                        //VocTermSearchAPI.search(vm.mpannotClassRequest, function(data) {
                                //if (data.error != null) {
                                        //console.log(data.message);
                                        //alert("Error initializing vocabulary : " + loadTerm);
                                //} else {
                                        //var termsList = data.items;
                                        //vm.mpannotClassTerms = termsList[0].terms;
                                //}
//
                        //}, function(err) {
                                //pageScope.handleError(vm, "Error loading vocabulary: " + loadTerm);
                        //});

                }

		// load a selected object from summary 
		function loadObject() {
			console.log("loadObject()");

			if (vm.results.length == 0) {
				return;
			}

			// derive the key of the selected result summary object
			vm.summaryObjectKey = vm.results[vm.selectedIndex].mpannotKey;
			
			// call API to gather object for given key
			MPAnnotGatherByKeyAPI.get({ key: vm.summaryObjectKey }, function(data) {
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

		// creates a display string to be used in summary (normally supplied by endpoint) 
		function createSummaryDisplay() {
			var displayStr = vm.objectData.jnumid + "; " + vm.objectData.mpannotType + "; " + vm.objectData.figureLabel;
			return displayStr;
		}

		// when an mpannot is deleted, remove it from the summary
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove mpannot (and thumbnail, if it exists)
			removeSearchResultsItem(vm.objectData.mpannotKey);

			if (vm.objectData.thumbnailMPAnnot != null) {
				removeSearchResultsItem(vm.objectData.thumbnailMPAnnot.mpannotKey);
			}

			// clear if now empty; otherwise, load next row
			if (vm.results.length == 0) {
				eiClear();
			}
			else {
				// adjust selected summary index as needed, and load mpannot
				if (vm.selectedIndex > vm.results.length -1) {
					vm.selectedIndex = vm.results.length -1;
				}
				loadObject();
			}
		}

		// handle removal from summary list
		function removeSearchResultsItem(keyToRemove) {
			
			// first find the item to remove
			var removeIndex = -1;
			for(var i=0;i<vm.results.length; i++) {
				if (vm.results[i].mpannotKey == keyToRemove) {
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

