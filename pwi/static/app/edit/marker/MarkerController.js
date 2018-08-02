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

		// holder mapping for marker data returned from API
		vm.markerData = {};
		
		// hide the marker data mapping until we want to display it 
		vm.showData = true;

		// default hide/show page sections
		vm.hideLoadingHeader = false;
		vm.hidePageContents  = true;
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
			else if (inputMarkerKey) {
				loadMarkerByKey();
			}

			// TODO - else handle error
			
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

				MarkerKeySearchAPI.get({ key: vm.marker_key }, function(data) {
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

		
		// load the marker 
		function loadMarkerByKey() {

			console.log("Attempting to load marker via key: " + inputMarkerKey);

			MarkerKeySearchAPI.get({ key: inputMarkerKey }, function(data) {
				vm.markerData = data;
				console.log("Marker retrieved via marker/key endpoint: " + inputMarkerKey)
				vm.hideLoadingHeader = true;
				vm.hidePageContents = false;
			}, function(err) {
				handleError("Error retrieving marker.");
			});

		}

		
		function handleError(msg) {
			vm.errorMsg = msg;
			vm.hideErrorContents = false;
			vm.hideLoadingHeader = true;
		}

		

		
		// call to initialize the page, and start the ball rolling...
		init();
	}

})();

