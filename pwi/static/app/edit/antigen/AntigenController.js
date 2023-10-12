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
                        AntigenCreateAPI,
			AntigenUpdateAPI,
                        AntigenDeleteAPI,
			AntigenTotalCountAPI,
                        AntigenOrganismSearchAPI, 
                        TissueSearchAPI, // move this to global ?
                        TissueListAPI, 
                        StrainListAPI,
                        VocTermListAPI,
                        AntibodySearchAPI,
                        GenotypeCreateStrainAPI,
                        CreateTissueAPI,
                        TermCreateAPI,
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
               
                // Data for auto completes
                vm.strains = {};
                vm.tissues = {};
                vm.celllines = {};

                // default booleans for page functionality
                vm.hideApiDomain = true;       // JSON package
                vm.hideVmData = true;          // JSON package + other vm objects
                vm.hideErrorContents = true;    // display error message

                // results list and data
                vm.total_count = 0;
                vm.results = [];
                vm.selectedIndex = -1;
                vm.selectedAntigenIndex = 0;
                vm.selectedAntibodyIndex = 0;

                vm.allowCommit = true;

                function loadVocabs() { 
                    
                    console.log("calling AntigenOrganismSearchAPI.search");
                    vm.organismLookup = [];
                    AntigenOrganismSearchAPI.search({}, function(data) { vm.organismLookup = data});;

                    console.log("calling VocTermSearchAPI.search");
                    vm.ageLookup = []
                    VocTermSearchAPI.search({"vocabKey":"147"}, function(data) { vm.ageLookup = data.items[0].terms});;

                    console.log("calling  VocabSearchAPI.search for gender");
                    vm.genderLookup = []
                    VocTermSearchAPI.search({"vocabKey":"17"}, function(data) { vm.genderLookup = data.items[0].terms});;

                    TissueListAPI.get({}, function(data) { vm.tissues = data.items});
                    StrainListAPI.get({}, function(data) { vm.strains = data.items});
                    VocTermListAPI.search({"vocabKey":"18"}, function(data) { vm.celllines = data.items});;
                    setAutoComplete();
                } 

		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
                        console.log("init()");
			resetData();
                        loadVocabs();
			refreshTotalCount();
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

                // set the auto-complete attachments
                function setAutoComplete() {
                        console.log("setAutoComplete()");

                        setTimeout(function() {
                                $q.all([
                                FindElement.byId("editTabTissue"),
                                ]).then(function(elements) {
                                        pageScope.autocompleteBeginning(angular.element(elements[0]), vm.tissues);
                                });

                                // 9/3/20 during alpha per connie remove this for performance reasons
                                //$q.all([
                                //FindElement.byId("editTabStrain"),
                                //]).then(function(elements) {
                                        //pageScope.autocompleteBeginning(angular.element(elements[0]), vm.strains);
                                //});
                                //

                                $q.all([
                                FindElement.byId("editTabCellLine"),
                                ]).then(function(elements) {
                                        pageScope.autocompleteBeginning(angular.element(elements[0]), vm.celllines);
                                });

                        }, (500));
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
                function create() {
                        console.log("create()");
                        vm.allowCommit = true;

                        // verify if record selected
                        if (vm.apiDomain.antigenKey != null && vm.apiDomain.antigenKey != "") {
                                alert("Cannot Add if a record is already selected.");
                                vm.allowCommit = false;
                                return;
                        }

                        // Required: name
                        if(vm.apiDomain.antigenName  == "") {
                                console.log("antigenName is empty");
                                alert("Name required.");
                                vm.allowCommit = false;
                                return;
                        }
                        console.log("organismKey: " + vm.apiDomain.probeSource.organismKey + " antigen note: " + vm.apiDomain.antigenNote);
                        if (vm.apiDomain.probeSource.organismKey == "77" && vm.apiDomain.antigenNote == undefined) {
                                console.log("Antigen Notes are Required");
                                alert("Antigen Notes are Required");
                                vm.allowCommit = false;
                                return;
                        }
                        if (vm.allowCommit){
                            console.log("createAntigen() -> AntigenCreateAPI()");
                            pageScope.loadingStart();

                            console.log("before calling AntigenCreateAPI");
                            AntigenCreateAPI.create(vm.apiDomain, function(data) {
                            console.log("after calling AntigenCreateAPI");
                                    pageScope.loadingEnd();

                                    if (data.error != null) {
                                            alert("ERROR: " + data.error + " - " + data.message);
                                    }
                                    else {
                                            vm.apiDomain = data.items[0];
                                            console.log("vm.results before: " +  vm.results.length);
                                            vm.selectedIndex = vm.results.length;
                                            vm.results[vm.selectedIndex] = [];
                                            vm.results[vm.selectedIndex].antigenKey = vm.apiDomain.antigenKey;
                                            vm.results[vm.selectedIndex].antigenName = vm.apiDomain.antigenName;
                                            console.log("vm.results after: " +  vm.results.length);
                                            console.log ("vm.selectedIndex: " +  vm.selectedIndex);
                                            console.log ("vm.results[vm.selectedIndex].name " + vm.results[vm.selectedIndex].antigenName);
                                            console.log("vm.results[vm.selectedIndex].logicalDBKey: " + vm.results[vm.selectedIndex].antigenKey);
                                            loadObject();
                                            refreshTotalCount();
                                    }
                                    pageScope.loadingEnd();
                                    setFocus();

                            }, function(err) {
                                    pageScope.handleError(vm, "Error creating Antigen.");
                                    pageScope.loadingEnd();
                                    setFocus();
                            });
                    }
                }

        	// update antigen
		function update() {
			console.log("update() -> AntigenUpdateAPI()");
			var allowCommit = true;

			// check if record selected
			if(vm.selectedIndex < 0) {
				alert("Cannot Modify if a record is not selected.");
				allowCommit = false;
			}
			
			// check required
			//for(var i=0;i<vm.apiDomain.antigens.length; i++) {
                        //        if ((vm.apiDomain.antigens[i].antigenKey == "")
                        //                || (vm.apiDomain.antigens[i].sourceKey == "")
                        //        ) {
                        //                alert("Required Fields are missing:  Antigen ID, Source");
                        //                allowCommit = false;
                        //        }
			//}

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

                function deleteAntigen() {
                    console.log("delete() -> AntigenDeleteAPI()");

                    if ($window.confirm("Are you sure you want to delete this record?")) {

                        pageScope.loadingStart();
                        console.log("vm.apiDomain.antigenKey" + vm.apiDomain.antigenKey);
                        AntigenDeleteAPI.delete({ key: vm.apiDomain.antigenKey }, function(data) {
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
                            pageScope.handleError(vm, "Error deleting Antigen.");
                            pageScope.loadingEnd();
                            setFocus();
                        });
                    }
                }
	
                function loadAntibodiesForAntigen() {
                        //AntigenGetAPI.get({ key: vm.results[vm.selectedIndex].antigenKey }, function(data) {
                         console.log("vm.apiDomain.antigenKey: " + vm.apiDomain.antigenKey);
                         AntibodySearchAPI.search( vm.apiDomain.antigenKey , function(data) {
                                if (data.error != null) {
                                        alert("ERROR: " + data.error + " - " + data.message);
                                }

                                if (data.length == 0) {
                                        console.log("No Antibodies found for antigen key: " + vm.apiDomain.antigenKey);
                                } else {
                                        vm.apiDomain.antibodies = data;
                                }

                        }, function(err) {
                                pageScope.handleError(vm, "Error retrieving antibodies for this antigen");
                        });

                }
// ADD SEARCH ANTIBODIES HERE
                

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
			   FindElement.byQuery("#resultsTable .SelectedRow")
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
                        vm.apiDomain.antibodies = [];
                        addAntibodyRow()

                        vm.apiDomain.probeSource = {
                                "sourceKey": ""
                        };
                }

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");
			vm.apiDomain.antigenKey = "";	
			vm.apiDomain.antibodies = [];
                        addAntibodyRow();
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
			console.log("vm.results[vm.selectedIndex].antigenKey: " + vm.results[vm.selectedIndex].antigenKey + " antigenName: " + vm.results[vm.selectedIndex].antigenName);
			AntigenGetAPI.get({ key: vm.results[vm.selectedIndex].antigenKey }, function(data) {
				vm.apiDomain = data;
                                console.log("age: " + vm.apiDomain.probeSource.age + " gender: " + vm.apiDomain.probeSource.gender + " agePrefix: " + vm.apiDomain.probeSource.agePrefix);
                                loadAntibodiesForAntigen();
				selectAntibody(0);
        

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AntigenGetAPI.get");
			});
                        //console.log("loadObject vm.apiDomain strain: " + vm.apiDomain.probeSource.strain + " key: " + vm.apiDomain.probeSource.strainKey);
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
                        console.log("validateStrain()");
                        console.log("vm.apiDomain.probeSource.strain: " + vm.apiDomain.probeSource.strain);
                        if (vm.apiDomain.probeSource.strain == undefined || vm.apiDomain.strain == "") {
                                console.log("strain undefined or empty");
                                return;
                        }

                        if (vm.apiDomain.probeSource.strain.includes("%")) {
                                 console.log("strain  has wildcard")
                                return;
                        }
                        console.log("Calling the API");
                        ValidateStrainAPI.search({strain: vm.apiDomain.probeSource.strain}, function(data) {
                                if (data.length == 0 || data == undefined) {
                                        createStrain();
                                } 
                                else {
                                        if (data[0].isPrivate == "1") {
                                                alert("This value is designated as 'private' and cannot be used: " + vm.apiDomain.probeSource.strain);
                                                vm.apiDomain.probeSource.strainKey = "";
                                                vm.apiDomain.probeSource.strain = "";
                                                document.getElementById("strain").focus();
                                        }
                                        else {
                                                console.log("validation passed: " + data[0].strain + " key: " +  data[0].strainKey);
                                                vm.apiDomain.probeSource.strainKey = data[0].strainKey;
                                                vm.apiDomain.probeSource.strain = data[0].strain;
                                        }
                                }

                        }, function(err) {
                                pageScope.handleError(vm, "API ERROR: ValidateStrainAPI.search");
                                document.getElementById("strain").focus();
                        });
                }

                function createStrain(newstrain) {
                        console.log("createStrain");

                        var newstrain = {};
                        newstrain.strain = vm.apiDomain.probeSource.strain;

                        // process new strain if user responds OK
                        if ($window.confirm("The item: \n\n'" + newstrain.strain + "' \n\ndoes not exist.\n\nTo add new item, click 'OK'\n\nElse, click 'Cancel'")) {
                                newstrain.speciesKey = "481207";
                                newstrain.strainTypeKey = "3410535";
                                newstrain.standard = "0";
                                newstrain.isPrivate = "0";
                                newstrain.geneticBackground = "0";

                                GenotypeCreateStrainAPI.create(newstrain, function(data) {
                                        if (data.error != null) {
                                                alert("ERROR: " + data.error + " - " + data.message);
                                                vm.apiDomain.probeSource.strainKey = "";
                                                vm.apiDomain.probeSource.strain = "";
                                                document.getElementById("editTabStrain").focus();
                                        } else {
                                                console.log("ran GenotypeCreateStrainAPI.create");
                                                vm.apiDomain.probeSource.strainKey = data.items[0].strainKey;
                                        }
                                }, function(err) {
                                        pageScope.handleError(vm, "API ERROR: GenotypeCreateStrainAPI.create");
                                });
                        }
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
                                        createTissue();

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


                function createTissue(newtissue) {
                        console.log("createTissue");

                        var newtissue = {};
                        newtissue.tissue = vm.apiDomain.probeSource.tissue;

                        // process new tissue if user responds OK
                        if ($window.confirm("The item: \n\n'" + newtissue.tissue + "' \n\ndoes not exist.\n\nTo add new item, click 'OK'\n\nElse, click 'Cancel'")) {
                                newtissue.standard = "0";

                                CreateTissueAPI.create(newtissue, function(data) {
                                        if (data.error != null) {
                                                alert("ERROR: " + data.error + " - " + data.message);
                                                vm.apiDomain.probeSource.tissueKey = "";
                                                vm.apiDomain.probeSource.tissue = "";
                                                document.getElementById("editTabTissue").focus();
                                        } else {
                                                console.log("ran CreateTissueAPI.create");
                                                vm.apiDomain.probeSource.tissueKey = data.items[0].tissueKey;
                                        }
                                }, function(err) {
                                        pageScope.handleError(vm, "API ERROR: CreateTissueAPI.create");
                                });
                        }
                }
 
                //  validate cell line
                function validateCellLine() {

                        if (vm.apiDomain.probeSource.cellLine == "") {
                                console.log("cellLine is blank")
                                return;
                        }

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
                        console.log(params); 

                        console.log("Calling the API"); 
                        
                        ValidateTermAPI.search(params, function(data) {

                               if (data.length == 0) {
                                        createCellLine();
                               }
                               else {
                                        console.log('validation passed');
                                        vm.apiDomain.probeSource.cellLineKey = data[0].termKey;
                                        vm.apiDomain.probeSource.cellLine = data[0].term;
                               }

                        }, function(err) {
                                pageScope.handleError(vm, "API ERROR: ValidateTerm.search");
                                document.getElementById(id).focus();

                        });
                }
                
                function createCellLine(newcellline) {
                        console.log("createCellLine");

                        //var newcellline = {};   // this is a vocabDomain
                        var newterm = {};       // this is a termDomain

                        // add term, and processStatus to domain
                        newterm.term = vm.apiDomain.probeSource.cellLine;
                        newterm.processStatus = "c";
                        newterm.isObsolete = "0";
                        newterm.vocabKey = "18";

                        // process new cell line if user responds OK
                        if ($window.confirm("The item: \n\n'" + newterm.term + "' \n\ndoes not exist.\n\nTo add new item, click 'OK'\n\nElse, click 'Cancel'")) {

                                TermCreateAPI.create(newterm, function(data) {
                                        if (data.error != null) {
                                                alert("ERROR: " + data.error + " - " + data.message);
                                                vm.apiDomain.probeSource.cellLineKey = "";
                                                vm.apiDomain.probeSource.cellLine = "";
                                                document.getElementById("editTabCellLine").focus();
                                        } else {
                                                console.log("ran TermCreateAPI.update to create cellLine");
                                                vm.apiDomain.probeSource.cellLineKey = data.items[0].termKey;
                                        }
                                }, function(err) {
                                        pageScope.handleError(vm, "API ERROR: TermCreateAPI.update for cell line");
                                });
                        }
                }
	
		/////////////////////////////////////////////////////////////////////
		// Antigens
		/////////////////////////////////////////////////////////////////////		
		
		// set current antibody row
		function selectAntibody(index) {
			console.log("selectAntibody: " + index);
			vm.selectedAntibodyIndex = index;
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
		function addAntibodyRow() {

			if (vm.apiDomain.antibodies == undefined) {
				vm.apiDomain.antibodies = [];
			}

			var i = vm.apiDomain.antibodies.length;
			vm.apiDomain.antibodies[i] = { 
				"antibodyKey": "",
				"antibodyName": "",
			       	"accID": ""
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
                $scope.create = create;
                $scope.update = update;
                $scope.deleteAntigen = deleteAntigen;

		$scope.changeAntigenRow = changeAntigenRow;
		$scope.addAntibodyRow = addAntibodyRow;
		$scope.selectAntibody = selectAntibody;
                $scope.setAutoComplete = setAutoComplete;

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

		// other functions: buttons, onBlurs and onChanges
		$scope.selectResult = selectResult;
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
                $scope.Kdelete = function() { $scope.deleteAntigen(); $scope.$apply(); }

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

