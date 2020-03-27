(function() {
	'use strict';
	angular.module('pwi.allele').controller('AlleleController', AlleleController);

	function AlleleController(
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
			AlleleSearchAPI,
			AlleleGetAPI,
			AlleleUpdateAPI,
			AlleleTotalCountAPI,
			AlleleGetReferencesAPI,
			AlleleReferenceReportAPI,
			// global APIs
			ReferenceAssocTypeSearchAPI,
			ValidateJnumAPI,
			VocTermSearchAPI,
			ValidateTermAPI,
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
			
			AlleleSearchAPI.search(vm.apiDomain, function(data) {
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
				pageScope.handleError(vm, "API ERROR: AlleleSearchAPI.search");
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
                        AlleleTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////
		
        	// modify allele
		function modify() {
			console.log("modify() -> AlleleUpdateAPI()");
			var allowCommit = true;

			// check if record selected
			if(vm.selectedIndex < 0) {
				alert("Cannot save this Allele if a record is not selected.");
				allowCommit = false;
			}
			
			if (allowCommit){
				pageScope.loadingStart();

				AlleleUpdateAPI.update(vm.apiDomain, function(data) {
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						loadObject();
					}
					pageScope.loadingEnd();
				}, function(err) {
					pageScope.handleError(vm, "API ERROR: AlleleUpdateAPI.update");
					pageScope.loadingEnd();
				});
			}
			else {
				loadObject();
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
			vm.selectedRefIndex = 0;
			vm.total_count = 0;

			resetBoolean();
			resetAllele();
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");
			resetBoolean();
			resetAllele();
		}

		// reset booleans
	        function resetBoolean() {
			vm.hideErrorContents = true;
			vm.hideDetailClip = true;
			vm.hideGeneralNote = true;
			vm.hideMolecularNote = true;
			vm.hideNomenNote = true;
			vm.hideInducibleNote = true;
			vm.hideProidNote = true;
			vm.hideIkmcNote = true;
			vm.hideCreNote = true;
		}

		// resets allele data
		function resetAllele() {
			console.log("resetAllele()");
			vm.apiDomain = {};
			vm.apiDomain.alleleKey = "";	
			vm.apiDomain.symbol = "";	
			vm.apiDomain.name = "";	
			vm.apiDomain.accID = "";
			vm.apiDomain.alleleTypeKey;
			vm.apiDomain.alleleType;
			vm.apiDomain.alleleStatusKey;
			vm.apiDomain.alleleStatus;
			vm.apiDomain.inheritanceModeKey;
			vm.apiDomain.inheritanceMode;
			vm.apiDomain.transmissionKey;
			vm.apiDomain.transmission;
			vm.apiDomain.collectionKey;
			vm.apiDomain.collection;
			vm.apiDomain.isWildType;
			vm.apiDomain.isExtinct;
			vm.apiDomain.isMixed;
			vm.apiDomain.markerKey;
			vm.apiDomain.markerSymbol;
			vm.apiDomain.refsKey;
			vm.apiDomain.jnumid;
			vm.apiDomain.short_citation;
			vm.apiDomain.markerStatusKey;
			vm.apiDomain.markerStatus;
			vm.apiDomain.detailClip;

			addNotes();
		}

		// load vocabularies
                function loadVocabs() {
                        console.log("loadVocabs()");

			vm.alleleStatusLookup = {};
			VocTermSearchAPI.search({"vocabKey":"37"}, function(data) { vm.alleleStatusLookup = data.items[0].terms});;

			vm.alleleTypeLookup = {};
			VocTermSearchAPI.search({"vocabKey":"38"}, function(data) { vm.alleleTypeLookup = data.items[0].terms});;

			vm.inheritanceLookup = {};
			VocTermSearchAPI.search({"vocabKey":"35"}, function(data) { vm.inheritanceLookup = data.items[0].terms});;

			vm.transmissionLookup = {};
			VocTermSearchAPI.search({"vocabKey":"61"}, function(data) { vm.transmissionLookup = data.items[0].terms});;

			vm.collectionLookup = {};
			VocTermSearchAPI.search({"vocabKey":"92"}, function(data) { vm.collectionLookup = data.items[0].terms});;

			vm.markerStatusLookup = {};
			VocTermSearchAPI.search({"vocabKey":"73"}, function(data) { vm.markerStatusLookup = data.items[0].terms});;

                        vm.refAssocTypeLookup = [];
		        ReferenceAssocTypeSearchAPI.search({"mgiTypeKey":"11"}, function(data) { vm.refAssocTypeLookup = data.items});;

                        vm.yesnoLookup = [];
                        vm.yesnoLookup[0] = {
                                "termKey": "1",
                                "term": "Yes"
                        }
                        vm.yesnoLookup[1] = {
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

			AlleleGetAPI.get({ key: vm.results[vm.selectedIndex].alleleKey }, function(data) {
				vm.apiDomain = data;
				addNotes();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AlleleGetAPI.get");
			});
		}	
		
		// when an object is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			removeSearchResultsItem(vm.apiDomain.alleleKey);

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
			input.focus(document.getElementById("symbol"));
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
					row.refsKey = vm.apiDomain.annots[index-1].refsKey;
					row.jnumid = vm.apiDomain.annots[index-1].jnumid;
					row.jnum = vm.apiDomain.annots[index-1].jnum;
					row.short_citation = vm.apiDomain.annots[index-1].short_citation;
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

        	// validate acc id
		function validateTerm(row, index, id) {		
			console.log("validateTerm = " + id + index);

			id = id + index;

			if (row.termid == "") {
				row.termKey = "";
				row.term = "";
				return;
			}

			// json for term search
			var params = {};
			params.vocabKey = "4";

			if (row.termid.includes("GO:") == false) {
				row.termid = "GO:" + row.termid;
			}

			params.accessionIds = [];
			params.accessionIds.push({"accID":row.termid.trim()});
			console.log(params);

			ValidateTermAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Acc ID: " + params.accessionIds[0].accID);
					document.getElementById(id).focus();
					row.termKey = "";
					row.term = "";
					row.termid = "";
				} else {
					row.termKey = data[0].termKey;
					row.term = data[0].term;
					row.termid = data[0].accessionIds[0].accID;
				}

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateTermAPI.search");
				document.getElementById(id).focus();
				row.termKey = "";
				row.term = "";
				row.termid = "";
			});
		}		

		/////////////////////////////////////////////////////////////////////
		// references
		/////////////////////////////////////////////////////////////////////		
		
		/////////////////////////////////////////////////////////////////////
		// notes
		/////////////////////////////////////////////////////////////////////		
		
		// Hide/Show note sections
		function hideShowDetailClip() {
			vm.hideDetailClip = !vm.hideDetailClip;
		}
		function hideShowGeneralNote() {
			vm.hideGeneralNote = !vm.hideGeneralNote;
		}
		function hideShowMolecularNote() {
			vm.hideMolecularNote = !vm.hideMolecularNote;
		}
		function hideShowNomenNote() {
			vm.hideNomenNote = !vm.hideNomenNote;
		}
		function hideShowInducibleNote() {
			vm.hideInducibleNote = !vm.hideInducibleNote;
		}
		function hideShowProidNote() {
			vm.hideProidNote = !vm.hideProidNote;
		}
		function hideShowIkmcNote() {
			vm.hideIkmcNote = !vm.hideIkmcNote;
		}
		function hideShowCreNote() {
			vm.hideCreNote = !vm.hideCreNote;
		}

		// add new note row
		function addNote(note, noteType) {
			console.log("addNote:" + note);

			if (note != null) { return; }

			var noteTypeKey = "";

			if (noteType == "General") {
				noteTypeKey = "1020";
			}
			if (noteType == "Molecular") {
				noteTypeKey = "1021";
			}
			if (noteType == "Nomenclature") {
				noteTypeKey = "1022";
			}
			if (noteType == "Inducible") {
				noteTypeKey = "1032";
			}
			if (noteType == "Proid") {
				noteTypeKey = "1036";
			}
			if (noteType == "Ikmc") {
				noteTypeKey = "1041";
			}
			if (noteType == "Cre") {
				noteTypeKey = "1040";
			}

			note = {
				"noteKey": "",
				"objectKey": vm.apiDomain.alleleKey,
				"mgiTypeKey": "11",
				"noteTypeKey": noteTypeKey,
				"noteChunk": ""
			}

			if (noteType == "General") {
				vm.apiDomain.generalNote = note;
			}
			if (noteType == "Molecular") {
				vm.apiDomain.molecularNote = note;
			}
			if (noteType == "Nomenclature") {
				vm.apiDomain.nomenNote = note;
			}
			if (noteType == "Inducible") {
				vm.apiDomain.inducibleNote = note;
			}
			if (noteType == "Proid") {
				vm.apiDomain.proidNote = note;
			}
			if (noteType == "Ikmc") {
				vm.apiDomain.ikmcNote = note;
			}
			if (noteType == "Cre") {
				vm.apiDomain.creNote = note;
			}
		}

		function addNotes() {
			console.log("addNotes");

			addNote(vm.apiDomain.generalNote, "General");
			addNote(vm.apiDomain.molecularNote, "Molecular");
			addNote(vm.apiDomain.nomenNote, "Nomenclature");
			addNote(vm.apiDomain.inducibleNote, "Inducible");
			addNote(vm.apiDomain.proidNote, "Proid");
			addNote(vm.apiDomain.ikmcNote, "Ikmc");
			addNote(vm.apiDomain.creNote, "Cre");
		}

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
		$scope.clear = clear;
		$scope.modify = modify;

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

		// Note Buttons
		$scope.hideShowDetailClip = hideShowDetailClip;
		$scope.hideShowGeneralNote = hideShowGeneralNote;
		$scope.hideShowMolecularNote = hideShowMolecularNote;
		$scope.hideShowNomenNote = hideShowNomenNote;
		$scope.hideShowInducibleNote = hideShowInducibleNote;
		$scope.hideShowProidNote = hideShowProidNote;

		// other functions: buttons, onBlurs and onChanges
		$scope.selectResult = selectResult;
		$scope.validateJnum = validateJnum;
		$scope.validateTerm = validateTerm;
		
		// global shortcuts
		$scope.KclearAll = function() { $scope.clear(); $scope.$apply(); }
		$scope.Ksearch = function() { $scope.search(); $scope.$apply(); }
		$scope.Kfirst = function() { $scope.firstSummaryObject(); $scope.$apply(); }
		$scope.Knext = function() { $scope.nextSummaryObject(); $scope.$apply(); }
		$scope.Kprev = function() { $scope.prevSummaryObject(); $scope.$apply(); }
		$scope.Klast = function() { $scope.lastSummaryObject(); $scope.$apply(); }
		$scope.Kmodify = function() { $scope.modify(); $scope.$apply(); }

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

