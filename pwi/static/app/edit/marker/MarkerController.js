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
			MarkerKeySearchAPI
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {}

		// Results from main query - list of marker key/symbol pairs
		vm.searchResults = {
			items: [],
		}	
		// holder mapping for marker data returned from API
		vm.markerData = {};
		
		// hide the marker data mapping until we want to display it 
		vm.showData = true;

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
			
			if (inputMarkerID) {
				loadMarkerByID();
			}
			else {
				vm.hideLoadingHeader = true;
				vm.hidePageContents = false;
			}
			// TODO - else handle error
		}

        // marker EI  search -- mapped to query search button
		function eiSearch() {				
		
			vm.hideLoadingHeader = false;

			// call API to search; pass query params (vm.selected)
			MarkerSearchAPI.search(vm.markerData, function(data) {
				
				
				// check for API returned error
				if (data.error != null) {
				}
				else { // success
					vm.results = data;
				}

				vm.hideLoadingHeader = true;

			}, function(err) { // server exception
				setMessage(err.data);
			});
		}		
		

        // resets input and results
		function eiClear() {				
			vm.markerData = {};
			vm.results = [];
		}		
		
		// load the marker 
		function loadMarkerByID() {

			console.log("Attempting to load marker: " + inputMarkerID);
			
			// First, retrieve the marker key for this marker ID via 
			// accession endpoint, then get marker via key
			AccIdSearchAPI.search(
			  {accid:inputMarkerID, _logicaldb_key:"1", _mgitype_key:"2"}, 
			  function(data) { 
				  
				vm.marker_key = data.items[0]._object_key;
				console.log("Marker key from accession endpoint: " + vm.marker_key)

				console.time("markerLoadTime");  //start timer
				
				MarkerKeySearchAPI.get({ key: vm.marker_key }, function(data) {

					console.timeEnd("markerLoadTime"); //end timer; print to console

					vm.markerData = data;
					console.log("Marker retrieved via marker/key endpoint: " + vm.marker_key)
					vm.hideLoadingHeader = true;
					vm.hidePageContents = false;

				}, function(err) {
					handleError("Error retrieving marker.");
				});

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

		//Expose functions on controller scope
		$scope.eiSearch = eiSearch;
		$scope.eiClear = eiClear;

		
		// call to initialize the page, and start the ball rolling...
		init();
	}

})();

