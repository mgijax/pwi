(function() {
	'use strict';
	angular.module('pwi.assay').controller('AssayController', AssayController);

	function AssayController(
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
			AssaySearchAPI,
			AssayGetAPI,
			AssayCreateAPI,
			AssayUpdateAPI,
			AssayDeleteAPI,
			AssayTotalCountAPI,
                        MGIGenotypeSetGetAPI,
			// global APIs
                        ValidateMarkerAPI,
                        ValidateJnumAPI,
                        ValidateStrainAPI,
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
		vm.selectedClipboardIndex = 0;
		vm.selectedSpecimenIndex = 0;
		
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			resetData();
			refreshTotalCount();
			loadVocabs();
                        loadClipboard();
                        setFocus();
		}

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        	// mapped to 'Clear' button; called from init();  resets page
		function clear() {		
			resetData();
                        refreshTotalCount();
			loadClipboard();
			setFocus();
		}		

		// mapped to query 'Search' button
		// default is to select first result
		function search() {				
			console.log(vm.apiDomain);
		
			pageScope.loadingStart();
			
			AssaySearchAPI.search(vm.apiDomain, function(data) {
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
			        pageScope.handleError(vm, "API ERROR: AssaySearchAPI.search");
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
                        AssayTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////
		
        	// create
		function create() {
			console.log("create() -> AssayCreateAPI()");

			// verify if record selected
			if (vm.selectedIndex >= 0) {
				alert("Cannot Add if a record is already selected.");
                                return;
			}

			pageScope.loadingStart();

			AssayCreateAPI.create(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					vm.apiDomain = data.items[0];
                                               vm.selectedIndex = vm.results.length;
                                               vm.results[vm.selectedIndex] = [];
                                               vm.results[vm.selectedIndex].assayKey = vm.apiDomain.assayKey;
					vm.results[vm.selectedIndex].assayDisplay = vm.apiDomain.assayDisplay;
					loadObject();
					refreshTotalCount();
				}
				pageScope.loadingEnd();
                                setFocus();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AssayCreateAPI.create");
				pageScope.loadingEnd();
                                setFocus();
			});
		}		

        	// modify
		function modify() {
			console.log("modify() -> AssayUpdateAPI()");

			// verify if record selected
                        if (vm.selectedIndex < 0) {
				alert("Cannot Modify if a record is already selected.");
                                return;
			}

			pageScope.loadingStart();

			AssayUpdateAPI.update(vm.apiDomain, function(data) {
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
				pageScope.handleError(vm, "API ERROR: AssayUpdateAPI.update");
				pageScope.loadingEnd();
                                setFocus();
			});
		}		
		
        	// delete
		function deleteIt() {
			console.log("deleteIt() -> AssayDeleteAPI() : " + vm.selectedIndex);

			// check if record selected
			if (vm.selectedIndex < 0) {
				alert("Cannot Delete if a record is not selected.");
				return;
			}

			if ($window.confirm("Are you sure you want to delete this record?")) {
			
				pageScope.loadingStart();

				AssayDeleteAPI.delete({key: vm.apiDomain.assayKey}, function(data) {
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
					pageScope.handleError(vm, "API ERROR: AssayDeleteAPI.delete");
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
                        vm.total_count = 0;
                        resetDataDeselect();
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");

		        vm.selectedSpecimenIndex = 0;

                        resetBoolean();

                        vm.apiDomain = {};
			vm.apiDomain.assayKey = "";	
			vm.apiDomain.assayDisplay = "";	
                        vm.apiDomain.assayTypeKey = "";
                        vm.apiDomain.assayType = "";
                        vm.apiDomain.markerKey = "";
                        vm.apiDomain.markerSymbol = "";
                        vm.apiDomain.refsKey = "";
                        vm.apiDomain.jnumid = "";
                        vm.apiDomain.jnum = "";
                        vm.apiDomain.short_citation = "";
                        vm.apiDomain.accID = "";   
                        vm.apiDomain.imagePaneKey = "";
                        vm.apiDomain.reporterGeneKey = "";
                        vm.apiDomain.reporterGeneTerm = "";
                        vm.apiDomain.detectionKey = "";
			vm.apiDomain.createdBy = "";
			vm.apiDomain.creation_date = "";
			vm.apiDomain.modifiedBy = "";
			vm.apiDomain.modification_date = "";

			if (vm.apiDomain.probePrep == null) {
                                vm.apiDomain.probePrep = {};
			        vm.apiDomain.probePrep = {
                                        "processStatus" : "c",
                                        "probePrepKey" : "",
                                        "probeKey" : "",
                                        "probeName" : "",
                                        "probeAccID" : "",
                                        "probeSenseKey" : "",
                                        "probeSenseName" : "",
                                        "labelKey" : "",
                                        "labelName" : "",
                                        "visualizationMethodKey" : "",
                                        "visualiationMethod" : "",
                                        "prepType" : ""
			        }
                        }

			if (vm.apiDomain.antibodyPrep == null) {
                                vm.apiDomain.antibodyPrep = {};
			        vm.apiDomain.antibodyPrep = {
                                        "processStatus" : "c",
                                        "antibodyPrepKey" : "",
                                        "antibodyKey" : "",
                                        "antibodyName" : "",
                                        "antibodyAccID" : "",
                                        "secondaryKey" : "",
                                        "secondaryName" : "",
                                        "labelKey" : "",
                                        "labelName" : ""
			        }
                        }

                        addAssayNote();
                        addSpecimenRow();
		}

		// reset booleans
	        function resetBoolean() {
			vm.hideErrorContents = true;
		}

		// load vocabularies
                function loadVocabs() {
                        console.log("loadVocabs()");

			vm.labelLookup = {};
			VocTermSearchAPI.search({"vocabKey":"152"}, function(data) { vm.labelLookup = data.items[0].terms});;

			vm.visualizationLookup = {};
			VocTermSearchAPI.search({"vocabKey":"157"}, function(data) { vm.visualizationLookup = data.items[0].terms});;

			vm.assayTypeLookup = {};
			VocTermSearchAPI.search({"vocabKey":"158"}, function(data) { vm.assayTypeLookup = data.items[0].terms});;

			vm.probeSenseLookup = {};
			VocTermSearchAPI.search({"vocabKey":"159"}, function(data) { vm.probeSenseLookup = data.items[0].terms});;

			vm.secondaryLookup = {};
			VocTermSearchAPI.search({"vocabKey":"160"}, function(data) { vm.secondaryLookup = data.items[0].terms});;

			vm.reporterGeneLookup = {};
			VocTermSearchAPI.search({"vocabKey":"14"}, function(data) { vm.reporterGeneLookup = data.items[0].terms});;

			vm.detectionLookup = {};
                        vm.detectionLookup[0] = {
                                "termKey": "1",
                                "term": "nucleotide"
                        }
                        vm.detectionLookup[1] = {
                                "termKey": "2",
                                "term": "antibody"
                        }
                        vm.detectionLookup[2] = {
                                "termKey": "3",
                                "term": "direct detection"
                        }

			vm.probeprepTypeLookup = {};
                        vm.probeprepTypeLookup[0] = {
                                "termKey": "1",
                                "term": "DNA"
                        }
                        vm.probeprepTypeLookup[1] = {
                                "termKey": "2",
                                "term": "RNA"
                        }
                        vm.probeprepTypeLookup[2] = {
                                "termKey": "3",
                                "term": "Not Specified"
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

			AssayGetAPI.get({ key: vm.results[vm.selectedIndex].assayKey }, function(data) {
				vm.apiDomain = data;
				vm.apiDomain.assayKey = vm.results[vm.selectedIndex].assayKey;
                                addAssayNote();
                                addSpecimenRow();
				vm.results[vm.selectedIndex].assayDisplay = vm.apiDomain.assayDisplay;
                                loadClipboard();

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AssayGetAPI.get");
			});
		}	
		
		// when an object is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove object, if it exists)
			removeSearchResultsItem(vm.apiDomain.assayKey);

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
				if (vm.results[i].assayKey == keyToRemove) {
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
                                document.getElementById("jnumID").focus();
                        }, (200));
		}

		/////////////////////////////////////////////////////////////////////
		// notes
		/////////////////////////////////////////////////////////////////////		
		
		// add assay note
		function addAssayNote() {
			console.log("addAssayNote()");

			if (vm.apiDomain.assayNote != null) { return; }

			vm.apiDomain.assayNote = {
                                "processStatus": "c",
                                "assayNoteKey" : "",
                                "assayKey" : vm.apiDomain.assayKey,
                                "assayNote" : ""
			}
		}

		/////////////////////////////////////////////////////////////////////
		// specimens
		/////////////////////////////////////////////////////////////////////		
		
		// set current row
		function selectSpecimenRow(index) {
			console.log("selectSpecimenRow: " + index);
			vm.selectedSpecimenIndex = index;

			if (vm.apiDomain.specimens == null | vm.apiDomain.specimens == undefined) {
                                return;
                        }

			if (vm.apiDomain.specimens.length == 0) {
				addSpecimenRow();
			}
		}

		// if current row has changed
		function changeSpecimenRow(index) {
			console.log("changeSpecimenRow: " + index);

			vm.selectedSpecimenIndex = index;

			if (vm.apiDomain.specimens[index] == null) {
				vm.selectedSpecimenIndex = 0;
				return;
			}

			if (vm.apiDomain.specimens[index].processStatus == "x") {
				vm.apiDomain.specimens[index].processStatus = "u";
			};
                }

		// add new row
		function addSpecimenRow() {
			console.log("addSpecimenRow()");

			if (vm.apiDomain.specimens == undefined) {
				vm.apiDomain.specimens = [];
			}

			var i = vm.apiDomain.specimens.length;

			vm.apiDomain.specimens[i] = {
				"processStatus": "c",
                                "creation_date": "",
                                "modification_date": ""
			}
		}		

		// attach tag text to specific note chunk
		function addTag(tagText, inputElement, outputElement) {

			// inserted text

			// add tagText based on current focus
			var textField = document.getElementById(inputElement);
			var textTmp = textField.value; 
			var start = textField.selectionStart
			var end = textField.selectionEnd
			var before = textTmp.substring(0, start)
			var after  = textTmp.substring(end, textTmp.length)

			// add the text, and set focus
			textField.value = (before + tagText + after); 
			textField.selectionStart = textField.selectionEnd = start + tagText.length
			textField.focus();

			if (outputElement == null) {
				outputElement = {};	
			}
			outputElement.assayNote = textField.value;
		}

		// attach acc/mgi tag to assay note
		function addAccMGITag() {
			addTag("(assay \Acc(MGI:||)) ", "assayNoteID", vm.apiDomain.assayNote);
		}
		
		/////////////////////////////////////////////////////////////////////
		// validations
		/////////////////////////////////////////////////////////////////////		
		
		function validateMarker(row, id) {
			console.log("validateMarker = " + id);

			if (row.markerSymbol == undefined || row.markerSymbol == "") {
				row.markerKey = "";
				row.markerSymbol = "";
				return;
			}

			if (row.markerSymbol.includes("%")) {
				return;
			}

			var params = {};
			params.symbol = row.markerSymbol;

			ValidateMarkerAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Marker Symbol: " + row.markerSymbol);
					document.getElementById(id).focus();
					row.markerKey = "";
					row.markerSymbol = "";
				} else if (data.length > 1) {
					alert("This marker requires a Chr.\nSelect a Chr, then Marker, and try again:\n\n" + row.markerSymbol);
					document.getElementById(id).focus();
					row.markerKey = "";
					row.markerSymbol = "";
				} else {
					console.log(data);
					row.markerKey = data[0].markerKey;
					row.markerSymbol = data[0].symbol;
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateMarkerAPI.search");
				document.getElementById(id).focus();
				row.markerKey = "";
				row.markerSymbol = "";
			});
		}

        	// validate jnum
		function validateJnum(row, id) {		
			console.log("validateJnum = " + id);

			if (row.jnumid == undefined || row.jnumid == "") {
				row.refsKey = "";
				row.jnumid = "";
				row.jnum = null;
				row.short_citation = "";
				return;
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

		function validateStrain() {
			console.log("validateStrain()");

			if (vm.apiDomain.assay == "") {
				vm.apiDomain.assayKey = "";
				vm.apiDomain.assay = "";
				return;
			}

			if (vm.apiDomain.assay.includes("%")) {
				return;
			}

			if (vm.apiDomain.assayKey != "") {
				return;
                        }

			var params = {};
			params.assay = vm.apiDomain.assay;

			AssaySearchAPI.search(params, function(data) {
			        if (data.length > 0) {
					alert("This Strain already exists in MGI.");
			        }
		                pageScope.loadingEnd();
			}, function(err) {
			        pageScope.handleError(vm, "API ERROR: AssaySearchAPI.search");
		                pageScope.loadingEnd();
			});
		}

		/////////////////////////////////////////////////////////////////////
		// clipboard
		/////////////////////////////////////////////////////////////////////		
	
		// reset clipboard
		function resetClipboard() {
			console.log("resetClipboard()");
			vm.clipboardDomain = {
				"assayKey": vm.apiDomain.assayKey,
				"createdBy": USERNAME
			}
		}

		// selected clipboard row
		function selectClipboard(index) {
			console.log("selectClipboard(): " + index);
			vm.selectedClipboardIndex = index;
		}		

		// load a clipboard
		function loadClipboard() {
			console.log("loadClipboard()");

			resetClipboard();

			MGIGenotypeSetGetAPI.search(vm.clipboardDomain, function(data) {
				if (data.length > 0) {
					vm.clipboardDomain.genotypeClipboardMembers = data[0].genotypeClipboardMembers;
				}
				else {
			                vm.clipboardDomain.genotypeClipboardMembers = [];
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: MGIGenotypeSetGetAPI.get");
			});
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

                $scope.changeSpecimenRow = changeSpecimenRow;
                $scope.addSpecimenRow = addSpecimenRow;
                $scope.selectSpecimenRow = selectSpecimenRow;

                // Validate
                $scope.validateMarker = validateMarker;
                $scope.validateJnum = validateJnum;
                $scope.validateStrain = validateStrain;

                // note functions
                $scope.addAccMGITag = addAccMGITag;

		// clipboard functions
                $scope.selectClipboard = selectClipboard;

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

