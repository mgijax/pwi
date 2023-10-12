(function() {
	'use strict';
	angular.module('pwi.mapping').controller('MappingController', MappingController);

	function MappingController(
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
			MappingSearchAPI,
			MappingGetAPI,
			MappingCreateAPI,
			MappingUpdateAPI,
			MappingDeleteAPI,
			MappingTotalCountAPI,
                        AssayTypeSearchAPI,
			// global APIs
                        ChromosomeSearchAPI,
                        ValidateJnumAPI,
                        ValidateAlleleAPI,
                        ValidateMarkerAPI,
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
			
			MappingSearchAPI.search(vm.apiDomain, function(data) {
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
				pageScope.handleError(vm, "API ERROR: MappingSearchAPI.search");
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
                        MappingTotalCountAPI.get(function(data){
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
                        if (vm.apiDomain.exptKey != null && vm.apiDomain.exptKey != "") {
				alert("Cannot Add if a record is already selected.");
                                return;
			}

			console.log("create() -> MappingCreateAPI()");
			pageScope.loadingStart();

			MappingCreateAPI.create(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					vm.apiDomain = data.items[0];
                                               vm.selectedIndex = vm.results.length;
                                               vm.results[vm.selectedIndex] = [];
                                               vm.results[vm.selectedIndex].exptKey = vm.apiDomain.exptKey;
					vm.results[vm.selectedIndex].exptDisplay = vm.apiDomain.exptDisplay;
                                        resetDataDeselect();
					refreshTotalCount();
				}
				pageScope.loadingEnd();
                                setFocus();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: MappingCreateAPI.create");
				pageScope.loadingEnd();
                                setFocus();
			});
		}		

        	// modify
		function modify() {
			console.log("modify() -> MappingUpdateAPI()");

			// verify if record selected
                        if (vm.selectedIndex < 0) {
				alert("Cannot Modify if a record is already selected.");
                                return;
			}

			pageScope.loadingStart();

			MappingUpdateAPI.update(vm.apiDomain, function(data) {
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
				pageScope.handleError(vm, "API ERROR: MappingUpdateAPI.update");
				pageScope.loadingEnd();
                                setFocus();
			});
		}		
		
        	// delete
		function deleteIt() {
			console.log("deleteIt() -> MappingDeleteAPI() : " + vm.selectedIndex);

			// check if record selected
			if (vm.selectedIndex < 0) {
				alert("Cannot Delete if a record is not selected.");
				return;
			}

			if ($window.confirm("Are you sure you want to delete this record?")) {
			
				pageScope.loadingStart();

				MappingDeleteAPI.delete({key: vm.apiDomain.exptKey}, function(data) {
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
					pageScope.handleError(vm, "API ERROR: MappingDeleteAPI.delete");
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
			vm.selectedMarkerIndex = 0;
                        vm.apiDomain = {};
                        resetDataDeselect();
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");
		        vm.selectedIndex = -1;
		        vm.selectedMarkerIndex = 0;
                        vm.apiDomain.exptDisplay = "";
                        vm.apiDomain.exptKey = "";
                        vm.apiDomain.exptType = "";
                        vm.apiDomain.chromosome = null;
                        vm.apiDomain.refsKey = "";
                        vm.apiDomain.jnumid = "";
                        vm.apiDomain.jnum = "";
                        vm.apiDomain.short_citation = "";
                        vm.apiDomain.creation_date = "";
                        vm.apiDomain.modification_date = "";
                        vm.apiDomain.accID = "";
                        vm.apiDomain.mgiAccessionIds = null;
                        vm.apiDomain.referenceNote = null;
			vm.apiDomain.exptNote = null;
			vm.apiDomain.markers = [];
                        addReferenceNote();
                        addExptNote();
			addMarkerRow();
		}

		// load vocabularies
                function loadVocabs() {
                        console.log("loadVocabs()");

                        vm.assayTypeLookup = {};
                        AssayTypeSearchAPI.search({}, function(data) { vm.assayTypeLookup = data});;

                        vm.chromosomeLookup = {};
                        ChromosomeSearchAPI.search({"organismKey":"1"}, function(data) { vm.chromosomeLookup = data});;

                        // only a sub-set of MLD_Expts.exptType are used/returned by API/get()
                        vm.exptTypeLookup = {};
			vm.exptTypeLookup[0] = {"term": "TEXT-QTL" };
			vm.exptTypeLookup[1] = {"term": "TEXT-Physical Mapping" };
			vm.exptTypeLookup[2] = {"term": "TEXT-Congenic" };
			vm.exptTypeLookup[3] = {"term": "TEXT-QTL-Candidate Genes" };
			vm.exptTypeLookup[4] = {"term": "TEXT-Meta Analysis" };
			vm.exptTypeLookup[5] = {"term": "TEXT" };
			vm.exptTypeLookup[6] = {"term": "TEXT-Genetic Cross" };

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

			MappingGetAPI.get({ key: vm.results[vm.selectedIndex].exptKey }, function(data) {
				vm.apiDomain = data;
				vm.apiDomain.exptKey = vm.results[vm.selectedIndex].exptKey;
				vm.results[vm.selectedIndex].name = vm.apiDomain.name;
				selectMarker(0);
                                addReferenceNote();
                                addExptNote();
			        addMarkerRow();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: MappingGetAPI.get");
			});
		}	
		
		// when an object is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove object, if it exists)
			removeSearchResultsItem(vm.apiDomain.exptKey);

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
				if (vm.results[i].exptKey == keyToRemove) {
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
                                document.getElementById("JNumID").focus();
                        }, (200));
		}

		/////////////////////////////////////////////////////////////////////
		// markers
		/////////////////////////////////////////////////////////////////////		
		
		// set current row
		function selectMarker(index) {
			console.log("selectMarker: " + index);
			vm.selectedMarkerIndex = index;

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
                                "exptKey": "",
                                "markerKey": "",
                                "markerChr": "",
                                "markerSymbol": "",
                                "markerAccID": "",
                                "alleleKey": "",
                                "alleleSymbol": "",
                                "assayTypeKey": "",
                                "assayType": "",
                                "description": "",
				"creation_date": "",
				"modification_date": ""
			}
		}		

                // reference notes
                
		// add reference note
		function addReferenceNote() {
			console.log("addReferenceNote()");

                        if (vm.apiDomain.referenceNote != null) {
                                return;
                        }

			vm.apiDomain.referenceNote = {
				"processStatus": "c",
				"refsKey": vm.apiDomain.refsKey,
                                "note": ""
			};
		}

		// clear reference note
		function clearReferenceNote() {
                        console.log("clearReferenceNote()");

			if (vm.apiDomain.referenceNote.processStatus == "x") {
                                vm.apiDomain.referenceNote.processStatus = "d";
                        };
                        vm.apiDomain.referenceNote.note = "";
		}

		// if reference note has changed
		function changeReferenceNote() {
                        console.log("changeReferenceNote()");

			if (vm.apiDomain.referenceNote.processStatus == "x") {
                                if (vm.apiDomain.referenceNote.note == null 
                                        || vm.apiDomain.referenceNote.note == "") {
                                        vm.apiDomain.referenceNote.processStatus = "d";
                                }
                                else {
                                        vm.apiDomain.referenceNote.processStatus = "u";
                                }
                        };
		}

                // expt notes
                
		// add expt note
		function addExptNote() {
			console.log("addExptNote()");

                        if (vm.apiDomain.exptNote != null) {
                                return;
                        }

			vm.apiDomain.exptNote = {
				"processStatus": "c",
				"exptKey": vm.apiDomain.exptKey,
                                "note": ""
			};
		}

		// clear expt note
		function clearExptNote() {
                        console.log("clearExptNote()");

			if (vm.apiDomain.exptNote.processStatus == "x") {
                                vm.apiDomain.exptNote.processStatus = "d";
                        };
                        vm.apiDomain.exptNote.note = "";
		}

		// if expt note has changed
		function changeExptNote() {
                        console.log("changeExptNote()");

			if (vm.apiDomain.exptNote.processStatus == "x") {
                                if (vm.apiDomain.exptNote.note == null 
                                        || vm.apiDomain.exptNote.note == "") {
                                        vm.apiDomain.exptNote.processStatus = "d";
                                }
                                else {
                                        vm.apiDomain.exptNote.processStatus = "u";
                                }
                        };
		}

		/////////////////////////////////////////////////////////////////////
		// validations
		/////////////////////////////////////////////////////////////////////		
                
        	// validate jnum
		function validateJnum() {		
			console.log("validateJnum()")

                        var id = "JNumID";

			if (vm.apiDomain.jnumid == undefined || vm.apiDomain.jnumid == "") {
				vm.apiDomain.refsKey = "";
				vm.apiDomain.jnumid = "";
				vm.apiDomain.jnum = null;
				vm.apiDomain.short_citation = "";
				return;
			}

                        if (vm.apiDomain.jnumid.includes("%")) {
                                return;
                        }

			ValidateJnumAPI.query({ jnum: vm.apiDomain.jnumid }, function(data) {
				if (data.length == 0) {
					alert("Invalid Reference: " + vm.apiDomain.jnumid);
					document.getElementById(id).focus();
					vm.apiDomain.refsKey = "";
					vm.apiDomain.jnumid = "";
					vm.apiDomain.jnum = null;
					vm.apiDomain.short_citation = "";
				} else {
					vm.apiDomain.refsKey = data[0].refsKey;
					vm.apiDomain.jnumid = data[0].jnumid;
					vm.apiDomain.jnum = parseInt(data[0].jnum, 10);
					vm.apiDomain.short_citation = data[0].short_citation;
				}

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateJnumAPI.query");
				document.getElementById(id).focus();
				vm.apiDomain.refsKey = "";
                                vm.apiDomain.jnumid = ""; 
                                vm.apiDomain.jnum = null; 
				vm.apiDomain.short_citation = "";
			});
		}		

		function validateAllele(row, index, id) {
			console.log("validateAllele = " + id + index);

			id = id + index;

			if (row.alleleSymbol == "") {
				row.alleleKey = "";
				row.alleleSymbol = "";
				return;
			}

			if (row.alleleSymbol.includes("%")) {
				return;
			}

			// params if used for the validation search only
			var params = {};
			params.symbol = row.alleleSymbol;
			params.markerKey = row.markerKey;
			console.log(params);
			
			ValidateAlleleAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Allele Symbol: " + row.alleleSymbol);
					document.getElementById(id).focus();
					row.alleleKey = "";
					row.alleleSymbol = "";
				} else {
					row.alleleKey = data[0].alleleKey;
					row.alleleSymbol = data[0].symbol;
					row.markerKey = data[0].markerKey; 
					row.markerChr = data[0].markerChr;
					row.markerSymbol = data[0].markerSymbol;
					row.markerAccID = data[0].markerAccID;
                                        validateChr(row, id);
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateAlleleAPI.search");
				document.getElementById(id).focus();
				row.alleleKey = "";
				row.alleleSymbol = "";
			});
		}

		function validateMarker(row, index, id) {
			console.log("validateMarker = " + id + index);

			id = id + index;
			
			if ((row.markerAccID == undefined || row.markerAccID == "")
			    && (row.markerSymbol == undefined || row.markerSymbol == "")) {
				row.markerKey = "";
				row.markerChr = "";
				row.markerSymbol = "";
				row.markerAccID = "";
				return;
			}

			if (row.markerSymbol.includes("%")) {
				return;
			}

			var params = {};
			params.symbol = row.markerSymbol;
			params.accID = row.markerAccID;

			ValidateMarkerAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Marker Symbol: " + row.markerSymbol);
					document.getElementById(id).focus();
					row.markerKey = "";
					row.markerChr = "";
					row.markerSymbol = "";
				        row.markerAccID = "";
				} else if (data.length > 1) {
					document.getElementById(id).focus();
					row.markerKey = "";
					row.markerChr = "";
					row.markerSymbol = "";
				        row.markerAccID = "";
				} else {
					console.log(data);
					row.markerKey = data[0].markerKey;
				        row.markerChr = data[0].chromosome;
					row.markerSymbol = data[0].symbol;
					row.markerAccID = data[0].accID;
                                        validateChr(row, id);
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateMarkerAPI.search");
				document.getElementById(id).focus();
				row.markerKey = "";
				row.markerChr = "";
				row.markerSymbol = "";
				row.markerAccID = "";
			});
		}

		function validateChr(row, id) {
			console.log("validateChr = " + id);

                        if (vm.apiDomain.chromosome != row.markerChr) {
			        alert("Experiment Chr \'" + vm.apiDomain.chromosome + "\' does not match Symbol \'" + row.markerSymbol + "\' Chr \'" + row.markerChr + "\'");
				row.markerKey = "";
				row.markerChr = "";
				row.markerSymbol = "";
				row.markerAccID = "";
				row.alleleKey = "";
				row.alleleSymbol = "";
				document.getElementById(id).focus();
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
		$scope.selectMarker = selectMarker;
		$scope.addReferenceNote = addReferenceNote;
		$scope.clearReferenceNote = clearReferenceNote;
		$scope.changeReferenceNote = changeReferenceNote;
		$scope.addExptNote = addExptNote;
		$scope.clearExptNote = clearExptNote;
		$scope.changeExptNote = changeExptNote;
		$scope.validateJnum = validateJnum;
		$scope.validateAllele = validateAllele;
		$scope.validateMarker = validateMarker;

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

