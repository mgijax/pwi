(function() {
	'use strict';
	angular.module('pwi.gxd').controller('EvaluationController', EvaluationController);

	function EvaluationController($scope, $http, $filter,
		GxdExperimentAPI,
		GxdExperimentSearchAPI,
		GxdExperimentSummarySearchAPI,
		GxdExperimentSampleAPI,
		VocTermSearchAPI,
		GxdExperimentCountAPI
	) {

		//usSpinnerService.stop('page-spinner');
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {};
		vm.message = {};
		vm.data = [];
		vm.selected = {};
		vm.selectedIndex = 0;
		vm.total_records = 0;
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

				if (vm.selected.secondaryid_objects.length > 0) {
					vm.selected.secondaryid = vm.selected.secondaryid_objects[0].accid;
				}

				vm.loading = false;
				pageScope.usSpinnerService.stop('page-spinner');
			}, function(err) {
				setMessage(err.data);
				vm.loading = false;
				pageScope.usSpinnerService.stop('page-spinner');
			});

		}

		$scope.loadSamples = function() {
			if(vm.data.length == 0) return;
			GxdExperimentSampleAPI.get({ '_experiment_key' : vm.selected._experiment_key}, function(data) {
				vm.selected.samples = data.items;
			}, function(err) {
				vm.selected.samples = "Retrieval of samples failed";
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
			clearMessages();
		}

		$scope.prevItem = function() {
			if(vm.data.length == 0) return;
			if(vm.selectedIndex == 0) {
				vm.selectedIndex = vm.data.length - 1;
			} else {
				vm.selectedIndex--;
			}
			setSelected();
			clearMessages();
		}

		$scope.columns = [
			"name",
			"age",
		];

		$scope.setItem = function(index) {
			vm.selectedIndex = index;
			setSelected();
			clearMessages();
		}

		$scope.modifyDisabled = function() {
			return (pageScope.pageModifyDisabled() || vm.loading || vm.data.length == 0);
		}

		var clearMessages = function() {
			vm.message = {};
		}

		var setMessage = function(data) {
			if(data.error) {
				vm.message.type = "danger";
				vm.message.text = data.message;
				vm.message.detail = data.error;
			} else if(data.success) {
				vm.message.type = "success";
				vm.message.text = data.message;
			} else {
				vm.message.type = "info";
				vm.message.text = data.message;
			}
		}

		$scope.clear = function() {
			pageScope.usSpinnerService.spin('page-spinner');
			console.log("Clearing Form:");
			vm.selected = {};
			clearMessages();
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
					clearMessages();
				}
				vm.loading = false;
				clearMessages();
				pageScope.usSpinnerService.stop('page-spinner');
			}, function(err) {
				setMessage(err.data);
				vm.loading = false;
				pageScope.usSpinnerService.stop('page-spinner');
			});
		}

		// Need to implement 
		$scope.modifyItem = function() {
			if ($scope.modifyDisabled()) return;

			vm.loading = true;
			pageScope.usSpinnerService.spin('page-spinner');
			GxdExperimentAPI.update({key: vm.selected._experiment_key}, vm.selected, function(data) {
				console.log("Saving Experiment: ");
				console.log(data);
				setSelected();
				setMessage({success: true, message: "Successfull Saved: " + vm.selected.primaryid});
				vm.loading = false;
				pageScope.usSpinnerService.stop('page-spinner');
			}, function(err) {
				setMessage(err.data);
				vm.loading = false;
				pageScope.usSpinnerService.stop('page-spinner');
			});
		}

		VocTermSearchAPI.search({vocab_name: "GXD HT Evaluation State"}, function(data) { $scope.evaluation_states = data.items });
		VocTermSearchAPI.search({vocab_name: "GXD HT Curation State"}, function(data) { $scope.curation_states = data.items });
		VocTermSearchAPI.search({vocab_name: "GXD HT Study Type"}, function(data) { $scope.study_types = data.items });
		VocTermSearchAPI.search({vocab_name: "GXD HT Experiment Type"}, function(data) { $scope.experiment_types = data.items });
		VocTermSearchAPI.search({vocab_name: "GXD HT Experiment Variables"}, function(data) { $scope.expvars = data.items });

		GxdExperimentCountAPI.get(function(data) { vm.total_records = data.total_count; });

		Mousetrap(document.body).bind(['ctrl+shift+c'], $scope.clear);

		Mousetrap(document.body).bind(['ctrl+shift+s'], $scope.search);
		Mousetrap(document.body).bind(['shift+enter'], $scope.search);

		Mousetrap(document.body).bind(['ctrl+shift+m'], $scope.modifyItem);

		Mousetrap(document.body).bind(['ctrl+shift+p'], $scope.prevItem);
		Mousetrap(document.body).bind(['ctrl+shift+n'], $scope.nextItem);

		Mousetrap(document.body).bind(['left'], $scope.prevItem);
		Mousetrap(document.body).bind(['right'], $scope.nextItem);

	}

})();
