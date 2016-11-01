(function() {
	'use strict';
	angular.module('pwi.gxd').controller('EmapaClipboardController', EmapaClipboardController);

	function EmapaClipboardController(
			// angular tools
			$document,
			$filter,
			$http,  
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
		
		function init() {
			
			refreshClipboardItems();
			
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
		
		function addClipboardItems() {
			
			if (!vm.selectedTerm || !vm.selectedTerm.primaryid) {
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
				emapa_id: vm.selectedTerm.primaryid, 
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
				  
				  // set first result as selectedTerm
				  if (results.items.length > 0) {
					  selectTerm(results.items[0]);
				  }
				  
			  }, 
			  function(error){
			    ErrorMessage.handleError(error);
				throw error;
			  }).finally(function(){
				  $scope.searchLoading = false;
			  });
			
			return promise;
		}
		
		
		function selectTerm(term) {
			vm.selectedTerm = term;
			refreshTermDetail(term);
		}
		
		function refreshTermDetail(term) {
			
			if (!vm.selectedTerm || !vm.selectedTerm.primaryid) {
				// no term to view
				return;
			}
			
			$scope.detailLoading = true;
			
			var termId = getSelectedTermId(vm.selectedTerm.primaryid, vm.selectedStage);
			
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
			
			
			return promise;
		}
		
		
		function clear() {
			vm.termSearch = "";
			vm.stageSearch = "";
			
			// clipboard 
			vm.stagesToAdd = "";
		}
		
		function selectStage(stage) {
			vm.selectedStage = stage;
			refreshTermDetail();
			
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
		function getSelectedTermId(termId, stage) {
			
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
			termId = "EMAPS" + termId.slice(5) + stage;
			return termId;
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
		
		$scope.selectTerm = selectTerm;
		$scope.selectStage = selectStage;
		
		init();
		
	}

})();
