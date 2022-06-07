(function() {
	'use strict';
        angular.module('pwi.gxd').controller('GxdIndexController', GxdIndexController);

	function GxdIndexController(
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
			GxdIndexSearchAPI,
			GxdIndexGetAPI,
			GxdIndexCreateAPI,
			GxdIndexUpdateAPI,
			GxdIndexDeleteAPI,
			GxdIndexTotalCountAPI,
			// global APIs
			ValidateMarkerAPI,
			ValidateJnumAPI,
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
                vm.attachNote = "";
		
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			resetData();
			refreshTotalCount();
			loadVocabs();

                        setTimeout(function(){
		                initializeIndexStageCells();
                        }, 500);

                        setTimeout(function(){
                                addScrollBarToGrid();
                                slideGridToRight();
                        }, 1000);
		}

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        	// mapped to 'Clear' button; called from init();  resets page
		function clear() {		
			resetData();
                        refreshTotalCount();
		        clearIndexStageCells();
			//setFocus();
		}		

		// mapped to query 'Search' button
		// default is to select first result
		function search() {				
			console.log(vm.apiDomain);
		
			pageScope.loadingStart();
			
			GxdIndexSearchAPI.search(vm.apiDomain, function(data) {
				vm.results = data;
				vm.selectedIndex = 0;
				if (vm.results.length > 0) {
					loadObject();
				}
				pageScope.loadingEnd();
				setFocus();

			}, function(err) { // server exception
				pageScope.handleError(vm, "API ERROR: GxdIndexSearchAPI.search");
				pageScope.loadingEnd();
				setFocus();
			});
		}		

        	// mapped to 'Delete' button
		function deleteGxdIndex() {
			console.log("deleteGxdIndex() -> GxdIndexDeleteAPI()");

			if ($window.confirm("Are you sure you want to delete this record?")) {
			
				pageScope.loadingStart();

				GxdIndexDeleteAPI.delete({key: vm.apiDomain.indexKey}, function(data) {
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
					pageScope.handleError(vm, "API ERROR: GxdIndexDeleteAPI.delete");
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
			console.log("selectResults: " + index);

			if (index == vm.selectedIndex) {
				deselectObject();
			}
			else {
				vm.apiDomain = {};
				vm.selectedIndex = index;
				loadObject();
				//setFocus();
			}
		}		

 		// Deselect current item from the searchResults.
 		function deselectObject() {
			console.log("deselectObject()");
			var newObject = angular.copy(vm.apiDomain);
                        vm.apiDomain = newObject;
			vm.selectedIndex = -1;
			resetDataDeselect();
                        displayIndexStageCells();
			//setFocus();
		}
	
		// refresh the total count
                function refreshTotalCount() {
                        GxdIndexTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

		/////////////////////////////////////////////////////////////////////
		// Add/Modify/Delete
		/////////////////////////////////////////////////////////////////////
		
        	// create
		function createGxdIndex() {
			console.log("createGxdIndex() -> GxdIndexCreateAPI()");

			// check if record selected
			if(vm.selectedIndex > 0) {
				alert("Cannot Add if a record is already selected.");
				return;
			}

			pageScope.loadingStart();

			GxdIndexCreateAPI.create(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
					loadObject();
				}
				else {
					vm.apiDomain = data.items[0];
                			vm.selectedIndex = vm.results.length;
					vm.results[vm.selectedIndex] = [];
					vm.results[vm.selectedIndex].indexKey = vm.apiDomain.indexKey;
					loadObject();
					refreshTotalCount();
				}
				pageScope.loadingEnd();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: GxdIndexCreateAPI.create");
				pageScope.loadingEnd();
			});
		}		

        	// modify
		function modifyGxdIndex() {
			console.log("modifyGxdIndex() -> GxdIndexUpdateAPI()");

			// check if record selected
			if(vm.selectedIndex < 0) {
				alert("Cannot modify if a record is not selected.");
				return;
			}
			
			GxdIndexUpdateAPI.update(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
					loadObject();
				}
				else {
					loadObject();
				}
				pageScope.loadingEnd();
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: GxdIndexUpdateAPI.update");
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
			vm.total_count = 0;
                        vm.attachNote = "";

                	vm.hideErrorContents = true;

                        resetIndex();
		}

		// reset index
		function resetIndex() {
			vm.apiDomain = {};
			vm.apiDomain.indexKey = "";	
			vm.apiDomain.refsKey = "";	
                        vm.apiDomain.markerKey = "";
                        vm.apiDomain.markerSymbol = "";
                        vm.apiDomain.refsKey = "";
                        vm.apiDomain.jnumid = "";
                        vm.apiDomain.jnum = "";
                        vm.apiDomain.short_citation = "";
                        vm.apiDomain.comments = "";
                        vm.apiDomain.priorityKey = "";
                        vm.apiDomain.priority = "";
                        vm.apiDomain.conditionalMutantsKey = "";
                        vm.apiDomain.conditionalMutants = "";
                }

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");
			resetIndex();
                        clearIndexStage();
		}

                // link out to image summary
		function refLink() {
        	FindElement.byId("jnumID").then(function(element){
    			var refUrl = pageScope.PWI_BASE_URL + "summary/gxdindex?refs_id=" + element.value;
    			window.open(refUrl, '_blank');
        	});
		}

		// load vocabularies
                function loadVocabs() {
                        console.log("loadVocabs()");

			vm.priorityLookup = {};
			VocTermSearchAPI.search({"vocabKey":"11"}, function(data) {vm.priorityLookup = data.items[0].terms});;

			vm.conditionalLookup = {};
			VocTermSearchAPI.search({"vocabKey":"74"}, function(data) {vm.conditionalLookup = data.items[0].terms});;

                        vm.yesnoLookup = [];
                        vm.yesnoLookup[0] = { "termKey": "1", "term": "Yes" }
                        vm.yesnoLookup[1] = { "termKey": "0", "term": "No" }

			vm.noteLookup = [
			    { term:"Activated", note: "The antibody used recognizes the activated form of the protein." },
			    { term:"Cleaved", note: "The antibody used recognizes the cleaved form of the protein." },
			    { term:"Phosphorylated", note: "The antibody used recognizes the phosphorylated form of the protein." },
			    { term:"Ab/probe spec.", note: "The specificity of the antibody/probe used was not detailed; both/all family members have been annotated." },
			    { term:"Ab/probe spec. MGI ID", note: "The antibody/probe specificity was not detailed and may recognize a related gene; (MGI:) has also been annotated." },
			    { term:"microRNA", note: "The mature microRNA is encoded at multiple sites in the genome." },
			    { term:"Supplementary", note: "Results are in the supplementary material." },
			    { term:"Section or WM", note: "Reference does not indicate whether specimen is a section or whole mount." },
			    { term:"Range", note: "Authors state that expression was examined on dpc *-*; not all stages are detailed." },
			    { term:"Primer spec", note: "Primer specificity was not detailed and may amplify a related gene; several/all family members have been annotated." },
			    { term:"Primer spec MGI ID", note: "Primer specificity was not detailed and may amplify a related gene; (MGI:) has also been annotated." },
			    { term:"Immunoprecipitated", note: "The protein was immunoprecipitated prior to Western blotting." },
			    { term:"Dot Blot", note: "Northern data was obtained from a dot blot." },
			    { term:"Enzymatic act", note: "Enzymatic activity was used to detect gene expression." },
			    { term:"Discrepancies", note: "There are discrepancies between the term and the figure legend as to the age of the tissue/embryo." },
			    { term:"Fractionated", note: "The material used in the Western blot was fractionated."}
			];

			vm.indexassayLookup = {};
			VocTermSearchAPI.search({"name":"GXD Index Assay"}, function(data) {vm.indexassayLookup = data.items[0].terms});;

                        vm.stageidLookup = {};
			VocTermSearchAPI.search({"name":"GXD Index Stages"}, function(data) {vm.stageidLookup = data.items[0].terms;});;
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

			console.log("loadObject(): " + vm.results[vm.selectedIndex].indexKey);

			GxdIndexGetAPI.get({key: vm.results[vm.selectedIndex].indexKey}, function(data) {
				vm.apiDomain = data;
				// create new rows
                        	//for(var i=0;i<2; i++) {
                                	//addIndexStageRow();
                        	//}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: GxdIndexGetAPI.get");
			});
		}	
		
		// when an annot is deleted, remove it from the results
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove from search results
			removeSearchResultsItem(vm.apiDomain.indexKey);

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
				if (vm.results[i].indexKey == keyToRemove) {
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

                /* Adds scroll bar to top of grid; slide right/left */
                function addScrollBarToGrid() { FindElement.byId("indexGridOverflow").then(function(element){ $(element).doubleScroll(); }); }
                function slideGridToRight() { FindElement.byId("indexGridOverflow").then(function(element){ element.scrollLeft += 1000; }); }
                function slideGridToLeft() { FindElement.byId("indexGridOverflow").then(function(element){ element.scrollLeft -= 1000; }); }

		/////////////////////////////////////////////////////////////////////
		// validating
		/////////////////////////////////////////////////////////////////////		
		
		function validateMarker(id) {
			console.log("validateMarker():" + id);

			if (vm.apiDomain.markerSymbol == undefined || vm.apiDomain.markerSymbol == "") {
				vm.apiDomain.markerKey = "";
				vm.apiDomain.markerSymbol = "";
				vm.apiDomain.markerChromosome = "";
				vm.apiDomain.markerAccID = "";
				return;
			}

			if (vm.apiDomain.markerSymbol.includes("%")) {
				return;
			}

			var params = {};
                        if (vm.apiDomain.markerAccID != undefined && vm.apiDomain.markerAccID != "") {
			        params.symbol = "";
			        params.chromosome = "";
			        params.accID = vm.apiDomain.markerAccID;;
                        } else if (vm.apiDomain.markerSymbol != undefined && vm.apiDomain.markerSymbol != "") {
			        params.symbol = vm.apiDomain.markerSymbol;
			        params.chromosome = vm.apiDomain.markerChromosome;
			        params.accID = "";
                        }
                        
			ValidateMarkerAPI.search(params, function(data) {
				if (data.length == 0) {
					alert("Invalid Marker Symbol: " + vm.apiDomain.markerSymbol);
					document.getElementById(id).focus();
					vm.apiDomain.markerKey = "";
					vm.apiDomain.markerSymbol = "";
					vm.apiDomain.markerChromosome = "";
				        vm.apiDomain.markerAccID = "";
				} else if (data.length > 1) {
					alert("This marker requires a Chr.\nSelect a Chr, then Marker, and try again:\n\n" + vm.apiDomain.markerSymbol);
					document.getElementById(id).focus();
					vm.apiDomain.markerKey = "";
					vm.apiDomain.markerSymbol = "";
					vm.apiDomain.markerChromosome = "";
				        vm.apiDomain.markerAccID = "";
				} else {
					console.log(data);
					vm.apiDomain.markerKey = data[0].markerKey;
					vm.apiDomain.markerSymbol = data[0].symbol;
					vm.apiDomain.markerChromosome = data[0].chromosome;
				        vm.apiDomain.markerAccID = data[0].accID;
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateMarkerAPI.search");
				document.getElementById(id).focus();
				vm.apiDomain.markerKey = "";
				vm.apiDomain.markerSymbol = "";
				vm.apiDomain.markerChromosome = "";
				vm.apiDomain.markerAccID = "";
			});
		}

        	// validate jnum
		function validateJnum(id) {		
			console.log("validateJnum():" + id);

			if (vm.apiDomain.jnumid == undefined || vm.apiDomain.jnumid == "") {
				vm.apiDomain.refsKey = "";
				vm.apiDomain.jnumid = "";
				vm.apiDomain.jnum = null;
				vm.apiDomain.short_citation = "";
				return;
			}

                        if (vm.apiDomain.jnumid.includes("%")) {
                                return;
                        }

			ValidateJnumAPI.query({jnum: vm.apiDomain.jnumid}, function(data) {
				if (data.length == 0) {
					alert("Invalid Reference: " + vm.apiDomain.jnumid);
					document.getElementById(id).focus();
					vm.apiDomain.refsKey = "";
					vm.apiDomain.jnumid = "";
					vm.apiDomain.jnum = null;
					vm.apiDomain.short_citation = "";
				} else {
					vm.apiDomain.refsKey = data[0].refsKey;
					vm.apiDomain.jnumid = data[0].jnumid;
					vm.apiDomain.jnum = parseInt(data[0].jnum, 10);
					vm.apiDomain.short_citation = data[0].short_citation;
				}

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ValidateJnumAPI.query");
				document.getElementById(id).focus();
				vm.apiDomain.refsKey = "";
                                vm.apiDomain.jnumid = ""; 
                                vm.apiDomain.jnum = null; 
				vm.apiDomain.short_citation = "";
			});
		}		

		/////////////////////////////////////////////////////////////////////
		// note
		/////////////////////////////////////////////////////////////////////		
                
                // clear comments
                function clearComments() {
                        vm.apiDomain.comments = "";
                }

		// attach to note
		function attachNote(note) {
			console.log("attachNote()");

                        if (vm.apiDomain.comments == null || vm.apiDomain.comments == "") {
                                if (note == null) {
			                vm.apiDomain.comments = vm.attachNote;
                                }
                                else {
			                vm.apiDomain.comments = note;
                                }
                        }
                        else {
                                if (note == null) {
			                vm.apiDomain.comments = vm.apiDomain.comments + " " + vm.attachNote;
                                }
                                else {
			                vm.apiDomain.comments = vm.apiDomain.comments + " " + note;
                                }
                        }
		}

		/////////////////////////////////////////////////////////////////////
		// index stages
		/////////////////////////////////////////////////////////////////////		
		
		// if current row has changed
		function toggleCell(cell) {
                        console.log("toggleCell():" + cell);

                        // if cell already exists, then set to delete ("d")
			if (cell.processStatus == "x") {
				cell.processStatus = "d";
			}
                        // if cell was set to delete, then set back to do nothing ("x")
			else if (cell.processStatus == "d") {
				cell.processStatus = "x";
			}
			else if (cell.processStatus == "c" && cell.indexKey == "") {
				cell.indexKey = vm.apiDomain.indexKey;
			}
			else if (cell.processStatus == "c" && cell.indexKey != "") {
				cell.indexKey = "";
			}

			loadIndexStageCells();
		}
		
		/*
		 * 
		 * Create dummy cells to represent the index stage table
		 * Order mirrors the indexassay_choices and priority_choices
		 *    term lists
		 */
		function initializeIndexStageCells() {
                        console.log("initializeIndexStageCells()");

			vm.indexStageCells = [];
			
			for(var i=0; i<vm.indexassayLookup.length; i++) {
				var newRow = [];
				vm.indexStageCells.push(newRow)
				for (var j=0; j<vm.stageidLookup.length; j++) {
					var newCell = { 
			                        processStatus : "c",
			                        indexStageKey : "",
			                        indexKey : "",
						stageidKey: vm.stageidLookup[j].termKey,
						indexassayKey: vm.indexassayLookup[i].termKey
					};
					newRow.push(newCell);
				}
			}
		}
		
		/*
		 * Pushes model to the display grid
		 */
		function displayIndexStageCells() {
                        console.log("displayIndexStageCells()");
			clearIndexStageCells();
			for( var i=0; i<vm.apiDomain.indexStages.length; i++) {
				setIndexStageCell(vm.apiDomain.indexStages[i]);
			}
		}
		
		function setIndexStageCell(indexstage) {
                        console.log("setIndexStageCell()");

			for (var i=0; i<vm.indexStageCells.length; i++) {
				var row = vm.indexStageCells[i];
				for (var j=0; j<row.length; j++) {
					if (row[j].stageidKey == indexstage.stageidKey && row[j].indexassayKey == indexstage.indexassayKey) {
						row[j].processStatus = indexstage.processStatus;
						row[j].indexStageKey = indexstage.indexStageKey;
						row[j].indexKey = indexstage.indexKey;
					}
				}
			}
		}
		
		/*
		 * Pulls display grid cells back into the model
		 */
		function loadIndexStageCells() {
                        console.log("loadIndexStageCells()");
			
			var newIndexStages = [];
			
			for (var i=0; i<vm.indexStageCells.length; i++) {
				var row = vm.indexStageCells[i];
				for (var j=0; j<row.length; j++) {
					var cell = row[j];
					if (cell.processStatus) {
						newIndexStages.push({
			                                processStatus : cell.processStatus,
			                                indexStageKey : cell.indexStageKey,
			                                indexKey : vm.apiDomain.indexKey,
							stageidKey : cell.stageidKey,
							indexassayKey : cell.indexassayKey
						});
					}
				}
			}
			
			vm.apiDomain.indexStages = newIndexStages;
		}
		
		function clearIndexStageCells() {
                        console.log("clearIndexStageCells()");

			for (var i=0; i<vm.indexStageCells.length; i++) {
				var row = vm.indexStageCells[i];
				for (var j=0; j<row.length; j++) {
					row[j].processStatus = "x";
				}
			}
		}

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
		$scope.clear = clear;
		$scope.create = createGxdIndex;
		$scope.modify = modifyGxdIndex;
		$scope.delete = deleteGxdIndex;

		// Validations
		$scope.validateMarker = validateMarker;
		$scope.validateJnum = validateJnum;

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

		// other functions: buttons, onBlurs and onChanges
		$scope.selectResult = selectResult;
		$scope.clearComments = clearComments;
		$scope.attachNote = attachNote;
		$scope.refLink = refLink;

		// stage grid
                $scope.toggleCell = toggleCell;
                $scope.slideGridToRight = slideGridToRight;
                $scope.slideGridToLeft = slideGridToLeft;
		
		// global shortcuts
		$scope.KclearAll = function() { $scope.clear(); $scope.$apply(); }
		$scope.Ksearch = function() { $scope.search(); $scope.$apply(); }
		$scope.Kfirst = function() { $scope.firstSummaryObject(); $scope.$apply(); }
		$scope.Knext = function() { $scope.nextSummaryObject(); $scope.$apply(); }
		$scope.Kprev = function() { $scope.prevSummaryObject(); $scope.$apply(); }
		$scope.Klast = function() { $scope.lastSummaryObject(); $scope.$apply(); }
		$scope.Kadd = function() { $scope.create(); $scope.$apply(); }
		$scope.Kmodify = function() { $scope.modify(); $scope.$apply(); }
		$scope.Kdelete = function() { $scope.deleteGxdIndex(); $scope.$apply(); }

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

