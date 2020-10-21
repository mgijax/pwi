(function() {
	'use strict';
	angular.module('pwi.organism').controller('OrganismController', OrganismController);

	function OrganismController(
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
			OrganismSearchAPI,
			OrganismGetAPI,
			OrganismCreateAPI,
			OrganismUpdateAPI,
			OrganismDeleteAPI,
			OrganismTotalCountAPI,
			// global APIs
			ChromosomeSearchAPI,
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
		vm.selectedMarkerIndex = 0;
		vm.selectedRefIndex = 0;
		
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			resetData(1);
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
			setFocus();
		}		

		// mapped to query 'Search' button
		// default is to select first result
		function search() {				
			console.log(vm.apiDomain);
		
			pageScope.loadingStart();
			
			OrganismSearchAPI.search(vm.apiDomain, function(data) {
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
				pageScope.handleError(vm, "API ERROR: OrganismSearchAPI.search");
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
                        OrganismTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////
		
        	// create
		function create() {
			console.log("create()");

			// verify if record selected
			if (vm.selectedIndex >= 0) {
				alert("Cannot Add if a record is already selected.");
                                return;
			}

			console.log("create() -> OrganismCreateAPI()");
			pageScope.loadingStart();

			OrganismCreateAPI.create(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					vm.apiDomain = data.items[0];
                                               vm.selectedIndex = vm.results.length;
                                               vm.results[vm.selectedIndex] = [];
                                               vm.results[vm.selectedIndex].organismKey = vm.apiDomain.organismKey;
					vm.results[vm.selectedIndex].name = vm.apiDomain.namel;
					loadObject();
					refreshTotalCount();
				}
				pageScope.loadingEnd();
                                setFocus();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: OrganismCreateAPI.create");
				pageScope.loadingEnd();
                                      setFocus();
			});
		}		

        	// modify
		function modify() {
			console.log("modify() -> OrganismUpdateAPI()");

			// verify if record selected
			if (vm.selectedIndex == ) {
				alert("Cannot Modify if a record is already selected.");
                                return;
			}

			pageScope.loadingStart();

			OrganismUpdateAPI.update(vm.apiDomain, function(data) {
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
				pageScope.handleError(vm, "API ERROR: OrganismUpdateAPI.update");
				pageScope.loadingEnd();
                                setFocus();
			});
		}		
		
        	// delete
		function deleteIt() {
			console.log("deleteIt() -> OrganismDeleteAPI() : " + vm.selectedIndex);

			// check if record selected
			if (vm.selectedIndex < 0) {
				alert("Cannot Delete if a record is not selected.");
				return;
			}

			if ($window.confirm("Are you sure you want to delete this record?")) {
			
				pageScope.loadingStart();

				OrganismDeleteAPI.delete({key: vm.apiDomain.organismKey}, function(data) {
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
					pageScope.handleError(vm, "API ERROR: OrganismDeleteAPI.delete");
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
		function resetData(index) {
			console.log("resetData(): " + index);

			vm.results = [];
			vm.selectedIndex = -1;
			vm.selectedMarkerIndex = 0;
			vm.selectedRefIndex = 0;
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");

			vm.apiDomain.organismKey = "";	
			vm.apiDomain.name = "";	
			addMarkerRow();
			addRefRow();
		}

		// load vocabularies
                function loadVocabs() {
                        console.log("loadVocabs()");

			//vm.vectorLookup = {};
			//VocTermSearchAPI.search({"vocabKey":"24"}, function(data) { vm.vectorLookup = data.items[0].terms});;

			//vm.organismLookup = [];
			//OrganismSearchOrganismAPI.search({}, function(data) { vm.organismLookup = data});;

                        vm.chromosomeLookup = {};
                        ChromosomeSearchAPI.search({"organismKey":"1"}, function(data) { vm.chromosomeLookup = data});;
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

			OrganismGetAPI.get({ key: vm.results[vm.selectedIndex].organismKey }, function(data) {
				vm.apiDomain = data;
				vm.apiDomain.organismKey = vm.results[vm.selectedIndex].organismKey;
				vm.results[vm.selectedIndex].name = vm.apiDomain.name;
				selectMarker(0);
				selectRef(0);
			        addMarkerRow();
			        addRefRow();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: OrganismGetAPI.get");
			});
		}	
		
		// when an object is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove object, if it exists)
			removeSearchResultsItem(vm.apiDomain.organismKey);

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
				if (vm.results[i].organismKey == keyToRemove) {
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
                                document.getElementById("latinname").focus();
                        }, (200));
		}

		/////////////////////////////////////////////////////////////////////
		// validating
		/////////////////////////////////////////////////////////////////////		
		
		/////////////////////////////////////////////////////////////////////
		// markers
		/////////////////////////////////////////////////////////////////////		
		
		// set current row
		function selectMarker(index) {
			console.log("selectMarker: " + index);
			vm.selectedMarkerIndex = index;
			vm.selectedRefIndex = 0;

			if (vm.apiDomain.markers == null | vm.apiDomain.markers == undefined) {
                                return;
                        }

			if (vm.apiDomain.markers.length == 0) {
				addMarkerRow();
			}
		}

		// if current row has changed
		function changeMarkerRow(index) {
			console.log("changeMarkerRow: " + index);

			vm.selectedMarkerIndex = index;

			if (vm.apiDomain.markers[index] == null) {
				vm.selectedMarkerIndex = 0;
				return;
			}

			if (vm.apiDomain.markers[index].processStatus == "x") {
				vm.apiDomain.markers[index].processStatus = "u";
			};
                }

		// add new row
		function addMarkerRow() {
			console.log("addMarkerRow");

			if (vm.apiDomain.markers == undefined) {
				vm.apiDomain.markers = [];
			}

			var i = vm.apiDomain.markers.length;

			vm.apiDomain.markers[i] = {
				"processStatus": "c",
                                "assocKey": "",
                                "organismKey": vm.apiDomain.organismKey,
                                "markerKey": "",
                                "markerSymbol": "",
                                "relationship": "",
				"refsKey": "",
			       	"jnumid": "",
			       	"jnum": null,
				"short_citation": "",
				"createdBy": "",
				"creation_date": "",
				"modifiedBy": "",
				"modification_date": ""
			}
		}		

		/////////////////////////////////////////////////////////////////////
		// references
		/////////////////////////////////////////////////////////////////////		
		
		// set current row
		function selectRef(index) {
			console.log("selectRef: " + index);
			vm.selectedRefIndex = index;
			vm.selectedAliasIndex = 0;

			if (vm.apiDomain.references == null | vm.apiDomain.references == undefined) {
                                return;
                        }

			if (vm.apiDomain.references.length == 0) {
				addRefRow();
			}

                        // add empty accession/alias rows, if needed
			for(var i=0;i<vm.apiDomain.references.length; i++) {
                                if (vm.apiDomain.references[i].accessionIds == null) {
                                        addAccRow(i);
                                }
                                if (vm.apiDomain.references[i].aliases == null) {
                                        addAliasRow(i);
                                }
                        }
		}

		// if current row has changed
		function changeRefRow(index) {
			console.log("changeRefRow: " + index);

			vm.selectedRefIndex = index;

			if (vm.apiDomain.references[index] == null) {
				vm.selectedRefIndex = 0;
				return;
			}

			if (vm.apiDomain.references[index].processStatus == "x") {
				vm.apiDomain.references[index].processStatus = "u";
			};
                }

		// add new row
		function addRefRow() {
			console.log("addRefRow()");

			if (vm.apiDomain.references == undefined) {
				vm.apiDomain.references = [];
			}

			var i = vm.apiDomain.references.length;

			vm.apiDomain.references[i] = {
				"processStatus": "c",
				"referenceKey": "",
			       	"organismKey": vm.apiDomain.organismKey,
                                "hasRmap": "0",
                                "hasSequence": "0",
				"refsKey": "",
			       	"jnumid": "",
				"short_citation": "",
				"createdBy": "",
				"creation_date": "",
				"modifiedBy": "",
				"modification_date": ""
			}
		}		

                //
		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
		$scope.clear = clear;
		$scope.create = create;
		$scope.modify = modify;
		$scope.delete = deleteIt;
		$scope.changeMarkerRow = changeMarkerRow;
		$scope.addMarkerRow = addMarkerRow;
		$scope.changeRefRow = changeRefRow;
		$scope.addRefRow = addRefRow;
		$scope.selectMarker = selectMarker;
		$scope.selectRef = selectRef;

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
		$scope.Kadd = function() { $scope.create(); $scope.$apply(); }
		$scope.Kmodify = function() { $scope.modify(); $scope.$apply(); }
		$scope.Kdelete = function() { $scope.deleteIt(); $scope.$apply(); }

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

