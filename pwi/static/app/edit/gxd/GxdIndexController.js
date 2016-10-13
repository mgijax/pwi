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
			GxdIndexAPI, 
			GxdIndexCountAPI,
			GxdIndexSearchAPI,
			VocTermSearchAPI,
			MarkerValidatorService,
			ReferenceValidatorService
	) {
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {}
		// primary form model
		vm.selected = {
			// jnumid is readonly
			jnumid: '',
			_refs_key: null,
			// marker_symbol is readonly
			marker_symbol: '',
			_marker_key: null,
			_priority_key: null,
			_conditionalmutants_key: null,
			comments: null,
			// is_coded is readonly
			is_coded: null,
			// creation fields are all readonly
			createdby_login: null,
			creation_date: null,
			_createdby_key: null,
			modifiedby_login: null,
			modification_date: null,
			_modifiedby_key: null,
			indexstages: []
		};
		
		vm.searchResults = {
			items: [],
			total_count: 0
		}
		vm.indexStageCells = [[]];
		vm.markerSelections = [];
		vm.markerSelectIndex = 0;
		vm.total_count = null;
		vm.selectedIndex = 0;
		// mapping between _term_keys and terms (and vice-versa)
		vm.termMap = {};
		vm.loading = false;
		$scope.conditionalmutants_choices = [];
		$scope.indexassay_choices = [];
		$scope.priority_choices = [];
		$scope.stageid_choices = [];
		
		
		/*
		 * Initialize the page.
		 * 
		 * 	All items are asynchronous, but are roughly
		 * 		ordered by importance.
		 */
		function init() {
			
			loadVocabs();			

			refreshTotalCount();
			
			addShortcuts();
			
			scrollGridWrapper();
			
			Focus.onElementById('jnumid');
		}
		
		
        function scrollGridWrapper() {
                
                FindElement.byId("indexGridWrapper").then(function(element){
                        element.scrollLeft += 1000;
                });                     
                
        }

		
		/*
		 * TODO (kstone):
		 * Inject these and/or define in their own factory/service
		 */
		function addShortcuts() {
			
			// global shortcuts
			var globalShortcuts = Mousetrap($document[0].body);
			globalShortcuts.bind(['ctrl+shift+c'], clearAll);
			globalShortcuts.bind(['ctrl+shift+s'], search);
			globalShortcuts.bind(['ctrl+shift+m'], modifyItem);
			globalShortcuts.bind(['ctrl+shift+a'], addItem);
			globalShortcuts.bind(['ctrl+shift+d'], deleteItem);
			globalShortcuts.bind(['ctrl+shift+p'], prevItem);
			globalShortcuts.bind(['ctrl+shift+n'], nextItem);
			globalShortcuts.bind(['ctrl+shift+b'], lastItem);
		}
		
		// load the vocab choices
		function loadVocabs() {
			
			VocTermSearchAPI.get(
			  {vocab_name:'GXD Conditional Mutants'}, 
			  function(data) {
				$scope.conditionalmutants_choices = data.items;
				addChoicesToTermMap(data.items);
			});
			
			VocTermSearchAPI.get(
		      {vocab_name:'GXD Index Priority'}, 
			  function(data) {
				$scope.priority_choices = data.items;
				addChoicesToTermMap(data.items);
			});
			
			// capture both promises so we can build out indexStageMap when they are done
			var indexassayPromise = VocTermSearchAPI.get(
			  {vocab_name:'GXD Index Assay'},
			  function(data) {
				$scope.indexassay_choices = data.items;
				addChoicesToTermMap(data.items);
			}).$promise;
			
			var stageidPromise = VocTermSearchAPI.get(
			  {vocab_name:'GXD Index Stages'},
			  function(data) {
				$scope.stageid_choices = data.items;
				addChoicesToTermMap(data.items);
			}).$promise;
			
			// finish building indexStageMap after both responses come back
			$q.all([indexassayPromise, stageidPromise])
			.then(function(){
				initializeIndexStageCells();
			});
			
		}
		
		function addChoicesToTermMap(choices) {
			for (var i=0; i<choices.length; i++) {
				var choice = choices[i];
				vm.termMap[choice.term] = choice._term_key;
				vm.termMap[choice._term_key] = choice.term;
			}
		}
		
		function refreshTotalCount() {
			
			GxdIndexCountAPI.get(function(data){
				vm.total_count = data.total_count;
			});
		}
		
		

		function setSelected() {
			
			var selection = vm.searchResults.items[vm.selectedIndex];
			
			// perform query to select index record
			setLoading()
			GxdIndexAPI.get({key:selection._index_key}).$promise
			.then(function(data) {
				vm.selected = data;
				
				refreshSelectedDisplay();
				
				Focus.onElementById("marker_symbol");
				
			}, function(error){
				ErrorMessage.handleError(error);
			}).finally(function(){
				stopLoading();
			});
			
		}
		
		function refreshSelectedDisplay() {
			vm.selected.creation_date = $filter('mgiDate')(vm.selected.creation_date);
			vm.selected.modification_date = $filter('mgiDate')(vm.selected.modification_date);
			updateSearchResultsWithSelected();
			displayIndexStageCells();
		}
		
		
		/*
		 * Optional options
		 *  {
		 *    spinnerKey - "key of spinner to show/hide"
		 *  }
		 */
		function setLoading(options) {
			if (options == undefined) {
				options = {};
			}
			ErrorMessage.clear();
			vm.loading = true;
			var spinnerKey = options.spinnerKey || 'page-spinner';
			
			pageScope.usSpinnerService.spin(spinnerKey);
		}
		
		function stopLoading(options) {
			if (options == undefined) {
				options = {};
			}
			vm.loading = false;
			var spinnerKey = options.spinnerKey || 'page-spinner';
			
			pageScope.usSpinnerService.stop(spinnerKey);
		}

		function nextItem() {
			if(vm.searchResults.items.length == 0) return;
			vm.selectedIndex++;
			var totalItems = vm.searchResults.items.length - 1;
			if (vm.selectedIndex > totalItems) {
				vm.selectedIndex = totalItems;
			}
			setSelected();
			
			scrollToSelected();
		}

		function prevItem() {
			if(vm.searchResults.items.length == 0) return;
			vm.selectedIndex--;
			if (vm.selectedIndex < 0) {
				vm.selectedIndex = 0;
			}
			setSelected();
			
			scrollToSelected();
		}
		
		function lastItem() {
			if(vm.searchResults.items.length == 0) return;
			vm.selectedIndex = vm.searchResults.items.length - 1;
			setSelected();
			
			scrollToSelected();
		}
		
		function scrollToSelected() {
			$q.all([
			   FindElement.byId("resultsTableWrapper"),
			   FindElement.byQuery("#resultsTable .info")
			 ]).then(function(elements) {
				 var table = angular.element(elements[0]);
				 var selected = angular.element(elements[1]);
				 var offset = 30;
				 table.scrollToElement(selected, offset, 0);
			 });
		}

		function setItem(index) {
			if(index == vm.selectedIndex) {
				clearResultsSelection();
				deselectItem()
			}
			else {
				vm.selectedIndex = index;
				setSelected();
			}
		}
		
		/*
		 * Deselect current item from the searchResults.
		 *   Create a deep copy of the current vm.selected object
		 *   to separate it from the searchResults
		 */
		function deselectItem() {
			var newObject = angular.copy(vm.selected);
			
			vm.selected = newObject;

			// clear some data
			vm.selected._index_key = null;
			
			vm.selected.marker_symbol = "";
			vm.selected._marker_key = "";
			
			vm.selected.indexstages = [];
			
			// refresh index grid
			displayIndexStageCells();
			
			Focus.onElementById('marker_symbol');
		}
		
		function clearResultsSelection() {
			vm.selectedIndex = -1;
		}
		
		
		function addItem() {
			
			var promise = verifyInputs().then(function(){
				console.log("adding: " + vm.selected);
				
				setLoading();
				
				GxdIndexAPI.save(vm.selected).$promise
				.then(function(data) {
					vm.searchResults.items.push(data);
					vm.searchResults.total_count += 1;
	
	
					// clear form, but leave reference-related fields
					clearForm();
					vm.selected._refs_key = data._refs_key;
					vm.selected.short_citation = data.short_citation;
					
					vm.selected.jnumid = data.jnumid;
					
					vm.selected._priority_key = data._priority_key;
					vm.selected._conditionalmutants_key = data._conditionalmutants_key;
					Focus.onElementById('marker_symbol');
					
					clearResultsSelection();
					
					return data;
					
				}, function(error){
					ErrorMessage.handleError(error);
					throw error;
				}).finally(function(){
					stopLoading();
				}).then(function(data){
					checkIndexStages(data);
					
					refreshTotalCount();
				});
			});
			
			return promise;
		}
		
		function checkIndexStages(data) {
			if (!data.indexstages || data.indexstages.length == 0) {
				var errorMessage = 'No stages have been selected for this record';
				;
				var error = {
					error: 'Warning',
					message: errorMessage
				};
				ErrorMessage.notifyError(error);
			}
		}

		function modifyItem() {
			
			var promise = verifyInputs().then(function(){
				console.log("Saving: " + vm.selected);
				
				setLoading();
				
				GxdIndexAPI.update({key: vm.selected._index_key}, vm.selected).$promise
				.then(function(data) {
					vm.selected = data;
					updateSearchResultsWithSelected();
					refreshSelectedDisplay();
				}, function(error){
					ErrorMessage.handleError(error);
				}).finally(function(){
					stopLoading();
				}).then(function(){
					refreshTotalCount();
				});
			});
			
			return promise;
		}
		
		function updateSearchResultsWithSelected() {
			var items = vm.searchResults.items;
			
			// if selected is in the list, update the display data
			for(var i=0;i<items.length; i++) {
				if (items[i]._index_key == vm.selected._index_key) {
					items[i] = angular.copy(vm.selected);
				}
			}
			
		}
		
		function deleteItem() {
			console.log("deleting: " + vm.selected);
			if (!vm.selected._index_key) {

				$timeout(function(){
					var error = {
							error: 'Warning',
							message: "No record selected to delete"
						};
					ErrorMessage.notifyError(error);
					$scope.$apply();
				}, 0);
				return;
			}
			
			if ($window.confirm("Are you sure you want to delete this record?")) {
				setLoading();
				
				GxdIndexAPI.delete({key: vm.selected._index_key}).$promise
				.then(function(data) {
					
					removeSearchResultsItem(vm.selected._index_key);
					
					clearResultsSelection();
					
					clearForm();
				}, function(error){
					ErrorMessage.handleError(error);
				}).finally(function(){
					stopLoading();
				}).then(function(){
					refreshTotalCount();
				});
			}
		}
		
		function removeSearchResultsItem(_index_key) {
			
			var items = vm.searchResults.items;
			
			// first find the item to remove
			var removeIndex = -1;
			for(var i=0;i<items.length; i++) {
				if (items[i]._index_key == _index_key) {
					removeIndex = i;
				}
			}
			
			// if found, remove it
			if (removeIndex >= 0) {
				items.splice(removeIndex, 1);
				vm.searchResults.total_count -= 1;
			}
			
		}


		function clearAll() {
			clearForm();
			
			// also clear search results
			vm.searchResults.items = [];
			vm.searchResults.total_count = 0;
		}
		
		function clearForm() {
			console.log("Clearing Form:");
			vm.selected = {};
			clearIndexStageCells();
			ErrorMessage.clear();
			Focus.onElementById('jnumid');
		}
		
		/*
		 * Ensure all validator backed fields
		 * 	have been validated
		 */
		function verifyInputs() {
			// make sure marker is validated if needed
			var markerPromise = MarkerValidatorService.validateWithComponent();
			var referencePromise = ReferenceValidatorService.validateWithComponent();
			
			return $q.all([markerPromise, referencePromise]);
		}

		function search() {	

			var promise = verifyInputs().then(function(){
			
				setLoading();
				var searchPromise = GxdIndexSearchAPI.search(vm.selected).$promise
				.then(function(data) {
					//Everything went well
					vm.searchResults = data;
					console.log("Count: " + data.items.length);
					if(data.items.length > 0) {
						vm.selectedIndex = 0
						setSelected();
					}
				}, function(error){ 
					ErrorMessage.handleError(error);
				}).finally(function(){
					stopLoading();
				}).then(function(){
					refreshTotalCount();
				});
				
				return searchPromise;
			});
			
			return promise;
		}
		
		function clearAndFocus(id) {
			vm.selected[id] = null;
			Focus.onElementById(id);
		}

		
		/*
		 * Select handler after validating marker symbol
		 */
		function selectMarker(marker) {
			
			vm.loading = false;
			
			// the following error cases are treated only as warnings
			if (MarkerValidatorService.isHeritablePhenotypicMarker(marker)) {
				MarkerValidatorService.raiseHeritableMarkerWarning(marker);
			}
			else if (MarkerValidatorService.isQTLMarker(marker)) {
				MarkerValidatorService.raiseQTLWarning(marker);
			}
			
			// set model values once selection is successful
			vm.selected._marker_key = marker._marker_key;
			vm.selected.marker_symbol = marker.symbol;
			
			console.log("selected marker symbol="+marker.symbol+", key="+marker._marker_key);
			
			// move to next input field
			Focus.onElementById('comments');
		}

		
		/*
		 * Called when marker symbol validator has become invalid
		 *   E.g. when user changes value or clears form
		 */
		function clearMarker() {
			if (vm.selected._marker_key) {
				console.log("marker widget invalidated. Clearing _marker_key value");
				vm.selected._marker_key = null;
			}
		}
		
		
		/*
		 * Select handler when reference has been validated
		 */
		function selectReference(reference) {
			vm.selected.jnumid = reference.jnumid;
			
			vm.selected._refs_key = reference._refs_key;
			vm.selected.short_citation = reference.short_citation;
			Focus.onElementById('marker_symbol');
		}
		
		/*
		 * Called when reference jnumid validator has become invalid
		 *   E.g when user changes value or clears form
		 */
		function clearReference() {
			if (vm.selected._refs_key) {
				console.log("reference widget invalidated. Clearing _refs_key value");
				vm.selected._refs_key = null;
			}
		}
		
		
		
		function toggleCell(cell) {
			if (cell.checked) {
				cell.checked = false;
			}
			else {
				cell.checked = true;
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
			vm.indexStageCells = [];
			
			for(var i=0; i<$scope.indexassay_choices.length; i++) {
				
				var newRow = [];
				vm.indexStageCells.push(newRow)
				for (var j=0; j<$scope.stageid_choices.length; j++) {
					
					var newCell = { 
						checked: false,
						_stageid_key: $scope.stageid_choices[j]._term_key,
						_indexassay_key: $scope.indexassay_choices[i]._term_key
					};
					newRow.push(newCell);
				}
			}
		}
		
		/*
		 * Pushes model to the display grid
		 */
		function displayIndexStageCells() {
			
			clearIndexStageCells();
			
			var indexstages = vm.selected.indexstages;
			for( var i=0; i<indexstages.length; i++) {
				setIndexStageCell(indexstages[i]);
			}
		}
		
		function setIndexStageCell(indexstage) {
			for (var i=0; i<vm.indexStageCells.length; i++) {
				var row = vm.indexStageCells[i];
				for (var j=0; j<row.length; j++) {
					var cell = row[j];
					
					if (cell._stageid_key == indexstage._stageid_key
							&& cell._indexassay_key == indexstage._indexassay_key) {
						
						cell.checked = true;
					}
				}
			}
		}
		
		/*
		 * Pulls display grid cells back into the model
		 */
		function loadIndexStageCells() {
			
			var newIndexStages = [];
			
			for (var i=0; i<vm.indexStageCells.length; i++) {
				var row = vm.indexStageCells[i];
				for (var j=0; j<row.length; j++) {
					var cell = row[j];
					
					if (cell.checked) {
						newIndexStages.push({
							_stageid_key: cell._stageid_key,
							_indexassay_key: cell._indexassay_key
						});
					}
				}
			}
			
			vm.selected.indexstages = newIndexStages;
		}
		
		function clearIndexStageCells() {
			for (var i=0; i<vm.indexStageCells.length; i++) {
				var row = vm.indexStageCells[i];
				for (var j=0; j<row.length; j++) {
					row[j].checked = false;
				}
			}
		}
		

		
		/*
		 * Expose functions on controller scope
		 */
		$scope.clearAll = clearAll;
		$scope.search = search;
		$scope.modifyItem = modifyItem;
		$scope.addItem = addItem;
		$scope.deleteItem = deleteItem;
		$scope.prevItem = prevItem;
		$scope.nextItem = nextItem;
		$scope.setItem = setItem;
		
		$scope.selectMarker = selectMarker;
		$scope.clearMarker = clearMarker;
		
		$scope.selectReference = selectReference;
		$scope.clearReference = clearReference;
		
		$scope.toggleCell = toggleCell;
		
		init();
	}

})();
