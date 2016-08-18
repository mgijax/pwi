(function() {
	'use strict';
	angular.module('pwi.gxd').controller('EvaluationController', EvaluationController);

	function EvaluationController($scope, $http, $filter, $document, GxdExperimentAPI, GxdExperimentSearchAPI) {
		var vm = $scope.vm = {};
		vm.selected = {};
		vm.selectedIndex = 0;

		function setSelected() {
			vm.selected = vm.data[vm.selectedIndex];
			vm.selected.release_date = new Date(vm.selected.release_date);
			vm.selected.lastupdate_date = new Date(vm.selected.lastupdate_date);
		}

		$scope.nextItem = function() {
			if(vm.selectedIndex == vm.data.length - 1) return;
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
			vm.data = [];
		}

		$scope.search = function() {
			console.log(vm.selected);
			GxdExperimentSearchAPI.search(vm.selected, function(data) {
            console.log(vm.selected);
				vm.data = data.items;
				console.log("Count: " + vm.data.length);
				if(vm.data.length > 0) {
					vm.selectedIndex = 0;
					setSelected();
				}
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
