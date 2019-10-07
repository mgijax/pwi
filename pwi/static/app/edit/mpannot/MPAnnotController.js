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
			MPAnnotGetAPI,
			MPAnnotUpdateAPI,
			MPAnnotTotalCountAPI,
			// global APIs
			ValidateJnumAPI,
			VocTermSearchAPI,
			ValidateTermAPI
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
		vm.hideLoadingHeader = false;   // display loading header
		
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
			addRow();
		}


		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        	// mapped to 'Clear' button; called from init();  resets page
		function clear() {		
			resetData();
                        refreshTotalCount();
			setFocus();
			addRow();
		}		

		// mapped to query 'Search' button
		// default is to select first result
		function search() {				
			console.log(vm.objectData);
		
			var params = {};

			// if accID is included for search, then ignore all other parameters...
			if (((vm.objectData.mgiAccessionIds != undefined)
			   && (vm.objectData.mgiAccessionIds[0].accID != null)
			   && (vm.objectData.mgiAccessionIds[0].accID.trim() != ""))
			   ) {
				params.mgiAccessionIds = vm.objectData.mgiAccessionIds;
			}
			else {
				params = vm.objectData;
			}

			pageScope.loadingStart();
			
			// call API to search; pass query params (vm.selected)
			MPAnnotSearchAPI.search(params, function(data) {
				
				vm.results = data;
				vm.selectedIndex = 0;
				if (vm.results.length > 0) {
					loadObject();
				}
				pageScope.loadingEnd();
				setFocus();

			}, function(err) { // server exception
				pageScope.handleError(vm, "Error while searching");
				pageScope.loadingEnd();
				setFocus();
			});
		}		

        	// called when user clicks a row in the results
		function setObject(index) {
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
			setFocus();
		}
	
		// refresh the total count
                function refreshTotalCount() {
                        MPAnnotTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

        	// modify annotations
		function modifyAnnot() {
			console.log("modifyAnnot() -> MPAnnotUpdateAPI()");
			var allowCommit = true;

			// check required

			if (allowCommit){

				pageScope.loadingStart();

				MPAnnotUpdateAPI.update(vm.objectData, function(data) {
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						vm.objectData = data.items[0];
					}
					pageScope.loadingEnd();
				}, function(err) {
					pageScope.handleError(vm, "Error updating mpannot.");
					pageScope.loadingEnd();
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

			vm.results = [];
			vm.selectedIndex = 0;
			vm.errorMsg = '';
			vm.total_count = 0;

			// rebuild empty objectData submission object, else bindings fail
			vm.objectData = {};
			vm.objectData.genotypeKey = "";	
			vm.objectData.mgiAccessionIds = [];
			vm.objectData.mgiAccessionIds[0] = {"accID":""};			
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");

			vm.objectData.genotypeKey = "";	
			vm.objectData.mpAnnots = [];
			addRow();
		}

		// load vocabularies
                function loadVocabs() {

                        console.log("loadVocabs()");

			vm.qualifierLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"54"}, function(data) { 
				vm.qualifierLookup = data.items[0].terms
				for(var i=0;i<vm.qualifierLookup.length; i++) {
					if (vm.qualifierLookup[i].abbreviation == null) {
						vm.qualifierLookup[i].abbreviation = "(null)";
					}
				}
			});;

			vm.evidenceLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"2"}, function(data) { vm.evidenceLookup = data.items[0].terms});;

			vm.mpSexSpecificityLookup = {};
                        VocTermSearchAPI.search({"name":"MP-Sex-Specificity"}, function(data) { vm.mpSexSpecificityLookup = data.items[0].terms});;
                }

		// load a selected object from results
		function loadObject() {
			console.log("loadObject()");

			if (vm.results.length == 0) {
				return;
			}

			// api get object by primary key
			MPAnnotGetAPI.get({ key: vm.results[vm.selectedIndex].genotypeKey }, function(data) {

				vm.objectData = data;
				vm.objectData.genotypeDisplay = vm.results[vm.selectedIndex].genotypeDisplay;

				// create new rows
                        	for(var i=0;i<5; i++) {
                                	addRow();
                        	}

			}, function(err) {
				pageScope.handleError(vm, "Error retrieving data object.");
			});
		}	
		
		// when an mpannot is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove mpannot (and thumbnail, if it exists)
			removeSearchResultsItem(vm.objectData.genotypeKey);

			// clear if now empty; otherwise, load next row
			if (vm.results.length == 0) {
				clear();
			}
			else {
				// adjust selected results index as needed, and load mpannot
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
				if (vm.results[i].genotypeKey == keyToRemove) {
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
			input.focus(document.getElementById("genotypeDisplay"));
		}

        	// validate jnum
		function validateJnum(row, id) {		
			console.log("validateJnum = " + id);

			if (row.jnumid == "") {
				row.refsKey = "";
				row.short_citation = "";
				return;
			}

			ValidateJnumAPI.query({ jnum: row.jnumid }, function(data) {
				if (data.length == 0) {
					alert("Invalid Reference: " + row.jnumid);
					row.refsKey = "";
                                       	row.jnumid = ""; 
					row.short_citation = "";
					document.getElementById(id).focus();
				} else {
					row.refsKey = data[0].refsKey;
					row.jnumid = data[0].jnumid;
					row.short_citation = data[0].short_citation;
				}

			}, function(err) {
				pageScope.handleError(vm, "Invalid Reference");
				row.refsKey = "";
                                row.jnumid = ""; 
				row.short_citation = "";
				document.getElementById(id).focus();
			});
		}		

        	// validate mp acc id
		function validateTerm(row, id) {		
			console.log("validateTerm = " + id);

			if (row.mpIds[0].accID == "") {
				row.vocabKey = "";
				row.termKey = "";
				row.term = "";
				return;
			}
			//if ((row.mpIds[0].accID != "")
			//    && (row.term != "")) {
			//	return;
			//}

			// json for term search
			var params = {};
			params.vocabKey = "5";

			// if search obsolete == true, then includeObsolete = true
			params.includeObsolete = false;

			params.accessionIds = [];
			params.accessionIds.push({"accID":row.mpIds[0].accID.trim()});
			//console.log(params);

			ValidateTermAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid MP Acc ID: " + params.accessionIds[0].accID);
					document.getElementById(id).focus();
					row.vocabKey = "";
					row.termKey = "";
					row.term = "";
					row.mpIds[0].accID = "";
				} else {
					row.vocabKey = data[0].vocabKey;
					row.termKey = data[0].termKey;
					row.term = data[0].term;
					row.mpIds[0].accID = data[0].accessionIds[0].accID;
				}

			}, function(err) {
				pageScope.handleError(vm, "Invalid MP Acc ID");
				document.getElementById(id).focus();
				row.vocabKey = "";
				row.termKey = "";
				row.term = "";
				row.mpIds[0].accID = "";
			});
		}		

		/////////////////////////////////////////////////////////////////////
		// annotations 
		/////////////////////////////////////////////////////////////////////		
		
		// set processStatus if existing row has changed
		function changeRow(row, subrow) {
			if (row.processStatus == "x") {
				row.processStatus = "u";
				subrow.processStatus = "u";
			};
		}

		// add new annotation row
		function addRow() {

			if (vm.objectData.mpAnnots == undefined) {
				vm.objectData.mpAnnots = [];
			}

			var i = vm.objectData.mpAnnots.length;

			vm.objectData.mpAnnots[i] = {
				"processStatus": "c",
				"annotKey": "",
				"annotTypeKey": "1002",
			        "objectKey": vm.objectData.genotypeKey,
			        "termKey": "",
			        "term": "",
			        "qualifierKey": "",
			        "qualifierAbbreviation": ""
			}

			// at most 1 evidence row
			vm.objectData.mpAnnots[i].evidence = [];
			vm.objectData.mpAnnots[i].evidence[0] = {
				"processStatus": "c",
				"annotEvidenceKey": "",
				"annotKey": "",
			        "evidenceTermKey": "",
			        "evidenceAbbreviation": "",
			        "jnumid": "",
				"short_citation": ""
			}

			// at most 1 MP id row
			vm.objectData.mpAnnots[i].mpIds = [];
			vm.objectData.mpAnnots[i].mpIds[0] = {
				"accID": ""
			}

		}		

                //
		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
		$scope.clear = clear;
		$scope.modifyAnnot = modifyAnnot;
		$scope.changeRow = changeRow;
		$scope.addRow = addRow;

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

		// other functions: buttons, onBlurs and onChanges
		$scope.setObject = setObject;
		$scope.validateJnum = validateJnum;
		$scope.validateTerm = validateTerm;
		
		// global shortcuts
		$scope.KclearAll = function() { $scope.clear(); $scope.$apply(); }
		$scope.Ksearch = function() { $scope.search(); $scope.$apply(); }
		$scope.Kfirst = function() { $scope.firstSummaryObject(); $scope.$apply(); }
		$scope.Knext = function() { $scope.nextSummaryObject(); $scope.$apply(); }
		$scope.Kprev = function() { $scope.prevSummaryObject(); $scope.$apply(); }
		$scope.Klast = function() { $scope.lastSummaryObject(); $scope.$apply(); }
		$scope.Kmodify = function() { $scope.modifyAnnot(); $scope.$apply(); }

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

