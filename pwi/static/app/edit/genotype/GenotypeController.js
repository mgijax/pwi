(function() {
	'use strict';
	angular.module('pwi.genotype').controller('GenotypeController', GenotypeController);

	function GenotypeController(
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
			GenotypeSearchAPI,
			GenotypeGetAPI,
			GenotypeCreateAPI,
			GenotypeCreateStrainAPI,
			GenotypeUpdateAPI,
			GenotypeDeleteAPI,
			GenotypeTotalCountAPI,
			GenotypeGetDataSetsAPI,
			GenotypeSearchDataSetsAPI,
			ValidateAlleleStateAPI,
			ValidateMutantCellLinesAPI,
			MGISetMemberCreateAPI,
			MGISetMemberDeleteAPI,
			// global APIs
			ChromosomeSearchAPI,
			ValidateAlleleAPI,
			ValidateImagePaneAPI,
			ValidateMarkerOfficialStatusAPI,
			ValidateJnumAPI,
			ValidateStrainAPI,
			VocTermSearchAPI
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

		// results list and data
		vm.total_count = 0;
		vm.results = [];
		vm.selectedIndex = -1;
		vm.selectedAllelePairIndex = 0;
		vm.selectedImagePaneIndex = 0;
		vm.selectedClipboardIndex = 0;
		
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			resetDomain();
			resetClipboard();
			refreshTotalCount();
			loadVocabs();
			addAllelePairRow();
			addAllelePairRow();
			addImagePaneRow();
			addDataSetRow();
		}

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        	// mapped to 'Clear' button; called from init();  resets page
		function clear() {		
			resetDomain();
                        refreshTotalCount();
			addAllelePairRow();
			addAllelePairRow();
			addNotes();
			addImagePaneRow();
			addDataSetRow();
			setFocus();
		}		

		// mapped to query 'Search' button
		// default is to select first result
		function search() {				
			console.log(vm.apiDomain);
		
			pageScope.loadingStart();
			
			if (vm.dataSets[0].refsKey != "") {
				GenotypeSearchDataSetsAPI.query({key: vm.dataSets[0].refsKey}, function(data) {
					console.log(data);
					vm.results = data;
					vm.selectedIndex = 0;
					if (vm.results.length > 0) {
						loadObject();
					}
					pageScope.loadingEnd();
					setFocus();
	
				}, function(err) { // server exception
					pageScope.handleError(vm, "API ERROR: GenotypeSearchDataSetsAPI.query");
					pageScope.loadingEnd();
					setFocus();
				});
			}
			else {
				GenotypeSearchAPI.search(vm.apiDomain, function(data) {
					vm.results = data;
					vm.selectedIndex = 0;
					if (vm.results.length > 0) {
						loadObject();
					}
					pageScope.loadingEnd();
					setFocus();
	
				}, function(err) { // server exception
					pageScope.handleError(vm, "API ERROR: GenotypeSearchAPI.search");
					pageScope.loadingEnd();
					setFocus();
				});
			}
		}		

		function searchAccId() {
			console.log("searchAccId");

			if (vm.apiDomain.genotypeKey == "" && vm.apiDomain.accID != "") {
				search();
			}
		}

        	// mapped to 'Delete' button
		function deleteGenotype() {
			console.log("deleteGenotype() -> GenotypeDeleteAPI()");

			if ($window.confirm("Are you sure you want to delete this record?")) {
			
				pageScope.loadingStart();

				GenotypeDeleteAPI.delete({key: vm.apiDomain.genotypeKey}, function(data) {
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
					pageScope.handleError(vm, "API ERROR: GenotypeDeleteAPI.delete");
					pageScope.loadingEnd();
					setFocus();
				});
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

			// per curators, do not clear form when de-selecting except for accID
			//resetDomainDeselect();
                        vm.apiDomain.genotypeKey = "";
                        vm.apiDomain.accID = "";
			// change all processStatus to 'c'
			for(var i=0;i<vm.apiDomain.allelePairs.length; i++) {
				vm.apiDomain.allelePairs[i].processStatus = "c";
				vm.apiDomain.allelePairs[i].genotypeKey = "";
				vm.apiDomain.generalNote = null;
				addNote(vm.apiDomain.generalNote, "General");
				vm.apiDomain.privateCuratorialNote = null;
				addNote(vm.apiDomain.privateCuratorialNote, "Private Curatorial");
				vm.apiDomain.imagePaneAssocs = [];
			}

			setFocus();
		}
	
		// refresh the total count
                function refreshTotalCount() {
                        GenotypeTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////
		
        	// create genotypes
		function createGenotype() {
			console.log("createGenotype() -> GenotypeUpdateAPI()");
			var allowCommit = true;

			// check if record selected
			if(vm.selectedIndex > 0) {
				alert("Cannot Add if a record is already selected.");
				allowCommit = false;
			}
			
			// check required
			for(var i=0;i<vm.apiDomain.allelePairs.length; i++) {
				if (vm.apiDomain.allelePairs[i].processStatus == "u") {
					if ((vm.apiDomain.allelePairs[i].termKey == "")
						|| (vm.apiDomain.allelePairs[i].refsKey == "")
					) {
						alert("Required Fields are missing:  Term ID, J:");
						allowCommit = false;
					}
				}
			}

			// check duplicate sequenceNum
			var hasDuplicateOrder = false;
			var orderList = [];
			var s1 = 0;
			for(var i=0;i<vm.apiDomain.allelePairs.length; i++) {
				s1 = vm.apiDomain.allelePairs[i].sequenceNum;
				if (orderList.includes(s1)) {
					hasDuplicateOrder = true;
				}
				else {
					orderList.push(s1);
				}
			}
			if (hasDuplicateOrder) {
				alert("Duplicate Order Detected in Table.  Cannot Modify.");
				allowCommit = false;
			}

			// check at most 1 primary image pane
			var hasPrimary = false;
			var primaryList = [];
			var s2 = 0;
			for(var i=0;i<vm.apiDomain.imagePaneAssocs.length; i++) {
				if (vm.apiDomain.imagePaneAssocs[i].processStatus == "d") {
					continue;
				}
				if (vm.apiDomain.imagePaneAssocs[i].isPrimary == "0") {
					continue;
				}
				s2 = vm.apiDomain.imagePaneAssocs[i].isPrimary;
				if (primaryList.includes(s2)) {
					hasPrimary = true;
				}
				else {
					primaryList.push(s2);
				}
			}
			if (hasPrimary) {
				alert("At most one Primary Image Pane is allowed.  Cannot Modify.");
				allowCommit = false;
			}

			if (allowCommit){
				pageScope.loadingStart();

				ValidateAlleleStateAPI.validate(vm.apiDomain.allelePairs, function(data) {
					if (data.error != null) {
						alert(data.error);
					} 
					else {
						GenotypeCreateAPI.create(vm.apiDomain, function(data) {
							if (data.error != null) {
								alert("ERROR: " + data.error + " - " + data.message);
								loadObject();
							}
							else {
								vm.apiDomain = data.items[0];
                						vm.selectedIndex = vm.results.length;
								vm.results[vm.selectedIndex] = [];
								vm.results[vm.selectedIndex].genotypeKey = vm.apiDomain.genotypeKey;
								vm.results[vm.selectedIndex].genotypeDisplay = 
									vm.apiDomain.strain + " " + vm.apiDomain.allelePairs[0].alleleSymbol1;
								loadObject();
								refreshTotalCount();
							}
							pageScope.loadingEnd();
						}, function(err) {
							pageScope.handleError(vm, "API ERROR: GenotypeCreateAPI.create");
							pageScope.loadingEnd();
						});
					}
					pageScope.loadingEnd();
				}, function(err) {
					pageScope.handleError(vm, "API ERROR: ValidateAlleleStateAPI.validate");
					pageScope.loadingEnd();
				});
			}
			else {
				loadObject();
			}
		}		

        	// modify genotypes
		function modifyGenotype() {
			console.log("modifyGenotype() -> GenotypeUpdateAPI()");
			var allowCommit = true;

			// check if record selected
			if(vm.selectedIndex < 0) {
				alert("Cannot modify if a record is not selected.");
				allowCommit = false;
			}
			
			// check required
			for(var i=0;i<vm.apiDomain.allelePairs.length; i++) {
				if (vm.apiDomain.allelePairs[i].processStatus == "u") {
					if ((vm.apiDomain.allelePairs[i].termKey == "")
						|| (vm.apiDomain.allelePairs[i].refsKey == "")
					) {
						alert("Required Fields are missing:  Term ID, J:");
						allowCommit = false;
					}
				}
			}

			// check duplicate sequenceNum
			var hasDuplicateOrder = false;
			var orderList = [];
			var s1 = 0;
			for(var i=0;i<vm.apiDomain.allelePairs.length; i++) {
				s1 = vm.apiDomain.allelePairs[i].sequenceNum;
				if (orderList.includes(s1)) {
					hasDuplicateOrder = true;
				}
				else {
					orderList.push(s1);
				}
			}
			if (hasDuplicateOrder) {
				alert("Duplicate Order Detected in Table.  Cannot Modify.");
				allowCommit = false;
			}

			// check at most 1 primary image pane
			var hasPrimary = false;
			var primaryList = [];
			var s2 = 0;
			for(var i=0;i<vm.apiDomain.imagePaneAssocs.length; i++) {
				if (vm.apiDomain.imagePaneAssocs[i].processStatus == "d") {
					continue;
				}
				if (vm.apiDomain.imagePaneAssocs[i].isPrimary == "0") {
					continue;
				}
				s2 = vm.apiDomain.imagePaneAssocs[i].isPrimary;
				if (primaryList.includes(s2)) {
					hasPrimary = true;
				}
				else {
					primaryList.push(s2);
				}
			}
			if (hasPrimary) {
				alert("At most one Primary Image Pane is allowed.  Cannot Modify.");
				allowCommit = false;
			}

			if (allowCommit){
				pageScope.loadingStart();

				ValidateAlleleStateAPI.validate(vm.apiDomain.allelePairs, function(data) {
					if (data.error != null) {
						alert(data.error);
					} 
					else {
						GenotypeUpdateAPI.update(vm.apiDomain, function(data) {
							if (data.error != null) {
								alert("ERROR: " + data.error + " - " + data.message);
								loadObject();
							}
							else {
								loadObject();
							}
							pageScope.loadingEnd();
						}, function(err) {
							pageScope.handleError(vm, "API ERROR: GenotypeUpdateAPI.update");
							pageScope.loadingEnd();
						});
					}
					pageScope.loadingEnd();
				}, function(err) {
					pageScope.handleError(vm, "API ERROR: ValidateAlleleStateAPI.validate");
					pageScope.loadingEnd();
				});
			}
			else {
				loadObject();
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
		function resetDomain() {
			console.log("resetDomain()");

			vm.results = [];
			vm.selectedIndex = -1;
			vm.total_count = 0;

                	vm.hideErrorContents = true;

			// rebuild empty apiDomain submission object, else bindings fail
			vm.apiDomain = {};
			vm.apiDomain.genotypeKey = "";	
			vm.apiDomain.strainKey = "";	
			vm.apiDomain.strain = "";	
			vm.apiDomain.isConditional = "";	
			vm.apiDomain.existsAsKey = "";	
                        vm.apiDomain.accID = "";
		}

		// resets page data deselect
		function resetDomainDeselect() {
			console.log("resetDomainDeselect()");

			vm.apiDomain.genotypeKey = "";	
			vm.apiDomain.allelePairs = [];
			addAllelePairRow();
			addImagePaneRow();
			addDataSetRow();
		}

		// load vocabularies
                function loadVocabs() {
                        console.log("loadVocabs()");

                        vm.chromosomeLookup = [];
                        ChromosomeSearchAPI.search({"organismKey":"1"}, function(data) { vm.chromosomeLookup = data});;

			vm.pairStateLookup = {};
			VocTermSearchAPI.search({"vocabKey":"39"}, function(data) { vm.pairStateLookup = data.items[0].terms});;

			vm.compoundLookup = {};
			VocTermSearchAPI.search({"vocabKey":"42"}, function(data) { vm.compoundLookup = data.items[0].terms});;

			vm.existsAsLookup = {};
			VocTermSearchAPI.search({"vocabKey":"60"}, function(data) { vm.existsAsLookup = data.items[0].terms});;

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

			// api get object by primary key
			GenotypeGetAPI.get({key: vm.results[vm.selectedIndex].genotypeKey}, function(data) {
				vm.apiDomain = data;
				selectAllelePair(0);

				// create new rows
                        	for(var i=0;i<2; i++) {
                                	addAllelePairRow();
                        	}

				addImagePaneRow();
				addDataSetRow();

				if (vm.apiDomain.allelePairs[0].processStatus != "c") {
					getDataSets();
				}
				if (vm.apiDomain.generalNote == null)  {
					addNote(vm.apiDomain.generalNote, "General");
				}
				if (vm.apiDomain.privateCuratorialNote == null)  {
					addNote(vm.apiDomain.privateCuratorialNote, "Private Curatorial");
				}

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: GenotypeGetAPI.get");
			});
		}	
		
		// when an annot is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove from search results
			removeSearchResultsItem(vm.apiDomain.genotypeKey);

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
			console.log("removeSearchResultsItem: " + keyToRemove);
			
			// first find the item to remove
			var removeIndex = -1;
			for(var i=0;i<vm.results.length; i++) {
				if (vm.results[i].genotypeKey == keyToRemove) {
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
			input.focus(document.getElementById("strain"));
		}

		/////////////////////////////////////////////////////////////////////
		// validating
		/////////////////////////////////////////////////////////////////////		
		
		function validateAllele1(row, index, id) {
			console.log("validateAllele1 = " + id + index);

			id = id + index;

			if (row.alleleSymbol1 == "") {
				row.alleleKey1 = "";
				row.alleleSymbol1 = "";
				return;
			}

			if (row.alleleSymbol1.includes("%")) {
				return;
			}

			// params if used for the validation search only
			var params = {};
			params.symbol = row.alleleSymbol1;
			console.log(params);
			
			ValidateAlleleAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Allele Symbol: " + row.alleleSymbol1);
					document.getElementById(id).focus();
					row.alleleKey1 = "";
					row.alleleSymbol1 = "";
				} else {
					row.alleleKey1 = data[0].alleleKey;
					row.alleleSymbol1 = data[0].symbol;
					row.markerKey = data[0].markerKey; 
					row.markerSymbol = data[0].markerSymbol;
					row.markerChromosome = data[0].chromosome;
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateAlleleAPI.search");
				document.getElementById(id).focus();
				row.alleleKey1 = "";
				row.alleleSymbol1 = "";
			});
		}

		function validateAllele2(row, index, id) {
			console.log("validateAllele2 = " + id + index);

			id = id + index;

			if (row.alleleSymbol2 == "") {
				row.alleleKey2 = "";
				row.alleleSymbol2 = "";
				return;
			}

			if (row.alleleSymbol2.includes("%")) {
				return;
			}

			// params if used for the validation search only
			var params = {};
			params.symbol = row.alleleSymbol2;
			console.log(params);
			
			ValidateAlleleAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Allele Symbol: " + row.alleleSymbol2);
					document.getElementById(id).focus();
					row.alleleKey2 = "";
					row.alleleSymbol2 = "";
				} else {
					row.alleleKey2 = data[0].alleleKey;
					row.alleleSymbol2 = data[0].symbol;
					row.markerSymbol = data[0].markerSymbol;
					row.markerChromosome = data[0].chromosome;
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateAlleleAPI.search");
				document.getElementById(id).focus();
				row.alleleKey2 = "";
				row.alleleSymbol2 = "";
			});
		}

		function validateImagePaneByMgiID(row, index, id) {
			console.log("validateImagePaneByMgiID = " + id + index);

			id = id + index;
			
			if (row.mgiID == undefined || row.mgiID == "") {
				row.imagePaneKey = "";
				row.mgiID = "";
				return;
			}

			if (row.mgiID.includes("%")) {
				return;
			}

			var params = {};
			params.mgiID = row.mgiID;
			validateImagePane(row, id, params);
		}

		function validateImagePaneByPixID(row, index, id) {
			console.log("validateImagePaneByPixID = " + id + index);

			id = id + index;
			
			if (row.pixID == undefined || row.pixID == "") {
				row.imagePaneKey = "";
				row.pixID = "";
				return;
			}

			if (row.pixID.includes("%")) {
				return;
			}

			var params = {};
			params.pixID = row.pixID;
			validateImagePane(row, id, params);
		}

		function validateImagePane(row, id, params) {
			console.log("validateImagePane");
			console.log(params);

			ValidateImagePaneAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Image Pane: " + row.mgiID + " " + row.pixID);
					document.getElementById(id).focus();
					row.imagePaneKey = "";
					row.figureLabel = "";
					row.imageClass = "";
					row.mgiID = "";
					row.pixID = "";
				} else {
					row.imagePaneKey = data[0].imagePaneKey;
					row.figureLabel = data[0].figureLabel;
					row.imageClass = data[0].imageClass;
					row.mgiID = data[0].mgiID;
					row.pixID = data[0].pixID;
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateImagePaneAPI.query");
				document.getElementById(id).focus();
				row.imagePaneKey = "";
				row.figureLabel = "";
				row.imageClass = "";
				row.mgiID = "";
				row.pixID = "";
			});
		}

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

			ValidateMarkerOfficialStatusAPI.query({symbol: row.markerSymbol}, function(data) {
				if (data.length == 0) {
					alert("Invalid Marker Symbol: " + row.markerSymbol);
					document.getElementById(id).focus();
					row.markerKey = "";
					row.markerSymbol = "";
					row.markerChromosome = "";
				} else {
					row.markerKey = data[0].markerKey;
					row.markerSymbol = data[0].symbol;
					row.markerChromosome = data[0].chromosome;
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateMarkerOfficialStatusAPI.query");
				document.getElementById(id).focus();
				row.markerKey = "";
				row.markerSymbol = "";
				row.markerChromosome = "";
			});
		}

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

			ValidateJnumAPI.query({jnum: row.jnumid}, function(data) {
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

		// validate strain
		function validateStrain(id) {
			console.log("validateStrain()");

			if (vm.apiDomain.strain == undefined || vm.apiDomain.strain == "") {
				return;
			}

                        if (vm.apiDomain.strain.includes("%")) {
                                return;
                        }

			ValidateStrainAPI.search({strain: vm.apiDomain.strain}, function(data) {
				if (data.length == 0) {
					createStrain();
				} else {
					if (data[0].isPrivate == "1") {
						alert("This value is designated as 'private' and cannot be used: " + vm.apiDomain.strain);
						vm.apiDomain.strainKey = "";
						vm.apiDomain.strain = "";
						document.getElementById(id).focus();
					}
					else {
						vm.apiDomain.strainKey = data[0].strainKey;
						vm.apiDomain.strain = data[0].strain;
					}
				}

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateStrainAPI.search");
				document.getElementById(id).focus();
			});
		}

		// create strain
		function createStrain(newstrain) {
			console.log("createStrain");
			
			var newstrain = {};
			newstrain.strain = vm.apiDomain.strain;

			// process new strain if user responds OK
			if ($window.confirm("The item: \n\n'" + newstrain.strain + "' \n\ndoes not exist in the database.\n\nDo you want the ADD this item?")) {
				newstrain.speciesKey = "481207";
				newstrain.strainTypeKey = "3410535";
				newstrain.standard = "0";
				newstrain.isPrivate = "0";
				newstrain.geneticBackground = "0";
				//console.log(newstrain);

				GenotypeCreateStrainAPI.create(newstrain, function(data) {
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
						vm.apiDomain.strainKey = "";
						vm.apiDomain.strain = "";
						document.getElementById("strain").focus();
					} else {
						console.log("ran GenotypeCreateStrainAPI.create");
						vm.apiDomain.strainKey = data.items[0].strainKey;
						vm.apiDomain.accID = data.items[0].accID;
					}
				}, function(err) {
					pageScope.handleError(vm, "API ERROR: GenotypeCreateStrainAPI.create");
				});
			}
			else {
				vm.apiDomain.strainKey = "";
				vm.apiDomain.strain = "";
				document.getElementById("strain").focus();
			}
		}

		function validateMutantCellLine1(row, index, id) {
			console.log("validateMutantCellLine1 = " + id + index);

			id = id + index;

			if (row.cellLine1 == undefined || row.cellLine1 == "") {
				vm.apiDomain.allelePairs[index].cellLineKey1 = "";
				vm.apiDomain.allelePairs[index].cellLine1 = "";
				return;
			}

			if (row.cellLine1.includes("%")) {
				vm.apiDomain.allelePairs[index].cellLineKey1 = "";
				return;
			}

			ValidateMutantCellLinesAPI.validate(vm.apiDomain.allelePairs[index], function(data) {
				if (data.error != null) {
					alert(data.error);
					vm.apiDomain.allelePairs[index].cellLineKey1 = "";
					vm.apiDomain.allelePairs[index].cellLine1 = "";
				} else {
					vm.apiDomain.allelePairs[index].cellLineKey1 = data.items[0].cellLineKey1;
					vm.apiDomain.allelePairs[index].cellLine1 = data.items[0].cellLine1;
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateMutantCellLinesAPI.validate");
				vm.apiDomain.allelePairs[index].cellLineKey1 = "";
				vm.apiDomain.allelePairs[index].cellLine1 = "";
			});
		}

		function validateMutantCellLine2(row, index, id) {
			console.log("validateMutantCellLine2 = " + id + index);

			id = id + index;

			if (row.cellLine2 == undefined || row.cellLine2 == "") {
				vm.apiDomain.allelePairs[index].cellLineKey2 = "";
				vm.apiDomain.allelePairs[index].cellLine2 = "";
				return;
			}

			if (row.cellLine2.includes("%")) {
				vm.apiDomain.allelePairs[index].cellLineKey2 = "";
				return;
			}

			ValidateMutantCellLinesAPI.validate(vm.apiDomain.allelePairs[index], function(data) {
				if (data.error != null) {
					alert(data.error);
					vm.apiDomain.allelePairs[index].cellLineKey2 = "";
					vm.apiDomain.allelePairs[index].cellLine2 = "";
				} else {
					vm.apiDomain.allelePairs[index].cellLineKey2 = data.items[0].cellLineKey2;
					vm.apiDomain.allelePairs[index].cellLine2 = data.items[0].cellLine2;
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateMutantCellLinesAPI.validate");
				vm.apiDomain.allelePairs[index].cellLineKey2 = "";
				vm.apiDomain.allelePairs[index].cellLine2 = "";
			});
		}

		/////////////////////////////////////////////////////////////////////
		// allele pairs
		/////////////////////////////////////////////////////////////////////		
		
		// set current row
		function selectAllelePair(index) {
			console.log("selectAllelePair: " + index);
			vm.selectedAllelePairIndex = index;
		}

		//
		// change of row/field detected
		//
		
		// if current row has changed
		function changeAllelePairRow(index) {
			console.log("changeAllelePairRow: " + index);

			vm.selectedAllelePairIndex = index;

			if (vm.apiDomain.allelePairs[index] == null) {
				vm.selectedAllelePairIndex = 0;
				return;
			}

			if (vm.apiDomain.allelePairs[index].alleleKey1 == ""
				|| vm.apiDomain.allelePairs[index].markerKey == ""
				|| vm.apiDomain.allelePairs[index].pairStateKey == ""
				|| vm.apiDomain.allelePairs[index].compoundKey == "") {
				return;
			}

			if (vm.apiDomain.allelePairs[index].processStatus == "x") {
				vm.apiDomain.allelePairs[index].processStatus = "u";
			};
		}

		// add new allele pair row
		function addAllelePairRow() {

			if (vm.apiDomain.allelePairs == undefined) {
				vm.apiDomain.allelePairs = [];
			}

			var i = vm.apiDomain.allelePairs.length;

			vm.apiDomain.allelePairs[i] = {
				"processStatus": "c",
				"genotypeKey": vm.apiDomain.genotypeKey,
				"allelePairKey": "",
				"alleleKey1": "",
				"alleleSymbol1": "",
				"alleleKey2": "",
				"alleleSymbol2": "",
				"markerKey": "",
				"markerSymbol": "",
				"markerChromosome": "",
				"sequenceNum": i + 1,
				"pairStateKey": "",
				"compoundKey": "",
				"cellLineKey1": "",
				"cellLine1": "",
				"cellLineKey2": "",
				"cellLine2": "",
				"createdBy": "",
				"creation_date": "",
				"modifiedBy": "",
				"modification_date": ""
			}
		}		

		/////////////////////////////////////////////////////////////////////
		// image panes
		/////////////////////////////////////////////////////////////////////		
		
		// set current row
		function selectImagePane(index) {
			console.log("selectImagePane: " + index);
			vm.selectedImagePaneIndex = index;
		}

		// if current row has changed
		function changeImagePaneRow(index) {
			console.log("changeImagePaneRow: " + index);

			vm.selectedImagePaneIndex = index;

			if (vm.apiDomain.imagePaneAssocs[index] == null) {
				vm.selectedImagePaneIndex = 0;
				return;
			}

			if (vm.apiDomain.imagePaneAssocs[index].processStatus == "x") {
				vm.apiDomain.imagePaneAssocs[index].processStatus = "u";
			};
		}

		// add new image pane row
		function addImagePaneRow() {

			if (vm.apiDomain.imagePaneAssocs == undefined) {
				vm.apiDomain.imagePaneAssocs = [];
			}

			var i = vm.apiDomain.imagePaneAssocs.length;

                        vm.apiDomain.imagePaneAssocs[i] = {
                                "processStatus": "c",
      				"assocKey": "",
      				"imagePaneKey": "",
      				"mgiTypeKey": "12",
      				"objectKey": vm.apiDomain.genotypeKey,
      				"isPrimary": "",
      				"figureLabel": "",
      				"imageClass": "",
      				"mgiID": "",
      				"pixID": ""
    			}
		}		

		/////////////////////////////////////////////////////////////////////
		// notes
		/////////////////////////////////////////////////////////////////////		
		
		// add new note row
		function addNote(note, noteType) {
			console.log("addNote:" + note);

			if (note != undefined) { return; }

			var noteTypeKey = "";

			if (noteType == "General") {
				noteTypeKey = "1027";
			}
			if (noteType == "Private Curatorial") {
				noteTypeKey = "1028";
			}

			note = {
				"noteKey": "",
				"objectKey": vm.apiDomain.markerKey,
				"mgiTypeKey": "12",
				"noteTypeKey": noteTypeKey,
				"noteChunk": ""
			}

			if (noteType == "General") {
				vm.apiDomain.generalNote = note;
			}
			if (noteType == "Private Curatorial") {
				vm.apiDomain.privateCuratorialNote = note;
			}
		}

		function addNotes() {
			//console.log("addNotes");

			addNote(vm.apiDomain.generalNote, "General");
			addNote(vm.apiDomain.privateCuratorialNote, "Private Curatorial");
		}

		/////////////////////////////////////////////////////////////////////
		// data sets
		/////////////////////////////////////////////////////////////////////		
		
		// add new data sets row
		function addDataSetRow() {

			vm.dataSets = [];

                        vm.dataSets[0] = {
      				"refsKey": "",
      				"jnumid": ""
      				//"short_citation": ""
    			}
		}		

		// get data sets by genotype key
		function getDataSets() {
			console.log("getDataSets: " + vm.apiDomain.genotypeKey);

			pageScope.loadingStart();
			GenotypeGetDataSetsAPI.query({key: vm.apiDomain.genotypeKey}, function(data) {
				vm.dataSets = data;
				pageScope.loadingEnd();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: GenotypeGetDataSetsAPI.query");
				pageScope.loadingEnd();
			});
		}	
		
		/////////////////////////////////////////////////////////////////////
		// clipboard
		/////////////////////////////////////////////////////////////////////		
	
		// reset clipboard
		function resetClipboard() {
			console.log("resetClipboard()");
			vm.clipboardDomain = {};
			vm.clipboardDomain.clipboard = [];
		}

		// selected clipboard row
		function selectClipboard(index) {
			console.log("selectClipboard(): " + index);
			vm.selectedClipboardIndex = index;
		}		

		// add current object to clipboard
		function addClipboard() {
			console.log("addClipboard()");

			if(vm.results.length == 0) return;

			var newItem = {
			       	"itemKey": vm.apiDomain.genotypeKey,
			       	"item": vm.results[vm.selectedIndex].genotypeDisplay
				}

			vm.clipboardDomain.clipboard.push(newItem);

			//MGISetMemberCreateAPI.create(vm.clipboardDomain, function(data) {
			//	if (data.error != null) {
			//		alert("ERROR: " + data.error + " - " + data.message);
					//loadClipboard();
			//	}
			//	else {
			//		vm.clipboardDomain.clipboard = data.items[0];
                			//vm.selectedIndex = vm.results.length;
					//loadClipboard();
			//	}
			//	pageScope.loadingEnd();
			//}, function(err) {
			//	pageScope.handleError(vm, "API ERROR: MGISetMemberCreateAPI.create");
			//	pageScope.loadingEnd();
			//});
		}
		
		// delete one clipboard item
		function deleteClipboard(row) {
			console.log("deleteClipboard(): " + row);
			vm.clipboardDomain.clipboard.splice(row,1)
		}
		
		// clear all clipboard items
		function clearClipboard() {
			console.log("clearClipboard()");
			resetClipboard();
		}
		
		// sort all clipboard items
		function sortClipboard() {
			console.log("sortClipboard()");
			vm.clipboardDomain.clipboard.sort();
		}

		// link out to mpannot using clipboard keys
                function mpannotLink() {
			console.log("mpannotLink: " + vm.clipboardDomain.clipboard.length);

			if (vm.clipboardDomain.clipboard.length == 0) {
				alert("The Genotype Clipboard is empty.\n");
				return;
			}

                        var mpannotUrl = pageScope.PWI_BASE_URL + "edit/mpannot/?searchKeys=";

			var params = [];
			for(var i=0;i<vm.clipboardDomain.clipboard.length; i++) {
				params.push(vm.clipboardDomain.clipboard[i].itemKey)
			}

			console.log(params);
			mpannotUrl = mpannotUrl + params.join(",");
			console.log(mpannotUrl);

                        window.open(mpannotUrl, '_blank');
                }

		// link out to doannot using clipboard keys
                function doannotLink() {
			console.log("doannotLink: " + vm.clipboard.length);

			if (vm.clipboardDomain.clipboard.length == 0) {
				alert("The Genotype Clipboard is empty.\n");
				return;
			}

                        var doannotUrl = pageScope.PWI_BASE_URL + "edit/doannot/?searchKeys=";

			var params = [];
			for(var i=0;i<vm.clipboardDomain.clipboard.length; i++) {
				params.push(vm.clipboardDomain.clipboard[i].itemKey)
			}

			console.log(params);
			doannotUrl = doannotUrl + params.join(",");
			console.log(doannotUrl);

                        window.open(doannotUrl, '_blank');
                }

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
		$scope.searchAccId = searchAccId;
		$scope.clear = clear;
		$scope.create = createGenotype;
		$scope.modify = modifyGenotype;
		$scope.delete = deleteGenotype;
		$scope.changeAllelePairRow = changeAllelePairRow;
		$scope.changeImagePaneRow = changeImagePaneRow;
		$scope.addAllelePairRow = addAllelePairRow;
		$scope.selectAllelePair = selectAllelePair;
		$scope.addImagePaneRow = addImagePaneRow;

		// Data Sets
		$scope.getDataSets = getDataSets;

		// Validations
		$scope.validateAllele1 = validateAllele1;
		$scope.validateAllele2 = validateAllele2;
		$scope.validateImagePaneByMgiID = validateImagePaneByMgiID;
		$scope.validateImagePaneByPixID = validateImagePaneByPixID;
		$scope.validateMarker = validateMarker;
		$scope.validateJnum = validateJnum;
		$scope.validateStrain = validateStrain;
		$scope.validateMutantCellLine1 = validateMutantCellLine1;
		$scope.validateMutantCellLine2 = validateMutantCellLine2;

		// clipboard functions
                $scope.selectClipboard = selectClipboard;
                $scope.addClipboard = addClipboard;
                $scope.deleteClipboard = deleteClipboard;
                $scope.clearClipboard = clearClipboard;
                $scope.sortClipboard = sortClipboard;
                $scope.mpannotLink = mpannotLink;
                $scope.doannotLink = doannotLink;

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

		// other functions: buttons, onBlurs and onChanges
		$scope.selectResult = selectResult;
		
		// global shortcuts
		$scope.KclearAll = function() { $scope.clear(); $scope.$apply(); }
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

