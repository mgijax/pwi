(function() {
	'use strict';
	angular.module('pwi.gxd').controller('EvaluationController', EvaluationController);

	function EvaluationController($scope, $http, $filter, GxdExperimentAPI, GxdExperimentSearchAPI, GxdExperimentSummarySearchAPI, GxdRawSampleAPI, VocTermSearchAPI) {

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
				clearMessages();
				pageScope.usSpinnerService.stop('page-spinner');
			}, function(err) {
				setMessage(err.data);
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

		vm.isSelectedEmpty = function() {
			return Object.keys(vm.selected).length === 0;
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
			GxdExperimentAPI.update({key: vm.selected._experiment_key}, vm.selected, function(data) {
				console.log("Saving Experiment: ");
				console.log(data);
				setMessage({success: true, message: "Successfull Saved: " + vm.selected.primaryid});
			});
		}

		VocTermSearchAPI.search({vocab_name: "GXD HT Evaluation State"}, function(data) { $scope.evaluation_states = data.items });
		VocTermSearchAPI.search({vocab_name: "GXD HT Curation State"}, function(data) { $scope.curation_states = data.items });

		VocTermSearchAPI.search({vocab_name: "GXD HT Study Type"}, function(data) { $scope.study_types = data.items });
		VocTermSearchAPI.search({vocab_name: "GXD HT Experiment Type"}, function(data) { $scope.experiment_types = data.items });

		$scope.expvars = ["developmental stage", "genotype", "organism", "sex", "strain"];

		Mousetrap(document.body).bind(['ctrl+c', 'meta+c'], $scope.clear);
		Mousetrap(document.body).bind(['ctrl+s', 'meta+s'], $scope.search);
		Mousetrap(document.body).bind(['ctrl+m', 'meta+m'], $scope.modifyItem);

		Mousetrap(document.body).bind(['ctrl+p', 'meta+p'], $scope.prevItem);
		Mousetrap(document.body).bind(['left'], $scope.prevItem);
		Mousetrap(document.body).bind(['ctrl+n', 'meta+n'], $scope.nextItem);
		Mousetrap(document.body).bind(['right'], $scope.nextItem);
	}

})();
