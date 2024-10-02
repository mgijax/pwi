(function() {
	'use strict';
	angular.module('pwi.markerfear').controller('MarkerFearController', MarkerFearController);

	function MarkerFearController(
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
			MarkerFearSearchAPI,
			MarkerFearGetAPI,
			MarkerFearUpdateAPI,
			MarkerFearTotalCountAPI,
			// global APIs
			ValidateJnumAPI,
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
		vm.selectedCMIndex = 0;
                vm.selectedClipboardCMIndex = 0;
		
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			resetData();
                        resetClipboardCM();
			refreshTotalCount();
			loadVocabs();
                        for(var i=0;i<5; i++) { addClusterHasMemberRow(); }
                        for(var i=0;i<5; i++) { addRegulatesExpressionRow(); }
                        if (document.location.search.length > 0) {
                                searchByMarkerKeys();
                        }
		}

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        	// mapped to 'Clear' button; called from init();  resets page
		function clear() {		
			resetData();
                        refreshTotalCount();
                        for(var i=0;i<5; i++) { addClusterHasMemberRow(); }
                        for(var i=0;i<5; i++) { addRegulatesExpressionRow(); }
			setFocus();
		}		

		// mapped to query 'Search' button
		// default is to select first result
		function search() {				
			console.log(vm.apiDomain);
		
			pageScope.loadingStart();
			
			MarkerFearSearchAPI.search(vm.apiDomain, function(data) {
				vm.results = data;
				vm.selectedIndex = 0;
				if (vm.results.length > 0) {
					loadObject();
				}
				else {
					clear();
				        pageScope.loadingEnd();
				}
				setFocus();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: MarkerFearSearchAPI.search");
				pageScope.loadingEnd();
				setFocus();
			});
		}		

		function searchAccId() {
			console.log("searchAccId");

                        if (vm.results.length > 0) {
                                return;
                        }

			if (vm.apiDomain.markerKey == "" && vm.apiDomain.accID != "") {
				search();
			}
		}

		// search by parameter keys
		function searchByMarkerKeys() {				
			console.log("searchByMarkerKeys: " + document.location.search);
		
			pageScope.loadingStart();
			
			var searchKeys = document.location.search.split("?searchKeys=");
			var params = {};
			params.markerKey = searchKeys[1];

			MarkerFearSearchAPI.search(params, function(data) {
				vm.results = data;
				vm.selectedIndex = 0;
				if (vm.results.length > 0) {
					loadObject();
				}
				pageScope.loadingEnd();
				setFocus();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: MPAnnotSearchByKeysAPI.search");
				pageScope.loadingEnd();
				setFocus();
			});
		}		

		function searchDisplay() {
			console.log("searchDisplay");

			if (vm.apiDomain.markerKey == "" && vm.apiDomain.markerSymbol != "" && !vm.apiDomain.markerSymbol.includes("%")) {
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
                        MarkerFearTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////
		
        	// modify relationships
		function modifyRelationship() {
			console.log("modifyRelationship() -> MarkerFearUpdateAPI()");

			// check if record selected
			if(vm.selectedIndex < 0) {
				alert("Cannot Modify if a record is not selected.");
				return;
			}
			
                        // skip duplicates; relationship type, marker
                        var rKey = 0;
                        var mKey = 0;
                        
                        // skip duplicates;  organism, marker
                        var oKey = 0;
                        var mKey = 0;
                        var isCMduplicate = false;
                        var isCMnoreference = false;
			for(var i=0;i<vm.apiDomain.clusterHasMember.length; i++) {
                                oKey = vm.apiDomain.clusterHasMember[i].organismKey;
                                mKey = vm.apiDomain.clusterHasMember[i].markerKey2;

                                if (oKey == "" || mKey == "") {
                                        continue
                                }

                                if (vm.apiDomain.clusterHasMember[i].refsKey == "") {
                                        isCMnoreference = true;
                                }

			        for(var j=i+1;j<vm.apiDomain.clusterHasMember.length; j++) {
                                        if (
                                                vm.apiDomain.clusterHasMember[j].organismKey == oKey
                                                && vm.apiDomain.clusterHasMember[j].markerKey2 == mKey
                                           ) { 
                                           vm.apiDomain.clusterHasMember[j].processStatus = "x";
                                           isCMduplicate = true;
                                        }
                                }
                        }
                        //if (isCMduplicate) {
                                //alert("Expresses Components: duplicate found; the duplicate will be skipped.");
                        //}
                        if (isCMnoreference) {
                                alert("CM: Reference is required.");
                                return;
                        }

			pageScope.loadingStart();

			MarkerFearUpdateAPI.update(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					loadObject();
				}
				pageScope.loadingEnd();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: MarkerFearUpdateAPI.update");
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
			vm.selectedCMIndex = 0;
			vm.selectedREIndex = 0;
			vm.total_count = 0;

			// rebuild empty apiDomain submission object, else bindings fail
			vm.apiDomain = {};
			vm.apiDomain.markerKey = "";	
			vm.apiDomain.markerSymbol = "";	
			vm.apiDomain.accID = "";
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");

			vm.apiDomain.markerKey = "";	
			vm.apiDomain.markerSymbol = "";	
			vm.apiDomain.accID = "";
			vm.apiDomain.clusterHasMember = [];
			vm.apiDomain.regulatesExpression = [];
                        for(var i=0;i<5; i++) { addClusterHasMemberRow(); }
		}

		// load vocabularies
                function loadVocabs() {
                        console.log("loadVocabs()");

			vm.cmLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"96", "name":"clusterHasMember"}, function(data) { vm.cmLookup = data.items[0].terms });;

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

			pageScope.loadingStart();

			MarkerFearGetAPI.get({ key: vm.results[vm.selectedIndex].markerKey }, function(data) {
				vm.apiDomain = data;
				vm.apiDomain.markerKey = vm.results[vm.selectedIndex].markerKey;
			        vm.apiDomain.markerSymbol = vm.results[vm.selectedIndex].markerSymbol;
                                for(var i=0;i<5; i++) { addClusterHasMemberRow(); }
                                for(var i=0;i<5; i++) { addRegulatesExpressionRow(); }
				selectCMRow(0);
				selectRERow(0);
			        pageScope.loadingEnd();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: MarkerFearGetAPI.get");
			        pageScope.loadingEnd();
			});
		}	
		
		// handle removal from results list
		function removeSearchResultsItem(keyToRemove) {
			
			// first find the item to remove
			var removeIndex = -1;
			for(var i=0;i<vm.results.length; i++) {
				if (vm.results[i].markerKey == keyToRemove) {
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
                                document.getElementById("markerSymbol").focus();
                        }, (200));
		}

		/////////////////////////////////////////////////////////////////////
		// validating
		/////////////////////////////////////////////////////////////////////		
		
        	// validate marker
		function validateMarker(row, index, id) {
			console.log("validateMarker = " + id + index);

			id = id + index;
			
			if ((row.markerAccID2 == undefined || row.markerAccID2 == "")
			   && (row.markerSymbol2 == undefined || row.markerSymbol2 == "")) {
				row.markerKey2 = "";
				row.markerSymbol2 = "";
				row.markerAccID2 = "";
				return;
			}

			if (row.markerSymbol2.includes("%")) {
				return;
			}

			var params = {};
                        if (row.markerAccID != undefined && row.markerAccID != "") {
			        params.symbol = "";
			        params.accID = row.markerAccID2;;
                                params.organismKey = 1;
                        } else if (row.markerSymbol2 != undefined && row.markerSymbol2 != "") {
			        params.symbol = row.markerSymbol2;
			        params.accID = "";
                                params.organismKey = 1;
                        }
                        
			ValidateMarkerAPI.search(params, function(data) {
				if (data.length == 0) {
					row.markerKey2 = "";
					row.markerSymbol2 = "";
				        row.markerAccID2 = "";
                                        row.organismKey = "";
                                        row.organism = "";
					document.getElementById(id).focus();
				} else {
					console.log(data);
					row.markerKey2 = data[0].markerKey;
					row.markerSymbol2 = data[0].symbol;
				        row.markerAccID2 = data[0].accID;
                                        row.organismKey = data[0].organismKey;
                                        row.organism = data[0].organism;
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateMarkerAPI.search");
				document.getElementById(id).focus();
				row.markerKey2 = "";
				row.markerSymbol2 = "";
				row.markerAccID2 = "";
                                row.organismKey = "";
                                row.organism = "";
			});
		}

        	// validate jnum
		function validateJnum(row, index, id) {		
			console.log("validateJnum = " + id + index);

			id = id + index;

			if (row.jnumid == undefined || row.jnumid == "") {
				if (index > 0) {
					row.refsKey = vm.apiDomain.clusterHasMember[index-1].refsKey;
					row.jnumid = vm.apiDomain.clusterHasMember[index-1].jnumid;
					row.jnum = vm.apiDomain.clusterHasMember[index-1].jnum;
					row.short_citation = vm.apiDomain.clusterHasMember[index-1].short_citation;
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
		function selectCMRow(index) {
			console.log("selectCMRow: " + index);
			vm.selectedCMIndex = index;
		}

		//
		// change of row/field detected
		//
		
		// if current clusterHasMember row has changed
		function changeClusterHasMemberRow(index) {
			console.log("changeClusterHasMemberRow: " + index);

			vm.selectedCMIndex = index;

			if (vm.apiDomain.clusterHasMember[index] == null) {
				vm.selectedCMIndex = 0;
				return;
			}

			if (vm.apiDomain.clusterHasMember[index].processStatus == "x") {
				vm.apiDomain.clusterHasMember[index].processStatus = "u";
			};
                }

		// add new clusterHasMember row
		function addClusterHasMemberRow() {
			console.log("addClusterHasMemberRow");

			if (vm.apiDomain.clusterHasMember == undefined) {
				vm.apiDomain.clusterHasMember = [];
			}

			var i = vm.apiDomain.clusterHasMember.length;

			vm.apiDomain.clusterHasMember[i] = {
				"processStatus": "c",
				"relationshipKey": "",
			       	"markerKey1": vm.apiDomain.markerKey,
                                "markerSymbol1": "",
			       	"markerKey2": "",
                                "markerSymbol2": "",
                                "markerAccID2": "",
                                "organismKey": "",
                                "organism": "",
			       	"categoryKey": "1002",
			       	"categoryTerm": "",
			       	"relationshipTermKey": "",
			       	"relationshipTerm": "",
			       	"qualifierKey": "11391898",
			       	"qualifierTerm": "",
			       	"evidenceKey": "11391900",
			       	"evidenceTerm": "IGC",
				"refsKey": "",
			       	"jnumid": "",
				"short_citation": "",
				"createdBy": "",
				"creation_date": "",
				"modifiedBy": "",
				"modification_date": ""
			}

                        addCMNoteRow(i);
		}		

		// add new note row
		function addCMNoteRow(index) {
			console.log("addCMNoteRow: " + index);

			if (vm.apiDomain.clusterHasMember.length == 0) {
				addClusterHasMemberRow();
			}
			if (vm.apiDomain.clusterHasMember[index].note == undefined) {
				vm.apiDomain.clusterHasMember[index].note = {};
			}

			vm.apiDomain.clusterHasMember[index].note = {
				"processStatus": "c",
				"noteKey": "",
				"objectKey": vm.apiDomain.clusterHasMember[index].relationshipKey,
				"mgiTypeKey": "40",
				"noteTypeKey": "1042",
				"noteChunk": ""
			}
		}		

		// set current relationship row
		function selectRERow(index) {
			console.log("selectRERow: " + index);
			vm.selectedREIndex = index;
		}

		//
		// change of row/field detected
		//
		
		// if current regulatesExpression row has changed
		function changeRegulatesExpressionRow(index) {
			console.log("changeRegulatesExpressionRow: " + index);

			vm.selectedREIndex = index;

			if (vm.apiDomain.regulatesExpression[index] == null) {
				vm.selectedREIndex = 0;
				return;
			}

			if (vm.apiDomain.regulatesExpression[index].processStatus == "x") {
				vm.apiDomain.regulatesExpression[index].processStatus = "u";
			};
                }

		// add new regulatesExpression row
		function addRegulatesExpressionRow() {
			console.log("addRegulatesExpressionRow");

			if (vm.apiDomain.regulatesExpression == undefined) {
				vm.apiDomain.regulatesExpression = [];
			}

			var i = vm.apiDomain.regulatesExpression.length;

			vm.apiDomain.regulatesExpression[i] = {
				"processStatus": "c",
				"relationshipKey": "",
			       	"markerKey1": vm.apiDomain.markerKey,
                                "markerSymbol1": "",
			       	"markerKey2": "",
                                "markerSymbol2": "",
                                "markerAccID2": "",
                                "organismKey": "",
                                "organism": "",
			       	"categoryKey": "1013",
			       	"categoryTerm": "",
			       	"relationshipTermKey": "",
			       	"relationshipTerm": "",
			       	"qualifierKey": "11391898",
			       	"qualifierTerm": "",
			       	"evidenceKey": "11451744",
			       	"evidenceTerm": "EXP",
				"refsKey": "",
			       	"jnumid": "",
				"short_citation": "",
				"createdBy": "",
				"creation_date": "",
				"modifiedBy": "",
				"modification_date": ""
			}

                        addRENoteRow(i);
		}		

		// add new note row
		function addRENoteRow(index) {
			console.log("addRENoteRow: " + index);

			if (vm.apiDomain.regulatesExpression.length == 0) {
				addRegulatesExpressionRow();
			}
			if (vm.apiDomain.regulatesExpression[index].note == undefined) {
				vm.apiDomain.regulatesExpression[index].note = {};
			}

			vm.apiDomain.regulatesExpression[index].note = {
				"processStatus": "c",
				"noteKey": "",
				"objectKey": vm.apiDomain.regulatesExpression[index].relationshipKey,
				"mgiTypeKey": "40",
				"noteTypeKey": "1042",
				"noteChunk": ""
			}
		}		

		/////////////////////////////////////////////////////////////////////
		// clipboard
		/////////////////////////////////////////////////////////////////////		
	
		// reset clipboard
		function resetClipboardCM() {
			console.log("resetClipboardCM()");
			vm.clipboardCM = [];
		}

		// selected clipboard row
		function selectClipboardCM(index) {
			console.log("selectClipboardCM(): " + index);
			vm.selectedClipboardCMIndex = index;
		}		

		// add selected table row to clipboard
		function addClipboardCM(row) {
			console.log("addClipboardCM():" + row);

                        // note:  cloning the vm.apiDomain.clusterHasMember properly
                        //
			if (vm.apiDomain.clusterHasMember[row].markerKey2 != "") {
				var newItem = {
                                        "processStatus": "c",
                                        "relationshipKey": "",
                                        "markerKey1": vm.apiDomain.clusterHasMember[row].markerKey1,
                                        "markerSymbol1": vm.apiDomain.clusterHasMember[row].markerSymbol1,
                                        "markerKey2": vm.apiDomain.clusterHasMember[row].markerKey2,
                                        "markerSymbol2": vm.apiDomain.clusterHasMember[row].markerSymbol2,
                                        "markerAccID2": vm.apiDomain.clusterHasMember[row].markerAccID2,
                                        "categoryKey": vm.apiDomain.clusterHasMember[row].categoryKey,
                                        "categoryTerm": vm.apiDomain.clusterHasMember[row].categoryTerm,
                                        "relationshipTermKey": vm.apiDomain.clusterHasMember[row].relationshipTermKey,
                                        "relationshipTerm": vm.apiDomain.clusterHasMember[row].relationshipTerm,
                                        "qualifierKey": vm.apiDomain.clusterHasMember[row].qualifierKey,
                                        "qualifierTerm": vm.apiDomain.clusterHasMember[row].qualifierTerm,
                                        "evidenceKey": vm.apiDomain.clusterHasMember[row].evidenceKey,
                                        "evidenceTerm": vm.apiDomain.clusterHasMember[row].evidenceTerm,
                                        "refsKey": vm.apiDomain.clusterHasMember[row].refsKey,
                                        "jnumid": vm.apiDomain.clusterHasMember[row].jnumid,
                                        "short_citation": vm.apiDomain.clusterHasMember[row].short_citation,
                                        "note": vm.apiDomain.clusterHasMember[row].note,
                                        "item": vm.apiDomain.clusterHasMember[row].relationshipTerm + ","
						+ vm.apiDomain.clusterHasMember[row].markerSymbol
                                }

                                newItem.note.processStatus = "c";
                                newItem.note.noteKey = "";
                                newItem.note.objectKey = "";
				vm.clipboardCM.push(newItem);
			}
		}
		
		// add all table rows to clipboard
		function addAllClipboardCM() {
			console.log("addAllClipboardCM()");

                        for(var i=0;i<vm.apiDomain.clusterHasMember.length; i++) {
				addClipboardCM(i);
			}
		}

		// paste all clipboard items to table
		function pasteClipboardCM() {
			console.log("pasteClipboardCM()");

			var emptyRow = 0;

			// find next available empty row
                        for(var i=0;i<vm.apiDomain.clusterHasMember.length; i++) {
				if ((vm.apiDomain.clusterHasMember[i].processStatus == "c")
					&& (vm.apiDomain.clusterHasMember[i].markerKey2 == "")
					) {
					emptyRow = i;
					break;
				}
			}

                        for(var i=0;i<vm.clipboardCM.length; i++) {
				// add new empty annot row if needed
				if (emptyRow == 0 || emptyRow == vm.apiDomain.clusterHasMember.length) {
					addClusterHasMemberRow();
				}
                                vm.apiDomain.clusterHasMember[emptyRow].processStatus = vm.clipboardCM[i].processStatus;
                                vm.apiDomain.clusterHasMember[emptyRow].relationshipKey = vm.clipboardCM[i].relationshipKey;
                                vm.apiDomain.clusterHasMember[emptyRow].markerKey1 = vm.clipboardCM[i].markerKey1;
                                vm.apiDomain.clusterHasMember[emptyRow].markerSymbol1 = vm.clipboardCM[i].markerSymbol1;
                                vm.apiDomain.clusterHasMember[emptyRow].markerKey2 = vm.clipboardCM[i].markerKey2;
                                vm.apiDomain.clusterHasMember[emptyRow].markerSymbol2 = vm.clipboardCM[i].markerSymbol2;
                                vm.apiDomain.clusterHasMember[emptyRow].markerAccID2 = vm.clipboardCM[i].markerAccID2;
                                vm.apiDomain.clusterHasMember[emptyRow].categoryKey = vm.clipboardCM[i].categoryKey;
                                vm.apiDomain.clusterHasMember[emptyRow].categoryTerm = vm.clipboardCM[i].categoryTerm;
                                vm.apiDomain.clusterHasMember[emptyRow].relationshipTermKey = vm.clipboardCM[i].relationshipTermKey;
                                vm.apiDomain.clusterHasMember[emptyRow].relationshipTerm = vm.clipboardCM[i].relationshipTerm;
                                vm.apiDomain.clusterHasMember[emptyRow].qualifierKey = vm.clipboardCM[i].qualifierKey;
                                vm.apiDomain.clusterHasMember[emptyRow].qualifierTerm = vm.clipboardCM[i].qualifierTerm;
                                vm.apiDomain.clusterHasMember[emptyRow].evidenceKey = vm.clipboardCM[i].evidenceKey;
                                vm.apiDomain.clusterHasMember[emptyRow].evidenceTerm = vm.clipboardCM[i].evidenceTerm;
                                vm.apiDomain.clusterHasMember[emptyRow].refsKey = vm.clipboardCM[i].refsKey;
                                vm.apiDomain.clusterHasMember[emptyRow].jnumid = vm.clipboardCM[i].jnumid;
                                vm.apiDomain.clusterHasMember[emptyRow].short_citation = vm.clipboardCM[i].short_citation;
                                vm.apiDomain.clusterHasMember[emptyRow].note = vm.clipboardCM[i].note;
				emptyRow = emptyRow + 1;
			}
		}

		// delete one clipboard item
		function deleteClipboardCM(row) {
			console.log("deleteClipboardCM(): " + row);
			vm.clipboardCM.splice(row,1)
		}
		
		// clear all clipboard items
		function clearClipboardCM() {
			console.log("clearClipboardCM()");
			resetClipboardCM();
		}
		
		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
		$scope.searchAccId = searchAccId;
		$scope.searchDisplay = searchDisplay;
		$scope.clear = clear;
		$scope.modifyRelationship = modifyRelationship;
		$scope.changeClusterHasMemberRow = changeClusterHasMemberRow;
		$scope.addClusterHasMemberRow = addClusterHasMemberRow;
		$scope.selectCMRow = selectCMRow;
		$scope.changeRegulatesExpressionRow = changeRegulatesExpressionRow;
		$scope.addRegulatesExpressionRow = addRegulatesExpressionRow;
		$scope.selectRERow = selectRERow;

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

		// other functions: buttons, onBlurs and onChanges
		$scope.selectResult = selectResult;
		$scope.validateJnum = validateJnum;
                $scope.validateMarker = validateMarker;
		
		// clipboard functions
		$scope.selectClipboardCM = selectClipboardCM;
		$scope.addClipboardCM = addClipboardCM;
		$scope.addAllClipboardCM = addAllClipboardCM;
		$scope.pasteClipboardCM = pasteClipboardCM;
		$scope.deleteClipboardCM = deleteClipboardCM;
		$scope.clearClipboardCM = clearClipboardCM;

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

