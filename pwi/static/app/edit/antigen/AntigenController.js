(function() {
	'use strict';
	angular.module('pwi.antigen').controller('AntigenController', AntigenController);

	function AntigenController(
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
			AntigenSearchAPI,
			AntigenGetAPI,
			AntigenUpdateAPI,
                        AntigenDeleteAPI,
			AntigenTotalCountAPI,
                        OrganismSearchAPI, // this need to move to global factor out of actldb and one other
                        ValidateTermSlimAPI, // move this to  global too
                        TissueSearchAPI, // moe this to global
			// global APIs
			ValidateTermAPI,
                        ValidateStrainAPI,
                        VocTermSearchAPI
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {};

		// api/json input/output
		vm.apiDomain = {};
                
                //verifications
                vm.organismLookup = [];
                OrganismSearchAPI.search({}, function(data) { vm.organismLookup = data});;

                vm.ageLookup = []
                VocTermSearchAPI.search({"vocabKey":"126"}, function(data) { vm.ageLookup = data.items[0].terms});;

                vm.genderLookup = []
                VocTermSearchAPI.search({"vocabKey":"17"}, function(data) { vm.genderLookup = data.items[0].terms});;

                // default booleans for page functionality
		vm.hideApiDomain = true;       // JSON package
		vm.hideVmData = true;          // JSON package + other vm objects
                vm.hideErrorContents = true;	// display error message

		// results list and data
		vm.total_count = 0;
		vm.results = [];
		vm.selectedIndex = -1;
		vm.selectedAntigenIndex = 0;
		vm.selectedNoteIndex = 0;
		
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
                        console.log("init()");
			resetData();
			refreshTotalCount();
			//loadVocabs();
			addAntigenRow();
			addAntigenRow();
                        console.log("done init()");
		}

                
		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        	// mapped to 'Clear' button; called from init();  resets page
		function clear() {		
                        console.log("clear()");
			resetData();
                        refreshTotalCount();
			addAntigenRow();
			addAntigenRow();
			setFocus();
                        console.log("done clear()");
		}		

		// mapped to query 'Search' button
		// default is to select first result
		function search() {
                        console.log("antigen search()");				
			console.log(vm.apiDomain);
		
			pageScope.loadingStart();
			console.log("after pageScope.loadingStart()");
			// call API to search; pass query params (vm.selected)
			AntigenSearchAPI.search(vm.apiDomain, function(data) {
				console.log("setting vm.results - data");
				vm.results = data;
				vm.selectedIndex = 0;
				if (vm.results.length > 0) {
                                        console.log("calling loadObject");
					loadObject();
                                        console.log("done calling loadObject");
				}
				pageScope.loadingEnd();
				setFocus();

			}, function(err) { // server exception
				pageScope.handleError(vm, "API ERROR: AntigenSearchAPI.search");
				pageScope.loadingEnd();
				setFocus();
			});
		}		

		function searchAccId() {
			console.log("searchAccId");

			if (vm.apiDomain.antigenKey == "" && vm.apiDomain.accID != "") {
				search();
			}
		}

		/////////////////////////////////////////////////////////////////////
		// Search Results
		/////////////////////////////////////////////////////////////////////
		
        	// called when user clicks a row in the results
		function selectResult(index) {
                        console.log("selectResult(index): " + index);
                        console.log("selectResult vm.selectedIndex: " + vm.selectedIndex);

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
                        console.log("refreshTotalCount()");
                        AntigenTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////
		
        	// update antigen
		function updateAntigen() {
			console.log("updateAntigen() -> AntigenUpdateAPI()");
			var allowCommit = true;

			// check if record selected
			if(vm.selectedIndex < 0) {
				alert("Cannot Modify if a record is not selected.");
				allowCommit = false;
			}
			
			// check required
			for(var i=0;i<vm.apiDomain.antigens.length; i++) {
                                if ((vm.apiDomain.antigens[i].antigenKey == "")
                                        || (vm.apiDomain.antigens[i].sourceKey == "")
                                ) {
                                        alert("Required Fields are missing:  Antigen ID, Source");
                                        allowCommit = false;
                                }
			}

			if (allowCommit){
				pageScope.loadingStart();

				AntigenUpdateAPI.update(vm.apiDomain, function(data) {
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						loadObject();
					}
					pageScope.loadingEnd();
				}, function(err) {
					pageScope.handleError(vm, "API ERROR: AntigenUpdateAPI.update");
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
                        console.log("scrollToObject()");
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
			vm.selectedIndex = -1;
			vm.total_count = 0;

			// rebuild empty apiDomain submission object, else bindings fail
			vm.apiDomain = {};
			vm.apiDomain.antigenKey = "";	
			vm.apiDomain.accID = "";
                }

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");
			vm.apiDomain.antigenKey = "";	
			vm.apiDomain.antigens = [];
			addAntigenRow();
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

			// api get object by primary key
			console.log("vm.results[vm.selectedIndex].antigenKey: " + vm.results[vm.selectedIndex].antigenKey);
			AntigenGetAPI.get({ key: vm.results[vm.selectedIndex].antigenKey }, function(data) {

				vm.apiDomain = data;
				vm.apiDomain.antigenKey = vm.results[vm.selectedIndex].antigenKey;
				vm.apiDomain.regionCovered = vm.results[vm.selectedIndex].regionCovered;
                                vm.apiDomain.antigenNote =  vm.results[vm.selectedIndex].antigenNote;
				selectAntigen(0);

				// create new rows
                        	for(var i=0;i<5; i++) {
                                	addAntigenRow();
                        	}

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AntigenGetAPI.get");
			});
		}	
		
		// when an antigen is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove antigen
			removeSearchResultsItem(vm.apiDomain.antigenKey);

			// clear if now empty; otherwise, load next row
			if (vm.results.length == 0) {
				clear();
			}
			else {
				// adjust selected results index as needed, and load antigen
				if (vm.selectedIndex > vm.results.length -1) {
					vm.selectedIndex = vm.results.length -1;
				}
				loadObject();
			}
		}

		// handle removal from results list
		function removeSearchResultsItem(keyToRemove) {
			 console.log("removeSearchResultsItem()");
			// first find the item to remove
			var removeIndex = -1;
			for(var i=0;i<vm.results.length; i++) {
				if (vm.results[i].antigenKey == keyToRemove) {
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
			input.focus(document.getElementById("antigenName"));
                        //simple vocab does this, syntax a little different:
                        document.getElementById("antigenName").focus();
		}

		/////////////////////////////////////////////////////////////////////
		// validating
		/////////////////////////////////////////////////////////////////////		

                // validate strain	
                function validateStrain() {
                        console.log("vm.apiDomain.probeSource.strain: " + vm.apiDomain.probeSource.strain);
                        if (vm.apiDomain.probeSource.strain == undefined) {
                                console.log("strain undefined");
                                return;
                        }

                        if (vm.apiDomain.probeSource.strain.includes("%")) {
                                 console.log("strain  has wildcard")
                                return;
                        }
                        console.log("Calling the API");
                        ValidateStrainAPI.search({strain: vm.apiDomain.probeSource.strain}, function(data) {
                                if (data.length == 0) {
                                        alert("Invalid Strain");
                                } else {
                                        if (data[0].isPrivate == "1") {
                                                alert("This value is designated as 'private' and cannot be used: " + vm.apiDomain.strain);
                                                vm.apiDomain.probeSource.strainKey = "";
                                                vm.apiDomain.probeSource.strain = "";
                                                document.getElementById("strain").focus();
                                        }
                                        else {
                                                console.log("validation passed: " + data[0].strain);
                                                vm.apiDomain.probeSource.strainKey = data[0].strainKey;
                                                vm.apiDomain.probeSource.strain = data[0].strain;
                                        }
                                }

                        }, function(err) {
                                pageScope.handleError(vm, "API ERROR: ValidateStrainAPI.search");
                                document.getElementById("strain").focus();
                        });
                }
                // validate Tissue
                function validateTissue() {
                        console.log("vm.apiDomain.probeSource.tissue: " + vm.apiDomain.probeSource.tissue);
                        if (vm.apiDomain.probeSource.tissue == undefined) {
                                console.log("tissue undefined");
                                return;
                        }

                        if (vm.apiDomain.probeSource.tissue.includes("%")) {
                                 console.log("tissue  has wildcard")
                                return;
                        }
                        console.log("Calling the API");
                        TissueSearchAPI.search({tissue: vm.apiDomain.probeSource.tissue}, function(data) {
                                if (data.length == 0 || data == undefined) {
                                        alert("Invalid Tissue");
                                } else {
                                        console.log("validation passed: " + data[0].tissue);
                                        vm.apiDomain.probeSource.tissueKey = data[0].tissueKey;
                                        vm.apiDomain.probeSource.tissue = data[0].tissue;
                                }

                        }, function(err) {
                                pageScope.handleError(vm, "API ERROR: ValidateTissueAPI.search");
                                document.getElementById("tissue").focus();
                        });
                }
                // this validation not working. data is  undefined
                function validateCellLine() {

                        if (vm.apiDomain.probeSource.cellLine == undefined) {
                                console.log("cellLine undefined");
                                return;
                        }

                        if (vm.apiDomain.probeSource.cellLine.includes("%")) {
                                 console.log("cellLine has wildcard") // this is working
                                return;
                        }

                        var params = {
                                "vocabKey":"",
                                "term":""
                        };

                        params.vocabKey = "18";
                        params.term = vm.apiDomain.probeSource.cellLine;
                        console.log(params); // this logged domain works in swagger

                        console.log("Calling the API"); // this prints in console
                        
                        ValidateTermSlimAPI.validate(params, function(data) {
                                console.log("data: " + data); // [object Object]
                                console.log("data[0]: " + data[0]); //undefined
                                if (data.length == 0 || data == undefined) {
                                        alert("Invalid Cell Line");
                                } 
                                else {
                                        console.log('validation passed');
                                        console.log("term: " + data[0].term + " termKey: " + data[0].termKey);
                                        vm.apiDomain.probeSource.cellLineKey = data[0].termKey;
                                        vm.apiDomain.probeSource.cellLine = data[0].term;
                                }

                        }, function(err) {
                                pageScope.handleError(vm, "API ERROR: ValidateStrainAPI.search");
                                document.getElementById("cellLine").focus();
                        });
                }
	
        	// validate term - don't think we need this, it's for one-2-many
		function validateTerm(domain) {		
			console.log("validateTerm = " + id + index);

			id = id + index;

			if (domain.term == "") {
				row.termKey = "";
				return;
			}

			// json for term search
			var params = {};
			params.vocabKey = "18";
                        params.termKey = row.termKey;
                        params.term = row.term;
			console.log(params);

			ValidateTermAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Term: " + params.term);
					document.getElementById(id).focus();
					row.termKey = "";
					row.term = "";
				} else {
					row.termKey = data[0].termKey;
					row.term = data[0].term;
				}

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateTermAPI.search");
				document.getElementById(id).focus();
				row.termKey = "";
				row.term = "";
			});
		}		

		/////////////////////////////////////////////////////////////////////
		// Antigens
		/////////////////////////////////////////////////////////////////////		
		
		// set current antigen row
		function selectAntigen(index) {
			console.log("selectAntigen: " + index);
			vm.selectedAntigenIndex = index;
		}

		//
		// change of row/field detected
		//
		
		// if current antigen row has changed
		function changeAntigenRow(index) {
			console.log("changeAntigenRow: " + index);

			vm.selectedAntigenIndex = index;

			if (vm.apiDomain.antigens[index] == null) {
				vm.selectedAntigenIndex = 0;
				return;
			}
		}

		// add new antigen row
		function addAntigenRow() {

			if (vm.apiDomain.an == undefined) {
				vm.apiDomain.antigens = [];
			}

			var i = vm.apiDomain.antigens.length;

			vm.apiDomain.antigens[i] = { // not sure if this is correct - what about source?
				"antigenKey": "",
				"antigenName": "",
			       	"regionCovered": "",
				"antigenNote" : "",
				"createdBy": "",
				"creation_date": "",
				"modifiedBy": "",
				"modification_date": ""
			}
		}		

                //
		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
		$scope.searchAccId = searchAccId;
		$scope.clear = clear;
		$scope.updateAntigen = updateAntigen;
		$scope.changeAntigenRow = changeAntigenRow;
		$scope.addAntigenRow = addAntigenRow;
		$scope.selectAntigen = selectAntigen;

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

		// other functions: buttons, onBlurs and onChanges
		$scope.selectResult = selectResult;
		$scope.validateTerm = validateTerm;
                $scope.validateStrain = validateStrain;
                $scope.validateTissue = validateTissue;
                $scope.validateCellLine = validateCellLine;
		
		// global shortcuts
		$scope.KclearAll = function() { $scope.clear(); $scope.$apply(); }
		$scope.Ksearch = function() { $scope.search(); $scope.$apply(); }
		$scope.Kfirst = function() { $scope.firstSummaryObject(); $scope.$apply(); }
		$scope.Knext = function() { $scope.nextSummaryObject(); $scope.$apply(); }
		$scope.Kprev = function() { $scope.prevSummaryObject(); $scope.$apply(); }
		$scope.Klast = function() { $scope.lastSummaryObject(); $scope.$apply(); }
                $scope.Kadd = function() { $scope.create(); $scope.$apply(); }
                $scope.Kmodify = function() { $scope.update(); $scope.$apply(); }
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

