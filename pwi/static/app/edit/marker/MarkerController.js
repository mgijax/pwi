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
			MarkerDeleteAPI
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {}

		// Results from main query - list of marker key/symbol pairs
//		vm.searchResults = {
//			items: [],
//		}	

		// mapping of marker data 
		vm.markerData = {};

		// list of results data (fills summary)
		vm.results = [];
		
		// Used to track which summary marker is highlighted / active
		vm.selectedIndex = 0;
		
		// hide the marker data mapping until we want to display it 
		vm.hideData = true;

		// default hide/show page sections
		vm.hideLoadingHeader = false;
		vm.hideErrorContents = true;
		
		// default error message
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
		
		// marker EI  search -- mapped to query search button
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
		

        // resets input and results
		function eiClear() {		
			vm.results = [];
			vm.markerData = {};
			vm.selectedIndex = 0;
			vm.hideErrorContents = true;
			vm.hideLoadingHeader = true;

		}		

		function setMarker(index) {

			// load marker
			vm.markerData = {};
			vm.selectedIndex = index;
			loadMarker();
		}		

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
					// set return data and finish
					vm.markerData = data.items[0];

					var result={
						markerKey:vm.markerData.markerKey, 
						symbol:vm.markerData.symbol
					};
					vm.results[0] = result;
					//vm.results[0].markerKey="12345";
					//vm.results[0].symbol="temp";
					alert("Marker Created!");

				
				
				}
				
			}, function(err) {
				handleError("Error creating marker.");
			});

		}		

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

		
		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		//Expose functions on controller scope
		$scope.eiSearch = eiSearch;
		$scope.eiClear = eiClear;
		$scope.setMarker = setMarker;
		$scope.createMarker = createMarker;
		$scope.deleteMarker = deleteMarker;
		
		
		// call to initialize the page, and start the ball rolling...
		init();
	}

})();

