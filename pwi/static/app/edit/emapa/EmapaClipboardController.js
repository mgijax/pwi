(function() {
	'use strict';
	angular.module('pwi.gxd').controller('EmapaClipboardController', EmapaClipboardController);

	function EmapaClipboardController(
			// angular tools
			$document,
			$filter,
			$http,  
			$location,
			$q,
			$scope, 
			$timeout,
			$window, 
			// general purpose utilities
			ErrorMessage,
			FindElement,
			Focus,
			
			// API Resources
			VocTermGetByAccidAPI,
			TermSearchAPI,
			MGISetGetBySeqNumAPI,
			MGISetMemberDeleteAPI,
                        MGISetUpdateAPI,
                        MGISetGetAPI,
			
			// Config
			JAVA_API_URL,
			RESOURCE_PATH,
			USERNAME
	) {
		var pageScope = $scope.$parent;
		
		$scope.vm = {};
		var vm = $scope.vm;
		
		// search fields
		vm.termSearch = "";
		vm.stageSearch = "";
		vm.searchResults = { items:[], total_count: 0 };
		
		// current selected term
		vm.selectedTerm = { term:"", primaryid: "", startstage: "", endstage: ""};
		vm.selectedStage = 0;
		
		// clipboard 
		vm.stagesToAdd = "";
		vm.clipboardResults = { items:[], total_count: 0 };
		
		vm.termDetail = {}
		
		$scope.RESOURCE_PATH = RESOURCE_PATH;
		
		// loading variables
		$scope.searchLoading = false;
		$scope.clipboardLoading = false;
		$scope.detailLoading = false;
		
		// TreeView variable
		window.emapaTree = null;
		
		function init() {
			
			loadInitialQuery();
			
			refreshClipboardItems();
			
			addShortcuts();
			
			enableResizableContainers();
			
		}
		
		/*
		 * If user passed in termSearch or stageSearch
		 *   query parameters
		 */
		function loadInitialQuery() {
			
			var params = $location.search();
			
			// run predefined search if form parameters are passed in
			if (params.termSearch || params.stageSearch) {
				
				if (params.termSearch) {
					vm.termSearch = params.termSearch;
				}
				
				if (params.stageSearch) {
					vm.stageSearch = params.stageSearch;
				}
				
				search();
			}
		}
		
                // reset clipboard
                function resetClipboard() {
                        console.log("resetClipboard()");
                        vm.clipboardDomain = {
                                "setKey": "1046",
                                "createdBy": USERNAME
                        }
                        vm.clipboardDomain.emapaClipboardMembers = [];
                }
		// load the clipboard
		function refreshClipboardItems() {

			console.log("refreshClipboardItems()" );
			$scope.clipboardLoading = true;

			ErrorMessage.clear();
			
                        if (vm.clipboardDomain == undefined) {
                                resetClipboard();
                        }

			const arg = { setKey: vm.clipboardDomain.setKey, createdBy: vm.clipboardDomain.createdBy }
			var promise =  MGISetGetBySeqNumAPI.search(arg).$promise
			  .then(function(data) {
                                if (data.length > 0) {
                                        console.log("in load setting clipboardDomain.emapaClipboardMembers - data");
                                        vm.clipboardDomain.emapaClipboardMembers = data[0].emapaClipboardMembers;
                                        vm.clipboardResults.items = data[0].emapaClipboardMembers;
                                        vm.clipboardResults.total_count = vm.clipboardResults.items.length
                                }
                                else {
                                        resetClipboard();
                                }
			  },

			  function(error){
			    ErrorMessage.handleError(error);
				throw error;
			  }).finally(function(){
				  $scope.clipboardLoading = false; 
			  });
			
			return promise;
		}

		// Update the clipboard in the db
                function updateClipboard() {
                     console.log("updateClipboard() -> MGISetUpdateAPI()");

                     $scope.clipboardLoading = true;
                     ErrorMessage.clear();

                     var promise = MGISetUpdateAPI.update(vm.clipboardDomain
                        ).$promise.then(function(data) {
                            return refreshClipboardItems();
                          },
                          function(error){
                            ErrorMessage.handleError(error);
                                throw error;
                          }).finally(function(){
                                  $scope.clipboardLoading = false;
                          });

                        return promise;

                }

                function clearClipboardItems() {
                        console.log("clearClipboard()");

                        for(var i=0;i<vm.clipboardDomain.emapaClipboardMembers.length; i++) {
                                vm.clipboardDomain.emapaClipboardMembers[i].processStatus = "d";
                        }
                        updateClipboard()
                }

		function addAllClipboardItems() {
                    function add (i,m) {
                        console.log('addAllClipboardItems.add', i, m)
                        if (i >= 0 && i < vm.searchResults.items.length) {
                            selectTerm(vm.searchResults.items[i])
                            const p = addClipboardItems()
                            p && p.then(() => add(i+1, 'T'))
                        }
                    }
                    add(0)
                    selectFirst()
                }

		function addClipboardItems() {
			
			var termId = getSelectedTermId();
			var emapaId = getEmapaId(termId);
			
			if (!emapaId || emapaId == "") {
				ErrorMessage.notifyError({
					error: "ClipboardError",
					message: "No EMAPA term selected"
				});
				return;
			}
			
			if (!vm.stagesToAdd || vm.stagesToAdd.length == 0) {
				ErrorMessage.notifyError({
					error: "ClipboardError",
					message: "No Stage(s) entered for '" + vm.selectedTerm.term + "'"
				});
				return;
			}
			const stages = parseStages(vm.stagesToAdd)
			stages.forEach(stage => {
			    if (termId.startsWith("EMAPS:") || (stage >= vm.selectedTerm.startstage && stage <= vm.selectedTerm.endstage)) {
				// if term/stage already in clipboard, move it to the end, otherwise create
				// a new one at the end
				// Oh, and another thing... you have to first create the new clipboard items.
				// Then you have to separately reassign all the sequenceNumbers.
				const ecms = vm.clipboardDomain.emapaClipboardMembers
				let existingMember = null;
				let emi = null;
				for (let i = 0; i < ecms.length; i++) {
				    const cm = ecms[i];
				    if (cm.label === vm.selectedTerm.term && cm.emapaStage.stage === ""+stage) {
				        existingMember = cm;
					emi = i;
					break;
				    }
				}

				if (existingMember) {
				    ecms.splice(emi, 1);
				    ecms.push(existingMember);
				} else {
                                    // always want the emapa term key. For emaps terms, it is stored in the "_emapa_term_key" field.
                                    // For emapa terms, it is the _term_key.
                                    console.log('emapaTermKey: ' + vm.selectedTerm.emapaTermKey)
                                    console.log('termKey: ' + vm.selectedTerm.termKey)
                                    console.log('vocabKey: ' + vm.selectedTerm.vocabKey)
                                    if (vm.selectedTerm.emapaTermKey == null && vm.selectedTerm.vocabKey != "90") {
                                        alert("EMAPS term (" + vm.selectedTerm.termKey + ") cannot be used.  Clear and try again.");
                                    }
                                    else {
                                        const key = (vm.selectedTerm.emapaTermKey || vm.selectedTerm.termKey);
				        ecms.push({
					        "processStatus": "c",
					        "setKey": "1046",
					        "objectKey": key,
					        "label": vm.selectedTerm.term,
					        "emapaStage": {"processStatus":"c","stage":""+stage},
					        "createdBy": USERNAME
					        })
                                    }   
				}
			    }
			})

			// create a mapping from stage:label keys to its desired sequenceNum 
			const order = vm.clipboardDomain.emapaClipboardMembers.reduce((ix,cm,i) => {
			    const key = cm.emapaStage.stage + ":" + cm.label
			    ix[key] = i+1
			    return ix
			}, {})

			return updateClipboard().then(() => {
			    vm.clipboardDomain.emapaClipboardMembers.forEach(cm => {
			        const key = cm.emapaStage.stage + ":" + cm.label
				cm.processStatus = 'u'
				cm.sequenceNum = order[key]
			    })
			    return updateClipboard()
			});
		}
		
		function sortClipboardItems() {
			
			vm.clipboardDomain.emapaClipboardMembers.sort((a,b) => {
				// two level sort: by stage, then label
				const sa = parseInt(a.emapaStage.stage)
				const sb = parseInt(b.emapaStage.stage)
				if (sa !== sb) return sa - sb
				if (a.label < b.label) return -1
				if (a.label > b.label) return 1
				return 0
			})
			vm.clipboardDomain.emapaClipboardMembers.forEach((m, i) => {
			    m.processStatus = "u"
			    m.sequenceNum = i+1
			})
			return updateClipboard()
		}
		
		function deleteClipboardItem(_setmember_key) {
			
			$scope.clipboardLoading = true;
			ErrorMessage.clear();
			
			var promise = MGISetMemberDeleteAPI.delete({key: _setmember_key}).$promise
			  .then(function() {
				  refreshClipboardItems();
			  },
			  function(error){
			    ErrorMessage.handleError(error);
				throw error;
			  }).finally(function(){
				$scope.clipboardLoading = false; 
			});
			
			return promise;
		}
		
		/*
		 * TODO (kstone):
		 * Inject these and/or define in their own factory/service
		 */
		function addShortcuts() {
			
			// global shortcuts
			var globalShortcuts = Mousetrap($document[0].body);
			globalShortcuts.bind(['ctrl+alt+c'], function(){
				clear();
				$scope.$apply();
			});
			
			globalShortcuts.bind(['ctrl+alt+k'], clearClipboardItems);

			globalShortcuts.bind(['ctrl+alt+f'], selectFirst);
			globalShortcuts.bind(['ctrl+alt+n'], selectNext);
			globalShortcuts.bind(['ctrl+alt+p'], selectPrev);
			globalShortcuts.bind(['ctrl+alt+l'], selectLast);
		}

		
		/*
		 * Attach jQuery resizable plugin to major container divs
		 */
		function enableResizableContainers() {
			var promise = $q.all([
			        FindElement.byQuery(".browserWrapper"),
			        FindElement.byQuery(".leftContainer"),
			        FindElement.byQuery(".rightContainer"),
			        FindElement.byId("emapTermArea"),
			        FindElement.byId("emapTermAreaWrapper"),
			        FindElement.byId("emapClipBoard"),
			        FindElement.byId("treeViewArea"),
			        FindElement.byId("treeViewAreaWrapper")
			]).then(function(elements){
				var browserWrapper = elements[0],
				leftContainer = elements[1],
				rightContainer = elements[2],
				emapTermArea = elements[3],
				emapTermAreaWrapper = elements[4],
				emapClipBoard = elements[5],
				treeViewArea = elements[6],
				treeViewAreaWrapper = elements[7];
				
				$(leftContainer).resizable({
			        handles: 'e',
			        minWidth: 260,
			        maxWidth: 800,
			        resize: function () {
			            $(leftContainer).css('width', $(leftContainer).outerWidth() / $(browserWrapper).innerWidth() * 100 + '%');
			            $(rightContainer).css('width', 99 - ($(leftContainer).outerWidth() / $(browserWrapper).innerWidth() * 100) + '%');
			        }
			    });
				
				$(emapTermAreaWrapper).resizable({
			        handles: 's',
			        minHeight: 100,
			        resize: function () {
			            $(emapTermArea).css('height', $(emapTermAreaWrapper).outerHeight() - 15 );
			        }
			    });
				
				$(emapClipBoard).resizable({
			        handles: 's'
			    });
				
				$(treeViewAreaWrapper).resizable({
			        handles: 's',
			        minHeight: 100,
			        resize: function () {
			            $(treeViewArea).css('height', $(treeViewAreaWrapper).outerHeight() - 15 );
			        }
			    });
				
			},function(error){
			    ErrorMessage.handleError(error);
				throw error;
			});
			
			return promise;
		}
		
		function parseStages (s) {
			// support comma-separated list and ranges
			// e.g. "11,12,18-20"
			// be forgiving of spaces
			// first split the term search string into individual pieces
			const stageTerms = s.replaceAll(",", " ").trim().split(/ +/)
			// turn these into a list of integers. expand ranges.
			const stages = stageTerms.reduce((lst,s) => {
			    const rng = s.split("-").map(ss => parseInt(ss))
			    if (rng.length === 1) {
				if (!isNaN(rng[0])) lst.push(rng[0])
				    } else if (rng.length === 2) {
					if (!isNaN(rng[0]) && !isNaN(rng[1])) {
					    const minstage = Math.min(rng[0],rng[1])
					    const maxstage = Math.max(rng[0],rng[1])
					    for (let i = minstage; i <= maxstage; i++) lst.push(i)

				}
				    } 
				    return lst
			    }, []).filter(s => s >= 1 && s <= 28);
			return stages
		}

		function search() {
			
			vm.termSearch = vm.termSearch.trim()
			vm.stageSearch = vm.stageSearch.trim()

			if (!vm.termSearch && !vm.stageSearch) {
				return;
			}
			
			$scope.searchLoading = true;
			ErrorMessage.clear();
			
			let arg = {vocabKey:"90"}
			if (vm.termSearch.startsWith("EMAPA:")) {
				arg.accessionIds = [{accID: vm.termSearch}]
			} else if (vm.termSearch) {
				arg.term = vm.termSearch
			}
			if (vm.stageSearch) {
				const stages = parseStages(vm.stageSearch)
				arg.stagesearch = stages.join(",")
			}
			var promise = TermSearchAPI.search(arg).$promise
			  .then(function(results){
				  results.forEach(r => prepareForDisplay(r, vm.termSearch))
				  vm.searchResults.items = results
				  vm.searchResults.total_count = results.length
				  
				  // check if only one stage was submitted
	    			  // must be integer between 1 and 28
				  // if so, make it the active selectedStage
				  var selectedStage = Number(vm.stageSearch)
	    			  if (!selectedStage 
	    		    		|| (selectedStage % 1 != 0)
	    		    		|| (selectedStage < 0)
	    		    		|| (selectedStage > 28)
				) {
					// otherwise set to all stages
					selectedStage = 0
				}
				vm.selectedStage = selectedStage

  				  // reset clipboard input to whatever is in stage search,
  				  // 	even though it is not a single stage
				  if (vm.stageSearch != "") {
	    				vm.stagesToAdd = vm.stageSearch
				  }
				  
				  // set first result as selectedTerm
				  if (results.length > 0) {
					  selectTerm(results[0])
				  }
				  
				  return $q.when()
				  
			  }, 
			  function(error){
			    ErrorMessage.handleError(error);
				throw error;
			  }).finally(function(){
				  $scope.searchLoading = false;
			  }).then(function(){
				  focusClipboard();
			  });
			
			
			return promise;
		}
		
		function selectSearchResult(term) {
			
			if (vm.selectedStage && vm.selectedStage > 0) {
				// verify stage is valid for this term
				if (vm.selectedStage < term.startstage || vm.selectedStage > term.endstage) {
					// if not reset to "all" stages
					vm.selectedStage = 0;
					
					// empty clipboard input
					vm.stagesToAdd = "";
				}
			}
			
			selectTerm(term);
		}
		
		
		function selectFirst() {
                    vm.selectedTermIndex = 0
                    selectTerm(vm.searchResults.items[vm.selectedTermIndex])
                }

		function selectLast() {
                    vm.selectedTermIndex = vm.searchResults.items.length - 1
                    selectTerm(vm.searchResults.items[vm.selectedTermIndex])
                }

		function selectNext() {
                    vm.selectedTermIndex += 1
                    if (vm.selectedTermIndex >= vm.searchResults.items.length) {
                        vm.selectedTermIndex = 0
                    }
                    selectTerm(vm.searchResults.items[vm.selectedTermIndex])
                }

		function selectPrev() {
                    vm.selectedTermIndex -= 1
                    if (vm.selectedTermIndex < 0) {
                        vm.selectedTermIndex = vm.searchResults.items.length - 1
                    }
                    selectTerm(vm.searchResults.items[vm.selectedTermIndex])
                }

		function selectTerm(term) {
			vm.selectedTerm = term;
                        vm.selectedTermIndex = vm.searchResults.items.indexOf(term)
			refreshTermDetail();
			refreshTreeView();
		}
		
		function selectTermNoTreeReload(term) {
			vm.selectedTerm = term;
			refreshTermDetail();
		}
		
		function setPrimaryId (term) {
			term.primaryid = term.accessionIds.filter(a => a.preferred === "1")[0].accID
		}

		function prepareForDisplay (term, termSearch) {
			setPrimaryId(term);
			(term.dagParents || []).forEach(p => setPrimaryId(p));
			term.synonyms = (term.synonyms || []).map(s => s.synonym);
			(term.dagParents || []).sort((a,b) => {
				const a1 = a.edgeLabel === "is-a" ? 0 : 1
				const b1 = b.edgeLabel === "is-a" ? 0 : 1
				if (a.edgeLabel < b.edgeLabel) return -1
				if (b.edgeLabel < a.edgeLabel) return 1
				if (a.term < b.term) return -1
				if (b.term < a.term) return 1
				return 0
			});
			// create stage range for links
			term.stageRange = [];
			for (var i = term.startstage; i <= term.endstage; i++) {
				term.stageRange.push(i);
			}
			if (term.primaryid.startsWith("EMAPA:")) {
			    vm.stageRange = term.stageRange
			}
			if (termSearch) {
			    const ts2 = termSearch.split(";")
			    for (let i = 0; i < ts2.length; i++) {
				let searchString = ts2[i].replaceAll("%",".*").trim()
				if (searchString.startsWith(".*")) searchString = searchString.slice(2)
				if (searchString.endsWith(".*")) searchString = searchString.slice(0,-2)
				const tre = new RegExp("("+searchString+")", "i")
				term.term_bold = term.term.replace(tre, "<mark>$1</mark>")
				if (term.term_bold !== term.term) break;
				const syn = term.synonyms.filter(s => s.search(tre) >= 0)[0]
				if (syn) {
				    term.synonym_bold = syn.replace(tre, "<mark>$1</mark>")
				    break;
				}
			    }
			} else {
				term.term_bold = term.term
			}
		}

		function refreshTermDetail() {
			
			var termId = getSelectedTermId()
			
			if (!termId) {
				// no term to view
				return;
			}
			
			$scope.detailLoading = true;
			
			var promise = VocTermGetByAccidAPI.get({accid:termId}).$promise
			  .then(function(detail) {
				  if (!detail || detail.termKey === null) return;
				  const term = vm.selectedTerm = vm.termDetail = detail;
				  prepareForDisplay(term)
				  if (termId.startsWith("EMAPS:")) {
					const emapaId = termId.replace("EMAPS","EMAPA").slice(0,-2)
				  	const arg2 = {"accessionIds": [{ "accID": emapaId }] }
					return TermSearchAPI.search(arg2).$promise
					    .then(function(detail2){
					    	const emapaTerm = detail2[0]
						const stages = []
						for (let i = emapaTerm.startstage; i <= emapaTerm.endstage; i++)
							stages.push(i);
						vm.stageRange = stages

					    },
					    function (error) {
			    			ErrorMessage.handleError(error);
						throw error;
					    });
				  }
			  },
			  function(error){
			    ErrorMessage.handleError(error);
				throw error;
			  }).finally(function(){
				  $scope.detailLoading = false;
			  });
			
			focusClipboard();
			
			return promise;
		}

		function clear() {
			vm.termSearch = "";
			vm.stageSearch = "";
			
			// clipboard 
			vm.stagesToAdd = "";
			
			ErrorMessage.clear();
			
			Focus.onElementById("termSearch");
		}
		
		function selectStage(stage) {
			vm.selectedStage = stage;
			refreshTermDetail();
			refreshTreeView();
			
			if (stage == 0) {
				vm.stagesToAdd = "";
			}
			else {
				vm.stagesToAdd = ""+stage;
			}
		}
		
		/*
		 * Creates EMAPA or EMAPS ID based on passed in stage
		 */
		function getSelectedTermId() {
			
			if (!vm.selectedTerm || !vm.selectedTerm.primaryid) {
				// no term selected
				return "";
			}
			
			var stage = vm.selectedStage;
			var termId = vm.selectedTerm.primaryid;
			
			if (stage == 0) {
				termId = getEmapaId(termId);
			}
			else {
				termId = getEmapsId(termId, stage);
			}
			
			return termId;
			
		}
		
		function getEmapaId(termId) {
			if (termId.startsWith("EMAPS")) {
				termId = "EMAPA" + termId.slice(5, -2);
			}
			return termId;
		}
		
		function getEmapsId(termId, stage) {
			termId = getEmapaId(termId);
			
			if (stage < 10) {
				stage = "0" + stage;
			}
			
			termId = "EMAPS" + termId.slice(5) + stage;
			return termId;
		}
		
		
		
		function refreshTreeView() {
			
			var termId = getSelectedTermId();
			
			if (!termId || termId=="") {
				// no term to view
				return;
			}
			
			
			/*
			 * Tree configuration
			 */
			var treeNodeRenderer = function(node) {
				var label = node.label;
				
				// add clickable area
				label = "<a class=\"nodeClick fakeLink\" data_id=\"" + node.id + "\">"
					+ label 
					+ "</a>";

				return label;
			};
			
			var clickNode = function(e) {
				e.preventDefault();
				
				// expand this node when term is clicked
				$(this).parent().parent().find(".close").click()
				
				// navigate to this term
				var termId = $(this).attr("data_id");
				var term = $(this).text();
				selectTermNoTreeReload({primaryid:termId, term:term});
				highlightTreeNode(getSelectedTermId());
			};
			
			/*
			 * highlight selected node in tree view
			 */
			var highlightTreeNode = function(id) {
				$(".nodeClick").removeClass("active");
				$(".nodeClick[data_id=\"" + id + "\"]").addClass("active");
			};
			
			// clear old tree view
			var promise = FindElement.byId("emapaTree").then(function(element){
				element.innerHTML = "";
				return $q.when();
			}).then(function(){
				// generate new tree view
				window.emapTree = new MGITreeView({
					target: "emapaTree",
					dataUrl: JAVA_API_URL + "term/getTreeView/" + termId,
					childUrl: JAVA_API_URL + "term/getTreeViewChildren/",
					nodeRenderer: treeNodeRenderer,
					LOADING_MSG: "Loading data for tree view...",
					afterInitialUpdate: function() {

						// after update, auto-scroll to node with current ID
						window.emapTree.scrollTo(termId);
					},
					afterUpdate: function() {
						
						$(".nodeClick").off("click");
						
						// add nodeClick event handlers after every update
						$(".nodeClick").click(clickNode);
						
						highlightTreeNode(getSelectedTermId());
						
						focusClipboard();
					}
				});
			});
			
			focusClipboard();
			
			return promise;
		}
		
		function focusClipboard() {
			var promise = Focus.onElementById("clipboardInput");
			return promise;
		}
		
		/*
		 * expose functions to template
		 */
		$scope.refreshClipboardItems = refreshClipboardItems;
		$scope.addClipboardItems = addClipboardItems;
		$scope.addAllClipboardItems = addAllClipboardItems;
		$scope.sortClipboardItems = sortClipboardItems;
		$scope.clearClipboardItems = clearClipboardItems;
		$scope.deleteClipboardItem = deleteClipboardItem;
		$scope.search = search;
		$scope.clear = clear;
		
		$scope.selectSearchResult = selectSearchResult;
		$scope.selectTerm = selectTerm;
		$scope.selectStage = selectStage;
		
		init();
		
	}

})();
