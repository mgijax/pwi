(function() {
	'use strict';
	angular.module('pwi.gxd').controller('EvaluationController', EvaluationController);

	function EvaluationController($scope, $http, $filter, GxdExperimentAPI, GxdExperimentSearchAPI, GxdExperimentSummarySearchAPI, GxdRawSampleAPI, VocTermSearchAPI) {

		//usSpinnerService.stop('page-spinner');
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {};
		vm.errors = {};
		vm.data = [];
		vm.selected = {};
		vm.selectedIndex = 0;
		vm.loading = false;

		function setSelected() {

			pageScope.usSpinnerService.spin('page-spinner');

			GxdExperimentSearchAPI.search(vm.data[vm.selectedIndex], function(data) {
				vm.selected = data.items[0];

				vm.selected.release_date = $filter('date')(new Date(vm.selected.release_date.replace(/ .+/, "").replace(/-/g, '\/')), "MM/dd/yyyy");
				vm.selected.lastupdate_date = $filter('date')(new Date(vm.selected.lastupdate_date.replace(/ .+/, "").replace(/-/g, '\/')), "MM/dd/yyyy");

				if(vm.selected.creation_date) vm.selected.creation_date = $filter('date')(new Date(vm.selected.creation_date.replace(/ .+/, "").replace(/-/g, '\/')), "MM/dd/yyyy");
				if(vm.selected.evaluated_date) vm.selected.evaluated_date = $filter('date')(new Date(vm.selected.evaluated_date.replace(/ .+/, "").replace(/-/g, '\/')), "MM/dd/yyyy");
				if(vm.selected.curated_date) vm.selected.curated_date = $filter('date')(new Date(vm.selected.curated_date.replace(/ .+/, "").replace(/-/g, '\/')), "MM/dd/yyyy");
				if(vm.selected.modification_date) vm.selected.modification_date = $filter('date')(new Date(vm.selected.modification_date.replace(/ .+/, "").replace(/-/g, '\/')), "MM/dd/yyyy");

				vm.loading = false;
				vm.errors.api = false;
				pageScope.usSpinnerService.stop('page-spinner');
			}, function(err) {
				vm.errors.api = err.data;
				vm.loading = false;
				pageScope.usSpinnerService.stop('page-spinner');
			});

		}

		$scope.loadRawSamples = function() {
			if(vm.data.length == 0) return;
			GxdRawSampleAPI.search({ 'experimentID' : vm.selected.primaryid }, function(data) {
				vm.selected.rawSamples = data.items;
			}, function(err) {
				vm.selected.rawSamples = "Retrieval of raw samples failed";
			});
		}
		
		$scope.nextItem = function() {
			if(vm.data.length == 0) return;
			if(vm.selectedIndex == vm.data.length - 1) {
				vm.selectedIndex = 0;
			} else {
				vm.selectedIndex++;
			}
			setSelected();
		}

		$scope.prevItem = function() {
			if(vm.data.length == 0) return;
			if(vm.selectedIndex == 0) {
				vm.selectedIndex = vm.data.length - 1;
			} else {
				vm.selectedIndex--;
			}
			setSelected();
		}

		$scope.setItem = function(index) {
			vm.selectedIndex = index;
			setSelected();
		}

		$scope.clear = function() {
			pageScope.usSpinnerService.spin('page-spinner');
			console.log("Clearing Form:");
			vm.selected = {};
			vm.errors.api = false;
			vm.data = [];
			pageScope.usSpinnerService.stop('page-spinner');
		}

		$scope.search = function() {
			vm.loading = true;
			pageScope.usSpinnerService.spin('page-spinner');
			GxdExperimentSummarySearchAPI.search(vm.selected, function(data) {
				vm.data = data.items;
				if(vm.data.length > 0) {
					vm.selectedIndex = 0;
					setSelected();
				}
				vm.loading = false;
				vm.errors.api = false;
				pageScope.usSpinnerService.stop('page-spinner');
			}, function(err) {
				vm.errors.api = err.data;
				vm.loading = false;
				pageScope.usSpinnerService.stop('page-spinner');
			});
		}

		// Need to implement 
		$scope.modifyItem = function() { console.log("Saving: " + vm.selected); }

		VocTermSearchAPI.search({vocab_name: "GXD HT Triage State"}, function(data) {
			$scope.triage_states = data.items
		});

		VocTermSearchAPI.search({vocab_name: "GXD HT Study Type"}, function(data) {
			$scope.study_types = data.items
		});

		VocTermSearchAPI.search({vocab_name: "GXD HT Curation State"}, function(data) {
			$scope.curation_states = data.items
		});


		$scope.expvars = ["developmental stage", "genotype", "organism", "sex", "strain"];

	}

})();
