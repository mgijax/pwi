(function() {
	'use strict';
	angular.module('pwi.allelefear').controller('AlleleFearController', AlleleFearController);

	function AlleleFearController(
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
			AlleleFearSearchAPI,
                        AlleleFearSearchPropertyAccIdAPI,
			AlleleFearGetAPI,
			AlleleFearUpdateAPI,
			AlleleFearTotalCountAPI,
                        AlleleFearGetMarkerByRegionAPI,
			// global APIs
			ValidateJnumAPI,
                        ValidateMarkerAPI,
			VocTermSearchAPI,
                        OrganismSearchRelationshipAPI,
                        ChromosomeSearchAPI,
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
		vm.selectedMIIndex = 0;
		vm.selectedECIndex = 0;
		vm.selectedPropertyIndex = 0;
		vm.attachOrganismValue = "";
		
                vm.organismPropertyKey = "12948290";
                vm.geneSymbolPropertyKey = "12948291";
                vm.geneIdPropertyKey = "12948292";
                vm.expressOrthoKey = "12948293";

		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			resetData();
			refreshTotalCount();
			loadVocabs();
                        for(var i=0;i<5; i++) { addMutationInvolvesRow(); }
                        for(var i=0;i<5; i++) { addExpressesComponentsRow(); }
                        if (document.location.search.length > 0) {
                                searchByAlleleKeys();
                        }
		}

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        	// mapped to 'Clear' button; called from init();  resets page
		function clear() {		
			resetData();
                        refreshTotalCount();
                        for(var i=0;i<5; i++) { addMutationInvolvesRow(); }
                        for(var i=0;i<5; i++) { addExpressesComponentsRow(); }
			setFocus();
		}		

		// mapped to query 'Search' button
		// default is to select first result
		function search() {				
			console.log(vm.apiDomain);
		
			pageScope.loadingStart();
			
			AlleleFearSearchAPI.search(vm.apiDomain, function(data) {
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
				pageScope.handleError(vm, "API ERROR: AlleleFearSearchAPI.search");
				pageScope.loadingEnd();
				setFocus();
			});
		}		

		function searchAccId() {
			console.log("searchAccId");

                        if (vm.results.length > 0) {
                                return;
                        }

			if (vm.apiDomain.alleleKey == "" && vm.apiDomain.accID != "") {
				search();
			}
		}

		// search by parameter keys
		function searchByAlleleKeys() {				
			console.log("searchByAlleleKeys: " + document.location.search);
		
			pageScope.loadingStart();
			
			var searchKeys = document.location.search.split("?searchKeys=");
			var params = {};
			params.alleleKey = searchKeys[1];

			AlleleFearSearchAPI.search(params, function(data) {
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

			if (vm.apiDomain.alleleKey == "" && vm.apiDomain.alleleSymbol != "" && !vm.apiDomain.alleleSymbol.includes("%")) {
				search();
                        }
		}

		function searchPropertyAccId(index) {
			console.log("searchPropertyAccId/ECIndex: " + vm.selectedECIndex);

                        if (vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index].value == undefined) {
			        return;
			}
                        if (vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index].value == "") {
                                return;
                        }

                        // 
                        // 12948292  | Non-mouse_NCBI_Gene_ID
                        // 100655557 | Non-mouse_HGNC_Gene_ID
                        // 100655558 | Non-mouse_RGD_Gene_ID
                        // 100655559 | Non-mouse_ZFIN_Gene_ID
                        //
                        // not implemented yet
                        // 100655560 | Non-mouse_WB_Gene_ID
                        // 100655561 | Non-mouse_FB_Gene_ID
                        // 100655562 | Non-mouse_SGD_Gene_ID
                        
                        if (index > 0) {
                                return;
                        }
                        if (
                                vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index].propertyNameKey != "12948292"
                                && vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index].propertyNameKey != "100655557"
                                && vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index].propertyNameKey != "100655558"
                                && vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index].propertyNameKey != "100655559"
                           ) {
                           return;
                        }

                        if (vm.apiDomain.expressesComponents[vm.selectedECIndex].properties.length == 1) {
			        addPropertyRow(vm.selectedECIndex);
			        addPropertyRow(vm.selectedECIndex);
			        addPropertyRow(vm.selectedECIndex);
                        }
                        else if (vm.apiDomain.expressesComponents[vm.selectedECIndex].properties.length < 4) {
			        addPropertyRow(vm.selectedECIndex);
                        }

			var params = {};
			params.relationshipKey = vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index].relationshipKey;
			params.propertyNameKey = vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index].propertyNameKey;
			params.value = vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index].value;

                        if (params.propertyNameKey == "100655557" && !params.value.includes("HGNC:")) {
                                params.value = "HGNC:" + params.value;
			        vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index].value = params.value;
                        }
                        else if (params.propertyNameKey == "100655558" && !params.value.includes("RGD:")) {
                                params.value = "RGD:" + params.value;
			        vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index].value = params.value;
                        }

			AlleleFearSearchPropertyAccIdAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Gene ID: " + vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index].value);
			                vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index].value = "";
				} else {
                                        vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index+1].propertyNameKey = data[0].propertyNameKey;
                                        vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index+1].value = data[0].value;
                                        vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index+2].propertyNameKey = data[1].propertyNameKey;
                                        vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index+2].value = data[1].value;
                                        if (data.length > 2) {
                                                vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index+3].propertyNameKey = data[2].propertyNameKey;
                                                vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index+3].value = data[2].value;
                                        }
			                for(var i=0;i<vm.apiDomain.expressesComponents[vm.selectedECIndex].properties.length; i++) {
                                                if (vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[i].processStatus == "x") {
                                                        vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[i].processStatus = "u";
                                                }
                                        }
                                }
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AlleleFearSearchPropertyAccIdAPI.searchPropertyAccId");
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
                        AlleleFearTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////
		
        	// modify relatioships
		function modifyRelationship() {
			console.log("modifyRelationship() -> AlleleFearUpdateAPI()");

			// check if record selected
			if(vm.selectedIndex < 0) {
				alert("Cannot Modify if a record is not selected.");
				return;
			}
			
                        // check expresses_an_orthologous_gene, expresses_mouse_gene values
			for(var i=0;i<vm.apiDomain.expressesComponents.length; i++) {
                                var hasOrganism = false;
                                var hasGeneSymbol = false;
                                var key = vm.apiDomain.expressesComponents[i].relationshipTermKey;
			        for(var j=0;j<vm.apiDomain.expressesComponents[i].properties.length; j++) {
                                        //if (vm.apiDomain.expressesComponents[i].properties[j].relationshipPropertyKey == "") {
                                        //        break;
                                        //}
                                        if (
                                                vm.apiDomain.expressesComponents[i].properties[j].propertyNameKey == vm.organismPropertyKey
                                                && vm.apiDomain.expressesComponents[i].properties[j].processStatus != "d"
                                           ) {
                                                hasOrganism = true;
                                        }
                                        else if (
                                                vm.apiDomain.expressesComponents[i].properties[j].propertyNameKey == vm.geneSymbolPropertyKey
                                                && vm.apiDomain.expressesComponents[i].properties[j].processStatus != "d"
                                           ) {
                                                hasGeneSymbol = true;
                                        }
                                }
                                console.log(key + ":" + hasOrganism + ":" + hasGeneSymbol);
                                if (key == vm.expressOrthoKey && (hasOrganism == false || hasGeneSymbol == false)) {
				        alert("marker symbol:  " + vm.apiDomain.expressesComponents[i].markerSymbol + "\n\nexpresses_an_orthologous_gene\nNon-mouse_Organism\nNon-mouse_GeneSymbol\n\nshould *not* be empty");
				        return;
                                }
                                else if (key != vm.expressOrthoKey && (hasOrganism == true || hasGeneSymbol == true)) {
				        alert("marker symbol:  " + vm.apiDomain.expressesComponents[i].markerSymbol + "\n\nexpresses_mouse_gene\nNon-mouse_Organism\nNon-mouse_GeneSymbol\n\nshould be empty");
				        return;
                                }
                        }

                        // skip duplicates; relationship type, marker
                        var rKey = 0;
                        var mKey = 0;
                        var isMIduplicate = false;
			for(var i=0;i<vm.apiDomain.mutationInvolves.length; i++) {
                                rKey = vm.apiDomain.mutationInvolves[i].relationshipTermKey;
                                mKey = vm.apiDomain.mutationInvolves[i].markerKey;

                                if (rKey == "" || mKey == "") {
                                        continue
                                }

			        for(var j=i+1;j<vm.apiDomain.mutationInvolves.length; j++) {
                                        if (
                                                vm.apiDomain.mutationInvolves[j].relationshipTermKey == rKey
                                                && vm.apiDomain.mutationInvolves[j].markerKey == mKey
                                           ) { 
                                           vm.apiDomain.mutationInvolves[j].processStatus = "x";
                                           isMIduplicate = true;
                                        }
                                }
                        }
                        //if (isMIduplicate) {
                                //alert("Mutation Involves: duplicate found; the duplicate will be skipped.");
                        //}

			pageScope.loadingStart();

			AlleleFearUpdateAPI.update(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					loadObject();
				}
				pageScope.loadingEnd();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AlleleFearUpdateAPI.update");
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
			vm.selectedMIIndex = 0;
			vm.selectedECIndex = 0;
			vm.total_count = 0;
		        vm.attachOrganismValue = "";

			// rebuild empty apiDomain submission object, else bindings fail
			vm.apiDomain = {};
			vm.apiDomain.alleleKey = "";	
			vm.apiDomain.alleleSymbol = "";	
			vm.apiDomain.accID = "";
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");

			vm.apiDomain.alleleKey = "";	
			vm.apiDomain.alleleSymbol = "";	
			vm.apiDomain.accID = "";
			vm.apiDomain.mutationInvolves = [];
			vm.apiDomain.expressesComponents = [];
		        vm.attachOrganismValue = "";
                        for(var i=0;i<5; i++) { addMutationInvolvesRow(); }
                        for(var i=0;i<5; i++) { addExpressesComponentsRow(); }
		}

		// load vocabularies
                function loadVocabs() {
                        console.log("loadVocabs()");

			vm.miLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"96","name":"mutationInvolves"}, function(data) { vm.miLookup = data.items[0].terms });;

			vm.ecLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"96", "name":"expressesComponents"}, function(data) { vm.ecLookup = data.items[0].terms });;

			vm.propertyLookup = {};
			VocTermSearchAPI.search({"vocabKey":"97", "name":"properties"}, function(data) { vm.propertyLookup = data.items[0].terms});;

                        vm.organismLookup = [];
                        OrganismSearchRelationshipAPI.search({}, function(data) { vm.organismLookup = data});;

                        vm.chromosomeLookup = [];
                        ChromosomeSearchAPI.search({"organismKey":"1"}, function(data) { vm.chromosomeLookup = data});;
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

			AlleleFearGetAPI.get({ key: vm.results[vm.selectedIndex].alleleKey }, function(data) {
				vm.apiDomain = data;
				vm.apiDomain.alleleKey = vm.results[vm.selectedIndex].alleleKey;
			        vm.apiDomain.alleleSymbol = vm.results[vm.selectedIndex].alleleSymbol;
		                vm.attachOrganismValue = "";
                                for(var i=0;i<5; i++) { addMutationInvolvesRow(); }
                                for(var i=0;i<5; i++) { addExpressesComponentsRow(); }
				selectMIRow(0);
				selectECRow(0);
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AlleleFearGetAPI.get");
			});
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
                        console.log("setFocus()");
                        // must pause for a bit...then it works
                        setTimeout(function() {
                                document.getElementById("alleleSymbol").focus();
                        }, (200));
		}

		/////////////////////////////////////////////////////////////////////
		// validating
		/////////////////////////////////////////////////////////////////////		
		
        	// validate marker
		function validateMarker(row, index, id) {
			console.log("validateMarker = " + id + index);

			id = id + index;
			
			if ((row.markerAccID == undefined || row.markerAccID == "")
			   && (row.markerSymbol == undefined || row.markerSymbol == "")) {
				row.markerKey = "";
				row.markerSymbol = "";
				row.markerAccID = "";
				return;
			}

			if (row.markerSymbol.includes("%")) {
				return;
			}

			var params = {};
                        if (row.markerAccID != undefined && row.markerAccID != "") {
			        params.symbol = "";
			        params.chromosome = "";
			        params.accID = row.markerAccID;;
                        } else if (row.markerSymbol != undefined && row.markerSymbol != "") {
			        params.symbol = row.markerSymbol;
			        params.accID = "";
                        }
                        
			ValidateMarkerAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Marker Symbol: " + row.markerSymbol);
					document.getElementById(id).focus();
					row.markerKey = "";
					row.markerSymbol = "";
				        row.markerAccID = "";
				} else {
					console.log(data);
					row.markerKey = data[0].markerKey;
					row.markerSymbol = data[0].symbol;
				        row.markerAccID = data[0].accID;
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateMarkerAPI.search");
				document.getElementById(id).focus();
				row.markerKey = "";
				row.markerSymbol = "";
				row.markerAccID = "";
			});
		}

        	// validate jnum
		function validateJnum(row, index, id) {		
			console.log("validateJnum = " + id + index);

			id = id + index;

			if (row.jnumid == undefined || row.jnumid == "") {
				if (index > 0) {
					row.refsKey = vm.apiDomain.mutationInvolves[index-1].refsKey;
					row.jnumid = vm.apiDomain.mutationInvolves[index-1].jnumid;
					row.jnum = vm.apiDomain.mutationInvolves[index-1].jnum;
					row.short_citation = vm.apiDomain.mutationInvolves[index-1].short_citation;
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
		function selectMIRow(index) {
			console.log("selectMIRow: " + index);
			vm.selectedMIIndex = index;
		}

		// set current relationship row
		function selectECRow(index) {
			console.log("selectECRow: " + index);
			vm.selectedECIndex = index;
		}

		// set current property row
		function selectPropertyRow(index) {
			console.log("selectPropertyRow: " + index);
			vm.selectedPropertyIndex = index;
                        searchPropertyAccId(index);
		}

		//
		// change of row/field detected
		//
		
		// if current mutationInvolves row has changed
		function changeMutationInvolvesRow(index) {
			console.log("changeMutationInvolvesRow: " + index);

			vm.selectedMIIndex = index;

			if (vm.apiDomain.mutationInvolves[index] == null) {
				vm.selectedMIIndex = 0;
				return;
			}

			if (vm.apiDomain.mutationInvolves[index].processStatus == "x") {
				vm.apiDomain.mutationInvolves[index].processStatus = "u";
			};
                }

		// add new mutationInvolves row
		function addMutationInvolvesRow() {
			console.log("addMutationInvolvesRow");

			if (vm.apiDomain.mutationInvolves == undefined) {
				vm.apiDomain.mutationInvolves = [];
			}

			var i = vm.apiDomain.mutationInvolves.length;

			vm.apiDomain.mutationInvolves[i] = {
				"processStatus": "c",
				"relationshipKey": "",
			       	"alleleKey": vm.apiDomain.alleleKey,
                                "alleleSymbol": "",
			       	"markerKey": "",
                                "markerSymbol": "",
                                "markerAccID": "",
			       	"categoryKey": "1003",
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

                        addMINoteRow(i);
		}		

		// add new note row
		function addMINoteRow(index) {
			console.log("addMINoteRow: " + index);

			if (vm.apiDomain.mutationInvolves.length == 0) {
				addMutationinvolvesRow();
			}
			if (vm.apiDomain.mutationInvolves[index].note == undefined) {
				vm.apiDomain.mutationInvolves[index].note = {};
			}

			vm.apiDomain.mutationInvolves[index].note = {
				"processStatus": "c",
				"noteKey": "",
				"objectKey": vm.apiDomain.mutationInvolves[index].relatioshipKey,
				"mgiTypeKey": "40",
				"noteTypeKey": "1042",
				"noteChunk": ""
			}
		}		
		// if current expressesComponents row has changed
		function changeExpressesComponentsRow(index) {
			console.log("changeExpressesComponentsRow: " + index);

			vm.selectedECIndex = index;

			if (vm.apiDomain.expressesComponents[index] == null) {
				vm.selectedECIndex = 0;
				return;
			}

			if (vm.apiDomain.expressesComponents[index].processStatus == "x") {
				vm.apiDomain.expressesComponents[index].processStatus = "u";
			};
                }

		// add new expressesComponents row
		function addExpressesComponentsRow() {
			console.log("addExpressesComponentsRow");

			if (vm.apiDomain.expressesComponents == undefined) {
				vm.apiDomain.expressesComponents = [];
			}

			var i = vm.apiDomain.expressesComponents.length;

			vm.apiDomain.expressesComponents[i] = {
				"processStatus": "c",
				"relationshipKey": "",
			       	"alleleKey": vm.apiDomain.alleleKey,
                                "alleleSymbol": "",
			       	"markerKey": "",
                                "markerSymbol": "",
                                "markerAccID": "",
			       	"categoryKey": "1004",
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

			addPropertyRow(i);
                        addECNoteRow(i);
		}		

		// add new note row
		function addECNoteRow(index) {
			console.log("addECNoteRow: " + index);

			if (vm.apiDomain.expressesComponents.length == 0) {
				addExpressesComponentsRow();
			}
			if (vm.apiDomain.expressesComponents[index].note == undefined) {
				vm.apiDomain.expressesComponents[index].note = {};
			}

			vm.apiDomain.expressesComponents[index].note = {
				"processStatus": "c",
				"noteKey": "",
				"objectKey": vm.apiDomain.expressesComponents[index].relatioshipKey,
				"mgiTypeKey": "40",
				"noteTypeKey": "1042",
				"noteChunk": ""
			}
		}		

		// if current property row has changed
		function changePropertyRow(index) {
			console.log("changePropertyRow: " + index);

			vm.selectedPropertyIndex = index;

			if (vm.apiDomain.expressesComponents[vm.selectedECIndex].properties == null) {
				vm.selectedPropertyIndex = 0;
				return;
			}

			if (vm.apiDomain.expressesComponents[vm.selectedECIndex].processStatus == "x") {
				vm.apiDomain.expressesComponents[vm.selectedECIndex].processStatus = "u";
			}

			if (vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index].processStatus == "x") {
				vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index].processStatus = "u";
			}

		}

		// add new property row
		function addPropertyRow(index) {
			console.log("addPropertyRow: " + index);

			if (vm.apiDomain.expressesComponents.length == 0) {
				addExpressesComponentsRow();
			}
			if (vm.apiDomain.expressesComponents[index].properties == undefined) {
				vm.apiDomain.expressesComponents[index].properties = [];
			}

			var i = vm.apiDomain.expressesComponents[index].properties.length;
			var sequenceNum = i + 1;
			
			vm.apiDomain.expressesComponents[index].properties[i] = {
				"processStatus": "c",
				"relationshipPropertyKey": "",
				"relationshipKey": vm.apiDomain.expressesComponents[index].relationshipKey,
			       	"propertyNameKey": "",
			       	"propertyName": "",
			       	"sequenceNum": sequenceNum,
				"value": ""
			}
		}		

		// delete property row
		function deletePropertyRow(index) {
			console.log("deletePropertyRow: " + index);
			if (vm.apiDomain.expressesComponents[vm.selectedECIndex].processStatus == "x") {
				vm.apiDomain.expressesComponents[vm.selectedECIndex].processStatus = "u";
			}
			vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index].processStatus = "d";
		}

		// attach organism to property value
		function attachOrganismValue() {
			console.log("attachOrganismValue()");

                        var index = vm.selectedPropertyIndex;

                        // property name must be "Search All" or "Non-mouse_Organism"
                        if (
                                vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index].propertyNameKey != ""
                                && vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index].propertyNameKey != vm.organismPropertyKey
                           ) {
                                return;
                        }

                        // do not overwrite
                        if (vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index].value != "") {
                                return;
                        }

			vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index].value = vm.attachOrganismValue;

                        if (vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index].processStatus == "x") {
                                vm.apiDomain.expressesComponents[vm.selectedECIndex].properties[index].processStatus = "u";
                        }
		}

                // marker region
                
                // using vm.markerRegionSearch, search for markers in region specified
		function searchMarkerRegion() {
			console.log("searchMarkerRegion()");

                        if (vm.markerRegionSearch == null) {
                                addMarkerRegion();
                        }

			if (
                                vm.apiDomain.alleleKey == ""
                                || vm.markerRegionSearch.chromosome == ""
                                || vm.markerRegionSearch.startCoordinate == ""
                                || vm.markerRegionSearch.endCoordinate == ""
                                || vm.markerRegionSearch.relationshipTermKey == ""
                           ) {
                                alert("Search Marker Count:\n\nAllele\nChr\nStart Coordinate\nEnd Coordinate\nRelationship Type\n\nis needed");
				document.getElementById("startCoordinate").focus();
				return;
			}

			var params = {};
			params.chromosome = vm.markerRegionSearch.chromosome;
			params.startCoordinate = vm.markerRegionSearch.startCoordinate;
			params.endCoordinate = vm.markerRegionSearch.endCoordinate;
			params.alleleKey = vm.apiDomain.alleleKey;
			params.relationshipTermKey = vm.markerRegionSearch.relationshipTermKey;
                        
			AlleleFearGetMarkerByRegionAPI.search(params, function(data) {
				if (data.length == 0) {
                                        vm.markerRegionSearch.markerCount = 0;
					alert("No Markers Available for this Allele:\n\n" + 
                                                vm.markerRegionSearch.chromosome + 
                                                "\n" + vm.markerRegionSearch.startCoordinate + 
                                                "\n" + vm.markerRegionSearch.endCoordinate);
					document.getElementById("startCoordinate").focus();
				} else {
                                        vm.markerRegion = data;
                                        vm.markerRegionSearch.markerCount = data.length;
                                }
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: GetMarkerByRegionAPI.search");
				document.getElementById("startCoordinate").focus();
			});
		}

                // add vm.markerRegionSearch, vm.markerRegion
		function addMarkerRegion() {
			console.log("addMarkerRegion()");
			vm.markerRegionSearch = {
			        "chromosome": "",
                                "startCoordinate": "",
                                "endCoordinate": "",
                                "relationshipTermKey": "",
                                "refsKey": "",
                                "jnumid": "",
                                "short_citation": "",
                                "markerCount": 0
                        }
                        vm.markerRegion = "";
                }

                // clear vm.markerRegion
		function clearMarkerRegion() {
			console.log("clearMarkerRegion()");
                        addMarkerRegion();
			document.getElementById("startCoordinate").focus();
                }

                // add vm.markerRegion list to first empty MI row
		function addMarkerRegionToMI() {
			console.log("addMarkerRegionToMI()");

			if (
                                vm.markerRegionSearch.refsKey == null
                                || vm.markerRegionSearch.refsKey == ""
                           ) {
                                alert("Add To Mutation Involves: J# is needed");
				document.getElementById("startCoordinate").focus();
				return;
			}

                        if (vm.markerRegion.length == 0) {
                                alert("Add To Mutation Involves: 0 Markers found");
				document.getElementById("startCoordinate").focus();
				return;
                        }

                        var newMI = vm.apiDomain.mutationInvolves.length;

                        for(var i=0;i<vm.apiDomain.mutationInvolves.length; i++) { 
                                if (vm.apiDomain.mutationInvolves[i].processStatus == "c") {
                                        newMI = i;
                                        break;
                                }
                        }

                        for(var i=0;i<vm.markerRegion.length; i++) { 
			        vm.apiDomain.mutationInvolves[newMI] = {
				        "processStatus": "c",
				        "relationshipKey": "",
			       	        "alleleKey": vm.apiDomain.alleleKey,
                                        "alleleSymbol": "",
			       	        "markerKey": vm.markerRegion[i].markerKey,
                                        "markerSymbol": vm.markerRegion[i].symbol,
                                        "markerAccID": vm.markerRegion[i].accID,
			       	        "categoryKey": "1003",
			       	        "categoryTerm": "",
			       	        "relationshipTermKey": vm.markerRegionSearch.relationshipTermKey,
			       	        "relationshipTerm": "",
			       	        "qualifierKey": "11391898",
			       	        "qualifierTerm": "",
			       	        "evidenceKey": "11391900",
			       	        "evidenceTerm": "IGC",
				        "refsKey": vm.markerRegionSearch.refsKey,
			       	        "jnumid": vm.markerRegionSearch.jnumid,
				        "short_citation": vm.markerRegionSearch.short_citation,
				        "createdBy": "",
				        "creation_date": "",
				        "modifiedBy": "",
				        "modification_date": ""
			        }

                                addMINoteRow(i);
                                newMI = newMI + 1;
                        }
                }

		function utilJnumOnBlur() {
			console.log("utilJnumOnBlur()");

                        if (vm.markerRegionSearch.jnumid == null || vm.markerRegionSearch.jnumid == "") {
                                return;
                        }

			ValidateJnumAPI.query({ jnum: vm.markerRegionSearch.jnumid }, function(data) {

				if (data.length == 0) {
					alert("Invalid Reference: " + vm.markerRegionSearch.jnumid);
				} else {
			  		vm.markerRegionSearch.refsKey = data[0].refsKey;
					vm.markerRegionSearch.jnumid = data[0].jnumid;
					vm.markerRegionSearch.short_citation = data[0].short_citation;
				}
			}, function(err) {
				pageScope.handleError(vm, "Error Validating J#.");
			});
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
		$scope.changeMutationInvolvesRow = changeMutationInvolvesRow;
		$scope.addMutationInvolvesRow = addMutationInvolvesRow;
		$scope.changeExpressesComponentsRow = changeExpressesComponentsRow;
		$scope.addExpressesComponentsRow = addExpressesComponentsRow;
		$scope.changePropertyRow = changePropertyRow;
		$scope.addPropertyRow = addPropertyRow;
		$scope.deletePropertyRow = deletePropertyRow;
		$scope.selectMIRow = selectMIRow;
		$scope.selectECRow = selectECRow;
		$scope.selectPropertyRow = selectPropertyRow;
		$scope.attachOrganismValue = attachOrganismValue;
		$scope.searchMarkerRegion = searchMarkerRegion;
		$scope.clearMarkerRegion = clearMarkerRegion;
		$scope.addMarkerRegionToMI = addMarkerRegionToMI;

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

		// other functions: buttons, onBlurs and onChanges
		$scope.selectResult = selectResult;
		$scope.validateJnum = validateJnum;
                $scope.validateMarker = validateMarker;
                $scope.utilJnumOnBlur = utilJnumOnBlur;
		
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

