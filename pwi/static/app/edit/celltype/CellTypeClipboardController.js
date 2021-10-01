(function() {
	'use strict';
	angular.module('pwi.gxd').controller('CellTypeClipboardController', CellTypeClipboardController);

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
			EMAPAClipboardAPI,
			EMAPAClipboardSortAPI,
			EMAPADetailAPI,
			
			// Config
			RESOURCE_PATH,
			PWI_BASE_URL
	) {
		var pageScope = $scope.$parent;
		
		$scope.vm = {};
		var vm = $scope.vm;
		
                // api/json input/output
                vm.apiDomain = {};

                // default booleans for page functionality
                vm.hideApiDomain = true;       // JSON package
                vm.hideVmData = true;          // JSON package + other vm objects
		// search fields
		vm.termSearch = "";
		vm.searchResults = { items:[], total_count: 0 };
		
		// current selected term
		vm.selectedTerm = { term:"", primaryid: ""};
		
		// clipboard 
		vm.clipboardResults = { items:[], total_count: 0 };
		
		vm.termDetail = {}
		
		$scope.RESOURCE_PATH = RESOURCE_PATH;
		$scope.PWI_BASE_URL = PWI_BASE_URL;
		
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
				
				
				search();
			}
		}
		
		function refreshClipboardItems() {
			
			$scope.clipboardLoading = true;
			ErrorMessage.clear();
			
			var promise = EMAPAClipboardAPI.get().$promise
			  .then(function(results) {
				  vm.clipboardResults = results;
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
			
			
			$scope.clipboardLoading = true;
			ErrorMessage.clear();
			
			var promise = EMAPAClipboardAPI.save({
				emapa_id: emapaId, 
				stagesToAdd: vm.stagesToAdd
			}).$promise.then(function() {
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
		
		function sortClipboardItems() {
			
			$scope.clipboardLoading = true;
			ErrorMessage.clear();
			
			var promise = EMAPAClipboardSortAPI.get().$promise
			  .then(function() {
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
			
			$scope.clipboardLoading = true;
			ErrorMessage.clear();
			
			var promise = EMAPAClipboardAPI.delete({}).$promise
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
		
		function deleteClipboardItem(_setmember_key) {
			
			$scope.clipboardLoading = true;
			ErrorMessage.clear();
			
			var promise = EMAPAClipboardAPI.delete({key: _setmember_key}).$promise
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
		
		function search() {
                        
			console.log("cell type search()");

			if (!vm.termSearch ) {
				return;
			}
			
			$scope.searchLoading = true;
			ErrorMessage.clear();
			
			var promise = TermSearchAPI.search({'term': vm.termSearch, 'vocabKey': '102'}).$promise
                            .then(function(data) {
                                console.log("setting vm.searchResults - data");
                                console.log(data);
                                vm.searchResults.items = data;
                                vm.searchResults.total_count = vm.searchResults.items.length;
                                // set first result as selectedTerm
                                if (vm.searchResults.items.length > 0) {
                                        selectTerm(vm.searchResults.items[0]);
                                }
                                return $q.when();
                       
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
			
			
			selectTerm(term);
		}
		
		
		function selectTerm(term) {
                        console.log("term.term: " + term.term);
                        console.log("term accID: " + term.accessionIds[0].accID);
			vm.selectedTerm = term;
                        console.log("vm.selectedTerm.term " + vm.selectedTerm.term)
			//refreshTermDetail();
			//refreshTreeView();
		}
		
		function selectTermNoTreeReload(term) {
			vm.selectedTerm = term;
			refreshTermDetail();
		}
		
		function refreshTermDetail() {
			
			var termId = getSelectedTermId();
			
			if (!termId || termId=="") {
				// no term to view
				return;
			}
			
			$scope.detailLoading = true;
			
			var promise = EMAPADetailAPI.get({id: termId}).$promise
			  .then(function(detail) {
				  vm.termDetail = detail;
				  
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
		
		/*
		 * Creates EMAPA or EMAPS ID based on passed in stage
		 */
		function getSelectedTermId() {
			
			if (!vm.selectedTerm || !vm.selectedTerm.primaryid) {
                        //if (!vm.selectedTerm || !vm.selectedTerm.accessionIds[0].accID) {
				// no term selected
				return "";
			}
			
			var termId = vm.selectedTerm.primaryid;
		        //var termId = vm.selectedTerm.accessionIds[0].accID;
			
			return termId;
			
		}
		
		function getEmapaId(termId) {
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
					dataUrl: PWI_BASE_URL + "edit/emapaTreeJson/" + termId,
					childUrl: PWI_BASE_URL + "edit/emapaTreeChildrenJson/",
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
		$scope.sortClipboardItems = sortClipboardItems;
		$scope.clearClipboardItems = clearClipboardItems;
		$scope.deleteClipboardItem = deleteClipboardItem;
		$scope.search = search;
		$scope.clear = clear;
		
		$scope.selectSearchResult = selectSearchResult;
		$scope.selectTerm = selectTerm;
		
		init();
		
	}

})();
