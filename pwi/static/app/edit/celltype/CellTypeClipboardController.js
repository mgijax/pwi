(function() {
	'use strict';
	angular.module('pwi.celltype').controller('CellTypeClipboardController', CellTypeClipboardController);

	function CellTypeClipboardController(
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
			TermSearchAPI,
                        MGISetGetBySeqNumAPI,
                        MGISetMemberDeleteAPI,
                 
                        // global APIs
                        MGISetUpdateAPI,
                        MGISetGetAPI,

			// Config
			RESOURCE_PATH,
			JAVA_API_URL,
                        USERNAME
	) {
		var pageScope = $scope.$parent;
		$scope.USERNAME = USERNAME;
		$scope.vm = {};
		var vm = $scope.vm;
		
                // default booleans for page functionality
                vm.hideApiDomain = true;       // JSON package
                vm.hideVmData = true;          // JSON package + other vm objects

		// search fields
		vm.termSearch = "";
		vm.searchResults = { items:[], total_count: 0 };
		
		// current selected term
		vm.selectedTerm = ''; 
		
		// clipboard 
		vm.clipboardResults = { items:[], total_count: 0 };
		
		
		$scope.RESOURCE_PATH = RESOURCE_PATH;
		
		// loading variables
		$scope.searchLoading = false;
		$scope.clipboardLoading = false;
		$scope.detailLoading = false;
		
		// TreeView variable
		window.celltypeTree = null;
		
		function init() {
			
			loadInitialQuery();
			
			loadClipboard();
			
			addShortcuts();
			
			enableResizableContainers();
			
		}
		
		/*
		 * If user passed in termSearch query parameters
		 */
		function loadInitialQuery() {
			
			var params = $location.search();
			
			// run predefined search if form parameters are passed in
			if (params.termSearch ) {
				
				if (params.termSearch) {
					vm.termSearch = params.termSearch;
				}
				
				
				search();
			}
		}
		// load the clipboard
		function loadClipboard() {

			console.log("loadClipboard()" );
			$scope.clipboardLoading = true;

			ErrorMessage.clear();
			
                        if (vm.clipboardDomain == undefined) {
                                resetClipboard();
                        }

			var promise =  MGISetGetBySeqNumAPI.search(vm.clipboardDomain).$promise
			  .then(function(data) {
                                if (data.length > 0) {
                                        console.log("in load setting clipboardDomain.celltypeClipboardMembers - data");
                                        vm.clipboardDomain.celltypeClipboardMembers = data[0].celltypeClipboardMembers;
                                        vm.clipboardResults.items = data[0].celltypeClipboardMembers;
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
			
			globalShortcuts.bind(['ctrl+alt+k'], clearClipboard);
		}

		
		/*
		 * Attach jQuery resizable plugin to major container divs
		 */
		function enableResizableContainers() {
			var promise = $q.all([
			        FindElement.byQuery(".browserWrapper"),
			        FindElement.byQuery(".leftContainer"),
			        FindElement.byQuery(".rightContainer"),
			        FindElement.byId("celltypeTermArea"),
			        FindElement.byId("celltypeTermAreaWrapper"),
			        FindElement.byId("celltypeClipBoard"),
			        FindElement.byId("treeViewArea"),
			        FindElement.byId("treeViewAreaWrapper")
			]).then(function(elements){
				var browserWrapper = elements[0],
				leftContainer = elements[1],
				rightContainer = elements[2],
				celltypeTermArea = elements[3],
				celltypeTermAreaWrapper = elements[4],
				celltypeClipBoard = elements[5],
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
				
				$(celltypeTermAreaWrapper).resizable({
			        handles: 's',
			        minHeight: 100,
			        resize: function () {
			            $(celltypeTermArea).css('height', $(celltypeTermAreaWrapper).outerHeight() - 15 );
			        }
			    });
				
				$(celltypeClipBoard).resizable({
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

                // reset clipboard
                function resetClipboard() {
                        console.log("resetClipboard()");
                        vm.clipboardDomain = {
                                "setKey": "1059",
                                "createdBy": USERNAME
                        }
                        vm.clipboardDomain.celltypeClipboardMembers = [];
                }

                
                // add current term to clipboard
		function modifyClipboard() {
			console.log("modifyClipboard() -> MGISetUpdateAPI()");

			var termId = getSelectedTermId();
			
			if (!termId || termId == "") {
				ErrorMessage.notifyError({
					error: "ClipboardError",
					message: "No Cell Type term selected"
				});
				return;
			}
			
			$scope.clipboardLoading = true;
			ErrorMessage.clear();
                        /*
			var promise = MGISetUpdateAPI.update(vm.clipboardDomain
			).$promise.then(function(data) {
			    return loadClipboard();
			  },
			  function(error){
			    ErrorMessage.handleError(error);
				throw error;
			  }).finally(function(){
				  $scope.clipboardLoading = false; 
			  });
			
			return promise; */
                        return updateClipboard()
		}

                function addClipboardRow() {
                        console.log("addClipboardRow()");
                        if (vm.clipboardDomain == undefined) {
                                console.log("addClipboardRow->resetClipboard");
                                resetClipboard();
                        }

                        var i = vm.clipboardDomain.celltypeClipboardMembers.length;

                        vm.clipboardDomain.celltypeClipboardMembers[i] = {
                                "processStatus": "c",
                                "setKey": "1059",
                                "objectKey": vm.selectedTerm.termKey,
                                "label": vm.selectedTerm.term,
                                "createdBy": USERNAME
                                }

                        modifyClipboard();
                }

                function updateClipboard() {
                     console.log("updateClipboard() -> MGISetUpdateAPI()");

                     $scope.clipboardLoading = true;
                     ErrorMessage.clear();

                     var promise = MGISetUpdateAPI.update(vm.clipboardDomain
                        ).$promise.then(function(data) {
                            loadClipboard();
                          },
                          function(error){
                            ErrorMessage.handleError(error);
                                throw error;
                          }).finally(function(){
                                  $scope.clipboardLoading = false;
                          });

                        return promise;

                }
                function sortClipboard() {
                        console.log("sortClipboard()");

                        if (vm.clipboardDomain == undefined) {
                                resetClipboard();
                        }

                        var promise =  MGISetGetAPI.search(vm.clipboardDomain).$promise
                          .then(function(data) {
                                if (data.length > 0) {
                                        console.log("in sort - setting clipboardDomain.celltypeClipboardMembers - data");
                                        //vm.clipboardResults.items = data[0].celltypeClipboardMembers;
                                        //vm.clipboardResults.total_count = vm.clipboardResults.items.length

                                        // now update the new sort order in the database
                                        resetClipboard();
                                        vm.clipboardDomain.celltypeClipboardMembers = data[0].celltypeClipboardMembers;
                                        
                                        for(var i=0; i < vm.clipboardDomain.celltypeClipboardMembers.length; i++) {
                                            vm.clipboardDomain.celltypeClipboardMembers[i].processStatus = "u";
                                            vm.clipboardDomain.celltypeClipboardMembers[i].sequenceNum = i + 1;
                                        }
                                        for(var i=0; i < vm.clipboardDomain.celltypeClipboardMembers.length; i++) {
                                                console.log("i: " + i + " " + vm.clipboardDomain.celltypeClipboardMembers[i].label + " : " + vm.clipboardDomain.celltypeClipboardMembers[i].sequenceNum + " " + vm.clipboardDomain.celltypeClipboardMembers[i].processStatus);
                                        }
                                        updateClipboard(); // this is not setting the results for display
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

                function clearClipboard() {
                        console.log("clearClipboard()");

                        for(var i=0;i<vm.clipboardDomain.celltypeClipboardMembers.length; i++) {
                                vm.clipboardDomain.celltypeClipboardMembers[i].processStatus = "d";
                        }
                        updateClipboard();
                }
		
		function deleteClipboardItem(_setmember_key) {
		
                        console.log("_setmember_key: " + _setmember_key);	
			$scope.clipboardLoading = true;
			ErrorMessage.clear();
			
			var promise = MGISetMemberDeleteAPI.delete({key: _setmember_key}).$promise
			  .then(function() {
				  loadClipboard();
			  },
			  function(error){
			    ErrorMessage.handleError(error);
				throw error;
			  }).finally(function(){
				$scope.clipboardLoading = false; 
			});
			
			return promise;
		}  
		
		function search() {
                        
			console.log("cell type search()");

			if (!vm.termSearch ) {
				return;
			}

                        // assume term 
                        var json = '{"term": "' + vm.termSearch + '", "vocabKey": "102"}';

                        // but check if this is a cell type ID instead of a term
			if (vm.termSearch.toLowerCase().search('cl:') == 0) {
                                json = '{"vocabKey": "102", "accessionIds": [ {"accID": "' + vm.termSearch + '"} ] }';
                        }
                        console.log("json: " + json);
			$scope.searchLoading = true;
			ErrorMessage.clear();
			
			var promise = TermSearchAPI.search(json).$promise
                            .then(function(data) {
                                console.log("setting vm.searchResults - data");
                                vm.searchResults.items = data;
                                vm.searchResults.total_count = vm.searchResults.items.length;

                                // the searchString w/o wildcards
                                var searchString = vm.termSearch.replaceAll('%', '');
                        
                                // end index of the search string
                                var end = searchString.length;

                                for(var i = 0; i < vm.searchResults.items.length; i++) {      
                                    var term = vm.searchResults.items[i]
				    prepareForDisplay(term, vm.termSearch)
                                }
				selectTerm(vm.searchResults.items[0]);
                                
                                return $q.when();
                       	    }, function(error){
                            	ErrorMessage.handleError(error);
                                throw error;
                            }).finally(function(){
                                  $scope.searchLoading = false;
                            }).then(function(){
                                  focusClipboard();
                            });
                        return promise;
		}

		function prepareForDisplay (term, termSearch) {
			term.synonyms = (term.synonyms || []).map(s => s.synonym)
			if (termSearch) {
			    const ts2 = termSearch.split(";")
			    for (let i = 0; i < ts2.length; i++) {
				let searchString = ts2[i].replaceAll("%",".*").trim()
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
			}
		}
		
		function selectTerm(term) {
			vm.selectedTerm = term;
                        vm.selectedTerm.primaryid = term.accessionIds[0].accID;
                        vm.selectedTerm.ontobeeid = vm.selectedTerm.primaryid.replaceAll(':', '_');
                        document.getElementById('addClipboardButton').focus();
                        
			refreshTermDetail();

			refreshTreeView();
		}
		
		function selectTermNoTreeReload(term) {
			vm.selectedTerm = term;
                        vm.selectedTerm.primaryid = term.accessionIds[0].accID;
                        vm.selectedTerm.ontobeeid = vm.selectedTerm.primaryid.replaceAll(':', '_');
                        document.getElementById('addClipboardButton').focus();

			//refreshTermDetail(); // don't need to call this, api already called prior to calling
			                       // this function
		}

		function refreshTermDetail() {
			console.log("refreshTermDetail calling getSelectedTermId");
			var termId = getSelectedTermId();
                        
                        // NEW Monday
			var json = '{"vocabKey": "102", "accessionIds": [ {"accID": "' + termId + '"} ] }';
			if (!termId || termId=="") {
				console.log('refreshTermDetail no term to view');
				return;
			}
			console.log('refreshTermDetail before search termId: ' + termId);
                        console.log('refreshTermDetail before search json: ' + json);
			$scope.detailLoading = true;

                       // we need to call the endpoint to get a fresh set of dagParents for the selected term
                       var promise =  TermSearchAPI.search(json).$promise
                         .then(function(detail) {
                                 console.log('refreshTermDetail returned from search');
                                 vm.selectedTerm.dagParents = detail[0].dagParents;

                                 console.log('detail.dagParents[0].term: ' + detail[0].dagParents[0].term);
                                 console.log('vm.selectedTerm.dagParents[0].term: ' + vm.selectedTerm.dagParents[0].term);
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
			
			ErrorMessage.clear();
			
			Focus.onElementById("termSearch");
		}
		
		 
		function getSelectedTermId() {
                        console.log("getSelectedTermId");
                        if (!vm.selectedTerm || !vm.selectedTerm.accessionIds[0].accID) {
				console.log("no term selected");
				return "";
			}
	                //console.log("getSelectedTermId  vm.selectedTerm.term: " + vm.selectedTerm.term);
                        //console.log("getSelectedTermId  vm.selectedTerm.accessionIds[0].accID: " + vm.selectedTerm.accessionIds[0].accID);	
		        var termId = vm.selectedTerm.accessionIds[0].accID;
			
			return termId;
			
		}
		
		function refreshTreeView() {
			console.log("refreshTreeView");
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

                                // we need to get the full domain from the database/pass in the vocabKey + ID
                                var json = '{"vocabKey": "102", "accessionIds": [ {"accID": "' + termId + '"} ] }';
                                $scope.detailLoading = true;
                                var promise =  TermSearchAPI.search(json).$promise
                                    .then(function(results) {
                                        selectTermNoTreeReload(results[0]);
                                        highlightTreeNode(getSelectedTermId());
                                    },
                                    function(error){
                                      ErrorMessage.handleError(error);
                                          throw error;
                                    }).finally(function(){
                                            $scope.detailLoading = false;
                                });

			};
			
			/*
			 * highlight selected node in tree view
			 */
			var highlightTreeNode = function(id) {
				$(".nodeClick").removeClass("active");
				$(".nodeClick[data_id=\"" + id + "\"]").addClass("active");
			};
			
			// clear old tree view
			var promise = FindElement.byId("celltypeTree").then(function(element){
				element.innerHTML = "";
				return $q.when();
			}).then(function(){
				// generate new tree view
				window.celltypeTree = new MGITreeView({
					target: "celltypeTree",
					dataUrl: JAVA_API_URL + "term/getTreeView/" + termId,
					childUrl: JAVA_API_URL + "term/getTreeViewChildren/",
					nodeRenderer: treeNodeRenderer,
					LOADING_MSG: "Loading data for tree view...",
					afterInitialUpdate: function() {

						// after update, auto-scroll to node with current ID
						window.celltypeTree.scrollTo(termId);
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

                function flipFocusElement (e) {
                    if (e.keyCode !== 9) return
                    const searchBox = document.getElementById('termSearch')
                    const addButton = document.getElementById('addClipboardButton')
                    if (document.activeElement == searchBox) {
                        addButton.focus()
                        e.stopPropagation()
                        e.preventDefault()
                    } else if (document.activeElement == addButton) {
                        searchBox.focus()
                        e.stopPropagation()
                        e.preventDefault()
                    }   
                }

		
		/*
		 * expose functions to template
		 */
		//$scope.loadClipboard = loadClipboard; // sc commented out no longer used in the html
		$scope.modifyClipboard = modifyClipboard;
                $scope.updateClipboard = updateClipboard;
                $scope.sortClipboard = sortClipboard;
		//$scope.sortClipboardItems = sortClipboardItems;
                $scope.addClipboardRow = addClipboardRow;
		$scope.clearClipboard = clearClipboard;
		$scope.deleteClipboardItem = deleteClipboardItem;
		$scope.search = search;
		$scope.clear = clear;
		
		$scope.selectTerm = selectTerm;
                
		$scope.flipFocusElement = flipFocusElement;

		init();
		
	}

})();
