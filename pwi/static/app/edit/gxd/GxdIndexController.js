(function() {
	'use strict';
	angular.module('pwi.gxd').controller('GxdIndexController', GxdIndexController);

	function GxdIndexController($scope, $http, $filter, $document, 
			$q,
			GxdIndexAPI, 
			GxdIndexSearchAPI,
			ValidReferenceAPI,
			ConditionalMutantsVocabAPI,
			IndexAssayVocabAPI,
			PriorityVocabAPI,
			StageidVocabAPI) {

		//usSpinnerService.stop('page-spinner');
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
			_modifiedby_key: null
		};
		vm.searchResults = {
			items: [],
			total_count: 0
		}
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
				if(vm.selected.creation_date) {
					vm.selected.creation_date = $filter('date')(new Date(vm.selected.creation_date.replace(" ", "T")), "MM/dd/yyyy");
				}
				if(vm.selected.modification_date) {
					vm.selected.modification_date = $filter('date')(new Date(vm.selected.modification_date.replace(" ", "T")), "MM/dd/yyyy");
				}
			}, function(error){
				handleError(error);
			}).finally(function(){
				stopLoading();
			});
			
		}
		
		function handleError(error) {
			//Everything when badly
			console.log(error);
			vm.errors.api = error.data;
		}
		
		function setLoading() {
			vm.errors.api = false;
			vm.loading = true;
			pageScope.usSpinnerService.spin('page-spinner');
		}
		
		function stopLoading() {
			vm.loading = false;
			pageScope.usSpinnerService.stop('page-spinner');
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

		$scope.modifyItem = function() {
			console.log("Saving: " + vm.selected);
		}

		$scope.clear = function() {
			pageScope.usSpinnerService.spin('page-spinner');
			console.log("Clearing Form:");
			vm.selected = {};
			vm.errors.api = null;
			vm.data = [];
			pageScope.usSpinnerService.stop('page-spinner');
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
			
			vm.loading = true;
			pageScope.usSpinnerService.spin('page-spinner');
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
			});
			
			return promise;
		}
		
		$scope.validateReference = function() {
			var jnumber = vm.selected.jnumid;
			vm.selected._refs_key = null;
			vm.selected.short_citation = null;
			if (!jnumber) {
				return $q.when();
			}
			
			setLoading();
			var promise = ValidReferenceAPI.get({jnumber: jnumber}).$promise
			.then(function(reference){
				vm.selected.jnumid = reference.jnumid;
				vm.selected._refs_key = reference._refs_key;
				vm.selected.short_citation = reference.short_citation;
			}, function(error) {
			  handleError(error);
			}).finally(function(){
				stopLoading();
			});
			
			return promise;
		}
		
		function addChoicesToTermMap(choices) {
			for (var i=0; i<choices.length; i++) {
				var choice = choices[i];
				vm.termMap[choice.term] = choice._term_key;
				vm.termMap[choice._term_key] = choice.term;
			}
		}
		
		// load the vocab choices
		function loadVocabs() {
			
			ConditionalMutantsVocabAPI.get(function(data) {
				$scope.conditionalmutants_choices = data.choices;
				addChoicesToTermMap(data.choices);
			});
			
			IndexAssayVocabAPI.get(function(data) {
				$scope.indexassay_choices = data.choices;
				addChoicesToTermMap(data.choices);
			});
			
			PriorityVocabAPI.get(function(data) {
				$scope.priority_choices = data.choices;
				addChoicesToTermMap(data.choices);
			});
			
			StageidVocabAPI.get(function(data) {
				$scope.stageid_choices = data.choices;
				addChoicesToTermMap(data.choices);
			});
		}
		
		loadVocabs();

		$document.on("keydown", function(event) {
			if (event.keyCode == 38) {
				//console.log("up arrow");
			} else if (event.keyCode == 39) {
				$scope.nextItem();
			} else if (event.keyCode == 40) {
				//console.log("down arrow");
			} else if (event.keyCode == 37) {
				$scope.prevItem();
			}
			$scope.$apply(function() {});
		});

	}

})();
