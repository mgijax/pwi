(function() {
	'use strict';
	angular.module('pwi.marker').controller('MarkerController', MarkerController);

	function MarkerController(
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
			// resource APIs
			MarkerSearchAPI,
			AccIdSearchAPI,
			MarkerKeySearchAPI,
			MarkerCreateAPI,
			MarkerUpdateAPI,
			MarkerDeleteAPI
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {}

		// mapping of marker data 
		vm.markerData = {};

		// list of results data (fills summary)
		vm.results = [];
		
		// Used to track which summary marker is highlighted / active
		vm.selectedIndex = 0;
		
		// default booleans for page functionality 
		vm.hideData = true;            // JSON data
		vm.hideLoadingHeader = true;   // display loading header
		vm.hideErrorContents = true;   // display error message
		vm.editableField = true;       // used to disable field edits
		
		// error message
		vm.errorMsg = '';
		
		
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			vm.hideLoadingHeader = true;
		}


		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI via buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////		
		
		// mapped to query 'Search' button
		function eiSearch() {				
		
			vm.hideLoadingHeader = false;

			// call API to search; pass query params (vm.selected)
			MarkerSearchAPI.search(vm.markerData, function(data) {
				
				vm.results = data;
				vm.hideLoadingHeader = true;
				vm.selectedIndex = 0;
				loadMarker();

			}, function(err) { // server exception
				handleError("Error searching for markers.");
			});
		}		
		
        // mapped to 'Clear' button
		function eiClear() {		
			vm.results = [];
			vm.markerData = {};
			vm.selectedIndex = 0;
			vm.hideErrorContents = true;
			vm.hideLoadingHeader = true;
			vm.editableField = true;
			vm.errorMsg = '';
		}		

        // called when user clicks a row in the marker summary
		function setMarker(index) {

			// load marker
			vm.markerData = {};
			vm.selectedIndex = index;
			loadMarker();
		}		

        // mapped to 'Create' button
		function createMarker() {

			// assume we're creating a mouse marker
			vm.markerData.organismKey = "1";

			// TODO:  Remove once we get chromosome funcitonality going
			vm.markerData.chromosome = "1";
			
			// call API to create marker
			console.log("Submitting to marker creation endpoint");
			console.log(vm.markerData);
			MarkerCreateAPI.create(vm.markerData, function(data) {
				
				// check for API returned error
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					// update marker data
					vm.markerData = data.items[0];
					postMarkerLoad();

					// update summary section
					var result={
						markerKey:vm.markerData.markerKey, 
						symbol:vm.markerData.symbol};
					vm.results[0] = result;
					alert("Marker Created!");
				}
				
			}, function(err) {
				handleError("Error creating marker.");
			});

		}		

        // mapped to 'Update' button
		function updateMarker() {
			
			// call API to update marker
			console.log("Submitting to marker update endpoint");
			console.log(vm.markerData);
			MarkerUpdateAPI.update(vm.markerData, function(data) {
				
				// check for API returned error
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					// update marker data
					vm.markerData = data.items[0];
					postMarkerLoad();

					alert("Marker Updated!");
				}
				
			}, function(err) {
				handleError("Error updating marker.");
			});

		}		
		
		
		
		
        // mapped to 'Delete' button
		function deleteMarker() {
			console.log("Deleting Marker1");

			if ($window.confirm("Are you sure you want to delete this marker?")) {
			
				// call API to delete marker
				MarkerDeleteAPI.delete({ key: vm.markerData.markerKey }, function(data) {


					// check for API returned error
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						// success
						alert("Marker Deleted!");
						vm.markerData = {};
						vm.results = [];
					}
				
				}, function(err) {
					handleError("Error deleting marker.");
				});
			}
		}		

		/////////////////////////////////////////////////////////////////////
		// Utility methods
		/////////////////////////////////////////////////////////////////////		
		
		function loadMarker() {

			// derive the key of the selected result summary marker
			vm.summaryMarkerKey = vm.results[vm.selectedIndex].markerKey;
			
			// call API to gather marker for given key
			MarkerKeySearchAPI.get({ key: vm.summaryMarkerKey }, function(data) {
				vm.markerData = data;
				postMarkerLoad();
			}, function(err) {
				handleError("Error retrieving marker.");
			});
		}		
		
		// error handling
		function handleError(msg) {
			vm.errorMsg = msg;
			vm.hideErrorContents = false;
			vm.hideLoadingHeader = true;
		}

		// a marker can be loaded from a search or create - this shared 
		// processing is called after endpoint data is loaded
		function postMarkerLoad() {
			//vm.markerData.accID = vm.markerData.mgiAccessionIds[0].accID;
			vm.editableField = false;
		}
		
		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		//Expose functions on controller scope
		$scope.eiSearch = eiSearch;
		$scope.eiClear = eiClear;
		$scope.setMarker = setMarker;
		$scope.createMarker = createMarker;
		$scope.updateMarker = updateMarker;
		$scope.deleteMarker = deleteMarker;
		
		
		// call to initialize the page, and start the ball rolling...
		init();
	}

})();

