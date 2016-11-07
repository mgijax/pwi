(function() {
	'use strict';
	angular.module('pwi.gxd').controller('EvaluationController', EvaluationController)
	.filter('handleSubscript', function () { return function (input) { if(input == null) return ""; return input.replace(/<([^>]*)>/g, "<sup>$1</sup>").replace(/\n/g, "<br>"); }; })
	.filter('html', function($sce) { return function(val) { return $sce.trustAsHtml(val); }; })
	.filter('htmlnobr', function($sce) { return function(val) { return $sce.trustAsHtml("<nobr>" + val + "</nobr>"); }; })
	.filter('uniqueraw', function() {
		return function (arr, field) {
			var o = {}, i, l = arr.length, r = [];
			for(i=0; i<l;i+=1) { if(arr[i].raw_sample) o[arr[i].raw_sample[field]] = arr[i].raw_sample; }
			for(i in o) { r.push(o[i]); }
			return r;
		};
	})
	.directive('ngTabevent', function() {
		return function(scope, element, attrs) {
			element.bind("keydown", function (event) {
				if(event.which == 9) {
					scope.$apply(function () {
						scope.$eval(attrs.ngTabevent);
					});
				}
			});
		}
	});

	function EvaluationController($scope, $http, $filter, $timeout, $document,
		naturalSortService,
		GxdExperimentAPI,
		GxdExperimentSearchAPI,
		GxdExperimentSummarySearchAPI,
		GxdExperimentSampleAPI,
		GxdGenotypeSearchAPI,
		VocTermSearchAPI,
		VocTermEMAPSSearchAPI,
		EMAPAClipboardAPI,
		MGITypeSearchAPI,
		GxdExperimentCountAPI
	) {

		var pageScope = $scope.$parent;
		var vm = $scope.vm = {};
		var vocabs = $scope.vocabs = {};
		vm.message = {};
		vm.counts = {};
		vm.data = [];
		vm.sample_data = [];
		vm.clipboard = [];
		vm.checked_columns = [];
		vm.selected = {};
		vm.selected.experiment_variables = [];
		vm.selectedIndex = 0;
		vm.resettable = false;
		vm.total_records = 0;
		vm.hasSampleDomain = false;
		vm.hasRawSamples = false;
		vm.showing_curated = false;
		vm.showing_raw = true;
		vm.curated_columns = [
			{ "column_name": "name", "display_name": "Name", "sort_name": "name"},
			{ "column_name": "organism", "display_name": "Organism", "sort_name": "_organism_key"},
			{ "column_name": "relevance", "display_name": "GXD Relevant?", "sort_name": "_relevance_key"},
			{ "column_name": "genotype", "display_name": "Genotype", "sort_name": "_genotype_key"},
			{ "column_name": "ageunit", "display_name": "Age Unit", "sort_name": "age"},
			{ "column_name": "agerange", "display_name": "Age Range", "sort_name": "age"},
			{ "column_name": "sex", "display_name": "Sex", "sort_name": "_sex_key"},
			{ "column_name": "emapa", "display_name": "EMAPA + Stage", "sort_name": "emapa"},
			{ "column_name": "note", "display_name": "Note", "sort_name": "note"},
		];

		function setSelected(loadOldRawSamples = false) {
			var oldsamples = vm.selected.samples;
			var oldcolumns = vm.selected.columns;
			GxdExperimentSearchAPI.search(vm.data[vm.selectedIndex], function(data) {
				vm.selected = data.items[0];

				if(vm.selected.release_date) vm.selected.release_date = $filter('date')(new Date(vm.selected.release_date.replace(/ .+/, "").replace(/-/g, '\/')), "MM/dd/yyyy");
				if(vm.selected.lastupdate_date) vm.selected.lastupdate_date = $filter('date')(new Date(vm.selected.lastupdate_date.replace(/ .+/, "").replace(/-/g, '\/')), "MM/dd/yyyy");

				if(vm.selected.creation_date) vm.selected.creation_date = $filter('date')(new Date(vm.selected.creation_date.replace(/ .+/, "").replace(/-/g, '\/')), "MM/dd/yyyy");
				if(vm.selected.evaluated_date) vm.selected.evaluated_date = $filter('date')(new Date(vm.selected.evaluated_date.replace(/ .+/, "").replace(/-/g, '\/')), "MM/dd/yyyy");
				if(vm.selected.initial_curated_date) vm.selected.initial_curated_date = $filter('date')(new Date(vm.selected.initial_curated_date.replace(/ .+/, "").replace(/-/g, '\/')), "MM/dd/yyyy");
				if(vm.selected.last_curated_date) vm.selected.last_curated_date = $filter('date')(new Date(vm.selected.last_curated_date.replace(/ .+/, "").replace(/-/g, '\/')), "MM/dd/yyyy");
				if(vm.selected.modification_date) vm.selected.modification_date = $filter('date')(new Date(vm.selected.modification_date.replace(/ .+/, "").replace(/-/g, '\/')), "MM/dd/yyyy");

				if(vm.selected.secondaryid_objects && vm.selected.secondaryid_objects.length > 0) {
					vm.selected.secondaryid = vm.selected.secondaryid_objects[0].accid;
				}

				for(var i in vocabs.expvars) {
					vocabs.expvars[i].checked = false;
					for (var j in vm.selected.experiment_variables) {
						if(vm.selected.experiment_variables[j]._term_key == vocabs.expvars[i]._term_key) {
							vocabs.expvars[i].checked = true;
						}
					}
				}

				vm.hasSampleDomain = false;
				if(vm.selected.samples && vm.selected.samples.length > 0) {
					var samples = vm.selected.samples;
					vm.selected.samples = [];
					for(var i in samples) {
						vm.selected.samples[i] = {};
						if(samples[i].genotype_object) {
							samples[i]._genotype_key = samples[i].genotype_object.mgiid;
						}
						if(samples[i].emaps_object) {
							samples[i]._emapa_key = samples[i].emaps_object.primaryid;
							samples[i]._stage_key = samples[i].emaps_object._stage_key;
						}
						vm.selected.samples[i].sample_domain = samples[i];
						vm.selected.samples[i].name = samples[i].name;
						vm.selected.samples[i].row_num = parseInt(i) + 1;
						vm.hasSampleDomain = true;
					}
					vm.counts.rows = vm.selected.samples.length;
				}

				if(loadOldRawSamples) {
					vm.selected.columns = oldcolumns;
					for(var i in oldsamples) {
						for(var j in vm.selected.samples) {
							if(vm.selected.samples[j].name == oldsamples[i].name) {
								vm.selected.samples[j].raw_sample = oldsamples[i].raw_sample;
							}
						}
					}
				}
				vm.resettable = true;

				pageScope.loadingFinished();
			}, function(err) {
				setMessage(err.data);
				pageScope.loadingFinished();
			});
		}

		$scope.attachSampleDomain = function() {
			for(var i in vm.selected.samples) {
				vm.selected.samples[i].sample_domain = {};
			}
			vm.hasSampleDomain = true;
			vm.showing_curated = false;
			vm.counts.rows = vm.selected.samples.length;
			$scope.show_curated();
		}

		$scope.updateGenotype = function(row_num) {
			var working_domain = vm.selected.samples[row_num - 1].sample_domain;
			GxdGenotypeSearchAPI.get({ 'mgiid' : working_domain._genotype_key}, function(data) {
				working_domain._genotype_key = data.items[0].mgiid;
				working_domain.genotype_object = data.items[0];
			}, function(err) {
			});
		}

		$scope.updateEMAPS = function(row_num) {
			var working_domain = vm.selected.samples[row_num - 1].sample_domain;
			if (working_domain._emapa_key) {
				vm.emaps_changed = false;
				VocTermEMAPSSearchAPI.get({'emapsid' : working_domain._emapa_key}, function(data) {
					if(!vm.emaps_changed) {
						if(data.items.length > 0) {
							working_domain._emapa_key = data.items[0].primaryid;
							working_domain.emaps_object = data.items[0];
						} else {
							delete working_domain["emaps_object"];
						}
					}
				}, function(err) {
				});
			}
		}
		
		$scope.updateEMAPS2 = function($item, $model, $label, row_num) {
			vm.emaps_changed = true;
			var working_domain = vm.selected.samples[row_num - 1].sample_domain;
			working_domain._emapa_key = $item.emaps_term.primaryid;
			working_domain.emaps_object = $item.emaps_term;
			console.log(working_domain);
			console.log($item);
			console.log($model);
			console.log($label);
		}

		$scope.loadSamples = function() {
			if(vm.data.length == 0) return;

			pageScope.loadingStart();

			GxdExperimentSampleAPI.get({ '_experiment_key' : vm.selected._experiment_key}, function(data) {
				vm.selected.columns = {};
				vm.sample_data = data.items;

				vm.counts.consolidated = data.items.length;
				vm.counts.totalraw = data.total_count;

				var existingSamples = vm.selected.samples.length > 0;

				for(var i in data.items) {
					var sample = data.items[i];
					var raw_sample = sample.raw_sample;

					var selectedSample = null;
					if(existingSamples) {
						for(var j in vm.selected.samples) {
							if(vm.selected.samples[j].name == sample.name) {
								selectedSample = vm.selected.samples[j];
								break;
							}
						}
					} else {
						selectedSample = {};
						vm.selected.samples[i] = selectedSample;
					}

					if(selectedSample != null) {

						if(!existingSamples) {
							selectedSample.row_num = parseInt(i) + 1; // 1 based instead of 0
							selectedSample.name = sample.name;
						}

						selectedSample.raw_sample = {}
						selectedSample.raw_sample["name"] = sample.name;
						vm.checked_columns["name"] = true;

						if(raw_sample.source.comment) {
							if(raw_sample.source.comment.length > 0) {
								for(var j in raw_sample.source.comment) {
									var column_name = "source_" + raw_sample.source.comment[j].name.toLowerCase().replace(/[ :\.]/g, "_");
									vm.selected.columns[column_name] = {"type": "S", "name": raw_sample.source.comment[j].name, "column_name": column_name};
									selectedSample.raw_sample[column_name] = raw_sample.source.comment[j].value;
									vm.checked_columns[column_name] = true;
								}
							} else if(raw_sample.source.comment.length == 0) {
								// Not sure what to do here?
							} else {
								var column_name = "source_" + raw_sample.source.comment.name.toLowerCase().replace(/[ :\.]/g, "_");
								vm.selected.columns[column_name] = {"type": "S", "name": raw_sample.source.comment.name, "column_name": column_name};
								selectedSample.raw_sample[column_name] = raw_sample.source.comment.value;
								vm.checked_columns[column_name] = true;
							}
						}

						for(var j in raw_sample.characteristic) {
							var column_name = "characteristic_" + raw_sample.characteristic[j].category.toLowerCase().replace(/[ :\.]/g, "_");
							vm.selected.columns[column_name] = {"type": "C", "name": raw_sample.characteristic[j].category, "column_name": column_name};
							selectedSample.raw_sample[column_name] = raw_sample.characteristic[j].value;
							vm.checked_columns[column_name] = true;
						}

						for(var j in raw_sample.variable) {
							var column_name = "variable_" + raw_sample.variable[j].name.toLowerCase().replace(/[ :\.]/g, "_");
							vm.selected.columns[column_name] = {"type": "V", "name": raw_sample.variable[j].name, "column_name": column_name};
							selectedSample.raw_sample[column_name] = raw_sample.variable[j].value;
							vm.checked_columns[column_name] = true;
						}
					}
				}
				vm.hasRawSamples = true;
				if(!existingSamples) {	
					vm.showing_curated = true;
					$scope.show_curated();
				}

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
			resetForm();
			setSelected();
			vm.showing_curated = false;
			$scope.show_curated();
			$scope.$apply();
		}

		$scope.prevItem = function() {
			if(vm.data.length == 0) return;
			pageScope.loadingStart();
			if(vm.selectedIndex == 0) {
				vm.selectedIndex = vm.data.length - 1;
			} else {
				vm.selectedIndex--;
			}
			resetForm();
			setSelected();
			vm.showing_curated = false;
			$scope.show_curated();
			$scope.$apply();
		}

		$scope.setItem = function(index) {
			pageScope.loadingStart();
			vm.selectedIndex = index;
			resetForm();
			setSelected();
			vm.showing_curated = false;
			$scope.show_curated();
			$scope.$apply();
		}

		function resetForm() {
			vm.checked_columns = [];
			vm.counts = {};
			vm.resettable = true;
			vm.hasRawSamples = false;
			vm.message = {};
		}

		$scope.clearAll = function() {
			vm.selected = {};
			vm.selected.experiment_variables = [];
			resetForm();
			vm.data = [];
			for(var i in vocabs.expvars) {
				vocabs.expvars[i].checked = false;
			}
			$scope.$apply();
		}

		$scope.search = function() {
			console.log("Search Being Called");
			pageScope.loadingStart();
			vm.selected.experiment_variables = [];

			resetForm();

			for(var i in vocabs.expvars) {
				if(vocabs.expvars[i].checked) {
					vm.selected.experiment_variables.push(vocabs.expvars[i]);
				}
			}

			GxdExperimentSummarySearchAPI.search(vm.selected, function(data) {
				vm.data = data.items;
				if(vm.data.length > 0) {
					vm.selectedIndex = 0;
					setSelected();
					vm.showing_curated = false;
					$scope.show_curated();
				}
				vm.message = {};
				pageScope.loadingFinished();
			}, function(err) {
				setMessage(err.data);
				pageScope.loadingFinished();
			});
		}

		var turnOffCheck = function() {
			vm.message.type = "";
		}

		var setMessage = function(data) {
			if(data.error) {
				vm.message.type = "danger";
				vm.message.text = data.message;
				vm.message.detail = data.error;
			} else if(data.success) {
				vm.message.type = "success";
				vm.message.text = data.message;
				$timeout(turnOffCheck, 1700);
			} else {
				vm.message.type = "info";
				vm.message.text = data.message;
			}
		}

		$scope.show_raw = function() {
			vm.showing_raw = !vm.showing_raw;
			for(var i in vm.selected.columns) {
				vm.checked_columns[i] = vm.showing_raw;
			}
		}

		$scope.show_curated = function() {
			vm.showing_curated = !vm.showing_curated;
			for(var i in vm.curated_columns) {
				if(vm.curated_columns[i].column_name != "relevance" && vm.curated_columns[i].column_name != "note") {
					vm.checked_columns[vm.curated_columns[i].column_name] = vm.showing_curated;
				}
			}
			vm.checked_columns["name"] = true;
		}

		$scope.modifyDisabled = function() {
			return (pageScope.pageModifyDisabled() || vm.data.length == 0);
		}

		$scope.expvar_changed = function(index) {
			var checked = false;
			var not_curated;
			if(vocabs.expvars[index].term == "Not Curated") {
				for(var i in vocabs.expvars) {
					if(vocabs.expvars[i].term != "Not Curated") {
						vocabs.expvars[i].checked = false;
					}
				}
			} else {
				for(var i in vocabs.expvars) {
					if(vocabs.expvars[i].term == "Not Curated") {
						vocabs.expvars[i].checked = false;
					}
				}
			}
			for(var i in vocabs.expvars) {
				if (typeof(vocabs.expvars[i].checked) != "undefined") {
					checked = checked || vocabs.expvars[i].checked;
				}
				if(vocabs.expvars[i].term == "Not Curated") {
					not_curated = vocabs.expvars[i];
				}
			}
			if(!checked) {
				not_curated.checked = true;
			}
		}

		// Need to implement 
		$scope.modifyItem = function() {
			if ($scope.modifyDisabled()) return;
			pageScope.loadingStart();
			vm.selected.experiment_variables = [];
			for(var i in vocabs.expvars) {
				if(vocabs.expvars[i].checked == true) {
					vm.selected.experiment_variables.push(vocabs.expvars[i]);
				}
			}

			for(var i in vm.selected.samples) {
				if(vm.selected.samples[i].sample_domain) {
					vm.selected.samples[i].sample_domain.name = vm.selected.samples[i].name;
				}
			}

			GxdExperimentAPI.update({key: vm.selected._experiment_key}, vm.selected, function(data) {
				setSelected(true);
				setMessage({success: true, message: "Successfull Saved: " + vm.selected.primaryid});
				pageScope.loadingFinished();
			}, function(err) {
				setMessage(err.data);
				pageScope.loadingFinished();
			});
		}

		$scope.getClipboard = function() {
			EMAPAClipboardAPI.get(function(data) {
				vm.clipboard = data.items;
			});
			return vm.clipboard;
		}

		VocTermSearchAPI.search({vocab_name: "GXD HT Evaluation State"}, function(data) { vocabs.evaluation_states = data.items; });
		VocTermSearchAPI.search({vocab_name: "GXD HT Curation State"}, function(data) { vocabs.curation_states = data.items; });
		VocTermSearchAPI.search({vocab_name: "GXD HT Study Type"}, function(data) { vocabs.study_types = data.items; });
		VocTermSearchAPI.search({vocab_name: "GXD HT Age"}, function(data) { vocabs.ages = data.items; });
		VocTermSearchAPI.search({vocab_name: "GXD HT Experiment Type"}, function(data) { vocabs.experiment_types = data.items; });
		VocTermSearchAPI.search({vocab_name: "GXD HT Experiment Variables"}, function(data) { vocabs.expvars = data.items; });
		VocTermSearchAPI.search({vocab_name: "Gender"}, function(data) { vocabs.genders = data.items; });
		VocTermSearchAPI.search({vocab_name: "GXD HT Relevance"}, function(data) { vocabs.relevances = data.items; });
		MGITypeSearchAPI.search({name: "GXD HT Sample"}, function(data) { vocabs.organisms = data.items[0].organisms; });
		//vocabs.organisms
		GxdExperimentCountAPI.get(function(data) { vm.total_records = data.total_count; });

		EMAPAClipboardAPI.get(function(data) { vm.clipboard = data.items; });

		var shortcuts = Mousetrap($document[0].body);
		shortcuts.bind(['ctrl+alt+c'], $scope.clearAll);
		shortcuts.bind(['ctrl+alt+m'], $scope.modifyItem);
		shortcuts.bind(['ctrl+alt+s'], $scope.search);
		shortcuts.bind(['ctrl+alt+p'], $scope.prevItem);
		shortcuts.bind(['ctrl+alt+n'], $scope.nextItem);

//			globalShortcuts.bind(['ctrl+alt+c'], clearAll);
//			globalShortcuts.bind(['ctrl+alt+s'], search);
//			globalShortcuts.bind(['ctrl+alt+m'], modifyItem);
//			globalShortcuts.bind(['ctrl+alt+a'], addItem);
//			globalShortcuts.bind(['ctrl+alt+d'], deleteItem);
//			globalShortcuts.bind(['ctrl+alt+p'], prevItem);
//			globalShortcuts.bind(['ctrl+alt+n'], nextItem);
//			globalShortcuts.bind(['ctrl+alt+b','ctrl+alt+l'], lastItem);

	}

})();
