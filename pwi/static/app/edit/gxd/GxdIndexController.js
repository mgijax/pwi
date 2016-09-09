(function() {
	'use strict';
	angular.module('pwi.gxd').controller('GxdIndexController', GxdIndexController);

	function GxdIndexController($scope, $http, $filter, $document, 
			$q,
			GxdIndexAPI, 
			GxdIndexCountAPI,
			GxdIndexSearchAPI,
			ValidMarkerAPI, 
			ValidReferenceAPI,
			ConditionalMutantsVocabAPI,
			IndexAssayVocabAPI,
			PriorityVocabAPI,
			StageidVocabAPI) {

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
		vm.ref_focus = false;
		vm.marker_focus = false;
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

		$scope.nextItem = function() {
			if(!vm.searchResults || vm.selectedIndex == vm.searchResults.items.length - 1) return;
			vm.selectedIndex++;
			setSelected();
		}

		$scope.prevItem = function() {
			if(vm.selectedIndex == 0) return;
			vm.selectedIndex--;
			setSelected();
		}

		$scope.setItem = function(index) {
			vm.selectedIndex = index;
			setSelected();
		}

		$scope.addItem = function() {
			console.log("Adding: " + vm.selected);
		}
		
		$scope.addItem = function() {
			console.log("adding: " + vm.selected);
			
			setLoading();
			
			GxdIndexAPI.save(vm.selected).$promise
			.then(function(data) {
				vm.selected = data;
				refreshSelectedDisplay();
			}, function(error){
				handleError(error);
			}).finally(function(){
				stopLoading();
			}).then(function(){
				refreshTotalCount();
			});;
		}

		$scope.modifyItem = function() {
			console.log("Saving: " + vm.selected);
			
			setLoading();
			
			GxdIndexAPI.update({key: vm.selected._index_key}, vm.selected).$promise
			.then(function(data) {
				vm.selected = data;
				refreshSelectedDisplay();
			}, function(error){
				handleError(error);
			}).finally(function(){
				stopLoading();
			}).then(function(){
				refreshTotalCount();
			});
		}
		
		$scope.deleteItem = function() {
			console.log("deleting: " + vm.selected);
			
			setLoading();
			
			GxdIndexAPI.delete({key: vm.selected._index_key}).$promise
			.then(function(data) {
				$scope.clear();
			}, function(error){
				handleError(error);
			}).finally(function(){
				stopLoading();
			}).then(function(){
				refreshTotalCount();
			});
		}


		$scope.clear = function() {
			console.log("Clearing Form:");
			vm.selected = {};
			clearIndexStageCells();
			vm.errors.api = null;
			vm.data = [];
			vm.markerSelections = [];
		}

		$scope.search = function() {	

			// attempt to validate reference before searching
			if (vm.selected.jnumid && !vm.selected._refs_key) {
				$scope.validateReference()
				.then(function(){
					$scope.search();
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

		
		$scope.tab = function() {
		
	      if (vm.ref_focus) {
	    	  $scope.validateReference();
	      }
	      if (vm.marker_focus) {
	    	  $scope.validateMarker();
	      }
		}
		
		
		$scope.validateReference = function() {
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
				$scope.focus('marker_symbol');
			}, function(error) {
			  handleError(error);
			  $scope.clearAndFocus("jnumid");
			}).finally(function(){
				stopLoading({
					spinnerKey: 'reference-spinner'
				});
			});
			
			return promise;
		}
		
		$scope.isWildcardSearch = function(input) {
			return input.indexOf('%') >= 0;
		}
		
		$scope.validateMarker = function() {
			var marker_symbol = vm.selected.marker_symbol;
			vm.selected._marker_key = null;
			if (!marker_symbol) {
				return $q.when();
			}
			
			if ($scope.isWildcardSearch(marker_symbol)) {
				return $q.when();
			}
			
			setLoading({
				spinnerKey: 'marker-spinner'
			});
			var promise = ValidMarkerAPI.get({symbol: marker_symbol}).$promise
			.then(function(data){
				
				if (data.total_count == 1) {
					$scope.selectMarker(data.items[0]);
				}
				else if (data.total_count == 0) {
					var error = {
						data: {
							error: 'MarkerSymbolNotFoundError',
							message: 'Invalid marker symbol: ' + marker_symbol
						}
					}
					handleError(error);
					$scope.clearAndFocus("marker_symbol");
				}
				else {
					vm.markerSelections = data.items;
				}
				
			}, function(error) {
			  handleError(error);
			  $scope.clearAndFocus("marker_symbol");
			}).finally(function(){
				stopLoading({
					spinnerKey: 'marker-spinner'
				});
			});
			
			return promise;
		}
		
		$scope.clearAndFocus = function(id) {
			vm.selected[id] = null;
			$scope.focus(id);
		}
		
		// Focus an html element by id
		$scope.focus = function(id) {
			setTimeout(function(){
				$document[0].getElementById(id).focus();
			}, 100);
		}
		
		$scope.cancelMarkerSelection = function() {
			$scope.clearMarkerSelection();
			$scope.clearAndFocus('marker_symbol');
		}
		
		$scope.clearMarkerSelection = function() {
			vm.markerSelections = [];
		}
		
		$scope.selectMarker = function(marker) {
			$scope.clearMarkerSelection();
			
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
				$scope.clearAndFocus('marker_symbol');
			}
			else {
				vm.selected._marker_key = marker._marker_key;
				vm.selected.marker_symbol = marker.symbol;
				console.log("selected marker symbol="+marker.symbol+", key="+marker._marker_key);
				$scope.focus('comments');
			}
		}
		
		$scope.toggleCell = function(cell) {
			if (cell.checked) {
				cell.checked = false;
				removeIndexStage(cell);
			}
			else {
				cell.checked = true;
				addIndexStage(cell);
			}
		}
		
		function displayIndexStageCells() {
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
		
		function clearIndexStageCells() {
			for (var i=0; i<vm.indexStageCells.length; i++) {
				var row = vm.indexStageCells[i];
				for (var j=0; j<row.length; j++) {
					row[j].checked = false;
				}
			}
		}
		
		function removeIndexStage(cell) {
			var indexstages = vm.selected.indexstages;
			for (var i=0; i<indexstages.length; i++) {
				var indexstage = indexstages[i];
				
				if (indexstage._stageid_key == cell._stageid_key
						&& indexstage._indexassay_key == cell._indexassay_key) {
					
					indexstages.splice(i, 1);
					return;
				}
			}
		}
		
		function addIndexStage(cell) {
			
			if (!vm.selected.indexstages) {
				vm.selected.indexstages = [];
			}
			
			var indexstages = vm.selected.indexstages;
			var newIndexStage = {
					_stageid_key: cell._stageid_key,
					_indexassay_key: cell._indexassay_key
			}
			indexstages.push(newIndexStage);
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
			
			ConditionalMutantsVocabAPI.get(function(data) {
				$scope.conditionalmutants_choices = data.choices;
				addChoicesToTermMap(data.choices);
			});
			
			PriorityVocabAPI.get(function(data) {
				$scope.priority_choices = data.choices;
				addChoicesToTermMap(data.choices);
			});
			
			// capture both promises so we can build out indexStageMap when they are done
			var indexassayPromise = IndexAssayVocabAPI.get(function(data) {
				$scope.indexassay_choices = data.choices;
				addChoicesToTermMap(data.choices);
			}).$promise;
			
			var stageidPromise = StageidVocabAPI.get(function(data) {
				$scope.stageid_choices = data.choices;
				addChoicesToTermMap(data.choices);
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

	}

})();
