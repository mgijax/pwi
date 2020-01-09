(function() {
	'use strict';
	angular.module('pwi.goannot').controller('GOAnnotController', GOAnnotController);

	function GOAnnotController(
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
			GOAnnotSearchAPI,
			GOAnnotGetAPI,
			GOAnnotUpdateAPI,
			GOAnnotTotalCountAPI,
			GOAnnotGetReferencesAPI,
			GOAnnotOrderByAPI,
			//MarkerStatusSearchAPI,
			//MarkerTypeSearchAPI,
			// global APIs
			ValidateJnumAPI,
			VocTermSearchAPI,
			ValidateTermAPI
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {};

		// api/json input/output
		vm.apiDomain = {};

                // default booleans for page functionality
		vm.hideApiDomain = true;       // JSON package
		vm.hideVmData = true;          // JSON package + other vm objects
                vm.hideErrorContents = true;	// display error message

		// used in validateTerm()
		vm.includeObsolete = false;

		// results list and data
		vm.total_count = 0;
		vm.results = [];
		vm.selectedIndex = -1;
		vm.selectedAnnotIndex = 0;
		vm.selectedPropertyIndex = 0;
		
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			resetData();
			refreshTotalCount();
			loadVocabs();
			addAnnotRow();
			addAnnotRow();
			addReferenceRow();
		}

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        	// mapped to 'Clear' button; called from init();  resets page
		function clear() {		
			resetData();
                        refreshTotalCount();
			addAnnotRow();
			addAnnotRow();
			addReferenceRow();
			setFocus();
		}		

		// mapped to query 'Search' button
		// default is to select first result
		function search() {				
			console.log(vm.apiDomain);
		
			pageScope.loadingStart();
			
			GOAnnotSearchAPI.search(vm.apiDomain, function(data) {
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
				pageScope.handleError(vm, "API ERROR: GOAnnotSearchAPI.search");
				pageScope.loadingEnd();
				setFocus();
			});
		}		

		function searchAccId() {
			console.log("searchAccId");

			if (vm.apiDomain.markerKey == "" && vm.apiDomain.accID != "") {
				search();
			}
		}

		function searchDisplay() {
			console.log("searchDisplay");

			if (vm.apiDomain.markerKey == "" && vm.apiDomain.markerDisplay != "") {
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
                        GOAnnotTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		///
		// get order by
		//
		function getOrderBy(i) {				
			console.log("getOrderBy: " + i);
		
			GOAnnotOrderByAPI.search(vm.apiDomain, function(data) {
				vm.apiDomain.annots = data.items;
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: GOAnnotOrderByAPI.query");
			});
		}		

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////
		
        	// modify annotations
		function modifyAnnot() {
			console.log("modifyAnnot() -> GOAnnotUpdateAPI()");
			var allowCommit = true;

			// check if record selected
			if(vm.selectedIndex < 0) {
				alert("Cannot save this Annotation if a record is not selected.");
				allowCommit = false;
			}
			
			if (vm.apiDomain.markerStatusKey == "2") {
				alert("Cannot save this Annotation because this Marker is withdrawn");
				allowCommit = false;
			}
			
			if (vm.apiDomain.markerTypeKey != "1") {
				alert("WARNING: This Marker is not a Gene");
			}

			// check required
			for(var i=0;i<vm.apiDomain.annots.length; i++) {
				if (vm.apiDomain.annots[i].processStatus == "u") {
					if (vm.apiDomain.annots[i].evidenceTermKey == "115") {
						alert("Cannot add/modify any IEA annotation");
						allowCommit = false;
					}
					if ((vm.apiDomain.annots[i].termKey == "")
						|| (vm.apiDomain.annots[i].refsKey == "")
					) {
						alert("Required Fields are missing:  Term ID, J:");
						allowCommit = false;
					}
				}
			}

			if (allowCommit){
				pageScope.loadingStart();

				GOAnnotUpdateAPI.update(vm.apiDomain, function(data) {
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						loadObject();
					}
					pageScope.loadingEnd();
				}, function(err) {
					pageScope.handleError(vm, "API ERROR: GOAnnotUpdateAPI.update");
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

			// rebuild empty apiDomain submission object, else bindings fail
			vm.apiDomain = {};
			vm.apiDomain.orderBy = 0;
			vm.apiDomain.markerKey = "";	
			vm.apiDomain.markerDisplay = "";	
			vm.apiDomain.accID = "";
			vm.apiDomain.goNote = [];

			// term-specific checks
			vm.apiDomain.allowEditTerm = false;	// allow user to change Terms/default is false

			addReferenceRow();
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");

			vm.apiDomain.orderBy = 0;
			vm.apiDomain.markerKey = "";	
			vm.apiDomain.markerDisplay = "";	
			vm.apiDomain.accID = "";
			vm.apiDomain.goNote = [];
			vm.apiDomain.annots = [];
			addAnnotRow();
			addReferenceRow();
		}

		// load vocabularies
                function loadVocabs() {
                        console.log("loadVocabs()");

			//vm.markerStatusLookup = [];
                        //MarkerStatusSearchAPI.search({}, function(data) { vm.markerStatusLookup = data; });;

			//vm.markerTypeLookup = [];
                        //MarkerTypeSearchAPI.search({}, function(data) { vm.markerTypeLookup = data; });;

			vm.qualifierLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"52"}, function(data) { 
				vm.qualifierLookup = data.items[0].terms
				for(var i=0;i<vm.qualifierLookup.length; i++) {
					if (vm.qualifierLookup[i].abbreviation == null) {
						vm.qualifierLookup[i].abbreviation = "(none)";
					}
				}
			});;

			vm.evidenceLookup = {};
			VocTermSearchAPI.search({"vocabKey":"3"}, function(data) { vm.evidenceLookup = data.items[0].terms});;

			vm.propertyLookup = {};
			VocTermSearchAPI.search({"vocabKey":"82"}, function(data) { vm.propertyLookup = data.items[0].terms});;

			vm.orderByLookup = {};
			vm.orderByLookup[0] = {"termKey": 0, "term": "by DAG, recent modification date, term" };
			vm.orderByLookup[1] = {"termKey": 1, "term": "by recent creation date, term" };
			vm.orderByLookup[2] = {"termKey": 2, "term": "by GO ID" };
			vm.orderByLookup[3] = {"termKey": 3, "term": "by J:, term" };
			vm.orderByLookup[4] = {"termKey": 4, "term": "by Evidence Code, term" };
			vm.orderByLookup[5] = {"termKey": 5, "term": "by recent modification date, term" };
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

			GOAnnotGetAPI.get({ key: vm.results[vm.selectedIndex].markerKey }, function(data) {
				vm.apiDomain = data;
				vm.apiDomain.markerKey = vm.results[vm.selectedIndex].markerKey;
				vm.apiDomain.markerDisplay = vm.results[vm.selectedIndex].markerDisplay;
				selectAnnot(0);

				// create new rows
                        	for(var i=0;i<5; i++) {
                                	addAnnotRow();
                        	}
				
				getReferences();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: GOAnnotGetAPI.get");
			});
		}	
		
		// when an annot is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove annot (and thumbnail, if it exists)
			removeSearchResultsItem(vm.apiDomain.markerKey);

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
			input.focus(document.getElementById("markerDisplay"));
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
					selectAnnot(index + 1);
					return;
				}
				else {
					row.refsKey = "";
					row.jnumid = "";
					row.jnum = null;
					row.short_citation = "";
					selectAnnot(index + 1);
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
					selectAnnot(index + 1);
				} else {
					row.refsKey = data[0].refsKey;
					row.jnumid = data[0].jnumid;
					row.jnum = parseInt(data[0].jnum, 10);
					row.short_citation = data[0].short_citation;
					selectAnnot(index + 1);
				}

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateJnumAPI.query");
				document.getElementById(id).focus();
				row.refsKey = "";
                                row.jnumid = ""; 
                                row.jnum = null; 
				row.short_citation = "";
				selectAnnot(index + 1);
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

			params.accessionIds = [];
			params.accessionIds.push({"accID":row.termid.trim()});
			params.includeObsolete = vm.includeObsolete;
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
		
		// add new row
		function addReferenceRow() {

			vm.references = [];

                        vm.references[0] = {
      				"refsKey": "",
      				"jnumid": ""
      				//"short_citation": ""
    			}
		}		

		// get references by marker key
		function getReferences() {
			console.log("getReferences: " + vm.apiDomain.markerKey);

			GOAnnotGetReferencesAPI.query({key: vm.apiDomain.markerKey}, function(data) {
				vm.references = data;
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: GOAnnotGetReferencesAPI.query");
			});
		}	

		/////////////////////////////////////////////////////////////////////
		// annotations 
		/////////////////////////////////////////////////////////////////////		
		
		// set current annotation row
		function selectAnnot(index) {
			console.log("selectAnnot: " + index);
			vm.selectedAnnotIndex = index;
			vm.selectedPropertyIndex = 0;
			addPropertyRow(index);
		}

		// set current note row
		function selectProperty(index) {
			console.log("selectProperty: " + index);
			vm.selectedPropertyIndex = index;
		}

		//
		// change of row/field detected
		//
		
		// if current annotation row has changed
		function changeAnnotRow(index) {
			console.log("changeAnnotRow: " + index);

			vm.selectedAnnotIndex = index;

			if (vm.apiDomain.annots[index] == null) {
				vm.selectedAnnotIndex = 0;
				return;
			}

			if (vm.apiDomain.annots[index].processStatus == "x") {
				vm.apiDomain.annots[index].processStatus = "u";
			};

			addPropertyRow(index);
		}

		// add new annotation row
		function addAnnotRow() {

			if (vm.apiDomain.annots == undefined) {
				vm.apiDomain.annots = [];
			}

			var i = vm.apiDomain.annots.length;

			vm.apiDomain.annots[i] = {
				"processStatus": "c",
				"annotKey": "",
				"annotTypeKey": "1000",
			       	"objectKey": vm.apiDomain.markerKey,
				"termid" : "",
			       	"termKey": "",
			       	"term": "",
			       	"qualifierKey": "",
			       	"qualifierAbbreviation": "",
				"annotEvidenceKey": "",
				"annotKey": "",
			       	"evidenceTermKey": "",
			       	"evidenceAbbreviation": "",
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

			if (vm.apiDomain.annots[vm.selectedAnnotIndex].properties == null) {
				vm.selectedPropertyIndex = 0;
				return;
			}

			if (vm.apiDomain.annots[vm.selectedAnnotIndex].properties[index].processStatus == "x") {
				vm.apiDomain.annots[vm.selectedAnnotIndex].properties[index].processStatus = "u";
			};
		}

		// add new property row
		function addPropertyRow(index) {
			console.log("addPropertyRow: " + index);

			if (vm.apiDomain.annots == null) {
				return;
			}

			if (vm.apiDomain.annots.length == 0) {
				return;
			}

			if (vm.apiDomain.annots[index].properties == undefined) {
				vm.apiDomain.annots[index].properties = [];
			}

			var i = vm.apiDomain.annots[index].properties.length;
			var sequenceNum = i + 1;

			vm.apiDomain.annots[index].properties[i] = {
				"processStatus": "c",
				"evidencePropertyKey": "",
				"annotevidenceKey": "1000",
			       	"propertyTermKey": "",
			       	"propertyTerm": "",
			       	"stanza": "",
			       	"sequenceNum": sequenceNum,
				"value": ""
			}
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
		$scope.modifyAnnot = modifyAnnot;
		$scope.changeAnnotRow = changeAnnotRow;
		$scope.addAnnotRow = addAnnotRow;
		$scope.changePropertyRow = changePropertyRow;
		$scope.addPropertyRow = addPropertyRow;
		$scope.selectAnnot = selectAnnot;
		$scope.selectProperty = selectProperty;
		$scope.getOrderBy = getOrderBy;

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

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
