(function() {
	'use strict';
	angular.module('pwi.gxd').controller('EvaluationController', EvaluationController)
	.filter('handleSubscript', function () { return function (input) { if(input == null) return ""; return input.replace(/<([^>]*)>/g, "<sup>$1</sup>").replace(/\n/g, "<br>"); }; })
	.filter('html', function($sce) { return function(val) { return $sce.trustAsHtml(val); }; })
	.filter('htmlnobr', function($sce) { return function(val) { return $sce.trustAsHtml("<nobr>" + val + "</nobr>"); }; })
	.filter('uniquedomain', function() {
		return function (arr, field) {
			var o = {}, i, l = arr.length, r = [];
			for(i=0; i<l;i+=1) { if(arr[i].sample_domain) o[arr[i].sample_domain[field]] = arr[i].sample_domain; }
			for(i in o) { r.push(o[i]); }
			return r;
		};
	})
	.filter("strictfilter", function($filter) {
		return function(input, predicate) {
			return $filter('filter')(input, predicate, true);
		}
	})
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

	function EvaluationController($scope, $http, $filter, $timeout, $document, $q,
		naturalSortService,
		FindElement,
		GxdExperimentAPI,
		GxdExperimentSearchAPI,
		GxdExperimentSummarySearchAPI,
		GxdExperimentSampleAPI,
		GxdGenotypeGetAPI,
		GxdGenotypeSearchAPI,
		VocTermSearchAPI,
		ValidateTermAPI,
                GxdHTSampleOrganismSearchAPI,
		GxdExperimentTotalCountAPI,
		EmapaHTSampleBySetUserAPI,
		CellTypeHTSampleBySetUserAPI,
                USERNAME
	) {

		var pageScope = $scope.$parent;
                $scope.USERNAME = USERNAME;
		var vm = $scope.vm = {};
		var vocabs = $scope.vocabs = {};
		vm.message = {};
		vm.counts = {};
		vm.data = [];
		vm.sample_data = [];
		vm.clipboard = [];
		vm.clipboardCL = [];
		vm.checked_columns = [];
		vm.emaps_cache = {};
		vm.selected = {};
		vm.selected.experiment_variables = [];
		vm.selectedIndex = 0;
		vm.resettable = false;
		vm.total_records = 0;
		vm.hasSampleDomain = false;
		vm.hasRawSamples = false;
		vm.editing_pubmed = false;
		vm.showing_curated = false;
		vm.showing_curatedSummary = false;
		vm.showing_raw = true;
		vm.curated_columns = [
			{ "column_name": "name", "display_name": "Name", "sort_name": "name"},
			{ "column_name": "organism", "display_name": "Organism", "sort_name": "_organism_key"},
			{ "column_name": "relevance", "display_name": "GXD Relevant?", "sort_name": "_relevance_key"},
			{ "column_name": "genotype", "display_name": "Genotype", "sort_name": "_genotype_key"},
			{ "column_name": "ageunit", "display_name": "Age Unit", "sort_name": "ageunit"},
			{ "column_name": "agerange", "display_name": "Age Range", "sort_name": "agerange"},
			{ "column_name": "sex", "display_name": "Sex", "sort_name": "_sex_key"},
			{ "column_name": "emapa", "display_name": "EMAPS", "sort_name": "_emapa_key"},
			{ "column_name": "celltype", "display_name": "Cell Type", "sort_name": "_celltype_term_key"},
			{ "column_name": "rnaseqtype", "display_name": "RNA-Seq Type", "sort_name": "_rnaseqtype_key"},
			{ "column_name": "notes", "display_name": "Note", "sort_name": "notesort"},
		];


		function updateLoadedData(data, loadOldSamples = false) {

				vm.showing_curatedSummary = false;
				vm.editing_pubmed = false;
				vm.selected = data;  // data is an HTDomain object

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

				//if(!vm.selected.pubmed_ids) { 
				//	vm.editing_pubmed = true;
				//}

				vm.hasSampleDomain = false;
				vm.selected.noteCount = 0;
				vm.selected.clCount = 0;
				vm.selected.hasSamples = 0;
				if(vm.selected.samples && vm.selected.samples.length > 0) {
					vm.selected.hasSamples = 1;
					var samples = vm.selected.samples;
					vm.selected.samples = [];
					for(var i in samples) {
						vm.selected.samples[i] = {};
						if(samples[i].genotype_object) {
							// samples[i]._genotype_key = samples[i].genotype_object.mgiid;
                                                        if (samples[i].genotype_object.isConditional) {
                                                            samples[i].genotype_object.combination1_cache += 'Conditional mutant.'
                                                        }
						}
						if(samples[i].emaps_object) {
							// --------------------------------------------------------------------
							// Feb 26, 2023: (jer) Retrofitting this module to account for changes in the
							// EMAPA clipboard API.
							// The following assignment (one of several like it in this controller)
							// is bizarre to me. The primary id here is an EMAPS accession id, and it
							// is being assigned to the sample's _emapa_key.
							// I have verified in the debugger that when the samples are first loaded from
							// the db, the _emapa_key is indeed the database key of an EMAPA voc term,
							// and this assignment overwrites the key with an EMAPS identifier. 
							// This has got to be a bug, right? And yet... it's been this way for 7 years,
							// and it all  works. The rest of the code is compensating (and actually 
							// dependent) on this weird assignment. 
							// At this point, I'm not attempting to fix this. but wanted to note it
							// for anyone who might look at this code in the future.
							// --------------------------------------------------------------------
							samples[i]._emapa_key = samples[i].emaps_object.primaryid;
							samples[i]._stage_key = samples[i].emaps_object._stage_key;
						}
                                                if (samples[i].cl_object) {
                                                    // The endpoint that supplies this data does not include the CL ids in the cl_object.
                                                    // Fortunately, we can get those from vocabs.celltypes (loaded 
                                                    // from an endpoint that does supply them)
                                                    // 
                                                    // cl_object has these fields: _term_key, term, abbreviation
                                                    // 
                                                    const ct = vm.key2celltype[samples[i]._celltype_term_key]
                                                    samples[i].celltype_id = ct.primaryid
                                                    samples[i].cl_object.primaryid = ct.primaryid
                                                    vm.selected.clCount += 1
                                                } else {
                                                    samples[i].celltype_id = ''
                                                }
                                                //
						vm.selected.samples[i].sample_domain = samples[i];
						vm.selected.samples[i].name = samples[i].name;
						vm.selected.samples[i].row_num = parseInt(i) + 1;
						if(vm.selected.samples[i].sample_domain.age) {
							var array = vm.selected.samples[i].sample_domain.age.split(/ +(?=\d)/);
							vm.selected.samples[i].sample_domain.ageunit = array[0];
							vm.selected.samples[i].sample_domain.agerange = array[1];
						}
						if(vm.selected.samples[i].sample_domain.notes) {
							vm.selected.noteCount = vm.selected.noteCount + vm.selected.samples[i].sample_domain.notes.length;
                                                        vm.selected.samples[i].sample_domain.notesort = vm.selected.samples[i].sample_domain.notes[0].text
						} else {
                                                        vm.selected.samples[i].sample_domain.notes = []
                                                }

						vm.hasSampleDomain = true;
					}
					vm.counts.rows = vm.selected.samples.length;
				}

				vm.resettable = true;
		}

		function setSelected() {
			scrollToSelected();
			GxdExperimentSearchAPI.get({ key: vm.data[vm.selectedIndex]._experiment_key }, function(data) {
				updateLoadedData(data);
				pageScope.loadingEnd();
			}, function(err) {
				setMessage(err.data);
				pageScope.loadingEnd();
			});
		}

		function scrollToSelected() {
			$q.all([
				FindElement.byQuery(".scrollable-menu"),
				FindElement.byQuery(".scrollable-menu .list-group-item-info")
			]).then(function(elements) {
				var table = angular.element(elements[0]);
				var selected = angular.element(elements[1]);
				var offset = 30;
				table.scrollToElement(selected, offset, 0);
			}, function(err) {
				console.log(err);
			});
		}

                //---------------------------------------
                $scope.updateNoteSort = function(row) {
                    const s = row.sample_domain
                    s.notesort = s.notes[0].text
                }

                $scope.show_curatedSummary = function () {
                    vm.showing_curatedSummary = ! vm.showing_curatedSummary
                }

                $scope.getOrganism = function (key) {
                    const o = vocabs.organisms.filter(o => o._organism_key === key)[0]
                    return o ? o.commonname : ''
                }

                $scope.getRelevance = function (key) {
                    const o = vocabs.relevances.filter(g => g._term_key === key)[0]
                    return o ? o.term : ''
                }

                $scope.getRNASeqType = function (key) {
                    const o = vocabs.rnaseqtypes.filter(g => g._term_key === key)[0]
                    return o ? o.term : ''
                }

                $scope.getAge = function (ageunit, agerange) {
                    const replacements = [
                        ['postnatal', 'P'],
                        ['embryonic', 'E'],
                        ['year','y'],
                        ['month', 'm'],
                        ['week', 'w'],
                        ['day', 'd'],
                    ]
                    const unit = replacements.reduce((v,r) => v.replace(r[0], r[1]), ageunit)
                    //const unit = " "
                    return unit + (agerange ? " " + agerange : "")
                }

                $scope.getSex = function (key) {
                    const o = vocabs.genders.filter(g => g._term_key === key)[0]
                    return o ? o.term : ''
                }

                $scope.getCellType = function (key) {
                    const o = vocabs.celltypes.filter(g => g._term_key === key)[0]
                    return o ? o.term : ''
                }

                $scope.getNotes = function (sample) {
                    if (!sample || !sample.notes) return ''
                    return sample.notes.map(n => n.text).join(";")
                }

                $scope.sampleOrderFn = function (sample) {
                    const s = sample.sample_domain
                    if (s && s._relevance_key === 20475450) {
                    	if (s.emaps_object) {
                        	return 'a' + (s._stage_key < 10 ? '0' : '') + s._stage_key + s.emaps_object.emapa_term.term
                    	}
                    	else {
                        	return 'a' + (s._stage_key < 10 ? '0' : '') + s._stage_key 
                    	}
                    } else {
                        return 'z' + sample.name
                    }
                }

                $scope.scrollToSample = function (sname,which) {
                    const tbl = document.getElementById(which)
                    const row = tbl.querySelector(`tr[name="${sname}"]`)
                    const inp = row.querySelector('input')
                    row.scrollIntoView()
                    inp.focus()
                }
                //---------------------------------------

		$scope.attachSampleDomain = function() {
			for(var i in vm.selected.samples) {
				vm.selected.samples[i].sample_domain = {};
				vm.selected.samples[i].sample_domain.notes = [];
				vm.selected.samples[i].sample_domain.processStatus = "c";
			}
			vm.hasSampleDomain = true;
			vm.showing_curated = false;
			vm.selected.creatingSamples = 1;
			vm.counts.rows = vm.selected.samples.length;

		    $scope.updateClipboards();
		    $scope.show_curated();
		}

		$scope.deleteSampleDomain = function() {
			vm.selected.deletingSamples = 1;
			for(var i in vm.selected.samples) {
				vm.selected.samples[i].sample_domain.processStatus = "d";
			}
			vm.hasSampleDomain = false;
			vm.showing_curated = true;
			$scope.show_curated();
		}

                $scope.updatingGenotype = false
		$scope.updateGenotype = function(row_num, display_index, displayed_array) {
                        $scope.updatingGenotype = true
			var working_domain = vm.selected.samples[row_num - 1].sample_domain;
                        
                        if (!working_domain.genotype_object) {
                            working_domain.genotype_object = {}
                        }
                        if (!working_domain.genotype_object.mgiid) {
                            working_domain.genotype_object.mgiid = 'MGI:2166310'
                            working_domain._genotype_key = -1
                        }

			if(!working_domain._genotype_key) {
				for(var i = display_index; i >= 0; i--) {
					if(displayed_array[i].sample_domain._genotype_key) {
						working_domain._genotype_key = displayed_array[i].sample_domain._genotype_key;
						break;
					}
				}
			}	

                        GxdGenotypeSearchAPI.search({ accID: working_domain.genotype_object.mgiid}, function(data) {
                            console.log("Genotype:", data)
                            if (data.length === 1){
                                working_domain._genotype_key = data[0].genotypeKey
                            } else {
                                alert("Invalid genotype ID: " + working_domain.genotype_object.mgiid)
                                working_domain._genotype_key = -1
                            }
                            $scope.updatingGenotype = false
                            GxdGenotypeGetAPI.get({key:working_domain._genotype_key}, function(data) {
				// working_domain._genotype_key = data.items[0].mgiid;
                                const combo1 = data.alleleDetailNote ? data.alleleDetailNote.noteChunk : ''
				working_domain.genotype_object = {
                                    _genotype_key: data.genotypeKey,
                                    _strain_key: data.strainKey,
                                    isConditional: data.isConditional,
                                    mgiid: data.accID,
                                    combination1_cache : combo1,
                                    geneticbackground: data.strain
                                }
                            }, function(err) {
                                $scope.updatingGenotype = false
			    });
                        }, function (err) {
                                $scope.updatingGenotype = false
                        });

		}

		$scope.updateAgeRange = function(row_num, display_index, displayed_array) {
			var working_domain = vm.selected.samples[row_num - 1].sample_domain;
			if (working_domain.processStatus != "c") {
				working_domain.processStatus = "u";
			}
			if(!working_domain.agerange) {
				for(var i = display_index; i >= 0; i--) {
					if(displayed_array[i].sample_domain.agerange) {
						working_domain.agerange = displayed_array[i].sample_domain.agerange;
						break;
					}
				}
			}
		}

                /* called on every keystroke in the  celltype field */
                $scope.celltypeChanged = function(index) {
                    const domain = vm.selected.samples[index].sample_domain
                    const ct = vm.id2celltype[domain.celltype_id]
                    if (ct) {
                        domain.cl_object = ct
                        domain._celltype_term_key = ct.termKey
                    } else {
                        domain.cl_object = null
                        domain._celltype_term_key = null
                    }
                    $scope.setSampleStatus(index)
                }

                /* called when user selects a CL term from the dropdown list */
		$scope.updateCL2 = function($item, $model, $label, row_num) {
                        const domain = vm.selected.samples[row_num - 1].sample_domain
			domain.cl_object = $item
			domain._celltype_term_key = $item.objectKey
                        domain.celltype_id = $item.primaryid
			if (domain.processStatus != "c") {
				domain.processStatus = "u";
			}
                }

                /* called when user selects an EMAPS term from the dropdown list */
		$scope.updateEMAPS2 = function($item, $model, $label, row_num) {
			vm.emaps_changed = true;
			vm.selected.samples[row_num - 1].sample_domain._emapa_key = $item.emaps_term.primaryid;
			vm.selected.samples[row_num - 1].sample_domain.emaps_object = $item.emaps_term;
			vm.emaps_cache[$item.emaps_term.primaryid] = $item.emaps_term;
			if (vm.selected.samples[row_num - 1].sample_domain.processStatus != "c") {
				vm.selected.samples[row_num - 1].sample_domain.processStatus = "u";
			}
		}

                /* called when user tabs out of the CL field */
		$scope.updateCL = function(row_num, display_index, displayed_array) {
			var working_domain = vm.selected.samples[row_num - 1].sample_domain;

			if (working_domain.processStatus != "c") {
				working_domain.processStatus = "u";
			}

                        // if tabbing out of an empty cell, copy down value from above
			if(!working_domain._celltype_term_key) {
                                working_domain.cl_object = null
                                working_domain.celltype_id = ''
				for(var i = display_index; i >= 0; i--) {
					if(displayed_array[i].sample_domain._celltype_term_key) {
						working_domain._celltype_term_key = displayed_array[i].sample_domain._celltype_term_key;
						break;
					}
				}

                        }

			if (working_domain._celltype_term_key) {
                                const ctterm = vm.key2celltype[working_domain._celltype_term_key]
                                if (ctterm) {
                                    working_domain.cl_object = ctterm
                                    working_domain.celltype_id = ctterm.primaryid
                                } else {
                                    working_domain._celltype_term_key = null
                                    working_domain.cl_object = null
                                    working_domain.celltype_id = ''
                                }
			} else {
				working_domain.cl_object = null
                                working_domain.celltype_id = ''
			}

                }

                /* called when user tabs out of the EMAPS field */
		$scope.updateEMAPS = function(row_num, display_index, displayed_array) {
			var working_domain = vm.selected.samples[row_num - 1].sample_domain;

			if (working_domain.processStatus != "c") {
				working_domain.processStatus = "u";
			}

			if(!working_domain._emapa_key) {
				for(var i = display_index; i >= 0; i--) {
					if(displayed_array[i].sample_domain._emapa_key) {
						working_domain._emapa_key = displayed_array[i].sample_domain._emapa_key;
						break;
					}
				}
			}

			if (working_domain._emapa_key) {
				vm.emaps_changed = false;
				if(vm.emaps_cache[working_domain._emapa_key]) {
					working_domain._emapa_key = vm.emaps_cache[working_domain._emapa_key].primaryid;
					working_domain.emaps_object = vm.emaps_cache[working_domain._emapa_key];
				} else {
					const arg = { "accessionIds": [{"accID": working_domain._emapa_key}] }
					ValidateTermAPI.search(arg, function(data) {
						if(data.length > 0) {
							const d = data[0]
							const emaps_object = {
								_emapa_term_key: d.emapaTermKey,
								_stage_key: d.theilerstage,
								_term_key: d.termKey,
								emapa_term: {
									_term_key: d.emapaTermKey,
									abbreviation: d.abbreviation,
									term: d.term
								},
								primaryid: d.accessionIds[0].accID
							}
							working_domain._emapa_key = emaps_object.primaryid;
							working_domain.emaps_object = emaps_object;
							vm.emaps_cache[working_domain._emapa_key] = emaps_object;
						} else {
							delete working_domain["emaps_object"];
						}
					}, function(err) {
					});
				}
			} else {
				delete working_domain["emaps_object"];
			}
		}

		$scope.copyDownColumn = function(index, array, field) {
                        if ($scope.updatingGenotype) return;
			var src = array[index].sample_domain;
			for(var i = index; i < array.length; i++) {
				var dst = array[i].sample_domain;
				if (dst.processStatus != "c") {
					dst.processStatus = "u";
				}
				copyDomain(src, dst, field);
			}
		}
		$scope.copyUpColumn = function(index, array, field) {
                        if ($scope.updatingGenotype) return;
			var src = array[index].sample_domain;
			for(var i = index; i >= 0; i--) {
				var dst = array[i].sample_domain;
				if (dst.processStatus != "c") {
					dst.processStatus = "u";
				}
				copyDomain(src, dst, field);
			}
		}

		var copyDomain = function(src, dst, field) {
			if(field == "organism") dst._organism_key = src._organism_key;
			if(field == "relevance") dst._relevance_key = src._relevance_key;
			if(field == "genotype") {
				dst._genotype_key = src._genotype_key;
				dst.genotype_object = src.genotype_object;
			}
			if(field == "ageunit") dst.ageunit = src.ageunit;
			if(field == "agerange") dst.agerange = src.agerange;
			if(field == "sex") dst._sex_key = src._sex_key;
			if(field == "celltype") {
                                dst._celltype_term_key = src._celltype_term_key;
                                dst.cl_object = src._celltype_term_key ? src.cl_object : null
                                dst.celltype_id = dst.cl_object ? dst.cl_object.primaryid : ''
                        }
			if(field == "rnaseqtype") {
                                dst._rnaseqtype_key = src._rnaseqtype_key;
                                dst.rnaseqtype = src.rnaseqtype;
                        }
			if(field == "emapa") {
				dst._emapa_key = src._emapa_key;
				dst.emaps_object = src._emapa_key ? src.emaps_object : null
			}
			if(field == "notes") {

				if(src.notes.length == 0) { // empty note; clear existing notes
					if(dst.notes.length != 0) {
						dst.notes[0].text = "";
					}
				} else {
					dst.notes.push({});
					dst.notes[0].text = src.notes[0].text;
				}
			}
		}
		
		// loading raw samples
		$scope.loadSamples = function(consolidate) {

			if(vm.data.length == 0) return; // bail if no experiment is loaded

			vm.downloadError = "";
			pageScope.loadingStart();

			// create submission object;  move needed values
			var sampleSubmission = {};
			sampleSubmission["_experiment_key"] = vm.selected["_experiment_key"];

			GxdExperimentSampleAPI.search(sampleSubmission, function(data) {
				console.log(data);

				vm.sample_data = data; // sample_data is only used for debug display

				vm.selected_columns = {};
				vm.counts.consolidated = data.length;
				vm.counts.totalraw = data.length;

				// boolean; existance of curated samples
				var existingSamples = vm.selected.samples.length > 0;

				let sampleCount = 0;
				while(sampleCount < data.length) {
					var sample = data[sampleCount];
					var raw_sample = sample.raw_sample;

					// map to existing or create a new sample
					var selectedSample = null;
					if(existingSamples) { // has existing curated samples; match name
						for(var j in vm.selected.samples) {
							if(vm.selected.samples[j].name.includes(sample.name)) {
								// found matching row
								selectedSample = vm.selected.samples[j]; 
								selectedSample.raw_sample = {}
								selectedSample.raw_sample["name"] = sample.name;
								vm.checked_columns["name"] = true;

								// variable handling; 0-n
								for(var j in raw_sample.variable) {

									var column_name = "variable_" + raw_sample.variable[j].name.toLowerCase().replace(/[ :\.]/g, "_");
									vm.selected_columns[column_name] = {"type": "", "name": raw_sample.variable[j].name, "column_name": column_name};
									selectedSample.raw_sample[column_name] = raw_sample.variable[j].value; 
									vm.checked_columns[column_name] = true;
								}

							}
						}
					} 
					else { // has no existing curated samples
						selectedSample = {};
						selectedSample.row_num = parseInt(sampleCount) + 1; // 1 based instead of 0
						selectedSample.name = sample.name;
						selectedSample.raw_sample = {}
						selectedSample.raw_sample["name"] = sample.name;
						vm.checked_columns["name"] = true;

						// variable handling; 0-n
						for(var j in raw_sample.variable) {

							var column_name = "variable_" + raw_sample.variable[j].name.toLowerCase().replace(/[ :\.]/g, "_");
							vm.selected_columns[column_name] = {"type": "", "name": raw_sample.variable[j].name, "column_name": column_name};
							selectedSample.raw_sample[column_name] = raw_sample.variable[j].value; 
							vm.checked_columns[column_name] = true;
						}
						vm.selected.samples[sampleCount] = selectedSample;
					}
					sampleCount++;
				}
				
				// set page data to show samples
				vm.hasRawSamples = true;
				if(!existingSamples) {	
					vm.showing_curated = true;
					$scope.show_curated();
				}
				pageScope.loadingEnd();
			}, function(err) {
				vm.downloadError = "Retrieval of samples failed";
				pageScope.loadingEnd();
			});
		}
		
		$scope.firstItem = function() {
			if(vm.data.length == 0 || pageScope.isLoading()) return;
			pageScope.loadingStart();
			vm.selectedIndex = 0;
			resetForm();
			setSelected();
			vm.showing_curated = false;
			$scope.show_curated();
		}
		$scope.nextItem = function() {
			if(vm.data.length == 0 || pageScope.isLoading()) return;
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
		}

		$scope.lastItem = function() {
			if(vm.data.length == 0 || pageScope.isLoading()) return;
			pageScope.loadingStart();
			vm.selectedIndex = vm.data.length - 1;
			resetForm();
			setSelected();
			vm.showing_curated = false;
			$scope.show_curated();
		}

		$scope.prevItem = function() {
			if(vm.data.length == 0 || pageScope.isLoading()) return;
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
		}

		$scope.setItem = function(index) {
			if(pageScope.isLoading()) return;
			pageScope.loadingStart();
			vm.selectedIndex = index;
			resetForm();
			setSelected();
			vm.showing_curated = false;
			$scope.show_curated();
		}

		function resetForm() {
			delete vm.selected.samples;
			vm.checked_columns = [];
			vm.downloadError = "";
			vm.counts = {};
			vm.resettable = true;
			vm.showing_raw = true;
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
		}


		$scope.editPubmedIds = function() {
			console.log("Editing pubmed Ids");
			if(vm.selected.pubmed_ids){
				var pubmedIdStrings = [];
				for(var i in vm.selected.pubmed_ids) {
					pubmedIdStrings[i] = vm.selected.pubmed_ids[i];
				}
				vm.selected.newPubmedIds = pubmedIdStrings.join(" ");
			}
			vm.editing_pubmed = !vm.editing_pubmed;
		}


		$scope.search = function() {
			pageScope.loadingStart();
			vm.selected.experiment_variables = [];

			resetForm();

			for(var i in vocabs.expvars) {
				if(vocabs.expvars[i].checked) {
					vm.selected.experiment_variables.push(vocabs.expvars[i]);
				}
			}

			GxdExperimentSummarySearchAPI.search(vm.selected, function(data) {
				//console.log(data);
				vm.data = data;
				if(vm.data.length > 0) {
					vm.selectedIndex = 0;
					setSelected();
					vm.showing_curated = false;
					$scope.show_curated();
				} else {
					pageScope.loadingEnd();
				}
				vm.message = {};
			}, function(err) {
				setMessage(err.data);
				pageScope.loadingEnd();
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
				$timeout(turnOffCheck, 2700);
			} else {
				vm.message.type = "info";
				vm.message.text = data.message;
			}
		}

		$scope.show_raw = function() {
			vm.showing_raw = !vm.showing_raw;
			for(var i in vm.selected_columns) {
				vm.checked_columns[i] = vm.showing_raw;
			}
		}

		$scope.show_curated = function() {
			vm.showing_curated = !vm.showing_curated;
			for(var i in vm.curated_columns) {
				if(vm.curated_columns[i].column_name != "relevance" && vm.curated_columns[i].column_name != "notes" && vm.curated_columns[i].column_name != "celltype") {
					vm.checked_columns[vm.curated_columns[i].column_name] = vm.showing_curated;
				}
			}
			vm.checked_columns["name"] = true;
		}

		$scope.modifyDisabled = function() {
			return (pageScope.pageModifyDisabled() || vm.data.length == 0 || $scope.updatingGenotype);
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

		$scope.modifyItem = function() {

			if ($scope.modifyDisabled()) return;
			pageScope.loadingStart();

			vm.selected.experiment_variables = [];
			for(var i in vocabs.expvars) {
				if(vocabs.expvars[i].checked == true) {
					vm.selected.experiment_variables.push(vocabs.expvars[i]);
				}
			}

			// save off old raw samples for later use after update
			var oldRawSamples = [];
                        for (var i=0; i<vm.selected.samples.length; i++) {
				if(vm.selected.samples[i].sample_domain) {
					vm.selected.samples[i].sample_domain.name = vm.selected.samples[i].name;
				}
				if(vm.selected.samples[i].raw_sample) {
					oldRawSamples.push(vm.selected.samples[i].raw_sample);
					// This removes the raw sample from going to the server on save
					//	delete vm.selected.samples[i].raw_sample;
				}
			}

			// Clone vm.selected; this is done so we can set defaults and 
			// remove unwanted data; this wasn't an issue for the python API, 
			// but the JavaAPI thowns an exception
			var selectedClone = JSON.parse(JSON.stringify(vm.selected));
			if (vm.editing_pubmed == true) {
				selectedClone.deletingPubmedIds = 1;
			}
			delete selectedClone.filters;
                        delete selectedClone.clCount
			selectedClone.samples = [];
			for(var i in vm.selected.samples) {
				if (!vm.selected.samples[i].sample_domain) continue;

                                selectedClone.hasSamples = 1;

                                selectedClone.samples[i] = JSON.parse(JSON.stringify(vm.selected.samples[i].sample_domain));
                                delete selectedClone.samples[i].row_num

                                // flag experiment as having modified samples
                                if (selectedClone.samples[i].processStatus == "u" ) {
                                                selectedClone.modifyingSamples = 1;
                                }
                                // if the emapa key is empty, remove the emaps object
                                if ((selectedClone.samples[i]._emapa_key == "" || selectedClone.samples[i]._emapa_key == null) 
                                        && selectedClone.samples[i].emaps_object != null) {
                                                delete selectedClone.samples[i].emaps_object;
                                }
                                // ditto for cell types
                                if ( !selectedClone.samples[i]._celltype_term_key ) {
                                        delete selectedClone.samples[i].cl_object
                                        selectedClone.samples[i]._celltype_term_key = null
                                } else {
                                        const cl = selectedClone.samples[i].cl_object
                                        selectedClone.samples[i].cl_object = {
                                            term: cl.term,
                                            _term_key: cl._term_key,
                                            abbreviation: cl.abbreviation
                                        }
                                }
                                delete selectedClone.samples[i].celltype_id

                                // --- Setting Defaults

                                // Some UI code sets the below keys to strings; need to reset to numeric,
                                // else the API throws exceptions. -pf
                                selectedClone.samples[i]._emapa_key = 0;
                                selectedClone.samples[i]._genotype_key = 0;
                                
                                // Organism
                                if (selectedClone.samples[i]._organism_key == null) {
                                        selectedClone.samples[i]._organism_key = 1;
                                }

                                // GXD Relevance
                                if (selectedClone.samples[i]._relevance_key == null) {
                                        selectedClone.samples[i]._relevance_key = 20475450;
                                }

                                // RNASeqType
                                //if (selectedClone.samples[i]._rnaseqtype_key == null) {
                                        //selectedClone.samples[i]._rnaseqtype_key = ?;
                                //}

                                // other fields, dependant upon GXD relevance
                                if (selectedClone.samples[i]._relevance_key == 20475450) {
                                        if (selectedClone.samples[i].ageunit == null) {					
                                                selectedClone.samples[i].ageunit = "Not Specified";
                                        }
                                        if (selectedClone.samples[i]._sex_key == null) {					
                                                selectedClone.samples[i]._sex_key = 315167;
                                        }
                                        if (selectedClone.samples[i].genotype_object == null) {					
                                                selectedClone.samples[i].genotype_object = {};
                                                selectedClone.samples[i].genotype_object._genotype_key = -1;
                                        }
                                } else {
                                        if (selectedClone.samples[i].ageunit == null) {					
                                                selectedClone.samples[i].ageunit = "Not Applicable";
                                        }
                                        if (selectedClone.samples[i]._sex_key == null) {					
                                                selectedClone.samples[i]._sex_key = 315168;
                                        }
                                        if (selectedClone.samples[i].genotype_object == null) {					
                                                selectedClone.samples[i].genotype_object = {};
                                                selectedClone.samples[i].genotype_object._genotype_key = -2;
                                        }
                                }

                                // build age value
                                if (selectedClone.samples[i].agerange == null || selectedClone.samples[i].agerange == "") {
                                        selectedClone.samples[i].age = selectedClone.samples[i].ageunit;
                                } else {
                                        selectedClone.samples[i].age = selectedClone.samples[i].ageunit + " " + selectedClone.samples[i].agerange;
                                }
			}

                        if (vm.selected.deletingSamples === 1) {
                            selectedClone.hasSamples = 0;
                        }

                        if (vm.selected.deletingSamples === 1) {
                            // if deleting samples, reset curation state to Not Done
                            selectedClone._curationstate_key = vocabs.curation_states_by_name['Not Done']._term_key
                        } else if (vm.selected.hasSamples || vm.selected.creatingSamples) {
                            // has samples or creating samples, set curation state to Done
                            selectedClone._curationstate_key = vocabs.curation_states_by_name['Done']._term_key
                        } else if (vm.selected._evaluationstate_key === vocabs.evaluation_states_by_name['No']._term_key) {
                            // if eval state is No, set curation state to Not Applicable
                            selectedClone._curationstate_key = vocabs.curation_states_by_name['Not Applicable']._term_key
                        } else if ((vm.selected._evaluationstate_key === vocabs.evaluation_states_by_name['Yes']._term_key) 
                                || (vm.selected._evaluationstate_key === vocabs.evaluation_states_by_name['Maybe']._term_key)) {
                            // if eval state is Yes or Maybe, set curation state to Not Done (we tested for hasSamples aleady, so cannot be Done)
                            selectedClone._curationstate_key = vocabs.curation_states_by_name['Not Done']._term_key
                        }
                        // sanity check that curation state is set
                        if (!selectedClone._curationstate_key) {
                            throw "Internal error: curation state key is null."
                        }

			// send the update with clone from above
                        vm.selectedClone = selectedClone;
			GxdExperimentAPI.update({key: vm.selected._experiment_key}, selectedClone, function(data) {

				updateLoadedData(data.items[0], true);

                                for (var i=0; i<oldRawSamples.length; i++) {
					for(var j in vm.selected.samples) {
						if(vm.selected.samples[j].name == oldRawSamples[i].name) {
							vm.selected.samples[j].raw_sample = oldRawSamples[i];
						}
					}
				}

				setMessage({success: true, message: "Successfull Saved: " + vm.selected.primaryid});
				pageScope.loadingEnd();
			}, function(err) {
				setMessage(err.data);
				pageScope.loadingEnd();
			});
		}

		$scope.getClipboard = function() {
				return vm.clipboard;
		}

		$scope.getClipboardCL = function() {
				return vm.clipboardCL;
		}

		$scope.updateClipboards = function() {
                        $scope.updateClipboard()
                        $scope.updateClipboardCL()
		}

		$scope.updateClipboard = function() {
			console.log("updateClipboard");

			var params = {};
                        
			params.createdBy = USERNAME;
			params._experiment_key = vm.selected ? vm.selected._experiment_key : null

			EmapaHTSampleBySetUserAPI.search(params, function(data) {
				if (data.length > 0) {
				        vm.clipboard = data.map(d => {
					    const emapsid = d.primaryid.replace("EMAPA","EMAPS") + d.stage;
					    return {
						emapa_stage: d.stage,
						emapa_stage_key: d.stage,
						emapa_term: d.term,
						emapa_term_key: d.objectKey,
						emaps_term: {
							_emapa_term_key: d.objectKey,
							_stage_key: d.stage,
							_term_key: null,
							emapa_term: {
								_term_key: d.objectKey,
								abbreviation: null,
								term: d.term
							},
							primaryid: emapsid
						}
					    }
					});
				}
				else {
				        vm.clipboard = [];
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: EmapaBySetUserAPI.search");
			});
		}

		$scope.updateClipboardCL = function() {
			console.log("updateClipboardCL");

			var params = {};
                        
			params.createdBy = USERNAME;
			params._experiment_key = vm.selected ? vm.selected._experiment_key : null

			CellTypeHTSampleBySetUserAPI.search(params, function(data) {
				if (data.length > 0) {
				        vm.clipboardCL = data;
				}
				else {
				        vm.clipboardCL = [];
				}
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: CellTypeBySetUserAPI.search");
			});
		}

		$scope.setSampleStatus = function(index) {
                        const domain = vm.selected.samples[index].sample_domain
			if (domain.processStatus != "c") {
				domain.processStatus = "u";
			}
		}

		VocTermSearchAPI.search({name:"GXD HT Evaluation State"}, function(data) {
                    vocabs.evaluation_states = data.items[0].terms;
                    vocabs.evaluation_states_by_name = {}
                    vocabs.evaluation_states.forEach( es => vocabs.evaluation_states_by_name[es.term] = es )
                });
		VocTermSearchAPI.search({name:"GXD HT Curation State"}, function(data) {
			vocabs.curation_states = data.items[0].terms;
			// Sets up hash for term lookup
			vocabs.curation_states_hash = {};
			vocabs.curation_states_by_name = {};
			for(var i = 0; i < vocabs.curation_states.length; i++) {
				var curation_state = vocabs.curation_states[i];
				vocabs.curation_states_hash[curation_state._term_key] = curation_state;
                                vocabs.curation_states_by_name[curation_state.term] = curation_state;
			}
		});
		VocTermSearchAPI.search({name:"GXD HT Study Type"}, function(data) { vocabs.study_types = data.items[0].terms; });
		VocTermSearchAPI.search({name:"GXD HT Age"}, function(data) { vocabs.ages = data.items[0].terms; });
		VocTermSearchAPI.search({name:"GXD HT Experiment Type"}, function(data) { vocabs.experiment_types = data.items[0].terms; });
		VocTermSearchAPI.search({name:"GXD HT Experiment Variables"}, function(data) { vocabs.expvars = data.items[0].terms; });
		VocTermSearchAPI.search({name:"Gender"}, function(data) { vocabs.genders = data.items[0].terms; });
		VocTermSearchAPI.search({name:"Cell Ontology"}, function(data) {
                    vocabs.celltypes = data.items[0].terms;
                    // index the terms by CL id
                    vm.id2celltype = {}
                    vocabs.celltypes.forEach(c => vm.id2celltype[c.primaryid] = c)
                    // index the terms by term key
                    vm.key2celltype = {}
                    vocabs.celltypes.forEach(c => vm.key2celltype[c._term_key] = c)
                });
		VocTermSearchAPI.search({name:"GXD HT Relevance"}, function(data) { vocabs.relevances = data.items[0].terms; });
		VocTermSearchAPI.search({name:"GXD HT RNA-Seq Type"}, function(data) { vocabs.rnaseqtypes = data.items[0].terms; });
		GxdHTSampleOrganismSearchAPI.search({name:"GXD HT Sample"}, function(data) { vocabs.organisms = data; });
		GxdExperimentTotalCountAPI.get(function(data) { vm.total_records = data.total_count; });

                vocabs.yesno = []
                vocabs.yesno[0] = { "termKey": "1", "term": "Yes" }
                vocabs.yesno[1] = { "termKey": "0", "term": "No" }

		$scope.updateClipboards();

		var shortcuts = Mousetrap($document[0].body);

		$scope.KclearAll = function() { $scope.clearAll(); $scope.$apply(); }

		$scope.KmodifyItem = function() {
                    document.activeElement.blur()
                    if($scope.updatingGenotype) return; 
                    $scope.modifyItem(); 
                    $scope.$apply();
                }
		$scope.Ksearch = function() { $scope.search(); $scope.$apply(); }
		$scope.KfirstItem = function() { $scope.firstItem(); $scope.$apply(); }
		$scope.KprevItem = function() { $scope.prevItem(); $scope.$apply(); }
		$scope.KnextItem = function() { $scope.nextItem(); $scope.$apply(); }
		$scope.KlastItem = function() { $scope.lastItem(); $scope.$apply(); }
		$scope.KupdateClipboards = function() { $scope.updateClipboards(); $scope.$apply(); }

		shortcuts.bind(['ctrl+alt+c'], $scope.KclearAll);
		shortcuts.bind(['ctrl+alt+m'], $scope.KmodifyItem);
		shortcuts.bind(['ctrl+alt+s'], $scope.Ksearch);
		shortcuts.bind(['ctrl+alt+p'], $scope.KprevItem);
		shortcuts.bind(['ctrl+alt+n'], $scope.KnextItem);
		shortcuts.bind(['ctrl+alt+f'], $scope.KfirstItem);
		shortcuts.bind(['ctrl+alt+l'], $scope.KlastItem);
		shortcuts.bind(['ctrl+alt+u'], $scope.KupdateClipboards);

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
