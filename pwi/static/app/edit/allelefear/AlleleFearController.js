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
		vm.selectedDCIndex = 0;
		vm.selectedPropertyIndex = 0;
                vm.selectedClipboardMIIndex = 0;
                vm.selectedClipboardECIndex = 0;
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
                        resetClipboardMI();
                        resetClipboardEC();
                        resetClipboardDC();
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
				        pageScope.loadingEnd();
				}
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
		
        	// modify relationships
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
			vm.apiDomain.driverComponents = [];
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

			vm.ecLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"96", "name":"driverComponents"}, function(data) { vm.ecLookup = data.items[0].terms });;

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

			pageScope.loadingStart();

			AlleleFearGetAPI.get({ key: vm.results[vm.selectedIndex].alleleKey }, function(data) {
				vm.apiDomain = data;
				vm.apiDomain.alleleKey = vm.results[vm.selectedIndex].alleleKey;
			        vm.apiDomain.alleleSymbol = vm.results[vm.selectedIndex].alleleSymbol;
		                vm.attachOrganismValue = "";
                                for(var i=0;i<5; i++) { addMutationInvolvesRow(); }
                                for(var i=0;i<5; i++) { addExpressesComponentsRow(); }
                                for(var i=0;i<5; i++) { addDriverComponentsRow(); }
				selectMIRow(0);
				selectECRow(0);
				selectDCRow(0);
			        pageScope.loadingEnd();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AlleleFearGetAPI.get");
			        pageScope.loadingEnd();
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

		// set current relationship row
		function selectDCRow(index) {
			console.log("selectDCRow: " + index);
			vm.selectedDCIndex = index;
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
				"objectKey": vm.apiDomain.mutationInvolves[index].relationshipKey,
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
				"objectKey": vm.apiDomain.expressesComponents[index].relationshipKey,
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

		// if current driverComponents row has changed
		function changeDriverComponentsRow(index) {
			console.log("changeDriverComponentsRow: " + index);

			vm.selectedDCIndex = index;

			if (vm.apiDomain.driverComponents[index] == null) {
				vm.selectedDCIndex = 0;
				return;
			}

			if (vm.apiDomain.driverComponents[index].processStatus == "x") {
				vm.apiDomain.driverComponents[index].processStatus = "u";
			};
                }

		// add new driverComponents row
		function addDriverComponentsRow() {
			console.log("addDriverComponentsRow");

			if (vm.apiDomain.driverComponents == undefined) {
				vm.apiDomain.driverComponents = [];
			}

			var i = vm.apiDomain.driverComponents.length;

			vm.apiDomain.driverComponents[i] = {
				"processStatus": "c",
				"relationshipKey": "",
			       	"alleleKey": vm.apiDomain.alleleKey,
                                "alleleSymbol": "",
			       	"markerKey": "",
                                "markerSymbol": "",
                                "markerAccID": "",
			       	"categoryKey": "1006",
			       	"categoryTerm": "",
			       	"relationshipTermKey": "111028066",
			       	"relationshipTerm": "driver_components",
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

                        addDCNoteRow(i);
		}		

		// add new note row
		function addDCNoteRow(index) {
			console.log("addDCNoteRow: " + index);

			if (vm.apiDomain.driverComponents.length == 0) {
				addExpressesComponentsRow();
			}
			if (vm.apiDomain.driverComponents[index].note == undefined) {
				vm.apiDomain.driverComponents[index].note = {};
			}

			vm.apiDomain.driverComponents[index].note = {
				"processStatus": "c",
				"noteKey": "",
				"objectKey": vm.apiDomain.driverComponents[index].relationshipKey,
				"mgiTypeKey": "40",
				"noteTypeKey": "1042",
				"noteChunk": ""
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
                                || vm.markerRegionSearch.chromosome == null
                                || vm.markerRegionSearch.startCoordinate == ""
                                || vm.markerRegionSearch.startCoordinate == null
                                || vm.markerRegionSearch.endCoordinate == ""
                                || vm.markerRegionSearch.endCoordinate == null
                                || vm.markerRegionSearch.relationshipTermKey == ""
                                || vm.markerRegionSearch.relationshipTermKey == null
                           ) {
                                alert("Search Marker Count Required Fields:\n\nAllele\nChr\nStart Coordinate\nEnd Coordinate\nRelationship Type");
				document.getElementById("startCoordinate").focus();
				return;
			}

			var params = {};
			params.chromosome = vm.markerRegionSearch.chromosome;
			params.startCoordinate = vm.markerRegionSearch.startCoordinate;
			params.endCoordinate = vm.markerRegionSearch.endCoordinate;
			params.alleleKey = vm.apiDomain.alleleKey;
			params.relationshipTermKey = vm.markerRegionSearch.relationshipTermKey;
                        
			pageScope.loadingStart();

			AlleleFearGetMarkerByRegionAPI.search(params, function(data) {
				if (data.length == 0) {
                                        vm.markerRegionSearch.markerCount = 0;
					alert("No Markers Available for this Allele:\n\n" + 
                                                vm.markerRegionSearch.chromosome + 
                                                "\n" + vm.markerRegionSearch.startCoordinate + 
                                                "\n" + vm.markerRegionSearch.endCoordinate);
					document.getElementById("startCoordinate").focus();
			                pageScope.loadingEnd();
				} else {
                                        vm.markerRegion = data;
                                        vm.markerRegionSearch.markerCount = data.length;
			                pageScope.loadingEnd();
                                }
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: GetMarkerByRegionAPI.search");
			        pageScope.loadingEnd();
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
                               vm.markerRegionSearch == null
                               || vm.markerRegionSearch.refsKey == null
                               || vm.markerRegionSearch.refsKey == ""
                           ) {
                                alert("Add To Mutation Involves Required Fields:\n\nAllele\nChr\nStart Coordinate\nEnd Coordinate\nRelationship Type\nJ#");
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

                        if (vm.markerRegionSearch == null) {
                                return;
                        }
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
		// clipboard
		/////////////////////////////////////////////////////////////////////		
	
		// reset clipboard
		function resetClipboardMI() {
			console.log("resetClipboardMI()");
			vm.clipboardMI = [];
		}

		// selected clipboard row
		function selectClipboardMI(index) {
			console.log("selectClipboardMI(): " + index);
			vm.selectedClipboardMIIndex = index;
		}		

		// add selected table row to clipboard
		function addClipboardMI(row) {
			console.log("addClipboardMI():" + row);

                        // note:  cloning the vm.apiDomain.mutationInvolves properly
                        
			if (vm.apiDomain.mutationInvolves[row].markerKey != "") {
				var newItem = {
                                        "processStatus": "c",
                                        "relationshipKey": "",
                                        "alleleKey": vm.apiDomain.mutationInvolves[row].alleleKey,
                                        "alleleSymbol": vm.apiDomain.mutationInvolves[row].alleleSymbol,
                                        "markerKey": vm.apiDomain.mutationInvolves[row].markerKey,
                                        "markerSymbol": vm.apiDomain.mutationInvolves[row].markerSymbol,
                                        "markerAccID": vm.apiDomain.mutationInvolves[row].markerAccID,
                                        "categoryKey": vm.apiDomain.mutationInvolves[row].categoryKey,
                                        "categoryTerm": vm.apiDomain.mutationInvolves[row].categoryTerm,
                                        "relationshipTermKey": vm.apiDomain.mutationInvolves[row].relationshipTermKey,
                                        "relationshipTerm": vm.apiDomain.mutationInvolves[row].relationshipTerm,
                                        "qualifierKey": vm.apiDomain.mutationInvolves[row].qualifierKey,
                                        "qualifierTerm": vm.apiDomain.mutationInvolves[row].qualifierTerm,
                                        "evidenceKey": vm.apiDomain.mutationInvolves[row].evidenceKey,
                                        "evidenceTerm": vm.apiDomain.mutationInvolves[row].evidenceTerm,
                                        "refsKey": vm.apiDomain.mutationInvolves[row].refsKey,
                                        "jnumid": vm.apiDomain.mutationInvolves[row].jnumid,
                                        "short_citation": vm.apiDomain.mutationInvolves[row].short_citation,
                                        "note": vm.apiDomain.mutationInvolves[row].note,
                                        "item": vm.apiDomain.mutationInvolves[row].relationshipTerm + "," 
						+ vm.apiDomain.mutationInvolves[row].markerSymbol
                                }
                                newItem.note.processStatus = "c";
                                newItem.note.noteKey = "";
                                newItem.note.objectKey = "";
				vm.clipboardMI.push(newItem);
			}
		}
		
		// add all table rows to clipboard
		function addAllClipboardMI() {
			console.log("addAllClipboardMI()");

                        for(var i=0;i<vm.apiDomain.mutationInvolves.length; i++) {
				addClipboardMI(i);
			}
		}

		// paste all clipboard items to table
		function pasteClipboardMI() {
			console.log("pasteClipboardMI()");

			var emptyRow = 0;

			// find next available empty row
                        for(var i=0;i<vm.apiDomain.mutationInvolves.length; i++) {
				if ((vm.apiDomain.mutationInvolves[i].processStatus == "c")
					&& (vm.apiDomain.mutationInvolves[i].markerKey == "")
					) {
					emptyRow = i;
					break;
				}
			}

                        for(var i=0;i<vm.clipboardMI.length; i++) {
				// add new empty annot row if needed
				if (emptyRow == 0 || emptyRow == vm.apiDomain.mutationInvolves.length) {
					addMutationInvolvesRow();
				}
                                vm.apiDomain.mutationInvolves[emptyRow].processStatus = vm.clipboardMI[i].processStatus;
                                vm.apiDomain.mutationInvolves[emptyRow].relationshipKey = vm.clipboardMI[i].relationshipKey;
                                vm.apiDomain.mutationInvolves[emptyRow].alleleKey = vm.clipboardMI[i].alleleKey;
                                vm.apiDomain.mutationInvolves[emptyRow].alleleSymbol = vm.clipboardMI[i].alleleSymbol;
                                vm.apiDomain.mutationInvolves[emptyRow].markerKey = vm.clipboardMI[i].markerKey;
                                vm.apiDomain.mutationInvolves[emptyRow].markerSymbol = vm.clipboardMI[i].markerSymbol;
                                vm.apiDomain.mutationInvolves[emptyRow].markerAccID = vm.clipboardMI[i].markerAccID;
                                vm.apiDomain.mutationInvolves[emptyRow].categoryKey = vm.clipboardMI[i].categoryKey;
                                vm.apiDomain.mutationInvolves[emptyRow].categoryTerm = vm.clipboardMI[i].categoryTerm;
                                vm.apiDomain.mutationInvolves[emptyRow].relationshipTermKey = vm.clipboardMI[i].relationshipTermKey;
                                vm.apiDomain.mutationInvolves[emptyRow].relationshipTerm = vm.clipboardMI[i].relationshipTerm;
                                vm.apiDomain.mutationInvolves[emptyRow].qualifierKey = vm.clipboardMI[i].qualifierKey;
                                vm.apiDomain.mutationInvolves[emptyRow].qualifierTerm = vm.clipboardMI[i].qualifierTerm;
                                vm.apiDomain.mutationInvolves[emptyRow].evidenceKey = vm.clipboardMI[i].evidenceKey;
                                vm.apiDomain.mutationInvolves[emptyRow].evidenceTerm = vm.clipboardMI[i].evidenceTerm;
                                vm.apiDomain.mutationInvolves[emptyRow].refsKey = vm.clipboardMI[i].refsKey;
                                vm.apiDomain.mutationInvolves[emptyRow].jnumid = vm.clipboardMI[i].jnumid;
                                vm.apiDomain.mutationInvolves[emptyRow].short_citation = vm.clipboardMI[i].short_citation;
                                vm.apiDomain.mutationInvolves[emptyRow].note = vm.clipboardMI[i].note;
				emptyRow = emptyRow + 1;
			}
		}

		// delete one clipboard item
		function deleteClipboardMI(row) {
			console.log("deleteClipboardMI(): " + row);
			vm.clipboardMI.splice(row,1)
		}
		
		// clear all clipboard items
		function clearClipboardMI() {
			console.log("clearClipboardMI()");
			resetClipboardMI();
		}
		
		// reset clipboard
		function resetClipboardEC() {
			console.log("resetClipboardEC()");
			vm.clipboardEC = [];
		}

		// selected clipboard row
		function selectClipboardEC(index) {
			console.log("selectClipboardEC(): " + index);
			vm.selectedClipboardECIndex = index;
		}		

		// add selected table row to clipboard
		function addClipboardEC(row) {
			console.log("addClipboardEC():" + row);

                        // note:  cloning the vm.apiDomain.expressesComponents properly
                        //
			if (vm.apiDomain.expressesComponents[row].markerKey != "") {
				var newItem = {
                                        "processStatus": "c",
                                        "relationshipKey": "",
                                        "alleleKey": vm.apiDomain.expressesComponents[row].alleleKey,
                                        "alleleSymbol": vm.apiDomain.expressesComponents[row].alleleSymbol,
                                        "markerKey": vm.apiDomain.expressesComponents[row].markerKey,
                                        "markerSymbol": vm.apiDomain.expressesComponents[row].markerSymbol,
                                        "markerAccID": vm.apiDomain.expressesComponents[row].markerAccID,
                                        "categoryKey": vm.apiDomain.expressesComponents[row].categoryKey,
                                        "categoryTerm": vm.apiDomain.expressesComponents[row].categoryTerm,
                                        "relationshipTermKey": vm.apiDomain.expressesComponents[row].relationshipTermKey,
                                        "relationshipTerm": vm.apiDomain.expressesComponents[row].relationshipTerm,
                                        "qualifierKey": vm.apiDomain.expressesComponents[row].qualifierKey,
                                        "qualifierTerm": vm.apiDomain.expressesComponents[row].qualifierTerm,
                                        "evidenceKey": vm.apiDomain.expressesComponents[row].evidenceKey,
                                        "evidenceTerm": vm.apiDomain.expressesComponents[row].evidenceTerm,
                                        "refsKey": vm.apiDomain.expressesComponents[row].refsKey,
                                        "jnumid": vm.apiDomain.expressesComponents[row].jnumid,
                                        "short_citation": vm.apiDomain.expressesComponents[row].short_citation,
                                        "note": vm.apiDomain.expressesComponents[row].note,
                                        "properties": vm.apiDomain.expressesComponents[row].properties,
                                        "item": vm.apiDomain.expressesComponents[row].relationshipTerm + ","
						+ vm.apiDomain.expressesComponents[row].markerSymbol
                                }

                                // change all properties to "c"
                                for(var i=0;i<newItem.properties.length; i++) {
                                        if (newItem.properties[i].processStatus == "x") {
                                                newItem.properties[i].processStatus = "c";
                                                newItem.properties[i].relationshipPropertyKey = "";
                                        }
                                }

                                newItem.note.processStatus = "c";
                                newItem.note.noteKey = "";
                                newItem.note.objectKey = "";
				vm.clipboardEC.push(newItem);
			}
		}
		
		// add all table rows to clipboard
		function addAllClipboardEC() {
			console.log("addAllClipboardEC()");

                        for(var i=0;i<vm.apiDomain.expressesComponents.length; i++) {
				addClipboardEC(i);
			}
		}

		// paste all clipboard items to table
		function pasteClipboardEC() {
			console.log("pasteClipboardEC()");

			var emptyRow = 0;

			// find next available empty row
                        for(var i=0;i<vm.apiDomain.expressesComponents.length; i++) {
				if ((vm.apiDomain.expressesComponents[i].processStatus == "c")
					&& (vm.apiDomain.expressesComponents[i].markerKey == "")
					) {
					emptyRow = i;
					break;
				}
			}

                        for(var i=0;i<vm.clipboardEC.length; i++) {
				// add new empty annot row if needed
				if (emptyRow == 0 || emptyRow == vm.apiDomain.expressesComponents.length) {
					addExpressesComponentsRow();
				}
                                vm.apiDomain.expressesComponents[emptyRow].processStatus = vm.clipboardEC[i].processStatus;
                                vm.apiDomain.expressesComponents[emptyRow].relationshipKey = vm.clipboardEC[i].relationshipKey;
                                vm.apiDomain.expressesComponents[emptyRow].alleleKey = vm.clipboardEC[i].alleleKey;
                                vm.apiDomain.expressesComponents[emptyRow].alleleSymbol = vm.clipboardEC[i].alleleSymbol;
                                vm.apiDomain.expressesComponents[emptyRow].markerKey = vm.clipboardEC[i].markerKey;
                                vm.apiDomain.expressesComponents[emptyRow].markerSymbol = vm.clipboardEC[i].markerSymbol;
                                vm.apiDomain.expressesComponents[emptyRow].markerAccID = vm.clipboardEC[i].markerAccID;
                                vm.apiDomain.expressesComponents[emptyRow].categoryKey = vm.clipboardEC[i].categoryKey;
                                vm.apiDomain.expressesComponents[emptyRow].categoryTerm = vm.clipboardEC[i].categoryTerm;
                                vm.apiDomain.expressesComponents[emptyRow].relationshipTermKey = vm.clipboardEC[i].relationshipTermKey;
                                vm.apiDomain.expressesComponents[emptyRow].relationshipTerm = vm.clipboardEC[i].relationshipTerm;
                                vm.apiDomain.expressesComponents[emptyRow].qualifierKey = vm.clipboardEC[i].qualifierKey;
                                vm.apiDomain.expressesComponents[emptyRow].qualifierTerm = vm.clipboardEC[i].qualifierTerm;
                                vm.apiDomain.expressesComponents[emptyRow].evidenceKey = vm.clipboardEC[i].evidenceKey;
                                vm.apiDomain.expressesComponents[emptyRow].evidenceTerm = vm.clipboardEC[i].evidenceTerm;
                                vm.apiDomain.expressesComponents[emptyRow].refsKey = vm.clipboardEC[i].refsKey;
                                vm.apiDomain.expressesComponents[emptyRow].jnumid = vm.clipboardEC[i].jnumid;
                                vm.apiDomain.expressesComponents[emptyRow].short_citation = vm.clipboardEC[i].short_citation;
                                vm.apiDomain.expressesComponents[emptyRow].note = vm.clipboardEC[i].note;
                                vm.apiDomain.expressesComponents[emptyRow].properties = vm.clipboardEC[i].properties;
				emptyRow = emptyRow + 1;
			}
		}

		// delete one clipboard item
		function deleteClipboardEC(row) {
			console.log("deleteClipboardEC(): " + row);
			vm.clipboardEC.splice(row,1)
		}
		
		// clear all clipboard items
		function clearClipboardEC() {
			console.log("clearClipboardEC()");
			resetClipboardEC();
		}
		
		// reset clipboard
		function resetClipboardDC() {
			console.log("resetClipboardDC()");
			vm.clipboardDC = [];
		}

		// selected clipboard row
		function selectClipboardDC(index) {
			console.log("selectClipboardDC(): " + index);
			vm.selectedClipboardDCIndex = index;
		}		

		// add selected table row to clipboard
		function addClipboardDC(row) {
			console.log("addClipboardDC():" + row);

                        // note:  cloning the vm.apiDomain.driverComponents properly
                        //
			if (vm.apiDomain.driverComponents[row].markerKey != "") {
				var newItem = {
                                        "processStatus": "c",
                                        "relationshipKey": "",
                                        "alleleKey": vm.apiDomain.driverComponents[row].alleleKey,
                                        "alleleSymbol": vm.apiDomain.driverComponents[row].alleleSymbol,
                                        "markerKey": vm.apiDomain.driverComponents[row].markerKey,
                                        "markerSymbol": vm.apiDomain.driverComponents[row].markerSymbol,
                                        "markerAccID": vm.apiDomain.driverComponents[row].markerAccID,
                                        "categoryKey": vm.apiDomain.driverComponents[row].categoryKey,
                                        "categoryTerm": vm.apiDomain.driverComponents[row].categoryTerm,
                                        "relationshipTermKey": vm.apiDomain.driverComponents[row].relationshipTermKey,
                                        "relationshipTerm": vm.apiDomain.driverComponents[row].relationshipTerm,
                                        "qualifierKey": vm.apiDomain.driverComponents[row].qualifierKey,
                                        "qualifierTerm": vm.apiDomain.driverComponents[row].qualifierTerm,
                                        "evidenceKey": vm.apiDomain.driverComponents[row].evidenceKey,
                                        "evidenceTerm": vm.apiDomain.driverComponents[row].evidenceTerm,
                                        "refsKey": vm.apiDomain.driverComponents[row].refsKey,
                                        "jnumid": vm.apiDomain.driverComponents[row].jnumid,
                                        "short_citation": vm.apiDomain.driverComponents[row].short_citation,
                                        "note": vm.apiDomain.driverComponents[row].note,
                                        "item": vm.apiDomain.driverComponents[row].relationshipTerm + ","
						+ vm.apiDomain.driverComponents[row].markerSymbol
                                }

                                newItem.note.processStatus = "c";
                                newItem.note.noteKey = "";
                                newItem.note.objectKey = "";
				vm.clipboardDC.push(newItem);
			}
		}
		
		// add all table rows to clipboard
		function addAllClipboardDC() {
			console.log("addAllClipboardDC()");

                        for(var i=0;i<vm.apiDomain.driverComponents.length; i++) {
				addClipboardDC(i);
			}
		}

		// paste all clipboard items to table
		function pasteClipboardDC() {
			console.log("pasteClipboardDC()");

			var emptyRow = 0;

			// find next available empty row
                        for(var i=0;i<vm.apiDomain.driverComponents.length; i++) {
				if ((vm.apiDomain.driverComponents[i].processStatus == "c")
					&& (vm.apiDomain.driverComponents[i].markerKey == "")
					) {
					emptyRow = i;
					break;
				}
			}

                        for(var i=0;i<vm.clipboardDC.length; i++) {
				// add new empty annot row if needed
				if (emptyRow == 0 || emptyRow == vm.apiDomain.driverComponents.length) {
					addExpressesComponentsRow();
				}
                                vm.apiDomain.driverComponents[emptyRow].processStatus = vm.clipboardDC[i].processStatus;
                                vm.apiDomain.driverComponents[emptyRow].relationshipKey = vm.clipboardDC[i].relationshipKey;
                                vm.apiDomain.driverComponents[emptyRow].alleleKey = vm.clipboardDC[i].alleleKey;
                                vm.apiDomain.driverComponents[emptyRow].alleleSymbol = vm.clipboardDC[i].alleleSymbol;
                                vm.apiDomain.driverComponents[emptyRow].markerKey = vm.clipboardDC[i].markerKey;
                                vm.apiDomain.driverComponents[emptyRow].markerSymbol = vm.clipboardDC[i].markerSymbol;
                                vm.apiDomain.driverComponents[emptyRow].markerAccID = vm.clipboardDC[i].markerAccID;
                                vm.apiDomain.driverComponents[emptyRow].categoryKey = vm.clipboardDC[i].categoryKey;
                                vm.apiDomain.driverComponents[emptyRow].categoryTerm = vm.clipboardDC[i].categoryTerm;
                                vm.apiDomain.driverComponents[emptyRow].relationshipTermKey = vm.clipboardDC[i].relationshipTermKey;
                                vm.apiDomain.driverComponents[emptyRow].relationshipTerm = vm.clipboardDC[i].relationshipTerm;
                                vm.apiDomain.driverComponents[emptyRow].qualifierKey = vm.clipboardDC[i].qualifierKey;
                                vm.apiDomain.driverComponents[emptyRow].qualifierTerm = vm.clipboardDC[i].qualifierTerm;
                                vm.apiDomain.driverComponents[emptyRow].evidenceKey = vm.clipboardDC[i].evidenceKey;
                                vm.apiDomain.driverComponents[emptyRow].evidenceTerm = vm.clipboardDC[i].evidenceTerm;
                                vm.apiDomain.driverComponents[emptyRow].refsKey = vm.clipboardDC[i].refsKey;
                                vm.apiDomain.driverComponents[emptyRow].jnumid = vm.clipboardDC[i].jnumid;
                                vm.apiDomain.driverComponents[emptyRow].short_citation = vm.clipboardDC[i].short_citation;
                                vm.apiDomain.driverComponents[emptyRow].note = vm.clipboardDC[i].note;
				emptyRow = emptyRow + 1;
			}
		}

		// delete one clipboard item
		function deleteClipboardDC(row) {
			console.log("deleteClipboardDC(): " + row);
			vm.clipboardDC.splice(row,1)
		}
		
		// clear all clipboard items
		function clearClipboardDC() {
			console.log("clearClipboardDC()");
			resetClipboardDC();
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
		$scope.changeDriverComponentsRow = changeDriverComponentsRow;
		$scope.addDriverComponentsRow = addDriverComponentsRow;
		$scope.selectMIRow = selectMIRow;
		$scope.selectECRow = selectECRow;
		$scope.selectDCRow = selectDCRow;
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
		
		// clipboard functions
		$scope.selectClipboardMI = selectClipboardMI;
		$scope.addClipboardMI = addClipboardMI;
		$scope.addAllClipboardMI = addAllClipboardMI;
		$scope.pasteClipboardMI = pasteClipboardMI;
		$scope.deleteClipboardMI = deleteClipboardMI;
		$scope.clearClipboardMI = clearClipboardMI;
		$scope.selectClipboardEC = selectClipboardEC;
		$scope.addClipboardEC = addClipboardEC;
		$scope.addAllClipboardEC = addAllClipboardEC;
		$scope.pasteClipboardEC = pasteClipboardEC;
		$scope.deleteClipboardEC = deleteClipboardEC;
		$scope.clearClipboardEC = clearClipboardEC;
		$scope.selectClipboardDC = selectClipboardDC;
		$scope.addClipboardDC = addClipboardDC;
		$scope.addAllClipboardDC = addAllClipboardDC;
		$scope.pasteClipboardDC = pasteClipboardDC;
		$scope.deleteClipboardDC = deleteClipboardDC;
		$scope.clearClipboardDC = clearClipboardDC;

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

