(function() {
	'use strict';
	angular.module('pwi.gxd').controller('EvaluationController', EvaluationController);

	function EvaluationController($scope, $http, $filter, $document, GxdExperimentAPI, GxdExperimentSearchAPI) {

		//usSpinnerService.stop('page-spinner');
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {};
		vm.errors = {};
		vm.selected = {};
		vm.selectedIndex = 0;
		vm.loading = false;

		function setSelected() {
			vm.selected = vm.data[vm.selectedIndex];
			vm.selected.release_date = $filter('date')(new Date(vm.selected.release_date.replace(" ", "T")), "MM/dd/yyyy");
			vm.selected.lastupdate_date = $filter('date')(new Date(vm.selected.lastupdate_date.replace(" ", "T")), "MM/dd/yyyy");

			if(vm.selected.creation_date) vm.selected.creation_date = $filter('date')(new Date(vm.selected.creation_date.replace(" ", "T")), "MM/dd/yyyy");
			if(vm.selected.evaluated_date) vm.selected.evaluated_date = $filter('date')(new Date(vm.selected.evaluated_date.replace(" ", "T")), "MM/dd/yyyy");
			if(vm.selected.curated_date) vm.selected.curated_date = $filter('date')(new Date(vm.selected.curated_date.replace(" ", "T")), "MM/dd/yyyy");
			if(vm.selected.modification_date) vm.selected.modification_date = $filter('date')(new Date(vm.selected.modification_date.replace(" ", "T")), "MM/dd/yyyy");
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
			console.log("Clearing Form:");
			vm.selected = {};
			vm.errors.api = false;
			vm.data = [];
		}

		$scope.search = function() {
			vm.loading = true;
			pageScope.usSpinnerService.spin('page-spinner');
			GxdExperimentSearchAPI.search(vm.selected, function(data) {
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
			}, function(err) {
				//Everything when badly
				console.log(err);
				vm.errors.api = err.data;
				vm.loading = false;
				pageScope.usSpinnerService.stop('page-spinner');
			});
		}

		$scope.studytypes = ["Study Type1", "Study Type2", "Study Type3", "Study Type4"];
		$scope.expvars = ["developmental stage", "genotype", "organism", "sex", "strain"];

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
