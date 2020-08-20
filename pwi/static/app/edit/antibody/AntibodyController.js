(function() {
	'use strict';
	angular.module('pwi.antibody').controller('AntibodyController', AntibodyController);

	function AntibodyController(
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
			AntibodyGetAPI,
                        AntibodyCreateAPI,
			AntibodyUpdateAPI,
                        AntibodyDeleteAPI,
			AntibodyTotalCountAPI,
                        AntigenOrganismSearchAPI, 
                        AntibodyOrganismSearchAPI,
                        ValidateTermSlimAPI, // move this to  glob
                        TissueSearchAPI, // moe this to global
                        AntibodySearchAPI,
                        AntibodyTypeSearchAPI,
                        AntibodyClassSearchAPI,
                        ValidateAntigenAccAPI,
			// global APIs
			ValidateTermAPI,
                        ValidateStrainAPI,
                        VocTermSearchAPI,
                        ReferenceAssocTypeSearchAPI,
                        ValidateMarkerAPI,
                        ValidateJnumAPI
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {};

		// api/json input/output
		vm.apiDomain = {};
               
                // default booleans for page functionality
                vm.hideApiDomain = true;       // JSON package
                vm.hideVmData = true;          // JSON package + other vm objects
                vm.hideErrorContents = true;    // display error message

                // results list and data
                vm.total_count = 0;
                vm.results = [];
                vm.selectedIndex = -1;
                vm.selectedAntibodyIndex = 0;
                vm.selectedAntibodyIndex = 0;

                function loadVocabs() {
                    //verifications/drop down menues
                    // antibody
                    console.log("calling AntibodyTypeSearchAPI.search for antibody type");
                    vm.typeLookup = []
                    AntibodyTypeSearchAPI.search({}, function(data) { vm.typeLookup = data});;

                    console.log("calling AntibodyClassSearchAPI.search for antibody class");
                    vm.classLookup = []
                    AntibodyClassSearchAPI.search({}, function(data) { vm.classLookup = data});;

                    // antigens
                    console.log("calling AntigenOrganismSearchAPI.search");
                    vm.organismLookup = [];
                    AntigenOrganismSearchAPI.search({}, function(data) { vm.organismLookup = data});;

                    // antibodies
                    console.log("calling AntibodyOrganismSearchAPI.search");
                    vm.antibodyOrganismLookup = [];
                    AntibodyOrganismSearchAPI.search({}, function(data) { vm.antibodyOrganismLookup = data});;

                    // age
                    console.log("calling VocTermSearchAPI.search for age");
                    vm.ageLookup = []
                    VocTermSearchAPI.search({"vocabKey":"147"}, function(data) { vm.ageLookup = data.items[0].terms});;

                    //  gender
                    console.log("calling  VocTermSearchAPI.search for gender");
                    vm.genderLookup = []
                    VocTermSearchAPI.search({"vocabKey":"17"}, function(data) { vm.genderLookup = data.items[0].terms});;
        
                    vm.refAssocTypeLookup = [];
                    ReferenceAssocTypeSearchAPI.search({"mgiTypeKey":"6"}, function(data) { vm.refAssocTypeLookup = data.items});;
                }

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
                        console.log("antibody search()");				
			console.log(vm.apiDomain);
		
			pageScope.loadingStart();
			console.log("after pageScope.loadingStart()");

			// call API to search; pass query params (vm.selected)
			AntibodySearchAPI.search(vm.apiDomain, function(data) {
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
				pageScope.handleError(vm, "API ERROR: AntibodySearchAPI.search");
				pageScope.loadingEnd();
				setFocus();
			});
		}		

		function searchAccId() {
			console.log("searchAccId");

			if (vm.apiDomain.antibodyKey == "" && vm.apiDomain.accID != "") {
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
                        AntibodyTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////


                function createAntibody() {
                        console.log("in createAntibody");
                        vm.allowCommit = true;

                        if (vm.selectedIndex > 0) {
                                alert("Cannot Add if a record is already selected.");
                                vm.allowCommit = false;
                                return;
                        }

                        if(vm.apiDomain.antibodyName  == "") {
                                console.log("antibodyName is empty");
                                alert("Name required.");
                                vm.allowCommit = false;
                                return;
                        }
                        if (validateReferences() == false) {
                                vm.allowCommit = false;
                                return;
                        }
                        if (vm.allowCommit){
                            console.log("createAntibody() -> AntibodyCreateAPI()");
                            pageScope.loadingStart();

                            console.log("before calling AntibodyCreateAPI");
                            AntibodyCreateAPI.create(vm.apiDomain, function(data) {
                                    console.log("after calling AntibodyCreateAPI");
                                    pageScope.loadingEnd();

                                    if (data.error != null) {
                                            alert("ERROR: " + data.error + " - " + data.message);
                                    }
                                    else {
                                            vm.apiDomain = data.items[0];
                                            console.log("vm.results before: " +  vm.results.length);
                                            vm.selectedIndex = vm.results.length;
                                            vm.results[vm.selectedIndex] = [];
                                            vm.results[vm.selectedIndex].antibodyKey = vm.apiDomain.antibodyKey;
                                            vm.results[vm.selectedIndex].antibodyName = vm.apiDomain.antibodyName;
                                            console.log("vm.results after: " +  vm.results.length);
                                            console.log ("vm.selectedIndex: " +  vm.selectedIndex);
                                            console.log ("vm.results[vm.selectedIndex].antibodyName " + vm.results[vm.selectedIndex].antibodyName);
                                            console.log("vm.results[vm.selectedIndex].antibodyKey: " + vm.results[vm.selectedIndex].antibodyKey);
                                            loadObject();
                                            refreshTotalCount();
                                    }
                                    pageScope.loadingEnd();
                                    setFocus();

                            }, function(err) {
                                    pageScope.handleError(vm, "Error creating Antibody.");
                                    pageScope.loadingEnd();
                                    setFocus();
                            });
                    }
                }
        	// update antibody
		function updateAntibody() {
			console.log("updateAntibody() -> AntibodyUpdateAPI()");
			var allowCommit = true;

			// check if record selected
			if(vm.selectedIndex < 0) {
				alert("Cannot Modify if a record is not selected.");
				allowCommit = false;
			}
			
                        if (validateReferences() == false) {
                                vm.allowCommit = false;
                                return;
                        }

			if (allowCommit){
				pageScope.loadingStart();

				AntibodyUpdateAPI.update(vm.apiDomain, function(data) {
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						loadObject();
					}
					pageScope.loadingEnd();
				}, function(err) {
					pageScope.handleError(vm, "API ERROR: AntibodyUpdateAPI.update");
					pageScope.loadingEnd();
				});
			}
			else {
				loadObject();
				pageScope.loadingEnd();
			}
		}		
	
                function getAntibodyObtained() {
                        vm.apiDomain.antibodyNote = "This antibody was obtained from * but no details were provided; multiple antibodies that recognize this protein are available from this vendor."
                }

                function deleteAntibody() {
                    console.log("delete() -> AntibodyDeleteAPI()");

                    if ($window.confirm("Are you sure you want to delete this record?")) {

                        pageScope.loadingStart();
                        console.log("vm.apiDomain.antibodyKey" + vm.apiDomain.antibodyKey);
                        AntibodyDeleteAPI.delete({ key: vm.apiDomain.antibodyKey }, function(data) {
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
			vm.apiDomain.antibodyKey = "";
                        vm.antibodyName = "";
                        vm.antibodyNote = "";
                        vm.antibodyClassKey = "";
                        vm.antibodyClass = "";
                        vm.antibodyTypeKey = "";
                        vm.antibodyType = "";
                        vm.organismKey = "";
                        vm.organism = "";
                        vm.createdByKey = "";
                        vm.createdBy = "";
                        vm.modifiedByKey = "";
                        vm.modifiedBy = "";
                        vm.creation_date = "";
                        vm.modification_date = "";
			vm.apiDomain.accID = "";

                        addAntigen();
                        addAntigenSource();
                        addRefRow();
                        addAliasRow();
                        addMarkerRow();

                }

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");
			vm.apiDomain.antibodyKey = "";	
			vm.apiDomain.refAssocs = [];
                        vm.apiDomain.aliases = [];
                        addRefRow();
                        addAliasRow();
                        addMarkerRow();
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
			console.log("vm.results[vm.selectedIndex].antibodyKey: " + vm.results[vm.selectedIndex].antibodyKey + " antibodyName: " + vm.results[vm.selectedIndex].antibodyName);
			AntibodyGetAPI.get({ key: vm.results[vm.selectedIndex].antibodyKey }, function(data) {
				vm.apiDomain = data;

                                if (vm.apiDomain.refAssocs != undefined) {
                                        selectRefRow(0);
                                }

				selectAntibody(0);
        

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AntibodyGetAPI.get");
			});
                        //console.log("loadObject vm.apiDomain strain: " + vm.apiDomain.antigen.probeSource.strain + " key: " + vm.apiDomain.antigen.probeSource.strainKey);
		}
		
		// when an antibody is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove antibody
			removeSearchResultsItem(vm.apiDomain.antibodyKey);

			// clear if now empty; otherwise, load next row
			if (vm.results.length == 0) {
				clear();
			}
			else {
				// adjust selected results index as needed, and load antibody
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
				if (vm.results[i].antibodyKey == keyToRemove) {
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
			input.focus(document.getElementById("antibodyName"));
                        //simple vocab does this, syntax a little different:
                        document.getElementById("antibodyName").focus();
		}

		/////////////////////////////////////////////////////////////////////
		// validating
		/////////////////////////////////////////////////////////////////////		

                // validate strain	
                function validateStrain() {
                        console.log("vm.apiDomain.antigen.probeSource.strain: " + vm.apiDomain.antigen.probeSource.strain);
                        if (vm.apiDomain.antigen.probeSource.strain == undefined) {
                                console.log("strain undefined");
                                return;
                        }

                        if (vm.apiDomain.antigen.probeSource.strain.includes("%")) {
                                 console.log("strain  has wildcard")
                                return;
                        }
                        console.log("Calling the API");
                        ValidateStrainAPI.search({strain: vm.apiDomain.antigen.probeSource.strain}, function(data) {
                                if (data.length == 0) {
                                        alert("Invalid Strain");
                                        vm.apiDomain.antigen.probeSource.strainKey = "";
                                        vm.apiDomain.antigen.probeSource.strain = "";
                                        document.getElementById("strain").focus();
                                } else {
                                        if (data[0].isPrivate == "1") {
                                                alert("This value is designated as 'private' and cannot be used: " + vm.apiDomain.antigen.probeSource.strain);
                                                vm.apiDomain.antigen.probeSource.strainKey = "";
                                                vm.apiDomain.antigen.probeSource.strain = "";
                                                document.getElementById("strain").focus();
                                        }
                                        else {
                                                console.log("validation passed: " + data[0].strain + " key: " +  data[0].strainKey);
                                                vm.apiDomain.antigen.probeSource.strainKey = data[0].strainKey;
                                                vm.apiDomain.antigen.probeSource.strain = data[0].strain;
                                        }
                                }

                        }, function(err) {
                                pageScope.handleError(vm, "API ERROR: ValidateStrainAPI.search");
                                document.getElementById("strain").focus();
                        });
                }
                // validate Tissue
                function validateTissue() {
                        console.log("vm.apiDomain.antigen.probeSource.tissue: " + vm.apiDomain.antigen.probeSource.tissue);
                        if (vm.apiDomain.antigen.probeSource.tissue == undefined) {
                                console.log("tissue undefined");
                                return;
                        }

                        if (vm.apiDomain.antigen.probeSource.tissue.includes("%")) {
                                 console.log("tissue  has wildcard")
                                return;
                        }
                        console.log("Calling the API");
                        TissueSearchAPI.search({tissue: vm.apiDomain.antigen.probeSource.tissue}, function(data) {
                                if (data.length == 0 || data == undefined) {
                                        alert("Invalid Tissue");
                                        vm.apiDomain.antigen.probeSource.tissueKey = "";
                                        vm.apiDomain.antigen.probeSource.tissue = "";
                                        document.getElementById("tissue").focus();


                                } else {
                                        console.log("validation passed: " + data[0].tissue);
                                        vm.apiDomain.antigen.probeSource.tissueKey = data[0].tissueKey;
                                        vm.apiDomain.antigen.probeSource.tissue = data[0].tissue;
                                }

                        }, function(err) {
                                pageScope.handleError(vm, "API ERROR: ValidateTissueAPI.search");
                                document.getElementById(id).focus();
                        });
                }
                
                function validateCellLine() {

                        if (vm.apiDomain.antigen.probeSource.cellLine == "") {
                                console.log("cellLine is blank")
                                return;
                        }

                        if (vm.apiDomain.antigen.probeSource.cellLine == undefined) {
                                console.log("cellLine undefined");
                                return;
                        }

                        if (vm.apiDomain.antigen.probeSource.cellLine.includes("%")) {
                                 console.log("cellLine has wildcard") // this is working
                                return;
                        }

                        var params = {
                                "vocabKey":"",
                                "term":""
                        };

                        params.vocabKey = "18";
                        params.term = vm.apiDomain.antigen.probeSource.cellLine;
                        console.log(params); // this logged domain works in swagger

                        console.log("Calling the API"); // this prints in console
                        
                        ValidateTermSlimAPI.validate(params, function(data) {
                                //console.log("data: " + data); // [object Object]
                                //console.log("data[0]: " + data.items[0]); //undefined
                                if (data.items == null || data.items == undefined || data.items.length == 0 ) {
                                        alert("Invalid Cell Line");
                                        vm.apiDomain.antigen.probeSource.cellLineKey = "";
                                        vm.apiDomain.antigen.probeSource.cellLine = "";
                                        document.getElementById("cellLine").focus();

                                } 
                                else {
                                        console.log('validation passed');
                                        console.log("term: " + data.items[0].term + " termKey: " + data.items[0].termKey);
                                        vm.apiDomain.antigen.probeSource.cellLineKey = data.items[0].termKey;
                                        vm.apiDomain.antigen.probeSource.cellLine = data.items[0].term;
                                }

                        }, function(err) {
                                pageScope.handleError(vm, "API ERROR: ValidateTermSlim.search");
                                document.getElementById(id).focus();

                        });
                }
                function validateMarker(row, index, id) {
                        console.log("validateMarker = " + id + index);
                        id = id + index
                        if (row.markerSymbol == undefined || row.markerSymbol == "") {
                                row.markerKey = "";
                                row.markerSymbol = ""
                                row.chromosome = "";
                                return;
                        }

                        if (row.markerSymbol.includes("%")) {
                                 console.log("symbol has wildcard")
                                return;
                        }
                        console.log("Calling the API");
                        ValidateMarkerAPI.search({symbol: row.markerSymbol}, function(data) {
                                if (data.length == 0) {
                                        alert("Invalid Marker Symbol: " + row.markerSymbol);
                                        document.getElementById(id).focus();
                                        vm.allowModify = false;
                                        row.markerKey = "";
                                        row.markerSymbol = "";
                                        row.chromosome = "";

                                } else {
                                        console.log("validation passed: " + data[0].symbol);
                                        vm.allowModify = true;
                                        row.markerKey = data[0].markerKey;
                                        row.markerSymbol = data[0].symbol
                                        row.chromosome = data[0].chromosome
                                }

                        }, function(err) {
                                pageScope.handleError(vm, "Invalid Marker Symbol");
                                document.getElementById(id).focus();
                        });
                }

                function validateJnum(row, index, id) {
                        console.log("validateJnum = " + id + index);

                        id = id + index;

                        if (row.jnumid == undefined || row.jnumid == "") {
                        
                                row.refsKey = "";
                                row.jnumid = "";
                                row.short_citation = "";
                                return;
                        }

                        if (row.jnumid.includes("%")) {
                                return;
                        }
                        console.log("Calling the API");
                        ValidateJnumAPI.query({ jnum: row.jnumid }, function(data) {
                                if (data.length == 0) {
                                        alert("Invalid Reference: " + row.jnumid);
                                        document.getElementById(id).focus();
                                        row.refsKey = "";
                                        row.jnumid = "";
                                        row.short_citation = "";
                                } else {
                                        row.refsKey = data[0].refsKey;
                                        row.jnumid = data[0].jnumid;
                                        row.short_citation = data[0].short_citation;
                                }
                        }, function(err) {
                                pageScope.handleError(vm, "Invalid Reference");
                                document.getElementById(id).focus();
                                row.refsKey = "";
                                row.jnumid = "";
                                row.short_citation = "";
                        });
                }
                

                function validateReferences() {
                        console.log("validateReferences()");

                        var hasPrimary = 0;
                        //var hasNoAssocType = 0;
                        for(var i=0;i<vm.apiDomain.refAssocs.length; i++) {
                                if (vm.apiDomain.refAssocs[i].refAssocType == "" && vm.apiDomain.refAssocs[i].refAssocTypeKey == null) {
                                       //hasNoAssocType = 1;
                                       vm.apiDomain.refAssocs[i].refAssocTypeKey = "1026";
                                }
                                if (vm.apiDomain.refAssocs[i].refAssocTypeKey == "1026"
                                        && vm.apiDomain.refAssocs[i].refsKey != "" && vm.apiDomain.refAssocs[i].processStatus != "d") {
                                        hasPrimary += 1;
                                }
                        }
                        //if(hasNoAssocType == 1) {
                        //        alert("One or more references is missing a Reference Type");
                        //        return false;
                        //}
                        if(hasPrimary != 1) {
                                alert("At most one Primary Reference is required.");
                                return false;
                        }
                }

                function validateAntigenAcc() {
                        console.log("vm.apiDomain.antigen.accID " + vm.apiDomain.antigen.accID);
                        if (vm.apiDomain.antigen.accID == undefined | vm.apiDomain.antigen.accID == "") {
                                console.log("Antigen accID undefined or empty");
                                return;
                        }

                        console.log("Calling the API");
                        ValidateAntigenAccAPI.validate({accID: vm.apiDomain.antigen.accID}, function(data) {
                                if (data.length == 0 || data == undefined || data.accID == undefined) {
                                        alert("Invalid Antigen ID");
                                        vm.apiDomain.antigen.antigenKey = "";
                                        vm.apiDomain.antigen.accID = "";
                                        vm.apiDomain.antigen.antigenName= "";
                                        vm.apiDomain.antigen.regionCovered = "";
                                        vm.apiDomain.antigen.antigenNote = "";
                                        
                                        //document.getElementById("antigenAcc").focus();

                                } else {
                                        console.log("validation passed: " );
                                        console.log( data.accID);
                                        vm.apiDomain.antigen.antigenNote = data.antigenNote;
                                        vm.apiDomain.antigen.antigenKey = data.antigenKey;
                                        vm.apiDomain.antigen.accID = data.accID; 
                                        vm.apiDomain.antigen.antigenName= data.antigenName;
                                        vm.apiDomain.antigen.regionCovered = data.regionCovered;
                                        vm.apiDomain.antigen.probeSource.organism = data.probeSource.organism;
                                        vm.apiDomain.antigen.probeSource.strain = data.probeSource.strain;
                                        vm.apiDomain.antigen.probeSource.tissue = data.probeSource.tissue;
                                        vm.apiDomain.antigen.probeSource.description = data.probeSource.description;
                                        vm.apiDomain.antigen.probeSource.agePrefix = data.probeSource.agePrefix;
                                        vm.apiDomain.antigen.probeSource.ageStage = data.probeSource.ageStage;
                                        vm.apiDomain.antigen.probeSource.gender = data.probeSource.gender;
                                        vm.apiDomain.antigen.probeSource.cellLine = data.probeSource.cellLine;
                                }
                        }, function(err) {
                                pageScope.handleError(vm, "API ERROR: ValidateAntigenAccAPI.search");
                                document.getElementById(id).focus();
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Antibodys
		/////////////////////////////////////////////////////////////////////		
		
		// set current antibody row
		function selectAntibody(index) {
			console.log("selectAntibody: " + index);
			vm.selectedAntibodyIndex = index;
		}

		//
		// change of row/field detected
		//
		
		// if current antibody row has changed
		function changeAntibodyRow(index) {
			console.log("changeAntibodyRow: " + index);

			vm.selectedAntibodyIndex = index;

			if (vm.apiDomain.antibodys[index] == null) {
				vm.selectedAntibodyIndex = 0;
				return;
			}
		}

		// add new reference assoc row
		function addRefRow() {

			if (vm.apiDomain.refAssocs == undefined) {
				vm.apiDomain.refAssocs = [];
			}

			var i = vm.apiDomain.refAssocs.length;

                        var allowOnlyOne;
                        if (vm.refAssocTypeKey == "1026") {
                                allowOnlyOne = 1;
                        }
                        if (vm.refAssocTypeKey == "1027") {
                                allowOnlyOne = 0;
                        }
                        console.log("allowOnlyOne: " + allowOnlyOne);
                        console.log("objectKey: " + vm.apiDomain.antibodyKey);
                        vm.apiDomain.refAssocs[i] = {
                                "processStatus": "c",
                                "assocKey": "",
                                "objectKey": vm.apiDomain.antibodyKey,
                                "mgiTypeKey": "6",
                                "refAssocTypeKey": vm.refAssocTypeKey,
                                "refAssocType": "",
                                "allowOnlyOne": allowOnlyOne,
                                "refsKey": "",
                                "jnumid": "",
                                "short_citation": "",
                                "createdBy": "",
                                "creation_date": "",
                                "modifiedBy": "",
                                "modification_date": ""
                        }

		}		

                // if current reference row has changed
                function changeRefRow(index) {
                        console.log("changeRefRow: " + index);

                        vm.selectedRefIndex = index;

                        if (vm.apiDomain.refAssocs[index] == null) {
                                vm.selectedRefIndex = 0;
                                return;
                        }

                        if (vm.apiDomain.refAssocs[index].processStatus == "x") {
                                vm.apiDomain.refAssocs[index].processStatus = "u";
                        };
                }

                // if current marker row has changed
                function changeMarkerRow(index) {
                        console.log("changeMarkerRow: " + index + " procesStatus: " + vm.apiDomain.markers[index].processStatus);

                        vm.selectedMarkerIndex = index;

                        if (vm.apiDomain.markers[index] == null) {
                                vm.selectedMarkerIndex = 0;
                                return;
                        }
                        if (vm.apiDomain.markers[index].processStatus == "x") {
                                vm.apiDomain.markers[index].processStatus = "u";
                        };
                }

                // if current alias row has changed
                function changeAliasRow(index) {
                        console.log("changeAliasRow: " + index + " procesStatus: " + vm.apiDomain.aliases[index].processStatus);

                        vm.selectedAliasIndex = index;

                        if (vm.apiDomain.aliases[index] == null) {
                                vm.selectedAliasIndex = 0;
                                return;
                        }
                        if (vm.apiDomain.aliases[index].processStatus == "x") {
                                vm.apiDomain.aliases[index].processStatus = "u";
                        };
                }

               function selectRefRow(index) {
                    console.log("selectRefRow: " + index);
                    vm.selectedRefIndex = index;

                    if (vm.apiDomain.refAssocs.length == 0) {
                           addRefRow();
                    }

                }

                function addAntigen() {
                    vm.apiDomain.antigen = {
                            "antigenKey": "",
                            "antigenName": "",
                            "regionCovered": "",
                            "antigenNote": "",
                            "createdByKey": "",
                            "createdBy": "",
                            "modifiedByKey": "",
                            "modifiedBy": "",
                            "creation_date": "",
                            "modification_date": "",
                            "accID": "",
                        }
                }
                function addAntigenSource() {
                    vm.apiDomain.antigen.probeSource = {
                        "sourceKey": "",
                        "name": "",
                        "description": "",
                        "age": "",
                        "agePrefix": "",
                        "ageStage": "",
                        "segmentTypeKey": "",
                        "segmentType": "",
                        "vectorKey": "",
                        "vector": "",
                        "organismKey": "",
                        "organism": "",
                        "strainKey": "",
                        "strain": "",
                        "tissueKey": "",
                        "tissue": "",
                        "genderKey": "",
                        "gender": "",
                        "cellLineKey": "",
                        "cellLine": "",                
                        "refsKey": "",
                        "jnumid": "",
                        "jnum": "",
                        "short_citation": ""
                    }
                }

                // add new alias row
                function addAliasRow() {

                        if (vm.apiDomain.aliases == undefined) {
                                vm.apiDomain.aliases = [];
                        }

                        var i = vm.apiDomain.aliases.length
                        vm.apiDomain.aliases[i] = {
                                "processStatus": "c",
                                "alias": "",
                                "jnumid": "",
                                "short_citation": ""
                        }
                }

                function addRefAssocRow() {

                        if (vm.apiDomain.refAssocs == undefined) {
                                vm.apiDomain.refAssocs = [];
                        }

                        var i = vm.apiDomain.refAssocs.length
                        vm.apiDomain.refAssocs[i] = {
                                "refAssocType": "",
                                "jnumid": "",
                                "short_citation": ""
                        }
                }


                // add new marker row
                function addMarkerRow() {

                        if (vm.apiDomain.markers == undefined) {
                                vm.apiDomain.markers = [];
                        }

                        var i = vm.apiDomain.markers.length
                        vm.apiDomain.markers[i] = {
                                "processStatus": "c",
                                "markerKey": "",
                                "markerSymbol": "",
                                "chromosome": ""
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
                $scope.createAntibody = createAntibody;
		$scope.updateAntibody = updateAntibody;
                $scope.deleteAntibody = deleteAntibody;
		$scope.changeAntibodyRow = changeAntibodyRow;
                $scope.addAntigen = addAntigen;
                $scope.addAntigenSource = addAntigenSource;
		$scope.addRefRow = addRefRow;
                $scope.selectRefRow = selectRefRow;
                $scope.changeRefRow = changeRefRow;
                $scope.addAliasRow = addAliasRow;
                $scope.changeAliasRow = changeAliasRow;
                $scope.addMarkerRow = addMarkerRow;
                $scope.changeMarkerRow = changeMarkerRow;
		$scope.selectAntibody = selectAntibody;
        
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
                $scope.validateMarker = validateMarker;
                $scope.validateJnum = validateJnum;
                $scope.validateAntigenAcc = validateAntigenAcc;
                $scope.getAntibodyObtained = getAntibodyObtained;		

		// global shortcuts
		$scope.KclearAll = function() { $scope.clear(); $scope.$apply(); }
		$scope.Ksearch = function() { $scope.search(); $scope.$apply(); }
		$scope.Kfirst = function() { $scope.firstSummaryObject(); $scope.$apply(); }
		$scope.Knext = function() { $scope.nextSummaryObject(); $scope.$apply(); }
		$scope.Kprev = function() { $scope.prevSummaryObject(); $scope.$apply(); }
		$scope.Klast = function() { $scope.lastSummaryObject(); $scope.$apply(); }
                $scope.Kadd = function() { $scope.createAntibody(); $scope.$apply(); }
                $scope.Kmodify = function() { $scope.updateAntibody(); $scope.$apply(); }
                $scope.Kdelete = function() { $scope.deleteAntibody(); $scope.$apply(); }

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

