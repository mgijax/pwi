(function() {
	'use strict';
	angular.module('pwi.strain').controller('StrainController', StrainController);

	function StrainController(
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
			StrainSearchAPI,
			StrainGetAPI,
			StrainCreateAPI,
			StrainUpdateAPI,
			StrainDeleteAPI,
			StrainTotalCountAPI,
			// global APIs
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
		vm.selectedAttributeIndex = 0;
		vm.selectedNeedsReviewIndex = 0;
		vm.selectedMarkerIndex = 0;
		
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			resetData();
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
			
			StrainSearchAPI.search(vm.apiDomain, function(data) {
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
				pageScope.handleError(vm, "API ERROR: StrainSearchAPI.search");
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
                        StrainTotalCountAPI.get(function(data){
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

			console.log("create() -> StrainCreateAPI()");
			pageScope.loadingStart();

			StrainCreateAPI.create(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					vm.apiDomain = data.items[0];
                                               vm.selectedIndex = vm.results.length;
                                               vm.results[vm.selectedIndex] = [];
                                               vm.results[vm.selectedIndex].strainKey = vm.apiDomain.strainKey;
					vm.results[vm.selectedIndex].fullName = vm.apiDomain.fullName;
					loadObject();
					refreshTotalCount();
				}
				pageScope.loadingEnd();
                                setFocus();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: StrainCreateAPI.create");
				pageScope.loadingEnd();
                                setFocus();
			});
		}		

        	// modify
		function modify() {
			console.log("modify() -> StrainUpdateAPI()");

			// verify if record selected
                        if (vm.selectedIndex < 0) {
				alert("Cannot Modify if a record is already selected.");
                                return;
			}

			pageScope.loadingStart();

			StrainUpdateAPI.update(vm.apiDomain, function(data) {
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
				pageScope.handleError(vm, "API ERROR: StrainUpdateAPI.update");
				pageScope.loadingEnd();
                                setFocus();
			});
		}		
		
        	// delete
		function deleteIt() {
			console.log("deleteIt() -> StrainDeleteAPI() : " + vm.selectedIndex);

			// check if record selected
			if (vm.selectedIndex < 0) {
				alert("Cannot Delete if a record is not selected.");
				return;
			}

			if ($window.confirm("Are you sure you want to delete this record?")) {
			
				pageScope.loadingStart();

				StrainDeleteAPI.delete({key: vm.apiDomain.strainKey}, function(data) {
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
					pageScope.handleError(vm, "API ERROR: StrainDeleteAPI.delete");
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
		function resetData() {
			console.log("resetData()");

			vm.results = [];
			vm.selectedIndex = -1;
		        vm.selectedAttributeIndex = 0;
		        vm.selectedNeedsReviewIndex = 0;
		        vm.selectedMarkerIndex = 0;
                        vm.total_count = 0;
                        vm.apiDomain = {};
                        resetDataDeselect();
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");
			vm.apiDomain.strainKey = "";	
                        vm.apiDomain.strain = "";
                        vm.apiDomain.standard = "";
                        vm.apiDomain.isPrivate = "";
                        vm.apiDomain.geneticBackground = "";
                        vm.apiDomain.speciesKey = "";
                        vm.apiDomain.species = "";
                        vm.apiDomain.strainTypeKey = "";
                        vm.apiDomain.strainType = "";
			vm.apiDomain.createdBy = "";
			vm.apiDomain.creation_date = "";
			vm.apiDomain.modifiedBy = "";
			vm.apiDomain.modification_date = "";
                        vm.apiDomain.accID = "";

                        addAttributeRow();
                        addNeedsReviewRow();

		}

		// load vocabularies
                function loadVocabs() {
                        console.log("loadVocabs()");

			vm.strainSpeciesLookup = {};
			VocTermSearchAPI.search({"vocabKey":"26"}, function(data) { vm.strainSpeciesLookup = data.items[0].terms});;

			vm.strainTypeLookup = {};
			VocTermSearchAPI.search({"vocabKey":"55"}, function(data) { vm.strainTypeLookup = data.items[0].terms});;

			vm.strainAttributeLookup = {};
			VocTermSearchAPI.search({"vocabKey":"27"}, function(data) { vm.strainAttributeLookup = data.items[0].terms});;

			vm.strainNeedsReviewLookup = {};
			VocTermSearchAPI.search({"vocabKey":"56"}, function(data) { vm.strainNeedsReviewLookup = data.items[0].terms});;

                        vm.isPrivateLookup = [];
                        vm.isPrivateLookup[0] = {
                                "termKey": "1",
                                "term": "Yes"
                        }
                        vm.isPrivateLookup[1] = {
                                "termKey": "0",
                                "term": "No"
                        }

                        vm.isStandardLookup = [];
                        vm.isStandardLookup[0] = {
                                "termKey": "1",
                                "term": "Yes"
                        }
                        vm.isStandardLookup[1] = {
                                "termKey": "0",
                                "term": "No"
                        }

                        vm.isPrefixLookup = [];
                        vm.isPrefixLookup[0] = {
                                "termKey": "1",
                                "term": "Yes"
                        }
                        vm.isPrefixLookup[1] = {
                                "termKey": "0",
                                "term": "No"
                        }

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

			StrainGetAPI.get({ key: vm.results[vm.selectedIndex].strainKey }, function(data) {
				vm.apiDomain = data;
				vm.apiDomain.strainKey = vm.results[vm.selectedIndex].strainKey;
                                addAttributeRow();
                                addNeedsReviewRow();
				vm.results[vm.selectedIndex].name = vm.apiDomain.name;
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: StrainGetAPI.get");
			});
		}	
		
		// when an object is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove object, if it exists)
			removeSearchResultsItem(vm.apiDomain.strainKey);

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
				if (vm.results[i].strainKey == keyToRemove) {
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
                                document.getElementById("strain").focus();
                        }, (200));
		}

		/////////////////////////////////////////////////////////////////////
		// attributes
		/////////////////////////////////////////////////////////////////////		
		
		// set current row
		function selectAttribute(index) {
			console.log("selectAttribute: " + index);
			vm.selectedAttributeIndex = index;

			if (vm.apiDomain.attributes == null | vm.apiDomain.attributes == undefined) {
                                return;
                        }

			if (vm.apiDomain.attributes.length == 0) {
				addAttributeRow();
			}
		}

		// if current row has changed
		function changeAttributeRow(index) {
			console.log("changeAttributeRow: " + index);

			vm.selectedAttributeIndex = index;

			if (vm.apiDomain.attributes[index] == null) {
				vm.selectedAttributeIndex = 0;
				return;
			}

			if (vm.apiDomain.attributes[index].processStatus == "x") {
				vm.apiDomain.attributes[index].processStatus = "u";
			};
                }

		// add new row
		function addAttributeRow() {
			console.log("addAttributeRow");

			if (vm.apiDomain.attributes == undefined) {
				vm.apiDomain.attributes = [];
			}

			var i = vm.apiDomain.attributes.length;

			vm.apiDomain.attributes[i] = {
				"processStatus": "c",
                                "annotKey": "",
                                "annotTypeKey": "1009",
                                "objectKey": vm.apiDomain.strainKey,
                                "termKey": "",
                                "term": "",
                                "qualifierKey": "1614158",
                                "creation_date": "",
                                "modification_date": ""
			}
		}		

		/////////////////////////////////////////////////////////////////////
		// needsReview
		/////////////////////////////////////////////////////////////////////		
		
		// set current row
		function selectNeedsReview(index) {
			console.log("selectNeedsReview: " + index);
			vm.selectedNeedsReviewIndex = index;

			if (vm.apiDomain.needsReview == null | vm.apiDomain.needsReview == undefined) {
                                return;
                        }

			if (vm.apiDomain.needsReview.length == 0) {
				addNeedsReviewRow();
			}
		}

		// if current row has changed
		function changeNeedsReviewRow(index) {
			console.log("changeNeedsReviewRow: " + index);

			vm.selectedNeedsReviewIndex = index;

			if (vm.apiDomain.needsReview[index] == null) {
				vm.selectedNeedsReviewIndex = 0;
				return;
			}

			if (vm.apiDomain.needsReview[index].processStatus == "x") {
				vm.apiDomain.needsReview[index].processStatus = "u";
			};
                }

		// add new row
		function addNeedsReviewRow() {
			console.log("addNeedsReviewRow");

			if (vm.apiDomain.needsReview == undefined) {
				vm.apiDomain.needsReview = [];
			}

			var i = vm.apiDomain.needsReview.length;

			vm.apiDomain.needsReview[i] = {
				"processStatus": "c",
                                "annotKey": "",
                                "annotTypeKey": "1008",
                                "objectKey": vm.apiDomain.strainKey,
                                "termKey": "",
                                "term": "",
                                "qualifierKey": "1614158",
                                "creation_date": "",
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

                $scope.changeAttributeRow = changeAttributeRow;
                $scope.addAttributeRow = addAttributeRow;
                $scope.selectAttribute = selectAttribute;

                $scope.changeNeedsReviewRow = changeNeedsReviewRow;
                $scope.addNeedsReviewRow = addNeedsReviewRow;
                $scope.selectNeedsReview = selectNeedsReview;

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

		// other functions: buttons, onBlurs and onChanges
		$scope.selectResult = selectResult;

		// global shortcuts
		$scope.Kclear = function() { $scope.clear(); $scope.$apply(); }
		$scope.Ksearch = function() { $scope.search(); $scope.$apply(); }
		$scope.Kfirst = function() { $scope.firstSummaryObject(); $scope.$apply(); }
		$scope.Knext = function() { $scope.nextSummaryObject(); $scope.$apply(); }
		$scope.Kprev = function() { $scope.prevSummaryObject(); $scope.$apply(); }
		$scope.Klast = function() { $scope.lastSummaryObject(); $scope.$apply(); }
		$scope.Kadd = function() { $scope.create(); $scope.$apply(); }
		$scope.Kmodify = function() { $scope.modify(); $scope.$apply(); }
		$scope.Kdelete = function() { $scope.deleteIt(); $scope.$apply(); }

		var globalShortcuts = Mousetrap($document[0].body);
		globalShortcuts.bind(['ctrl+alt+c'], $scope.Kclear);
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

