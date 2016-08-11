(function() {
	'use strict';
	angular.module('pwi.gxd').controller('EvaluationController', EvaluationController);

	function EvaluationController($scope, $http, $document) {
		var vm = $scope.vm = {};
		vm.selected = {};
		vm.querymodel = {};
		vm.selectedIndex = 0;

		$http({
			method: 'GET',
			url: '/pwi/static/edit/gxd/results.json'
		}).then(function successCallback(response) {
			vm.data = response.data.results;
			vm.selected = vm.data[vm.selectedIndex];
		}, function errorCallback(response) {
			vm.selected = {};
		});

		$scope.nextItem = function() {
			console.log("Next");
			if(vm.selectedIndex== vm.data.length - 1) return;
			vm.selectedIndex++;
			vm.selected = vm.data[vm.selectedIndex];
		}

		$scope.prevItem = function() {
			console.log("Prev");
			if(vm.selectedIndex == 0) return;
			vm.selectedIndex--;
			vm.selected = vm.data[vm.selectedIndex];
		}

		$scope.setItem = function(index) {
			vm.selectedIndex = index;
			vm.selected = vm.data[vm.selectedIndex];
		}

		vm.queryFields = [
			{
				key: 'search',
				type: 'input',
				templateOptions: {
					type: 'text',
					label: 'Search',
					placeholder: 'Search Box'
				}
			}, {
				key: 'releasedate',
				type: 'input',
				templateOptions: {
					type: 'date',
					label: 'Start Release Date'
				}
			}
		];

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
