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
			EMAPASearchAPI,
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
				
				if (params.stageSearch) {
					vm.stageSearch = params.stageSearch;
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
			
			if (!vm.termSearch && !vm.stageSearch) {
				return;
			}
			
			$scope.searchLoading = true;
			ErrorMessage.clear();
			
			var promise = EMAPASearchAPI.search({'termSearch': vm.termSearch, 'stageSearch': vm.stageSearch}).$promise
			  .then(function(results){
				  vm.searchResults = results;

				  
				  
				  // check if only one stage was submitted
	    		  // must be integer between 1 and 28
				  // if so, make it the active selectedStage
				  var selectedStage = Number(vm.stageSearch);
	    		  if (!selectedStage 
	    		    		|| (selectedStage % 1 != 0)
	    		    		|| (selectedStage < 0)
	    		    		|| (selectedStage > 28)
	    		  ) {
	    		      // otherwise set to all stages
	    			  selectedStage = 0;
	    		  }
	    		  vm.selectedStage = selectedStage;
	    		  

  				  // reset clipboard input to whatever is in stage search,
  				  // 	even though it is not a single stage
				  if (vm.stageSearch != "") {
	    				vm.stagesToAdd = vm.stageSearch;
				  }
				  
				  
				  // set first result as selectedTerm
				  if (results.items.length > 0) {
					  selectTerm(results.items[0]);
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
		
		
		function selectTerm(term) {
			vm.selectedTerm = term;
			refreshTermDetail();
			refreshTreeView();
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
				  
				  // create stage range for links
				  vm.termDetail.stageRange = [];
				  for (var i = vm.termDetail.startstage; i <= vm.termDetail.endstage; i++) {
					  vm.termDetail.stageRange.push(i);
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
				vm.stagesToAdd = stage;
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
				selectTermNoTreeReload({primaryid:termId, term:""});
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
		$scope.selectStage = selectStage;
		
		init();
		
	}

})();
