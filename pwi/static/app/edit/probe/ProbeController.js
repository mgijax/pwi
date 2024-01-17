(function() {
	'use strict';
	angular.module('pwi.probe').controller('ProbeController', ProbeController);

	function ProbeController(
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
			ProbeSearchAPI,
			ProbeGetAPI,
			ProbeCreateAPI,
			ProbeUpdateAPI,
			ProbeDeleteAPI,
			ProbeTotalCountAPI,
                        ProbeValidateAmpPrimerAPI,
			StrainCreateAPI,
			TissueCreateAPI,
			CellLineCreateAPI,
                        LogicalDBSearchAPI,
			// global APIs
			ChromosomeSearchAPI,
                        OrganismSearchProbeAPI,
                        LibrarySearchAPI,
                        StrainListProbeAntigenAPI,
                        TissueListAPI,
			ValidateJnumAPI,
			ValidateMarkerAPI,
                        ValidateStrainAPI,
                        ValidateTissueAPI,
                        ValidateTermAPI,
                        ValidateProbeSourceAPI,
			VocTermSearchAPI,
                        VocTermListAPI,
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
		vm.selectedRefIndex = 0;
		vm.selectedAccIndex = 0;
		vm.selectedAliasIndex = 0;
		vm.attachGeneralNote = "";
		
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			resetData(1);
			refreshTotalCount();
			loadVocabs();
                        setFocus();
                        
                        setTimeout(function() {
                                var findLibrary = document.getElementById('library');
                                findLibrary.selectedIndex = 0;
                        }, (2000));
		}

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        	// mapped to 'Clear' button; called from init();  resets page
		function clear() {		
			resetData(1);
                        refreshTotalCount();
			setFocus();
		}		

        	// clear partial
		function clearPartial() {		
			resetData(2);
                        refreshTotalCount();
			setFocus();
		}		

        	// clear info
		function clearInfo() {		
			resetData(3);
                        refreshTotalCount();
			setFocus();
		}		

		// mapped to query 'Search' button
		// default is to select first result
		function search() {				
			console.log("search()");
		
			pageScope.loadingStart();
			
			ProbeSearchAPI.search(vm.apiDomain, function(data) {
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
				pageScope.handleError(vm, "API ERROR: ProbeSearchAPI.search");
				pageScope.loadingEnd();
				setFocus();
			});
		}		

		function searchSummary() {				
			console.log("searchSummary()");
		
                        if (!vm.apiDomain.segmentTypeKey && !vm.apiDomain.name) {
                            alert("Please specify probe name and/or segment type.")
                            return
                        }

			pageScope.loadingStart();
			
			ProbeSearchAPI.search(vm.apiDomain, function(data) {
				vm.results = data;
				vm.selectedIndex = 0;

                                // call probe summary even if no results returned from regular search
                                var segparam = "";
                                if (vm.apiDomain.segmentTypeKey != "") {
			                for(var i=0;i<vm.segmentLookup.length; i++) {
                                                if (vm.segmentLookup[i].termKey == vm.apiDomain.segmentTypeKey) {
                                                        vm.apiDomain.segmentType = vm.segmentLookup[i].term;
                                                        segparam = "&segmentTypeKey=" + vm.apiDomain.segmentTypeKey;
                                                        segparam += "&segmentType=" + vm.apiDomain.segmentType;
                                                }
                                        }
                                }

                                const name = vm.apiDomain.name
                                const nameparam = name ? 'name=' + encodeURIComponent(name) : ''
                                var prbUrl = pageScope.url_for('pwi.probesummary', '?' + nameparam + segparam);
                                window.open(prbUrl, '_blank');
				pageScope.loadingEnd();
				setFocus();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ProbeSearchAPI.search");
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
                        ProbeTotalCountAPI.get(function(data){
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
                        if (vm.apiDomain.probeKey != null && vm.apiDomain.probeKey != "") {
				alert("Cannot Add if a record is already selected.");
                                return;
			}

			if (vm.apiDomain.name == null || vm.apiDomain.name == "") {
				alert("Required Field : Name");
                                return;
			}

			if (vm.apiDomain.references[0].refsKey == null || vm.apiDomain.references[0].refsKey == "") {
				alert("Warning:  No J# has been entered");
			}

			console.log("create() -> ProbeCreateAPI()");
			pageScope.loadingStart();

                        // set default accession type = Segment (9)
			for(var i=0;i<vm.apiDomain.references.length; i++) {
			        for(var j=0;j<vm.apiDomain.references[i].accessionIds.length; j++) {
                                        if (vm.apiDomain.references[i].accessionIds[j].logicaldbKey == "") {
                                                vm.apiDomain.references[i].accessionIds[j].logicaldbKey = "9";
                                        }
                                }
                        }

			ProbeCreateAPI.create(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					vm.apiDomain = data.items[0];
                                        vm.selectedIndex = vm.results.length;
                                        vm.results[vm.selectedIndex] = [];
                                        vm.results[vm.selectedIndex].probeKey = vm.apiDomain.probeKey;
					vm.results[vm.selectedIndex].name = vm.apiDomain.namel;
					loadObject();
					refreshTotalCount();
				}
				pageScope.loadingEnd();
                                setFocus();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ProbeCreateAPI.create");
				pageScope.loadingEnd();
                                setFocus();
			});
		}		

        	// modify
		function modify() {
			console.log("modify() -> ProbeUpdateAPI()");

			// check if record selected
			if(vm.selectedIndex < 0) {
				alert("Cannot Modify if a record is not selected.");
                                return;
			}
			
                        if (vm.apiDomain.segmentTypeKey == "63473"
                                && vm.apiDomain.segmentType != "primer") {
				alert("Segment Type : cannot change Molecular Segment to Primer");
                                return;
                        }

                        if (vm.apiDomain.segmentTypeKey != "63473"
                                && vm.apiDomain.segmentType == "primer") {
				alert("Segment Type : cannot change Primer to Molecular Segment");
                                return;
                        }

			if (vm.apiDomain.name == null || vm.apiDomain.name == "") {
				alert("Required Field : Name");
                                return;
			}

			pageScope.loadingStart();
			ProbeUpdateAPI.update(vm.apiDomain, function(data) {
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
				pageScope.handleError(vm, "API ERROR: ProbeUpdateAPI.update");
				pageScope.loadingEnd();
                                       setFocus();
			});
		}		
		
        	// delete
		function deleteIt() {
			console.log("deleteIt() -> ProbeDeleteAPI() : " + vm.selectedIndex);

			// check if record selected
			if (vm.selectedIndex < 0) {
				alert("Cannot Delete if a record is not selected.");
				return;
			}

			if ($window.confirm("Are you sure you want to delete this record?")) {
			
				pageScope.loadingStart();

				ProbeDeleteAPI.delete({key: vm.apiDomain.probeKey}, function(data) {
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
					pageScope.handleError(vm, "API ERROR: ProbeDeleteAPI.delete");
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
		function resetData(index) {
			console.log("resetData(): " + index);

			vm.results = [];
			vm.selectedIndex = -1;
			vm.selectedMarkerIndex = 0;
			vm.selectedRefIndex = 0;
		        vm.attachGeneralNote = "";
                        resetBoolean();

                        // clear all
                        if (index == 1) {
			        vm.apiDomain = {};
			        vm.apiDomain.probeKey = "";	
			        vm.apiDomain.name = "";	
			        vm.apiDomain.segmentTypeKey = "";	
			        vm.apiDomain.segmentType = "";	
			        vm.apiDomain.derivedFromKey = "";	
			        vm.apiDomain.derivedFromName = "";	
			        vm.apiDomain.derivedFromAccID = "";	
                                vm.apiDomain.ampPrimerAccID = "";
                                vm.apiDomain.ampPrimerName = "";
                                vm.apiDomain.ampPrimerKey = "";
			        vm.apiDomain.vectorTypeKey = "";	
			        vm.apiDomain.vectorType = "";	
			        vm.apiDomain.primer1sequence = "";	
			        vm.apiDomain.primer2sequence = "";	
			        vm.apiDomain.regionCovered = "";	
			        vm.apiDomain.insertSite = "";	
			        vm.apiDomain.insertSize = "";	
			        vm.apiDomain.productSize = "";	
			        vm.apiDomain.accID = "";
			        vm.apiDomain.createdByKey = "";
			        vm.apiDomain.createdBy = "";
			        vm.apiDomain.modifiedByKey = "";
			        vm.apiDomain.modifiedBy = "";
			        vm.apiDomain.creation_date = "";
			        vm.apiDomain.modification_date = "";
                                addSourceRow();
			        addMarkerRow();
                                addNotes();
			        addRefRow();
			        addRefRow();
                        }

                        // clear partial
                        else if (index == 2) {
			        vm.apiDomain.probeKey = "";	
			        vm.apiDomain.name = "";	
			        vm.apiDomain.derivedFromKey = "";	
			        vm.apiDomain.derivedFromName = "";	
			        vm.apiDomain.derivedFromAccID = "";	
                                vm.apiDomain.ampPrimerAccID = "";
                                vm.apiDomain.ampPrimerName = "";
                                vm.apiDomain.ampPrimerKey = "";
			        vm.apiDomain.primer1sequence = "";	
			        vm.apiDomain.primer2sequence = "";	
			        vm.apiDomain.regionCovered = "";	
			        vm.apiDomain.insertSite = "";	
			        vm.apiDomain.insertSize = "";	
			        vm.apiDomain.productSize = "";	
			        vm.apiDomain.accID = "";
			        vm.apiDomain.createdByKey = "";
			        vm.apiDomain.createdBy = "";
			        vm.apiDomain.modifiedByKey = "";
			        vm.apiDomain.modifiedBy = "";
			        vm.apiDomain.creation_date = "";
			        vm.apiDomain.modification_date = "";
			        vm.apiDomain.mgiAccessionIds = null;
                                vm.apiDomain.generalNote = null;
                                vm.apiDomain.rawsequenceNote = null;
                                addNotes();

			        if (vm.apiDomain.markers != null) {
                                        vm.apiDomain.markers[0].processStatus = "c";
                                        vm.apiDomain.markers[0].assocKey = "";
                                        vm.apiDomain.markers[0].probeKey = "";
                                        vm.apiDomain.markers[0].markerKey = "";
                                        vm.apiDomain.markers[0].markerSymbol = "";
                                        vm.apiDomain.markers[0].markerChromosome = "";
			                vm.apiDomain.markers[0].createdByKey = "";
			                vm.apiDomain.markers[0].createdBy = "";
			                vm.apiDomain.markers[0].modifiedByKey = "";
			                vm.apiDomain.markers[0].modifiedBy = "";
			                vm.apiDomain.markers[0].creation_date = "";
			                vm.apiDomain.markers[0].modification_date = "";
                                        var saveValue = vm.apiDomain.markers[0];
				        vm.apiDomain.markers = [];
                                        vm.apiDomain.markers[0] = saveValue;
                                }

			        if (vm.apiDomain.references != null) {
                                        vm.apiDomain.references[0].processStatus = "c";
                                        vm.apiDomain.references[0].referenceKey = "";
                                        vm.apiDomain.references[0].probeKey = "";
			                vm.apiDomain.references[0].createdByKey = "";
			                vm.apiDomain.references[0].createdBy = "";
			                vm.apiDomain.references[0].modifiedByKey = "";
			                vm.apiDomain.references[0].modifiedBy = "";
			                vm.apiDomain.references[0].creation_date = "";
			                vm.apiDomain.references[0].modification_date = "";
                                        vm.apiDomain.references[0].accessionIds = [];
                                        vm.apiDomain.references[0].aliases = [];
                                        var saveValue = vm.apiDomain.references[0];
				        vm.apiDomain.references = [];
                                        vm.apiDomain.references[0] = saveValue;
			                addAccRow(0);
			                addAliasRow(0);
                                }
                        }

                        // clear info
                        // keep Segment Type, 1st Reference
                        else if (index == 3) {
			        vm.apiDomain.probeKey = "";	
			        vm.apiDomain.name = "";	
			        vm.apiDomain.derivedFromKey = "";	
			        vm.apiDomain.derivedFromName = "";	
			        vm.apiDomain.derivedFromAccID = "";	
                                vm.apiDomain.ampPrimerAccID = "";
                                vm.apiDomain.ampPrimerName = "";
                                vm.apiDomain.ampPrimerKey = "";
			        vm.apiDomain.vectorTypeKey = "";	
			        vm.apiDomain.vectorType = "";	
			        vm.apiDomain.primer1sequence = "";	
			        vm.apiDomain.primer2sequence = "";	
			        vm.apiDomain.regionCovered = "";	
			        vm.apiDomain.insertSite = "";	
			        vm.apiDomain.insertSize = "";	
			        vm.apiDomain.productSize = "";	
			        vm.apiDomain.accID = "";
			        vm.apiDomain.createdByKey = "";
			        vm.apiDomain.createdBy = "";
			        vm.apiDomain.modifiedByKey = "";
			        vm.apiDomain.modifiedBy = "";
			        vm.apiDomain.creation_date = "";
			        vm.apiDomain.modification_date = "";
			        vm.apiDomain.mgiAccessionIds = null;
                                addSourceRow();
				vm.apiDomain.markers = [];
			        addMarkerRow();
                                vm.apiDomain.generalNote = null;
                                vm.apiDomain.rawsequenceNote = null;
                                addNotes();

			        if (vm.apiDomain.references != null) {
                                        vm.apiDomain.references[0].accessionIds = [];
                                        vm.apiDomain.references[0].aliases = [];
                                        var saveValue = vm.apiDomain.references[0];
				        vm.apiDomain.references = [];
                                        vm.apiDomain.references[0] = saveValue;
			                addAccRow(0);
			                addAliasRow(0);
                                }
                        }
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");

                        resetBoolean();
			vm.apiDomain.probeKey = "";	
			vm.apiDomain.name = "";	
			vm.apiDomain.segmentTypeKey = "";	
			vm.apiDomain.segmentType = "";	
			vm.apiDomain.derivedFromKey = "";	
			vm.apiDomain.derivedFromName = "";	
			vm.apiDomain.derivedFromAccID = "";	
			vm.apiDomain.vectorTypeKey = "";	
			vm.apiDomain.vectorType = "";	
			vm.apiDomain.primer1sequence = "";	
			vm.apiDomain.primer2sequence = "";	
			vm.apiDomain.productSize = "";	
			vm.apiDomain.regionCovered = "";	
			vm.apiDomain.insertSite = "";	
			vm.apiDomain.insertSize = "";	
			vm.apiDomain.accID = "";
                        addSourceRow();
			addMarkerRow();
			addRefRow();
			addRefRow();
                        addNotes();
		}

		// reset booleans
	        function resetBoolean() {
			vm.hideErrorContents = true;
			vm.hideDetailClip = true;
			vm.hideGeneralNote = false;
			vm.hideRawSequenceNote = true;
			vm.hideMGIIds = true;
		}

		// load vocabularies
                function loadVocabs() {
                        console.log("loadVocabs()");

			vm.segmentLookup = {};
			VocTermSearchAPI.search({"vocabKey":"10"}, function(data) { vm.segmentLookup = data.items[0].terms});;

			vm.vectorLookup = {};
			VocTermSearchAPI.search({"vocabKey":"24"}, function(data) { vm.vectorLookup = data.items[0].terms});;

			vm.organismLookup = [];
			OrganismSearchProbeAPI.search({}, function(data) { vm.organismLookup = data});;

                        vm.libraryLookup = {};
			LibrarySearchAPI.search({}, function(data) { vm.libraryLookup = data});;

                        vm.ageLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"147"}, function(data) { vm.ageLookup = data.items[0].terms});;

                        vm.genderLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"17"}, function(data) { vm.genderLookup = data.items[0].terms});;

                        vm.molsegLookup = {};
                        VocTermSearchAPI.search({"vocabKey":"150"}, function(data) { vm.molsegLookup = data.items[0].terms});;

                        vm.chromosomeLookup = {};
                        ChromosomeSearchAPI.search({"organismKey":"1"}, function(data) { vm.chromosomeLookup = data});;

			vm.logicaldbLookup = [];
			LogicalDBSearchAPI.search({}, function(data) { vm.logicaldbLookup = data});;

                        vm.relationshipLookup = {};
			vm.relationshipLookup[0] = {"term": "A" };
			vm.relationshipLookup[1] = {"term": "E" };
			vm.relationshipLookup[2] = {"term": "H" };
			vm.relationshipLookup[3] = {"term": "P" };
			vm.relationshipLookup[4] = {"term": "(none)" };

                        // yesnoLookup
                        vm.yesnoLookup = [];
                        vm.yesnoLookup[0] = { "termKey": "1", "term": "Yes" }
                        vm.yesnoLookup[1] = { "termKey": "0", "term": "No" }

                        vm.tissueLookup = {};
                        TissueListAPI.get({}, function(data) { vm.tissueLookup = data.items; 
                                $q.all([
                                FindElement.byId("tissue"),
                                ]).then(function(elements) {
                                        pageScope.autocompleteBeginning(angular.element(elements[0]), vm.tissueLookup);
                                });
                        }); 

			vm.cellLineLookup = {};
			VocTermListAPI.search({"vocabKey":"18"}, function(data) { vm.cellLineLookup = data.items;
                                $q.all([
                                FindElement.byId("cellLine"),
                                ]).then(function(elements) {
                                        pageScope.autocompleteBeginning(angular.element(elements[0]), vm.cellLineLookup);
                                });
                        });

                        vm.strainLookup = {};
                        StrainListProbeAntigenAPI.get({}, function(data) { vm.strainLookup = data.items;
                                $q.all([
                                FindElement.byId("strain"),
                                ]).then(function(elements) {
                                        pageScope.autocompleteBeginning(angular.element(elements[0]), vm.strainLookup);
                                });
                        }); 
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

                        vm.attachGeneralNote = "";

			ProbeGetAPI.get({ key: vm.results[vm.selectedIndex].probeKey }, function(data) {
				vm.apiDomain = data;
				vm.apiDomain.probeKey = vm.results[vm.selectedIndex].probeKey;
				vm.results[vm.selectedIndex].name = vm.apiDomain.name;
				selectMarker(0);
				selectRef(0);
			        addMarkerRow();
			        addRefRow();
                                addNotes();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ProbeGetAPI.get");
			});
		}	
		
		// when an object is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove object, if it exists)
			removeSearchResultsItem(vm.apiDomain.probeKey);

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
				if (vm.results[i].probeKey == keyToRemove) {
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
                                document.getElementById("segmentType").focus();
                        }, (500));
		}

		/////////////////////////////////////////////////////////////////////
		// validating
		/////////////////////////////////////////////////////////////////////		
		
		// validate probe clone
		function validateProbeClone() {				
			console.log("validateProbeClone()");
		
                        if (vm.apiDomain.derivedFromAccID == undefined || vm.apiDomain.derivedFromAccID == "") {
                                return;
                        }

                        if (vm.apiDomain.derivedFromAccID.includes("%")) {
                                return;
                        }

			pageScope.loadingStart();

			var params = {};
			params.accID = vm.apiDomain.derivedFromAccID;

			ProbeSearchAPI.search(params, function(data) {
                                if (data.length == 0) {
					alert("Invalid Probe Clone: " + vm.apiDomain.derivedFromAccID);
					document.getElementById("derivedFromAccID").focus();
                                        vm.apiDomain.derivedFromAccID = "";
                                        vm.apiDomain.derivedFromName = "";
                                        vm.apiDomain.derivedFromKey = "";
				        pageScope.loadingEnd();
                                }
                                else {
                                        vm.apiDomain.derivedFromAccID = data[0].accID;
                                        vm.apiDomain.derivedFromName = data[0].name;
                                        vm.apiDomain.derivedFromKey = data[0].probeKey;
                                        vm.apiDomain.probeSource = data[0].probeSource;
			                if (vm.apiDomain.probeSource.processStatus == "x") {
                                                vm.apiDomain.probeSource.processStatus = "u";
                                        }
				        pageScope.loadingEnd();
                                }
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ProbeSearchAPI.search");
				document.getElementById("derivedFromAccID").focus();
                                vm.apiDomain.derivedFromAccID = "";
                                vm.apiDomain.derivedFromName = "";
                                vm.apiDomain.derivedFromKey = "";
				pageScope.loadingEnd();
			});
		}		

		// validate amp primer
		function validateAmpPrimer() {				
			console.log("validateAmpPrimer()");
		
                        if (vm.apiDomain.ampPrimerAccID == undefined || vm.apiDomain.ampPrimerAccID == "") {
                                vm.apiDomain.ampPrimerAccID = "";
                                vm.apiDomain.ampPrimerName = "";
                                vm.apiDomain.ampPrimerKey = "";
                                return;
                        }

                        if (vm.apiDomain.ampPrimerAccID.includes("%")) {
                                return;
                        }

			pageScope.loadingStart();

			var params = {};
			params.accID = vm.apiDomain.ampPrimerAccID;

			ProbeValidateAmpPrimerAPI.search(params, function(data) {
                                if (data.length == 0) {
					alert("Invalid Amp Primer: " + vm.apiDomain.ampPrimerAccID
                                                + "\n\nsegment type must equal 'primer'")
					document.getElementById("ampPrimerAccID").focus();
                                        vm.apiDomain.ampPrimerAccID = "";
                                        vm.apiDomain.ampPrimerName = "";
                                        vm.apiDomain.ampPrimerKey = "";
				        pageScope.loadingEnd();
                                }
                                else {
                                        vm.apiDomain.ampPrimerAccID = data[0].accID;
                                        vm.apiDomain.ampPrimerName = data[0].name;
                                        vm.apiDomain.ampPrimerKey = data[0].probeKey;
				        pageScope.loadingEnd();
                                }
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ProbeSearchAPI.search");
				document.getElementById("ampPrimerAccID").focus();
                                vm.apiDomain.ampPrimerAccID = "";
                                vm.apiDomain.ampPrimerName = "";
                                vm.apiDomain.ampPrimerKey = "";
				pageScope.loadingEnd();
			});
		}		

		function validateProbeSource() {				
			console.log("validateProbeSource()");
		
                        if (vm.apiDomain.probeSource.sourceKey == undefined || vm.apiDomain.probeSource.sourceKey == "") {
                                return;
                        }

			ValidateProbeSourceAPI.get({ key: vm.apiDomain.probeSource.sourceKey }, function(data) {
				vm.apiDomain.probeSource = data;
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateProbeSourceAPI.get");
			});
		}		

        	// validate jnum
		function validateJnum(row, index, id) {		
			console.log("validateJnum = " + id + index);

			id = id + index;

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

                                        // add refsKey to row.accessionIds()
                                        if (row.accessionIds != null) {
			                        for(var i=0;i<row.accessionIds.length; i++) {
			                                for(var j=0;j<row.accessionIds[i].references.length; j++) {
                                                                row.accessionIds[i].references[j].refsKey = row.refsKey;
                                                        }
                                                }
                                        }

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

                // validate marker
		function validateMarker(row, index, id) {
			console.log("validateMarker = " + id + index);

			id = id + index;
			
			if (row.markerSymbol == undefined || row.markerSymbol == "") {
				row.markerKey = "";
				row.markerSymbol = "";
				row.markerChromosome = "";
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
					row.markerChromosome = "";
				} else if (data.length > 1) {
					alert("This marker requires a Chr.\nSelect a Chr, then Marker, and try again:\n\n" + row.markerSymbol);
					document.getElementById(id).focus();
					row.markerKey = "";
					row.markerSymbol = "";
					row.markerChromosome = "";
				} else {
					console.log(data);
					row.markerKey = data[0].markerKey;
					row.markerSymbol = data[0].symbol;
					row.markerChromosome = data[0].chromosome;
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateMarkerAPI.search");
				document.getElementById(id).focus();
				row.markerKey = "";
				row.markerSymbol = "";
				row.markerChromosome = "";
			});
		}

                // validate strain	
                function validateStrain() {
                        console.log("validateStrain(): ") + vm.apiDomain.probeSource.strain;

                        if (vm.apiDomain.probeSource.strain == undefined || vm.apiDomain.probeSource.strain == "") {
                                return;
                        }

                        if (vm.apiDomain.probeSource.strain.includes("%")) {
                                return;
                        }

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
                                                vm.apiDomain.probeSource.strainKey = data[0].strainKey;
                                                vm.apiDomain.probeSource.strain = data[0].strain;
                                        }
                                }
                        }, function(err) {
                                pageScope.handleError(vm, "API ERROR: ValidateStrainAPI.search");
                                document.getElementById("strain").focus();
                        });
                }

                function createStrain() {
                        console.log("createStrain()");

                        var newterm = {};
                        newterm.strain = vm.apiDomain.probeSource.strain;
                        newterm.speciesKey = "481207";
                        newterm.strainTypeKey = "3410535";
                        newterm.standard = "0";
                        newterm.isPrivate = "0";
                        newterm.geneticBackground = "0";

                        if ($window.confirm("The item: \n\n'" + newterm.strain + "' \n\ndoes not exist.\n\nTo add new item, click 'OK'\n\nElse, click 'Cancel'")) {
                                StrainCreateAPI.create(newterm, function(data) {
                                        if (data.error != null) {
                                                alert("ERROR: " + data.error + " - " + data.message);
                                                vm.apiDomain.probeSource.strainKey = "";
                                                vm.apiDomain.probeSource.strain = "";
                                                document.getElementById("strain").focus();
                                        } else {
                                                vm.apiDomain.probeSource.strainKey = data.items[0].strainKey;
                                                vm.apiDomain.probeSource.strain = data.items[0].strain;
                                        }
                                }, function(err) {
                                        pageScope.handleError(vm, "API ERROR: StrainCreateAPI.create");
                                        document.getElementById("strain").focus();
                                });
                        }
                        else {
                                vm.apiDomain.probeSource.strainKey = "";
                                vm.apiDomain.probeSource.strain = "";
                                document.getElementById("strain").focus();
                        }
                }

                // validate tissue
                function validateTissue() {
                        console.log("validateTissue(): " + vm.apiDomain.probeSource.tissue);

                        if (vm.apiDomain.probeSource.tissue == undefined || vm.apiDomain.probeSource.tissue == "") {
                                return;
                        }

                        if (vm.apiDomain.probeSource.tissue.includes("%")) {
                                return;
                        }

                        ValidateTissueAPI.search({tissue: vm.apiDomain.probeSource.tissue}, function(data) {
                                if (data.length == 0 || data == undefined) {
                                        createTissue();
                                } else {
                                        vm.apiDomain.probeSource.tissueKey = data[0].tissueKey;
                                        vm.apiDomain.probeSource.tissue = data[0].tissue;
                                }
                        }, function(err) {
                                pageScope.handleError(vm, "API ERROR: ValidateTissueAPI.search");
                                document.getElementById("tissue").focus();
                        });
                }

                function createTissue() {
                        console.log("createTissue()");

                        var newterm = {};
                        newterm.tissue = vm.apiDomain.probeSource.tissue;
                        newterm.standard = "0";

                        if ($window.confirm("The item: \n\n'" + newterm.tissue + "' \n\ndoes not exist.\n\nTo add new item, click 'OK'\n\nElse, click 'Cancel'")) {
                                TissueCreateAPI.create(newterm, function(data) {
                                        if (data.error != null) {
                                                alert("ERROR: " + data.error + " - " + data.message);
                                                vm.apiDomain.probeSource.tissueKey = "";
                                                vm.apiDomain.probeSource.tissue = "";
                                                document.getElementById("tissue").focus();
                                        } else {
                                                vm.apiDomain.probeSource.tissueKey = data.items[0].tissueKey;
                                                vm.apiDomain.probeSource.tissue = data.items[0].tissue;
                                        }
                                }, function(err) {
                                        pageScope.handleError(vm, "API ERROR: TissueCreateAPI.create");
                                        document.getElementById("tissue").focus();
                                });
                        }
                        else {
                                vm.apiDomain.probeSource.tissueKey = "";
                                vm.apiDomain.probeSource.tissue = "";
                                document.getElementById("tissue").focus();
                        }
                }
 
                //  validate cell line
                function validateCellLine() {
                        console.log("validateCellLine(): " + vm.apiDomain.probeSource.cellLine);

                        if (vm.apiDomain.probeSource.cellLine == undefined || vm.apiDomain.probeSource.cellLine == "") {
                                return;
                        }

                        if (vm.apiDomain.probeSource.cellLine.includes("%")) {
                                return;
                        }

                        var params = {};
                        params.vocabKey = "18";
                        params.term = vm.apiDomain.probeSource.cellLine;
                        console.log(params); 

                        ValidateTermAPI.search(params, function(data) {
                                if (data == null || data.length == 0 || data.length == undefined) {
                                        createCellLine();
                                }
                                else {
                                        vm.apiDomain.probeSource.cellLineKey = data[0].termKey;
                                        vm.apiDomain.probeSource.cellLine = data[0].term;
                                }
                        }, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateTermAPI.search");
                                document.getElementById("cellLine").focus();
                        });
                }
                
                function createCellLine() {
                        console.log("createCellLine");

                        var newterm = {};
                        newterm.processStatus = "c";
                        newterm.term = vm.apiDomain.probeSource.cellLine;
                        newterm.isObsolete = "0";
                        newterm.vocabKey = "18";

                        if ($window.confirm("The item: \n\n'" + newterm.term + "' \n\ndoes not exist.\n\nTo add new item, click 'OK'\n\nElse, click 'Cancel'")) {
                                CellLineCreateAPI.create(newterm, function(data) {
                                        if (data.error != null) {
                                                alert("ERROR: " + data.error + " - " + data.message);
                                                vm.apiDomain.probeSource.cellLineKey = "";
                                                vm.apiDomain.probeSource.cellLine = "";
                                                document.getElementById("cellLine").focus();
                                        } else {
                                                vm.apiDomain.probeSource.cellLineKey = data.items[0].termKey;
                                                vm.apiDomain.probeSource.cellLine = data.items[0].term;
                                        }
                                }, function(err) {
					pageScope.handleError(vm, "API ERROR: CellLineCreateAPI.create");
                                        document.getElementById("cellLine").focus();
                                });
                        }
                        else {
                                vm.apiDomain.probeSource.cellLineKey = "";
                                vm.apiDomain.probeSource.cellLine = "";
                                document.getElementById("cellLine").focus();
                        }
                }
	
		/////////////////////////////////////////////////////////////////////
		// probe source
		/////////////////////////////////////////////////////////////////////		
		
		// add new row
		function addSourceRow() {
			console.log("addSourceRow");

			if (vm.apiDomain.probeSource == undefined) {
				vm.apiDomain.probeSource = {};
			}

			vm.apiDomain.probeSource = {
				"processStatus": "c",
                                "sourceKey": "",
                                "name": "",
                                "description": "",
                                "age": "",
                                "agePrefix": "",
                                "ageStage": "",
                                "organismKey": "",
                                "organism": "",
                                "strainKey": "",
                                "strain": "",
                                "tissueKey": "",
                                "tissue": "",
                                "genderKey": "",
                                "gender": "",
                                "cellLineKey": "",
                                "cellLine": ""
			}
		}		

		/////////////////////////////////////////////////////////////////////
		// primer sequence
		/////////////////////////////////////////////////////////////////////		
                
                // remove non-ascii and empty/white space
		function changePrimerSequence() {
			console.log("changePrimerSequence()");

                        var newsequence;

	                newsequence = vm.apiDomain.primer1sequence.replace(/[^\s -~]+/g, '');
                        vm.apiDomain.primer1sequence = newsequence;
	                newsequence = vm.apiDomain.primer2sequence.replace(/[^\s -~]+/g, '');
                        vm.apiDomain.primer2sequence = newsequence;
	                newsequence = vm.apiDomain.primer1sequence.replace(/\s+/g, '');
                        vm.apiDomain.primer1sequence = newsequence;
	                newsequence = vm.apiDomain.primer2sequence.replace(/\s+/g, '');
                        vm.apiDomain.primer2sequence = newsequence;
                }

		/////////////////////////////////////////////////////////////////////
		// source
		/////////////////////////////////////////////////////////////////////		
                
		// if current object has changed
		function changeSource() {
			console.log("changeSource()");

                        if (vm.apiDomain.probeSource.name == null || vm.apiDomain.probeSource.name == undefined) {
			        if (vm.apiDomain.probeSource.processStatus == "x") {
				        vm.apiDomain.probeSource.processStatus = "u";
			        };
                        }
                }

		/////////////////////////////////////////////////////////////////////
		// markers
		/////////////////////////////////////////////////////////////////////		
		
		// set current row
		function selectMarker(index) {
			console.log("selectMarker: " + index);
			vm.selectedMarkerIndex = index;
			vm.selectedRefIndex = 0;
			vm.selectedAccIndex = 0;
			vm.selectedAliasIndex = 0;

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
                                "probeKey": vm.apiDomain.probeKey,
                                "markerKey": "",
                                "markerSymbol": "",
                                "relationship": "",
				"refsKey": "",
			       	"jnumid": "",
			       	"jnum": null,
				"short_citation": "",
				"createdBy": "",
				"creation_date": "",
				"modifiedBy": "",
				"modification_date": ""
			}
		}		

		// autopopulate primer name
		function autoPrimerName() {
			console.log("autoPrimerName");

                        if (vm.apiDomain.segmentTypeKey != "63473") {
                                return;
                        }

			if (vm.apiDomain.markers[0].markerSymbol == "") {
				return;
			}

			if (vm.apiDomain.name != "") {
				return;
			}

			vm.apiDomain.name = vm.apiDomain.markers[0].markerSymbol + "-pF, " + vm.apiDomain.markers[0].markerSymbol + "-pR";
		}		

		/////////////////////////////////////////////////////////////////////
		// references
		/////////////////////////////////////////////////////////////////////		
		
		// set current row
		function selectRef(index) {
			console.log("selectRef: " + index);
			vm.selectedRefIndex = index;
			vm.selectedAliasIndex = 0;

			if (vm.apiDomain.references == null | vm.apiDomain.references == undefined) {
                                return;
                        }

			if (vm.apiDomain.references.length == 0) {
				addRefRow();
			}

                        // add empty accession/alias rows, if needed
			for(var i=0;i<vm.apiDomain.references.length; i++) {
                                if (vm.apiDomain.references[i].accessionIds == null) {
                                        addAccRow(i);
                                }
                                if (vm.apiDomain.references[i].aliases == null) {
                                        addAliasRow(i);
                                }
                        }
		}

		// if current row has changed
		function changeRefRow(index) {
			console.log("changeRefRow: " + index);

			vm.selectedRefIndex = index;

			if (vm.apiDomain.references[index] == null) {
				vm.selectedRefIndex = 0;
				return;
			}

			if (vm.apiDomain.references[index].processStatus == "x") {
				vm.apiDomain.references[index].processStatus = "u";
			};
                }

		// add new row
		function addRefRow() {
			console.log("addRefRow()");

			if (vm.apiDomain.references == undefined) {
				vm.apiDomain.references = [];
			}

			var i = vm.apiDomain.references.length;

			vm.apiDomain.references[i] = {
				"processStatus": "c",
				"referenceKey": "",
			       	"probeKey": vm.apiDomain.probeKey,
                                "hasRmap": "0",
                                "hasSequence": "0",
				"refsKey": "",
			       	"jnumid": "",
				"short_citation": "",
				"createdBy": "",
				"creation_date": "",
				"modifiedBy": "",
				"modification_date": ""
			}

			addAccRow(i);
			addAliasRow(i);
		}		

		/////////////////////////////////////////////////////////////////////
		// accessionIds
		/////////////////////////////////////////////////////////////////////		
		
		// set current row
		function selectAcc(index) {
			console.log("selectAcc: " + index);
			vm.selectedAccIndex = index;

			if (vm.apiDomain.references == null | vm.apiDomain.references == undefined) {
                                return;
                        }

                        // build vm.apiDomain.references.accessionIds from vm.apiDomain.otherAccessionIds
                        // by _refs_key
                        
			if (vm.apiDomain.references.length == 0) {
				addAccRow(index);
			}
		}

		// if current row has changed
		function changeAccRow(index) {
			console.log("changeAccRow: " + index);

			vm.selectedAccIndex = index;

			if (vm.apiDomain.references[vm.selectedRefIndex].accessionIds == null) {
				vm.selectedAccIndex = 0;
				return;
			}

			if (vm.apiDomain.references[vm.selectedRefIndex].processStatus == "x") {
				vm.apiDomain.references[vm.selectedRefIndex].processStatus = "u";
			}

			if (vm.apiDomain.references[vm.selectedRefIndex].accessionIds[index].processStatus == "x") {
				vm.apiDomain.references[vm.selectedRefIndex].accessionIds[index].processStatus = "u";
			}

		}

		// add new row
		function addAccRow(index) {
			console.log("addAccRow: " + index);

			if (vm.apiDomain.references[index].accessionIds == undefined) {
				vm.apiDomain.references[index].accessionIds = [];
			}

			var i = vm.apiDomain.references[index].accessionIds.length;
			
			vm.apiDomain.references[index].accessionIds[i] = {
				"processStatus": "c",
				"objectKey": vm.apiDomain.probeKey,
				"accessionKey": "",
				"logicaldbKey": "",
				"accID": ""
			}
			vm.apiDomain.references[index].accessionIds[i].references = [];
			vm.apiDomain.references[index].accessionIds[i].references[0] = {
				"refsKey": vm.apiDomain.references[index].refsKey,
			        "jnumid": vm.apiDomain.references[index].jnumid
			}

                        // set default accession for row > 0
                        if (i > 0) {
                                vm.apiDomain.references[index].accessionIds[i].logicaldbKey = "9";
                        }
		}		

		// delete row
		function deleteAccRow(index) {
			console.log("deleteAccRow: " + index);
			if (vm.apiDomain.references[vm.selectedRefIndex].processStatus == "x") {
				vm.apiDomain.references[vm.selectedRefIndex].processStatus = "u";
			}
			vm.apiDomain.references[vm.selectedRefIndex].accessionIds[index].processStatus = "d";
		}

		/////////////////////////////////////////////////////////////////////
		// aliases
		/////////////////////////////////////////////////////////////////////		
		
		// set current row
		function selectAlias(index) {
			console.log("selectAlias: " + index);
			vm.selectedAliasIndex = index;

			if (vm.apiDomain.references == null | vm.apiDomain.references == undefined) {
                                return;
                        }

			if (vm.apiDomain.references.length == 0) {
				addAddRow(index);
				addAliasRow(index);
			}
		}

		// if current row has changed
		function changeAliasRow(index) {
			console.log("changeAliasRow: " + index);

			vm.selectedAliasIndex = index;

			if (vm.apiDomain.references[vm.selectedRefIndex].aliases == null) {
				vm.selectedAliasIndex = 0;
				return;
			}

			if (vm.apiDomain.references[vm.selectedRefIndex].processStatus == "x") {
				vm.apiDomain.references[vm.selectedRefIndex].processStatus = "u";
			}

			if (vm.apiDomain.references[vm.selectedRefIndex].aliases[index].processStatus == "x") {
				vm.apiDomain.references[vm.selectedRefIndex].aliases[index].processStatus = "u";
			}

		}

		// add new row
		function addAliasRow(index) {
			console.log("addAliasRow: " + index);

			if (vm.apiDomain.references[index].aliases == undefined) {
				vm.apiDomain.references[index].aliases = [];
			}

			var i = vm.apiDomain.references[index].aliases.length;
			
			vm.apiDomain.references[index].aliases[i] = {
				"processStatus": "c",
				"aliasKey": "",
				"referenceKey": vm.apiDomain.references[index].referenceKey,
			       	"alias": ""
			}
		}		

		// delete row
		function deleteAliasRow(index) {
			console.log("deleteAliasRow: " + index);
			if (vm.apiDomain.references[vm.selectedRefIndex].processStatus == "x") {
				vm.apiDomain.references[vm.selectedRefIndex].processStatus = "u";
			}
			vm.apiDomain.references[vm.selectedRefIndex].aliases[index].processStatus = "d";
		}

		/////////////////////////////////////////////////////////////////////
		// general note
		/////////////////////////////////////////////////////////////////////		
                
		// add general note
		function addGeneralNote() {
			console.log("addGeneralNote()");

                        if (vm.apiDomain.generalNote != null) {
                                return;
                        }

			vm.apiDomain.generalNote = {
				"processStatus": "c",
				"probeKey": vm.apiDomain.probeKey,
                                "note": ""
			};
		}

		// clear general note
		function clearGeneralNote() {
                        console.log("clearGeneralNote()");

			if (vm.apiDomain.generalNote.processStatus == "x") {
                                vm.apiDomain.generalNote.processStatus = "d";
                        };
                        vm.apiDomain.generalNote.note = "";
		}

		// if general note has changed
		function changeGeneralNote() {
                        console.log("changeGeneralNote()");

			if (vm.apiDomain.generalNote.processStatus == "x") {
                                if (vm.apiDomain.generalNote.note == null 
                                        || vm.apiDomain.generalNote.note == "") {
                                        vm.apiDomain.generalNote.processStatus = "d";
                                }
                                else {
                                        vm.apiDomain.generalNote.processStatus = "u";
                                }
                        };
		}

		// attach to general note
		function attachGeneralNote() {
			console.log("attachGeneralNote()");

                        if (vm.apiDomain.generalNote.note == null || vm.apiDomain.generalNote.note == "") {
			        vm.apiDomain.generalNote.note = vm.attachGeneralNote;
                        }
                        else {
			        vm.apiDomain.generalNote.note = 
                                        vm.apiDomain.generalNote.note + " " + vm.attachGeneralNote;
                        }

			if (vm.apiDomain.generalNote.processStatus == "x") {
                                vm.apiDomain.generalNote.processStatus = "u";
                        }
		}

		/////////////////////////////////////////////////////////////////////
		// notes
		/////////////////////////////////////////////////////////////////////		
		
		// Hide/Show note sections
		function hideShowGeneralNote() {
			vm.hideGeneralNote = !vm.hideGeneralNote;
		}
		function hideShowRawSequenceNote() {
			vm.hideRawSequenceNote = !vm.hideRawSequenceNote;
		}
		function hideShowMGIIds() {
			vm.hideMGIIds = !vm.hideMGIIds;
		}

		// add new note row
		function addNote(note, noteType) {
			console.log("addNote():" + note);

			if (note != null) { return; }

			var noteTypeKey = "";

			if (noteType == "RawSequence") {
				noteTypeKey = "1037";
			}

			note = {
                                "processStatus": "c",
				"noteKey": "",
				"objectKey": vm.apiDomain.alleleKey,
				"mgiTypeKey": "3",
				"noteTypeKey": noteTypeKey,
				"noteChunk": ""
			}

			if (noteType == "RawSequence") {
				vm.apiDomain.rawsequenceNote = note;
			}
		}

		function addNotes() {
			console.log("addNotes()");

			addGeneralNote();
			addNote(vm.apiDomain.rawsequenceNote, "RawSequence");
		}

		/////////////////////////////////////////////////////////////////////
		// link outs
		/////////////////////////////////////////////////////////////////////		
                
		// linkout to probe detail
                function prbDetailLink() {
                        var prbUrl = pageScope.url_for('pwi.probedetail', '?id=' + vm.apiDomain.accID);
                        window.open(prbUrl, '_blank');
                }

		// linkout to probe summary by Jnum
                function prbSummaryByJLink() {
                        console.log("prbSummaryByJLink");
                        var prbUrl = pageScope.url_for('pwi.probesummary', '?refs_id=' + vm.apiDomain.references[0].jnumid);
                        window.open(prbUrl, '_blank');
                }

		// linkout to probe summary by Marker
                function prbSummaryByMarkerLink() {
                        console.log("prbSummaryByMarkerLink");
                        var prbUrl = pageScope.url_for('pwi.probesummary', '?marker_id=' + vm.apiDomain.markers[0].markerAccId);
                        window.open(prbUrl, '_blank');
                }

                //
		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
		$scope.searchSummary = searchSummary;
		$scope.clear = clear;
		$scope.clearPartial = clearPartial;
		$scope.clearInfo = clearInfo;
		$scope.create = create;
		$scope.modify = modify;
		$scope.delete = deleteIt;
		$scope.changePrimerSequence = changePrimerSequence;
		$scope.changeSource = changeSource;
		$scope.changeGeneralNote = changeGeneralNote;
		$scope.changeMarkerRow = changeMarkerRow;
		$scope.addMarkerRow = addMarkerRow;
		$scope.autoPrimerName = autoPrimerName;
		$scope.changeRefRow = changeRefRow;
		$scope.addRefRow = addRefRow;
		$scope.changeAccRow = changeAccRow;
		$scope.addAccRow = addAccRow;
		$scope.deleteAccRow = deleteAccRow;
		$scope.changeAliasRow = changeAliasRow;
		$scope.addAliasRow = addAliasRow;
		$scope.deleteAliasRow = deleteAliasRow;
		$scope.selectMarker = selectMarker;
		$scope.selectRef = selectRef;
		$scope.selectAcc = selectAcc;
		$scope.selectAlias = selectAlias;
		$scope.attachGeneralNote = attachGeneralNote;
		$scope.clearGeneralNote = clearGeneralNote;

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

                // Note Button
		$scope.hideShowGeneralNote = hideShowGeneralNote;
		$scope.hideShowRawSequenceNote = hideShowRawSequenceNote;
		$scope.hideShowMGIIds = hideShowMGIIds;

		// other functions: buttons, onBlurs and onChanges
		$scope.selectResult = selectResult;
		$scope.validateProbeClone = validateProbeClone;
		$scope.validateAmpPrimer = validateAmpPrimer;
		$scope.validateProbeSource = validateProbeSource;
		$scope.validateJnum = validateJnum;
		$scope.validateMarker = validateMarker;
		$scope.validateStrain = validateStrain;
		$scope.validateTissue = validateTissue;
		$scope.validateCellLine = validateCellLine;
                $scope.prbDetailLink = prbDetailLink;
                $scope.prbSummaryByJLink = prbSummaryByJLink;
                $scope.prbSummaryByMarkerLink = prbSummaryByMarkerLink;

		// global shortcuts
		$scope.KclearAll = function() { $scope.clear(); $scope.$apply(); }
		$scope.KclearInfo = function() { $scope.clearInfo(); $scope.$apply(); }
		$scope.KclearPartial = function() { $scope.clearPartial(); $scope.$apply(); }
		$scope.Ksearch = function() { $scope.search(); $scope.$apply(); }
		$scope.Kfirst = function() { $scope.firstSummaryObject(); $scope.$apply(); }
		$scope.Knext = function() { $scope.nextSummaryObject(); $scope.$apply(); }
		$scope.Kprev = function() { $scope.prevSummaryObject(); $scope.$apply(); }
		$scope.Klast = function() { $scope.lastSummaryObject(); $scope.$apply(); }
		$scope.Kadd = function() { $scope.create(); $scope.$apply(); }
		$scope.Kmodify = function() { $scope.modify(); $scope.$apply(); }
		$scope.Kdelete = function() { $scope.delete(); $scope.$apply(); }

		var globalShortcuts = Mousetrap($document[0].body);
		globalShortcuts.bind(['ctrl+alt+c'], $scope.KclearAll);
		globalShortcuts.bind(['ctrl+alt+i'], $scope.KclearInfo);
		globalShortcuts.bind(['ctrl+alt+t'], $scope.KclearPartial);
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

