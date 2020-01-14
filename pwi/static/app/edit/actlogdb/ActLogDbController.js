(function() {
	'use strict';
	angular.module('pwi.actlogdb').controller('ActLogDbController', ActLogDbController);

	function ActLogDbController(
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
			LDBSearchAPI,
			LDBGetAPI,
			LDBCreateAPI,
			LDBUpdateAPI,
			LDBDeleteAPI,
			LDBTotalCountAPI,
			OrganismSearchAPI
			// global APIs
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {};

		// api/json input/output
		vm.apiDomain = {};

		// organism lookup
		vm.organismLookup = [];
		OrganismSearchAPI.search({}, function(data) { vm.organismLookup = data; });;

		// yes/no lookup for  adb active? multiple?
		vm.yesnoLookup = [];
		vm.yesnoLookup[0] = {
		    "termKey": "1",
		    "term": "Yes"
		}
		vm.yesnoLookup[1] = {
			"termKey": "0",
			"term": "No"
		}

                // default booleans for page functionality
		vm.hideApiDomain = true;       // JSON package
		vm.hideVmData = true;          // JSON package + other vm objects
                vm.hideErrorContents = true;	// display error message

		// results list and data
		vm.total_count = 0;
		vm.results = [];
		vm.selectedIndex = -1;
		vm.selectedAdbIndex = 0;
		
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			console.log("init()");
			resetData();
			refreshTotalCount();
			addAdbRow();
			console.log("done init()");
		}

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        	// mapped to 'Clear' button; called from init();  resets page
		function clear() {
			console.log("clear()");		
			resetData();
                        refreshTotalCount();
			setFocus();
			addAdbRow();
			console.log("done clear()");
		}		

		// mapped to query 'Search' button
		// default is to select first result
		function search() {				
			console.log("search()");
			console.log(vm.apiDomain);
	
			pageScope.loadingStart();
			console.log("after pageScope.loadingStart()");
			// call API to search; pass query params (vm.selected)
			LDBSearchAPI.search(vm.apiDomain, function(data) {
			 	console.log("setting vm.results - data");
				vm.results = data;
				vm.selectedIndex = 0;

				console.log("calling loadLDB");
				loadLDB();
				console.log("done calling loadLDB");

				pageScope.loadingEnd();
				setFocus();

			}, function(err) { // server exception
				pageScope.handleError(vm, "Error while searching");
				pageScope.loadingEnd();
				setFocus();
			});
		}		
		function searchLdbName() {
                        console.log("searchLdbName()");

                        if (vm.apiDomain.logicalDBKey == "" && vm.apiDomain.name != "") {
                                search();
                        }
                }
		function searchDescription() {
                        console.log("searchDescription()");

                        if (vm.apiDomain.logicalDBKey == "" && vm.apiDomain.description != "") {
                                search();
                        }
                }

		/////////////////////////////////////////////////////////////////////
		// Search Results
		/////////////////////////////////////////////////////////////////////
		
        	// called when user clicks a row in the results
		function selectResult(index) {
			console.log("selectResult(index): " + index);
			console.log("selectResult vm.selectedIndex: " + vm.selectedIndex);
			if (index == vm.selectedIndex) {
				deselectObject();
			}
			else {
				vm.apiDomain = {};
				vm.selectedIndex = index;
				loadLDB();
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
			console.log("refreshTotalCount()");
                        LDBTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////

		function createLDB() {
                        console.log("createLDB() -> LDBCreateAPI()");
                        pageScope.loadingStart();

			console.log("before calling LDBCreateAPI");
                        LDBCreateAPI.create(vm.apiDomain, function(data) {
			console.log("after calling LDBCreateAPI");
                                pageScope.loadingEnd();
			
                                if (data.error != null) {
                                        alert("ERROR: " + data.error + " - " + data.message);
                                }
                                else {
                                        vm.apiDomain = data.items[0];
					console.log("vm.results before: " +  vm.results.length);
                                        vm.selectedIndex = vm.results.length;
                                        vm.results[vm.selectedIndex] = [];
                                        vm.results[vm.selectedIndex].logicalDBKey = vm.apiDomain.logicalDBKey;
                                        vm.results[vm.selectedIndex].name = vm.apiDomain.name;
					console.log("vm.results after: " +  vm.results.length);
					console.log ("vm.selectedIndex: " +  vm.selectedIndex);
					console.log ("vm.results[vm.selectedIndex].name " + vm.results[vm.selectedIndex].name);
					console.log("vm.results[vm.selectedIndex].logicalDBKey: " + vm.results[vm.selectedIndex].logicalDBKey);
                                        loadLDB();
                                        refreshTotalCount();
                                }
                                pageScope.loadingEnd();
                                setFocus();

                        }, function(err) {
                                pageScope.handleError(vm, "Error creating logical DB.");
                                pageScope.loadingEnd();
                                setFocus();
                        });
                }


        	// modify logicalDB
		function modifyLDB() {
			console.log("modifyLDB() -> LDBUpdateAPI()");
			var allowCommit = true;

			// check if record selected
			if(vm.selectedIndex < 0) {
				alert("Cannot save this Logical Database if a record is not selected.");
				allowCommit = false;
			}
			
			if (allowCommit){
				pageScope.loadingStart();

				LDBUpdateAPI.update(vm.apiDomain, function(data) {
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						loadLDB();
					}
					pageScope.loadingEnd();
				}, function(err) {
					pageScope.handleError(vm, "Error updating logicalDB.");
					pageScope.loadingEnd();
				});
			}
			else {
				loadLDB();
				pageScope.loadingEnd();
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
			loadLDB();
			scrollToObject();
		}
		
		function nextSummaryObject() {
			console.log("nextSummaryObject()");
			if(vm.results.length == 0) return;
			if(vm.selectedIndex + 1 >= vm.results.length) return;
			vm.selectedIndex++;
			loadLDB();
			scrollToObject();
		}		

	    	function firstSummaryObject() {
			console.log("firstSummaryObject()");
	        	if(vm.results.length == 0) return;
	        	vm.selectedIndex = 0;
			loadLDB();
			scrollToObject();
	      	}

	    	function lastSummaryObject() {
			console.log("lastSummaryObject()");
	        	if(vm.results.length == 0) return;
			console.log("lastSummaryObject vm.selectedIndex: " + vm.selectedIndex);
			console.log("lastSummaryObject vm.results.length: " + vm.results.length);
	        	vm.selectedIndex = vm.results.length - 1;
			loadLDB();
			scrollToObject();
	      	}

	    	// ensure we keep the selected row in view
		function scrollToObject() {
			console.log("scrollToObject()");
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

			vm.results = [];
			vm.selectedIndex = -1;
			vm.total_count = 0;

			// rebuild empty apiDomain submission object, else bindings fail
			vm.apiDomain = {};
			vm.apiDomain.logicalDBKey = "";	
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");

			vm.apiDomain.logicalDBKey = "";	
			addAdbRow();
		}

		// load a selected object from results
		function loadLDB() {
			console.log("loadLDB()");
			if (vm.results.length == 0) { // this works coming from create
				return;
			}

			if (vm.selectedIndex < 0) {
				return;
			}

			// api get object by primary key
			console.log("vm.results[vm.selectedIndex].logicalDBKey: " + vm.results[vm.selectedIndex].logicalDBKey); //this works from create
			LDBGetAPI.get({ key: vm.results[vm.selectedIndex].logicalDBKey }, function(data) { // this works from create

				vm.apiDomain = data;
				vm.apiDomain.logicalDBKey = vm.results[vm.selectedIndex].logicalDBKey; // this works from create
				selectLDB(vm.selectedIndex);
				addAdbRow()

			}, function(err) {
				pageScope.handleError(vm, "Error retrieving data object.");
			});
		}	

		function selectLDB(index) {
		    console.log("selectLDB: " + index);
                    vm.selectedIndex = index;
		    vm.selectedAdbIndex = 0;
		}

		function addAdbRow() {
		    console.log("addAdbRow");
		    if (vm.apiDomain.actualDBs == undefined) {
			vm.apiDomain.actualDBs = [];
		    }
		    var i = vm.apiDomain.actualDBs.length;

                    vm.apiDomain.actualDBs[i] = {
		        "actualDBKey": "" ,
			 "logicalDBKey": vm.apiDomain.logicalDBKey,
			 "name": "",
			 "active": "",
			 "url": "",
			 "allowsMultiple": "",
			 "delimiter": "",
			 "createdBy": "",
			 "modifiedBy": "",
			 "creation_date": "",
			 "modification_date": ""
		    }
		}
		
		function deleteAdbRow(index) {
		    console.log("deleteAdbRow: " + index);
		    changeAdbRow(vm.selectedIndex); 
		    vm.apiDomain[vm.selectedIndex].actualDBs[index].name = "";
		        
                }
		function changeAdbRow(index) {
		    console.log("changeAdbRow: " + index);

                    vm.selectedAdbIndex = index;
                    if (vm.apiDomain.actualDBs[index] == null) {
                        vm.selectedIndex = 0;
                        return;
                    }
		}
                
		function deleteLDB() {
		    console.log("deleteLDB() -> LDBDeleteAPI()");

		    if ($window.confirm("Are you sure you want to delete this record?")) {

			pageScope.loadingStart();
			console.log("vm.apiDomain.logicalDBKey" + vm.apiDomain.logicalDBKey);
			LDBDeleteAPI.delete({ key: vm.apiDomain.logicalDBKey }, function(data) {
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
			    pageScope.handleError(vm, "Error deleting logical DB.");
			    pageScope.loadingEnd();
			    setFocus();
			});
		    }
                }
	
		// when a logical DB  is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove ldb (and thumbnail, if it exists)
			removeSearchResultsItem(vm.apiDomain.logicalDBKey);

			// clear if now empty; otherwise, load next row
			if (vm.results.length == 0) {
				clear();
			}
			else {
				// adjust selected results index as needed, and load ldb
				if (vm.selectedIndex > vm.results.length -1) {
					vm.selectedIndex = vm.results.length -1;
				}
				loadLDB();
			}
		}

		// handle removal from results list
		function removeSearchResultsItem(keyToRemove) {
		   	console.log("removeSearchResultsItem()");
			// first find the item to remove
			var removeIndex = -1;
			for(var i=0;i<vm.results.length; i++) {
				if (vm.results[i].logicalDBKey == keyToRemove) {
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
			document.getElementById("name").focus();
		}

		/////////////////////////////////////////////////////////////////////
		// validating
		/////////////////////////////////////////////////////////////////////		
	
		/////////////////////////////////////////////////////////////////////
		// logical DB
		/////////////////////////////////////////////////////////////////////		
		
		// set actual db row
		function selectADB(index) {
			console.log("selectADB index: " + index);
			vm.selectedAdbIndex = index;
		}


                // Main Buttons
		$scope.search = search;
		$scope.clear = clear;
		$scope.createLDB = createLDB;
		$scope.modifyLDB = modifyLDB;
		$scope.deleteLDB = deleteLDB;
		$scope.addAdbRow = addAdbRow;
		$scope.changeAdbRow = changeAdbRow;
	
		// change of row/field detected
		$scope.selectLDB = selectLDB;
		$scope.searchLdbName = searchLdbName;
		$scope.searchDescription = searchDescription;

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

		// other functions: buttons, onBlurs and onChanges
		$scope.selectResult = selectResult;
		
		// global shortcuts
		$scope.KclearAll = function() { $scope.clear(); $scope.$apply(); }
		$scope.Ksearch = function() { $scope.search(); $scope.$apply(); }
		$scope.Kfirst = function() { $scope.firstSummaryObject(); $scope.$apply(); }
		$scope.Knext = function() { $scope.nextSummaryObject(); $scope.$apply(); }
		$scope.Kprev = function() { $scope.prevSummaryObject(); $scope.$apply(); }
		$scope.Klast = function() { $scope.lastSummaryObject(); $scope.$apply(); }
		$scope.Kadd = function() { $scope.createLDB(); $scope.$apply(); }
		$scope.Kmodify = function() { $scope.modifyLDB(); $scope.$apply(); }
		$scope.Kdelete = function() { $scope.deleteLDB(); $scope.$apply(); }

		var globalShortcuts = Mousetrap($document[0].body);
		globalShortcuts.bind(['ctrl+alt+c'], $scope.KclearAll);
		globalShortcuts.bind(['ctrl+alt+s'], $scope.Ksearch);
		globalShortcuts.bind(['ctrl+alt+f'], $scope.Kfirst);
		globalShortcuts.bind(['ctrl+alt+n'], $scope.Knext);
		globalShortcuts.bind(['ctrl+alt+p'], $scope.Kprev);
		globalShortcuts.bind(['ctrl+alt+l'], $scope.Klast);
		globalShortcuts.bind(['ctrl+alt+a'], $scope.Kadd);
		globalShortcuts.bind(['ctrl+alt+m'], $scope.Kmodify);
		globalShortcuts.bind(['ctrl+alt+d'], $scope.Kdelete);

		// call to initialize the page, and start the ball rolling...
		init();
	}

})();

