(function() {
	'use strict';
	angular.module('pwi.allelefear').controller('AlleleFearController', AlleleFearController);

	function AlleleFearController(
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
			AlleleFearSearchAPI,
			AlleleFearGetAPI,
			AlleleFearUpdateAPI,
			AlleleFearTotalCountAPI,
			// global APIs
			ValidateJnumAPI,
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
		vm.selectedRelationshipIndex = 0;
		vm.selectedPropertyIndex = 0;
		
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			resetData();
			refreshTotalCount();
			loadVocabs();
			addRelationshipRow();
			addRelationshipRow();

                        if (document.location.search.length > 0) {
                                searchByAlleleKey();
                        }

		}

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        	// mapped to 'Clear' button; called from init();  resets page
		function clear() {		
			resetData();
                        refreshTotalCount();
			addRelationshipRow();
			addRelationshipRow();
			setFocus();
		}		

		// mapped to query 'Search' button
		// default is to select first result
		function search() {				
			console.log(vm.apiDomain);
		
			pageScope.loadingStart();
			
			AlleleFearSearchAPI.search(vm.apiDomain, function(data) {
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
				pageScope.handleError(vm, "API ERROR: AlleleFearSearchAPI.search");
				pageScope.loadingEnd();
				setFocus();
			});
		}		

		function searchAccId() {
			console.log("searchAccId");

                        if (vm.results.length > 0) {
                                return;
                        }

			if (vm.apiDomain.alleleKey == "" && vm.apiDomain.accID != "") {
				search();
			}
		}

		function searchByAlleleKey() {				
			console.log("searchByAlleleKey: " + document.location.search);
			var stuff = document.location.search.split("?allele_key=");
                        vm.apiDomain.relationships[0].refsKey = stuff[1];
                        search();
		}		

		function searchDisplay() {
			console.log("searchDisplay");

			if (vm.apiDomain.alleleKey == "" && vm.apiDomain.alleleDisplay != "") {
				search();
			}
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
                        AlleleFearTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////
		
        	// modify relatioships
		function modifyRelationship() {
			console.log("modifyRelationship() -> AlleleFearUpdateAPI()");

			// check if record selected
			if(vm.selectedIndex < 0) {
				alert("Cannot Modify if a record is not selected.");
				return;
			}
			
			pageScope.loadingStart();

			AlleleFearUpdateAPI.update(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					loadObject();
				}
				pageScope.loadingEnd();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AlleleFearUpdateAPI.update");
				pageScope.loadingEnd();
			});
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
			vm.selectedRelationshipIndex = 0;
			vm.total_count = 0;

			// rebuild empty apiDomain submission object, else bindings fail
			vm.apiDomain = {};
			vm.apiDomain.alleleKey = "";	
			vm.apiDomain.alleleDisplay = "";	
			vm.apiDomain.alleleSymbol = "";	
			vm.apiDomain.accID = "";
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");

			vm.apiDomain.alleleKey = "";	
			vm.apiDomain.alleleDisplay = "";	
			vm.apiDomain.alleleSymbol = "";	
			vm.apiDomain.accID = "";
			vm.apiDomain.relationships = [];
			addRelationshipRow();
		}

		// load vocabularies
                function loadVocabs() {
                        console.log("loadVocabs()");

			vm.relationshipLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"96"}, function(data) { vm.relationshipLookup = data.items[0].terms });;

			vm.qualifierLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"94"}, function(data) { vm.qualifierLookup = data.items[0].terms });;

			vm.evidenceLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"95"}, function(data) { vm.evidenceLookup = data.items[0].terms });;

			vm.propertyLookup = {};
			VocTermSearchAPI.search({"vocabKey":"97"}, function(data) { vm.propertyLookup = data.items[0].terms});;
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

			AlleleFearGetAPI.get({ key: vm.results[vm.selectedIndex].alleleKey }, function(data) {
				vm.apiDomain = data;
				vm.apiDomain.alleleKey = vm.results[vm.selectedIndex].alleleKey;
				vm.apiDomain.alleleDisplay = vm.results[vm.selectedIndex].alleleDisplay;
			        vm.apiDomain.alleleSymbol = vm.results[vm.selectedIndex].alleleSymbol;
				selectRelationship(0);
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AlleleFearGetAPI.get");
			});
		}	
		
		// handle removal from results list
		function removeSearchResultsItem(keyToRemove) {
			
			// first find the item to remove
			var removeIndex = -1;
			for(var i=0;i<vm.results.length; i++) {
				if (vm.results[i].alleleKey == keyToRemove) {
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
                                document.getElementById("alleleDisplay").focus();
                        }, (200));
		}

		/////////////////////////////////////////////////////////////////////
		// validating
		/////////////////////////////////////////////////////////////////////		
		
        	// validate jnum
		function validateJnum(row, index, id) {		
			console.log("validateJnum = " + id + index);

			id = id + index;

			if (row.jnumid == undefined || row.jnumid == "") {
				if (index > 0) {
					row.refsKey = vm.apiDomain.relationships[index-1].refsKey;
					row.jnumid = vm.apiDomain.relationships[index-1].jnumid;
					row.jnum = vm.apiDomain.relationships[index-1].jnum;
					row.short_citation = vm.apiDomain.relationships[index-1].short_citation;
					return;
				}
				else {
					row.refsKey = "";
					row.jnumid = "";
					row.jnum = null;
					row.short_citation = "";
					return;
				}
			}

                        if (row.jnumid.includes("%")) {
                                return;
                        }

			ValidateJnumAPI.query({ jnum: row.jnumid }, function(data) {
				if (data.length == 0) {
					alert("Invalid Reference: " + row.jnumid);
					document.getElementById(id).focus();
					row.refsKey = "";
					row.jnumid = "";
					row.jnum = null;
					row.short_citation = "";
				} else {
					row.refsKey = data[0].refsKey;
					row.jnumid = data[0].jnumid;
					row.jnum = parseInt(data[0].jnum, 10);
					row.short_citation = data[0].short_citation;
				}

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateJnumAPI.query");
				document.getElementById(id).focus();
				row.refsKey = "";
                                row.jnumid = ""; 
                                row.jnum = null; 
				row.short_citation = "";
			});
		}		

		/////////////////////////////////////////////////////////////////////
		// relationships
		/////////////////////////////////////////////////////////////////////		
		
		// set current relationship row
		function selectRelationship(index) {
			console.log("selectRelationship: " + index);
			vm.selectedRelationshipIndex = index;
			vm.selectedPropertyIndex = 0;

			if (vm.apiDomain.relationships.length == 0) {
				addRelationshipRow();
			}
		}

		// set current property row
		function selectProperty(index) {
			console.log("selectProperty: " + index);
			vm.selectedPropertyIndex = index;
		}

		//
		// change of row/field detected
		//
		
		// if current relationship row has changed
		function changeRelationshipRow(index) {
			console.log("changeRelationshipRow: " + index);

			vm.selectedRelationshipIndex = index;

			if (vm.apiDomain.relationships[index] == null) {
				vm.selectedRelationshipIndex = 0;
				return;
			}

			if (vm.apiDomain.relationships[index].processStatus == "x") {
				vm.apiDomain.relationships[index].processStatus = "u";
			};
                }

		// add new relationship row
		function addRelationshipRow() {
			console.log("addRelationshipRow");

			if (vm.apiDomain.relationships == undefined) {
				vm.apiDomain.relationships = [];
			}

			var i = vm.apiDomain.relationships.length;

			vm.apiDomain.relationships[i] = {
				"processStatus": "c",
				"relationshipKey": "",
			       	"alleleKey": vm.apiDomain.alleleKey,
                                "alleleSymbol": "",
			       	"markerKey": "",
                                "markerSymbol": "",
			       	"categoryKey": "",
			       	"categoryTerm": "",
			       	"relationshipTermKey": "",
			       	"relationshipTerm": "",
			       	"qualifierKey": "",
			       	"qualifierTerm": "",
			       	"evidenceKey": "",
			       	"evidenceTerm": "",
				"refsKey": "",
			       	"jnumid": "",
				"short_citation": "",
				"createdBy": "",
				"creation_date": "",
				"modifiedBy": "",
				"modification_date": ""
			}

			addPropertyRow(i);
		}		

		// if current property row has changed
		function changePropertyRow(index) {
			console.log("changePropertyRow: " + index);

			vm.selectedPropertyIndex = index;

			if (vm.apiDomain.relationships[vm.selectedRelationshipIndex].properties == null) {
				vm.selectedPropertyIndex = 0;
				return;
			}

			if (vm.apiDomain.relationships[vm.selectedRelationshipIndex].processStatus == "x") {
				vm.apiDomain.relationships[vm.selectedRelationshipIndex].processStatus = "u";
			}

			if (vm.apiDomain.relationships[vm.selectedRelationshipIndex].properties[index].processStatus == "x") {
				vm.apiDomain.relationships[vm.selectedRelationshipIndex].properties[index].processStatus = "u";
			}

		}

		// add new property row
		function addPropertyRow(index) {
			console.log("addPropertyRow: " + index);

			//if (vm.apiDomain.relationships.length == 0) {
			//	addRelationshipRow();
			//}
			if (vm.apiDomain.relationships[index].properties == undefined) {
				vm.apiDomain.relationships[index].properties = [];
			}

			var i = vm.apiDomain.relationships[index].properties.length;
			var sequenceNum = i + 1;
			
			vm.apiDomain.relationships[index].properties[i] = {
				"processStatus": "c",
				"relationshipPropertyKey": "",
				"relationshipKey": vm.apiDomain.relationships[index].relationshipKey,
			       	"propertyNameKey": "",
			       	"propertyName": "",
			       	"sequenceNum": sequenceNum,
				"value": ""
			}
		}		

		// delete property row
		function deletePropertyRow(index) {
			console.log("deletePropertyRow: " + index);
			if (vm.apiDomain.relationships[vm.selectedRelationshipIndex].processStatus == "x") {
				vm.apiDomain.relationships[vm.selectedRelationshipIndex].processStatus = "u";
			}
			vm.apiDomain.relationships[vm.selectedRelationshipIndex].properties[index].processStatus = "d";
		}

                //
		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
		$scope.searchAccId = searchAccId;
		$scope.searchDisplay = searchDisplay;
		$scope.clear = clear;
		$scope.modifyRelationship = modifyRelationship;
		$scope.changeRelationshipRow = changeRelationshipRow;
		$scope.addRelationshipRow = addRelationshipRow;
		$scope.changePropertyRow = changePropertyRow;
		$scope.addPropertyRow = addPropertyRow;
		$scope.deletePropertyRow = deletePropertyRow;
		$scope.selectRelationship = selectRelationship;
		$scope.selectProperty = selectProperty;

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

		// other functions: buttons, onBlurs and onChanges
		$scope.selectResult = selectResult;
		$scope.validateJnum = validateJnum;
		
		// global shortcuts
		$scope.KclearAll = function() { $scope.clear(); $scope.$apply(); }
		$scope.Ksearch = function() { $scope.search(); $scope.$apply(); }
		$scope.Kfirst = function() { $scope.firstSummaryObject(); $scope.$apply(); }
		$scope.Knext = function() { $scope.nextSummaryObject(); $scope.$apply(); }
		$scope.Kprev = function() { $scope.prevSummaryObject(); $scope.$apply(); }
		$scope.Klast = function() { $scope.lastSummaryObject(); $scope.$apply(); }
		$scope.Kmodify = function() { $scope.modifyRelationship(); $scope.$apply(); }

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

