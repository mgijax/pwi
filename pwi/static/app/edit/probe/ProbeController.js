(function() {
	'use strict';
	angular.module('pwi.probe').controller('ProbeController', ProbeController);

	function ProbeController(
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
			ProbeSearchAPI,
			ProbeGetAPI,
			ProbeCreateAPI,
			ProbeUpdateAPI,
			ProbeDeleteAPI,
			ProbeTotalCountAPI,
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
		vm.selectedRefIndex = 0;
		vm.selectedAliasIndex = 0;
		
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			resetData();
			refreshTotalCount();
			loadVocabs();
			addRefRow();
			addRefRow();
			addRefRow();
			addRefRow();
			addRefRow();
		}

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        	// mapped to 'Clear' button; called from init();  resets page
		function clear() {		
			resetData();
                        refreshTotalCount();
			addRefRow();
			addRefRow();
			addNote();
			setFocus();
		}		

		// mapped to query 'Search' button
		// default is to select first result
		function search() {				
			console.log(vm.apiDomain);
		
			pageScope.loadingStart();
			
			ProbeSearchAPI.search(vm.apiDomain, function(data) {
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
				pageScope.handleError(vm, "API ERROR: ProbeSearchAPI.search");
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
                        ProbeTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////
		
        	// create
		function create() {
			console.log("create()");
			vm.allowCommit = true;

			// verify if record selected
			if (vm.selectedIndex >= 0) {
				alert("Cannot Add if a record is already selected.");
				vm.allowCommit = false;
                                return;
			}

			if (vm.allowCommit){
			        console.log("create() -> allowCommit -> ProbeCreateAPI()");
				pageScope.loadingStart();

				ProbeCreateAPI.create(vm.apiDomain, function(data) {
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						vm.apiDomain = data.items[0];
                                                vm.selectedIndex = vm.results.length;
                                                vm.results[vm.selectedIndex] = [];
                                                vm.results[vm.selectedIndex].alleleKey = vm.apiDomain.alleleKey;
						vm.results[vm.selectedIndex].symbol = vm.apiDomain.symbol;
						loadObject();
						refreshTotalCount();
					}
					pageScope.loadingEnd();
                                        setFocus();
				}, function(err) {
					pageScope.handleError(vm, "API ERROR: ProbeCreateAPI.create");
					pageScope.loadingEnd();
                                        setFocus();
				});
			}
		}		

        	// modify
		function modify() {
			console.log("modify() -> ProbeUpdateAPI()");
			vm.allowCommit = true;

			if (vm.allowCommit){
			        pageScope.loadingStart();

				ProbeUpdateAPI.update(vm.apiDomain, function(data) {
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
					pageScope.handleError(vm, "API ERROR: ProbeUpdateAPI.update");
					pageScope.loadingEnd();
                                        setFocus();
				});
		        }
		        else {
			    loadObject();
			    pageScope.loadingEnd();
                                   setFocus();
		        }
		}		
		
        	// delete
		function deleteIt() {
			console.log("deleteIt() -> ProbeDeleteAPI() : " + vm.selectedIndex);
			vm.allowCommit = true;

			// check if record selected
			if (vm.selectedIndex < 0) {
				alert("Cannot Delete if a record is not selected.");
				vm.allowCommit = false;
			}

			if (vm.allowCommit && $window.confirm("Are you sure you want to delete this record?")) {
			
				pageScope.loadingStart();

				ProbeDeleteAPI.delete({key: vm.apiDomain.alleleKey}, function(data) {
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
					pageScope.handleError(vm, "API ERROR: ProbeDeleteAPI.delete");
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
			vm.selectedRefIndex = 0;
			vm.total_count = 0;

			// rebuild empty apiDomain submission object, else bindings fail
			vm.apiDomain = {};
			vm.apiDomain.probeKey = "";	
			vm.apiDomain.name = "";	
			vm.apiDomain.regionCovered = "";	
			vm.apiDomain.accID = "";
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");

			vm.apiDomain.probeKey = "";	
			vm.apiDomain.name = "";	
			vm.apiDomain.regionCovered = "";	
			vm.apiDomain.accID = "";
			addRefRow();
		}

		// load vocabularies
                function loadVocabs() {
                        console.log("loadVocabs()");

			vm.segmentLookup = {};
			VocTermSearchAPI.search({"vocabKey":"10"}, function(data) { vm.segmentLookup = data.items[0].terms});;

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

			ProbeGetAPI.get({ key: vm.results[vm.selectedIndex].probeKey }, function(data) {
				vm.apiDomain = data;
				vm.apiDomain.probeKey = vm.results[vm.selectedIndex].probeKey;
				vm.apiDomain.name = vm.results[vm.selectedIndex].name;
				selectRef(0);
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ProbeGetAPI.get");
			});
		}	
		
		// when an annot is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove annot (and thumbnail, if it exists)
			removeSearchResultsItem(vm.apiDomain.probeKey);

			// clear if now empty; otherwise, load next row
			if (vm.results.length == 0) {
				clear();
			}
			else {
				// adjust selected results index as needed, and load annot
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
				if (vm.results[i].probeKey == keyToRemove) {
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
			input.focus(document.getElementById("name"));
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
					row.refsKey = vm.apiDomain.references[index-1].refsKey;
					row.jnumid = vm.apiDomain.references[index-1].jnumid;
					row.jnum = vm.apiDomain.references[index-1].jnum;
					row.short_citation = vm.apiDomain.references[index-1].short_citation;
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
		// references
		/////////////////////////////////////////////////////////////////////		
		
		// set current annotation row
		function selectRef(index) {
			console.log("selectRef: " + index);
			vm.selectedRefIndex = index;
			vm.selectedAliasIndex = 0;

			if (vm.apiDomain.references.length == 0) {
				addRefRow();
			}
		}

		// set current alias row
		function selectAlias(index) {
			console.log("selectAlias: " + index);
			vm.selectedAliasIndex = index;

			if (vm.apiDomain.references.length == 0) {
				addRefRow();
			}
		}

		// if current annotation row has changed
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

                        if ((vm.apiDomain.references[index].termKey != null && vm.apiDomain.references[index].termKey != "")
                             && (vm.apiDomain.references[index].evidenceTermKey == "118")
                             && ((vm.apiDomain.references[index].termid != "GO:0008150")
                                || (vm.apiDomain.references[index].termid != "GO:0005575")
                                || (vm.apiDomain.references[index].termid != "GO:0003674"))) {
                                alert("ND can only use for GO:0008150, GO:0005575, GO:0003674");
                                vm.apiDomain.references[index].evidenceTermKey= "";
                        }
                }

		// add new annotation row
		function addRefRow() {
			console.log("addRefRow");

			if (vm.apiDomain.references == undefined) {
				vm.apiDomain.references = [];
			}

			var i = vm.apiDomain.references.length;

			vm.apiDomain.references[i] = {
				"processStatus": "c",
				"referenceKey": "",
			       	"probeKey": vm.apiDomain.probeKey,
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

			addAliasRow(i);
			addAliasRow(i);
			addAliasRow(i);
			addAliasRow(i);
			addAliasRow(i);
		}		

		// if current alias row has changed
		function changeAliasRow(index) {
			console.log("changeAliasRow: " + index);

			vm.selectedAliasIndex = index;

			if (vm.apiDomain.references[vm.selectedRefIndex].aliases == null) {
				vm.selectedAliasIndex = 0;
				return;
			}

			if (vm.apiDomain.references[vm.selectedRefIndex].processStatus == "x") {
				vm.apiDomain.references[vm.selectedRefIndex].processStatus = "u";
			}

			if (vm.apiDomain.references[vm.selectedRefIndex].aliases[index].processStatus == "x") {
				vm.apiDomain.references[vm.selectedRefIndex].aliases[index].processStatus = "u";
			}

		}

		// add new alias row
		function addAliasRow(index) {
			console.log("addAliasRow: " + index);

			//if (vm.apiDomain.references.length == 0) {
			//	addRefRow();
			//}
			if (vm.apiDomain.references[index].aliases == undefined) {
				vm.apiDomain.references[index].aliases = [];
			}

			var i = vm.apiDomain.references[index].aliases.length;
			
			vm.apiDomain.references[index].aliases[i] = {
				"processStatus": "c",
				"aliasKey": "",
				"referenceKey": vm.apiDomain.references[index].annotEvidenceKey,
			       	"alias": ""
			}
		}		

		// delete alias row
		function deleteAliasRow(index) {
			console.log("deleteAliasRow: " + index);
			if (vm.apiDomain.references[vm.selectedRefIndex].processStatus == "x") {
				vm.apiDomain.references[vm.selectedRefIndex].processStatus = "u";
			}
			vm.apiDomain.references[vm.selectedRefIndex].aliases[index].processStatus = "d";
		}

		/////////////////////////////////////////////////////////////////////
		// notes
		/////////////////////////////////////////////////////////////////////		
		
		// add new note row
		function addNote() {
			console.log("addNote:");

                        if (vm.apiDomain.rawsequenceNote == undefined) {
                                vm.apiDomain.rawsequenceNote = [];
                        }

                        if (vm.apiDomain.rawsequenceNote.length > 0) {
				return;
			}

			vm.apiDomain.rawsequenceNote[0] = {
				"noteKey": "",
				"objectKey": vm.apiDomain.probeKey,
				"mgiTypeKey": "3",
				"noteTypeKey": "1037",
				"noteChunk": ""
			}
		}

                //
		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
		$scope.clear = clear;
		$scope.changeRefRow = changeRefRow;
		$scope.addRefRow = addRefRow;
		$scope.changeAliasRow = changeAliasRow;
		$scope.addAliasRow = addAliasRow;
		$scope.deleteAliasRow = deleteAliasRow;
		$scope.selectRef = selectRef;
		$scope.selectAlias = selectAlias;

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

