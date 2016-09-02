(function() {
	'use strict';
	angular.module('pwi.gxd').controller('GxdIndexController', GxdIndexController);

	function GxdIndexController($scope, $http, $filter, $document, 
			GxdIndexAPI, 
			GxdIndexSearchAPI,
			ValidReferenceAPI,
			ConditionalMutantsVocabAPI,
			IndexAssayVocabAPI,
			PriorityVocabAPI,
			StageidVocabAPI) {

		//usSpinnerService.stop('page-spinner');
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {};
		vm.errors = {};
		vm.selected = {};
		vm.selectedIndex = 0;
		// mapping between _term_keys and terms (and vice-versa)
		vm.termMap = {};
		vm.loading = false;
		$scope.conditionalmutants_choices = [];
		$scope.indexassay_choices = [];
		$scope.priority_choices = [];
		$scope.stageid_choices = [];

		function setSelected() {
			vm.selected = vm.data[vm.selectedIndex];

			if(vm.selected.creation_date) vm.selected.creation_date = $filter('date')(new Date(vm.selected.creation_date.replace(" ", "T")), "MM/dd/yyyy");
			if(vm.selected.modification_date) vm.selected.modification_date = $filter('date')(new Date(vm.selected.modification_date.replace(" ", "T")), "MM/dd/yyyy");
		}
		
		function handleError(error) {
			//Everything when badly
			console.log(error);
			vm.errors.api = error.data;
			vm.loading = false;
			pageScope.usSpinnerService.stop('page-spinner');
		}

		$scope.nextItem = function() {
			if(!vm.data || vm.selectedIndex == vm.data.length - 1) return;
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
			vm.loading = true;
			pageScope.usSpinnerService.spin('page-spinner');
			GxdIndexSearchAPI.search(vm.selected).$promise
			.then(function(data) {
				//Everything when well
				vm.data = data.items;
				console.log("Count: " + vm.data.length);
				if(vm.data.length > 0) {
					vm.selectedIndex = 0;
					setSelected();
				}
				vm.loading = false;
				vm.errors.api = false;
				pageScope.usSpinnerService.stop('page-spinner');
			}, function(error){ 
			  handleError(error);
			});
		}
		
		$scope.validateReference = function() {
			var jnumber = vm.selected.reference.jnumid;
			vm.selected.reference.citation_cache.short_citation = null;
			ValidReferenceAPI.get({jnumber: jnumber}).$promise
			.then(function(reference){
				vm.selected.reference = reference;
			}, function(error) {
			  handleError(error);
			});
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
