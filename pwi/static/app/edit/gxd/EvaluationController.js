(function() {
	'use strict';
	angular.module('pwi.gxd').controller('EvaluationController', EvaluationController)
	.filter('unique', function() {
		return function (arr, field) {
			var o = {}, i, l = arr.length, r = [];
			for(i=0; i<l;i+=1) { o[arr[i][field]] = arr[i]; }
			for(i in o) { r.push(o[i]); }
			return r;
		};
	});

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

		function setSelected() {

			GxdExperimentSearchAPI.search(vm.data[vm.selectedIndex], function(data) {
				vm.selected = data.items[0];

				if(vm.selected.release_date) vm.selected.release_date = $filter('date')(new Date(vm.selected.release_date.replace(/ .+/, "").replace(/-/g, '\/')), "MM/dd/yyyy");
				if(vm.selected.lastupdate_date) vm.selected.lastupdate_date = $filter('date')(new Date(vm.selected.lastupdate_date.replace(/ .+/, "").replace(/-/g, '\/')), "MM/dd/yyyy");

				if(vm.selected.creation_date) vm.selected.creation_date = $filter('date')(new Date(vm.selected.creation_date.replace(/ .+/, "").replace(/-/g, '\/')), "MM/dd/yyyy");
				if(vm.selected.evaluated_date) vm.selected.evaluated_date = $filter('date')(new Date(vm.selected.evaluated_date.replace(/ .+/, "").replace(/-/g, '\/')), "MM/dd/yyyy");
				if(vm.selected.curated_date) vm.selected.curated_date = $filter('date')(new Date(vm.selected.curated_date.replace(/ .+/, "").replace(/-/g, '\/')), "MM/dd/yyyy");
				if(vm.selected.modification_date) vm.selected.modification_date = $filter('date')(new Date(vm.selected.modification_date.replace(/ .+/, "").replace(/-/g, '\/')), "MM/dd/yyyy");

				if (vm.selected.secondaryid_objects && vm.selected.secondaryid_objects.length > 0) {
					vm.selected.secondaryid = vm.selected.secondaryid_objects[0].accid;
				}

				pageScope.loadingFinished();
			}, function(err) {
				setMessage(err.data);
				pageScope.loadingFinished();
			});

		}

		$scope.loadSamples = function() {
			if(vm.data.length == 0) return;

			pageScope.loadingStart();

			GxdExperimentSampleAPI.get({ '_experiment_key' : vm.selected._experiment_key}, function(data) {
				vm.selected.samples = [];
				vm.selected.columns = {};

				for(var i in data.items) {
					vm.selected.samples[i] = {};
					for(var j in data.items[i].characteristic) {
						var column_name = "characteristic_" + data.items[i].characteristic[j].category.toLowerCase().replace(/ /g, "_");
						vm.selected.columns[column_name] = {"type": "C", "name": data.items[i].characteristic[j].category, "column_name": column_name};
						vm.selected.samples[i][column_name] = data.items[i].characteristic[j].value;
					}
					for(var j in data.items[i].source.comment) {
						var column_name = "source_" + data.items[i].source.comment[j].name.toLowerCase().replace(/ /g, "_");
						vm.selected.columns[column_name] = {"type": "S", "name": data.items[i].source.comment[j].name, "column_name": column_name};
						vm.selected.samples[i][column_name] = data.items[i].source.comment[j].value;
					}
					vm.selected.samples[i]["source_name"] = data.items[i].source.name;
					// Going to add this manually
					//vm.selected.columns["source_name"] = {"type": "source", "name": "Source Name"};

					for(var j in data.items[i].variable) {
						var column_name = "variable_" + data.items[i].variable[j].name.toLowerCase().replace(/ /g, "_");
						vm.selected.columns[column_name] = {"type": "V", "name": data.items[i].variable[j].name, "column_name": column_name};
						vm.selected.samples[i][column_name] = data.items[i].variable[j].value;
					}
					vm.selected.samples[i]["domain_sample"] = data.items[i].domain_sample;
				}
				
				//console.log(data.items);
				//console.log(vm.selected.columns);
				//console.log(vm.selected.samples);

				pageScope.loadingFinished();
			}, function(err) {
				vm.selected.samples = "Retrieval of samples failed";
				pageScope.loadingFinished();
			});
		}
		
		$scope.nextItem = function() {
			if(vm.data.length == 0) return;
			pageScope.loadingStart();
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
			pageScope.loadingStart();
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
			pageScope.loadingStart();
			vm.selectedIndex = index;
			setSelected();
			clearMessages();
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
			pageScope.loadingStart();
			console.log("Clearing Form:");
			vm.selected = {};
			clearMessages();
			vm.data = [];
			pageScope.loadingFinished();
		}

		$scope.search = function() {
			pageScope.loadingStart();

			GxdExperimentSummarySearchAPI.search(vm.selected, function(data) {
				vm.data = data.items;
				if(vm.data.length > 0) {
					vm.selectedIndex = 0;
					setSelected();
				}
				clearMessages();
				pageScope.loadingFinished();
			}, function(err) {
				setMessage(err.data);
				pageScope.loadingFinished();
			});
		}

		$scope.modifyDisabled = function() {
			return (pageScope.pageModifyDisabled() || vm.data.length == 0);
		}

		// Need to implement 
		$scope.modifyItem = function() {
			if ($scope.modifyDisabled()) return;

			pageScope.loadingStart();

			GxdExperimentAPI.update({key: vm.selected._experiment_key}, vm.selected, function(data) {
				console.log("Saving Experiment: ");
				setSelected();
				setMessage({success: true, message: "Successfull Saved: " + vm.selected.primaryid});
			}, function(err) {
				setMessage(err.data);
			});
		}

		VocTermSearchAPI.search({vocab_name: "GXD HT Evaluation State"}, function(data) { $scope.evaluation_states = data.items });
		VocTermSearchAPI.search({vocab_name: "GXD HT Curation State"}, function(data) { $scope.curation_states = data.items });
		VocTermSearchAPI.search({vocab_name: "GXD HT Study Type"}, function(data) { $scope.study_types = data.items });
		VocTermSearchAPI.search({vocab_name: "GXD HT Experiment Type"}, function(data) { $scope.experiment_types = data.items });
		VocTermSearchAPI.search({vocab_name: "GXD HT Experiment Variables"}, function(data) { $scope.expvars = data.items });

		VocTermSearchAPI.search({vocab_name: "Gender"}, function(data) { $scope.genders = data.items });
		VocTermSearchAPI.search({vocab_name: "GXD HT Relevance"}, function(data) { $scope.relevances = data.items });

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
