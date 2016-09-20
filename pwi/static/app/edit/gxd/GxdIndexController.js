(function() {
	'use strict';
	angular.module('pwi.gxd').controller('GxdIndexController', GxdIndexController);

	function GxdIndexController($scope, $http, $filter, $document, $window,
			$q,
			GxdIndexAPI, 
			GxdIndexCountAPI,
			GxdIndexSearchAPI,
			ValidMarkerAPI, 
			ValidReferenceAPI,
			VocTermSearchAPI
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
		vm.errors = {};
		vm.selectedIndex = 0;
		// mapping between _term_keys and terms (and vice-versa)
		vm.termMap = {};
		vm.loading = false;
		$scope.conditionalmutants_choices = [];
		$scope.indexassay_choices = [];
		$scope.priority_choices = [];
		$scope.stageid_choices = [];

		function setSelected() {
			
			var selection = vm.searchResults.items[vm.selectedIndex];
			
			// perform query to select index record
			setLoading()
			GxdIndexAPI.get({key:selection._index_key}).$promise
			.then(function(data) {
				vm.selected = data;
				refreshSelectedDisplay();
			}, function(error){
				handleError(error);
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
		
		function handleError(error) {
			//Everything when badly
			console.log(error);
			vm.errors.api = error.data;
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
			vm.errors.api = false;
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
		}

		function prevItem() {
			if(vm.searchResults.items.length == 0) return;
			vm.selectedIndex--;
			if (vm.selectedIndex < 0) {
				vm.selectedIndex = 0;
			}
			setSelected();
		}

		function setItem(index) {
			vm.selectedIndex = index;
			setSelected();
		}
		
		function addItem() {
			console.log("adding: " + vm.selected);
			
			setLoading();
			
			GxdIndexAPI.save(vm.selected).$promise
			.then(function(data) {
				vm.searchResults.items.push(data);
				vm.searchResults.total_count += 1;


				// clear form, but leave reference-related fields
				clear();
				vm.selected._refs_key = data._refs_key;
				vm.selected.short_citation = data.short_citation;
				vm.selected.jnumid = data.jnumid;
				vm.selected._priority_key = data._priority_key;
				vm.selected._conditionalmutants_key = data._conditionalmutants_key;
				focus('marker_symbol');
				
				return data;
				
			}, function(error){
				handleError(error);
			}).finally(function(){
				stopLoading();
			}).then(function(data){
				checkIndexStages(data);
				
				refreshTotalCount();
			});;
		}
		
		function checkIndexStages(data) {
			if (!data.indexstages || data.indexstages.length == 0) {
				var errorMessage = 'No stages have been selected for this record';
				;
				var error = {
					data: {
						error: 'Warning',
						message: errorMessage
					}
				}
				handleError(error);
			}
		}

		function modifyItem() {
			console.log("Saving: " + vm.selected);
			
			setLoading();
			
			GxdIndexAPI.update({key: vm.selected._index_key}, vm.selected).$promise
			.then(function(data) {
				vm.selected = data;
				updateSearchResultsWithSelected();
				refreshSelectedDisplay();
			}, function(error){
				handleError(error);
			}).finally(function(){
				stopLoading();
			}).then(function(){
				refreshTotalCount();
			});
		}
		
		function updateSearchResultsWithSelected() {
			var items = vm.searchResults.items;
			
			// if selected is in the list, update the display data
			for(var i=0;i<items.length; i++) {
				if (items[i]._index_key == vm.selected._index_key) {
					items[i] = vm.selected;
				}
			}
			
		}
		
		function deleteItem() {
			console.log("deleting: " + vm.selected);
			
			setLoading();
			
			GxdIndexAPI.delete({key: vm.selected._index_key}).$promise
			.then(function(data) {
				
				removeSearchResultsItem(vm.selected._index_key);
				clear();
			}, function(error){
				handleError(error);
			}).finally(function(){
				stopLoading();
			}).then(function(){
				refreshTotalCount();
			});
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


		function clear() {
			console.log("Clearing Form:");
			vm.selected = {};
			clearIndexStageCells();
			vm.errors.api = null;
			vm.data = [];
			vm.markerSelections = [];
			focus('jnumid');
		}

		function search() {	

			// attempt to validate reference before searching
			if (vm.selected.jnumid && !vm.selected._refs_key) {
				validateReference()
				.then(function(){
					search();
				});
				return;
			}
			
			setLoading();
			var promise = GxdIndexSearchAPI.search(vm.selected).$promise
			.then(function(data) {
				//Everything went well
				vm.searchResults = data;
				console.log("Count: " + data.items.length);
				if(data.items.length > 0) {
					vm.selectedIndex = 0
					setSelected();
				}
			}, function(error){ 
			  handleError(error);
			}).finally(function(){
				stopLoading();
			}).then(function(){
				refreshTotalCount();
			});
			
			return promise;
		}


		
		
		function validateReference() {
			var jnumber = vm.selected.jnumid;
			vm.selected._refs_key = null;
			vm.selected.short_citation = null;
			if (!jnumber) {
				return $q.when();
			}
			
			setLoading({
				spinnerKey: 'reference-spinner'
			});
			var promise = ValidReferenceAPI.get({jnumber: jnumber}).$promise
			.then(function(reference){
				vm.selected.jnumid = reference.jnumid;
				vm.selected._refs_key = reference._refs_key;
				vm.selected.short_citation = reference.short_citation;
				focus('marker_symbol');
			}, function(error) {
			  handleError(error);
			  clearAndFocus("jnumid");
			}).finally(function(){
				stopLoading({
					spinnerKey: 'reference-spinner'
				});
			});
			
			return promise;
		}
		
		function clearAndFocus(id) {
			vm.selected[id] = null;
			focus(id);
		}
		
		// Focus an html element by id
		function focus(id) {
			setTimeout(function(){
				$document[0].getElementById(id).focus();
			}, 100);
		}

		
		function selectMarker(marker) {
			
			// prevent selecting withdrawn marker
			if (marker.markerstatus == 'withdrawn') {
				var errorMessage = 'Cannot select withdrawn marker: ' 
					+ marker.symbol
					+ '. Current symbols are: ' 
					+ marker.current_symbols
				;
				var error = {
					data: {
						error: 'SelectedWithdrawnMarkerError',
						message: errorMessage
					}
				}
				handleError(error);
				clearAndFocus('marker_symbol');
			}
			else {

				// the following error cases are treated only as warnings
				if (isHeritablePhenotypicMarker(marker)) {
					var errorMessage = 'You selected a heritable phenotypic marker: ' 
						+ marker.symbol;
					;
					var error = {
						data: {
							error: 'Warning',
							message: errorMessage
						}
					}
					handleError(error);
				}
				else if (isQTLMarker(marker)) {
					var errorMessage = 'You selected a QTL type marker: ' 
						+ marker.symbol;
					;
					var error = {
						data: {
							error: 'Warning',
							message: errorMessage
						}
					}
					handleError(error);
				}
				
				vm.selected._marker_key = marker._marker_key;
				vm.selected.marker_symbol = marker.symbol;
				console.log("selected marker symbol="+marker.symbol+", key="+marker._marker_key);
				focus('comments');
			}
		}
		
		function isHeritablePhenotypicMarker(marker) {
			
			for (var i=0; i<marker.featuretypes.length; i++) {
				var featuretype = marker.featuretypes[i];
				if (featuretype == 'heritable phenotypic marker') {
					return true;
				}
			}
			
			return false;
		}
		
		function isQTLMarker(marker) {
			return marker.markertype == 'QTL';
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
		
		
		function addChoicesToTermMap(choices) {
			for (var i=0; i<choices.length; i++) {
				var choice = choices[i];
				vm.termMap[choice.term] = choice._term_key;
				vm.termMap[choice._term_key] = choice.term;
			}
		}
		
		// Create dummy cells to represent the index stage table
		// Order mirrors the indexassay_choices and priority_choices
		//    term lists
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
		
		loadVocabs();
		
		function refreshTotalCount() {
			
			GxdIndexCountAPI.get(function(data){
				vm.total_count = data.total_count;
			});
		}
		
		refreshTotalCount();
		
		

		/*
		 * TODO (kstone):
		 * Inject these and/or define in their own factory/service
		 */
		var globalShortcuts = Mousetrap(document.body);
		globalShortcuts.bind(['ctrl+shift+c'], clear);
		globalShortcuts.bind(['ctrl+shift+s'], search);
		globalShortcuts.bind(['ctrl+shift+m'], modifyItem);
		globalShortcuts.bind(['ctrl+shift+a'], addItem);
		globalShortcuts.bind(['ctrl+shift+d'], deleteItem);
		globalShortcuts.bind(['ctrl+shift+p'], prevItem);
		globalShortcuts.bind(['ctrl+shift+n'], nextItem);
		
		var referenceShortcut = Mousetrap(document.getElementById('jnumid'));
		referenceShortcut.bind('tab', validateReference);
		
		
		/*
		 * Expose functions on controller scope
		 */
		$scope.clear = clear;
		$scope.search = search;
		$scope.modifyItem = modifyItem;
		$scope.addItem = addItem;
		$scope.deleteItem = deleteItem;
		$scope.prevItem = prevItem;
		$scope.nextItem = nextItem;
		$scope.setItem = setItem;
		
		$scope.selectMarker = selectMarker;
		
		$scope.toggleCell = toggleCell;
		
		
//		$document.ready(function(){
//			focus('jnumid');
//		});
		//focus('jnumid');

	}

})();
