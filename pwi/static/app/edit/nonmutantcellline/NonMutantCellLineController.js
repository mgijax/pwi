(function() {
	'use strict';
	angular.module('pwi.nonmutantcellline').controller('NonMutantCellLineController', NonMutantCellLineController);

	function NonMutantCellLineController(
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
			NonMutantCellLineSearchAPI,
			NonMutantCellLineGetAPI,
			NonMutantCellLineCreateAPI,
			NonMutantCellLineUpdateAPI,
			NonMutantCellLineDeleteAPI,
			NonMutantCellLineTotalCountAPI,
                        NonMutantCellLineMCLCountAPI,
			// global APIs
			ValidateStrainAPI,
                        ValidateTermAPI,
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
			
			NonMutantCellLineSearchAPI.search(vm.apiDomain, function(data) {
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
				pageScope.handleError(vm, "API ERROR: NonMutantCellLineSearchAPI.search");
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
                        NonMutantCellLineTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		// refresh the mcl count
                function refreshMCLCount() {
                        NonMutantCellLineMCLCountAPI.search(vm.results[vm.selectedIndex].cellLineKey, function(data) {
                                vm.mcl_count = data.total_count;
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////
		
        	// create nonmutant cell line
		function create() {
			console.log("create()");

			// verify if record selected
                        if (vm.apiDomain.cellLineKey != null && vm.apiDomain.cellLineKey != "") {
				alert("Cannot Add if a record is already selected.");
                                return;
			}

                        // required : Cell Line
                        if (vm.apiDomain.cellLine == "") {
				alert("Cell Line required.");
                                return;
                        }

			console.log("create() -> NonMutantCellLineCreateAPI()");
			pageScope.loadingStart();

			NonMutantCellLineCreateAPI.create(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					vm.apiDomain = data.items[0];
                                        vm.selectedIndex = vm.results.length;
                                        vm.results[vm.selectedIndex] = [];
                                        vm.results[vm.selectedIndex].cellLineKey = vm.apiDomain.cellLineKey;
                                        vm.results[vm.selectedIndex].cellLine = vm.apiDomain.cellLine;
					loadObject();
					refreshTotalCount();
				}
				pageScope.loadingEnd();
                                setFocus();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: NonMutantCellLineCreateAPI.create");
				pageScope.loadingEnd();
                                setFocus();
			});
		}		

        	// modify nonmutant cell line
		function modify() {
			console.log("modify() -> NonMutantCellLineUpdateAPI()");

			// check if record selected
			if (vm.selectedIndex < 0) {
				alert("Cannot Modify if a record is not selected.");
				return;
			}
			
			pageScope.loadingStart();

                        vm.apiDomain.processStatus = "u";

			NonMutantCellLineUpdateAPI.update(vm.apiDomain, function(data) {
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
				pageScope.handleError(vm, "API ERROR: NonMutantCellLineUpdateAPI.update");
				pageScope.loadingEnd();
                                setFocus();
			});
		}		
		
        	// delete allele
		function deleteIt() {
			console.log("deleteIt() -> NonMutantCellLineDeleteAPI() : " + vm.selectedIndex);

			// check if record selected
			if (vm.selectedIndex < 0) {
				alert("Cannot Delete if a record is not selected.");
				return;
			}

			if (vm.mcl_count > 0) {
				alert("Non mutant cell lines cannot be deleted when associated with one or more allele.");
				return;
			}

			if ($window.confirm("Are you sure you want to delete this record?")) {
			
				pageScope.loadingStart();

				NonMutantCellLineDeleteAPI.delete({key: vm.apiDomain.cellLineKey}, function(data) {
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
					pageScope.handleError(vm, "API ERROR: NonMutantCellLineDeleteAPI.delete");
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
			//setFocus();
		}
		
		
		/////////////////////////////////////////////////////////////////////
		// Utility methods
		/////////////////////////////////////////////////////////////////////
		
		// resets page data
		function resetData() {
			console.log("resetData()");

			vm.results = [];
			vm.selectedIndex = -1;
                        vm.selectedAccIndex = 0;
			vm.total_count = 0;
                        loadEmptyObject();
			resetBoolean();
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");
			resetBoolean();
		}

		// reset booleans
	        function resetBoolean() {
			vm.hideErrorContents = true;
		}

		// load vocabularies
                function loadVocabs() {
                        console.log("loadVocabs()");

                        vm.cellLineTypeLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"63"}, function(data) { vm.cellLineTypeLookup = data.items[0].terms});;
                }

		// load empty oject
		function loadEmptyObject() {
			console.log("loadEmptyObject()");

			NonMutantCellLineGetAPI.get({ key: "-999" }, function(data) {
				vm.apiDomain = data;
                                vm.apiDomain.processStatus = "c";
                                vm.apiDomain.isMutant = "0";
                                vm.mcl_count = "";
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: NonMutantCellLineGetAPI.get");
			});
		}	
		
		// load a selected object from results
		function loadObject() {
			console.log("loadObject()");

			if(vm.results.length == 0) {
				return;
			}

			if(vm.selectedIndex < 0) {
				return;
			}

			NonMutantCellLineGetAPI.get({ key: vm.results[vm.selectedIndex].cellLineKey }, function(data) {
				vm.apiDomain = data;
				refreshMCLCount();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: NonMutantCellLineGetAPI.get");
			});

		}	
		
		// when an object is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			removeSearchResultsItem(vm.apiDomain.cellLineKey);

			// clear if now empty; otherwise, load next row
			if(vm.results.length == 0) {
				clear();
			}
			else {
				// adjust selected results index as needed, and load object
				if(vm.selectedIndex > vm.results.length -1) {
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
				if (vm.results[i].cellLineKey == keyToRemove) {
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
                                document.getElementById("cellLine").focus();
                        }, (200));
		}

		/////////////////////////////////////////////////////////////////////
		// validating
		/////////////////////////////////////////////////////////////////////		
		
		// validate strain
		function validateStrain(id) {
			console.log("validateStrain()");

			if (vm.apiDomain.strain == undefined || vm.apiDomain.strain == "") {
				vm.apiDomain.strainKey = "";
				vm.apiDomain.strain = "";
                                return;
			}

                        if (vm.apiDomain.strain.includes("%")) {
				vm.apiDomain.strainKey = "";
                                return;
                        }

			console.log("validateStrain(): " + vm.apiDomain.strain);
			ValidateStrainAPI.search({strain: vm.apiDomain.strain}, function(data) {
				if (data.length == 0) {
					alert("Invalid Strain");
					vm.apiDomain.strainKey = "";
					vm.apiDomain.strain = "";
					document.getElementById(id).focus();
				} else {
					if (data[0].isPrivate == "1") {
						alert("This value is designated as 'private' and cannot be used: " + vm.apiDomain.strain);
						vm.apiDomain.strainKey = "";
						vm.apiDomain.strain = "";
						document.getElementById(id).focus();
					}
					else {
						vm.apiDomain.strainKey = data[0].strainKey;
						vm.apiDomain.strain = data[0].strain;
					}
				}

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateStrainAPI.search");
				document.getElementById(id).focus();
			});
		}

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
		$scope.clear = clear;
		$scope.create = create;
		$scope.modify = modify;
		$scope.delete = deleteIt;

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

		// other functions: buttons, onBlurs and onChanges
		$scope.selectResult = selectResult;
		$scope.validateStrain = validateStrain;
		
		// global shortcuts
		$scope.KclearAll = function() { $scope.clear(); $scope.$apply(); }
		$scope.Ksearch = function() { $scope.search(); $scope.$apply(); }
		$scope.Kfirst = function() { $scope.firstSummaryObject(); $scope.$apply(); }
		$scope.Knext = function() { $scope.nextSummaryObject(); $scope.$apply(); }
		$scope.Kprev = function() { $scope.prevSummaryObject(); $scope.$apply(); }
		$scope.Klast = function() { $scope.lastSummaryObject(); $scope.$apply(); }
                $scope.Kadd = function() { $scope.create(); $scope.$apply(); }
                $scope.Kmodify = function() { $scope.modify(); $scope.$apply(); }
                $scope.Kdelete = function() { $scope.delete(); $scope.$apply(); }

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

