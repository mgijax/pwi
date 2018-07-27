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
		vm.hidePageContents = true;
		
		
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			loadMarker();
		}
		
		// load the marker 
		function loadMarker() {

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
					setMessage(err.data);
				});

			}, function(err) {
				setMessage(err.data);
			});
		}

		
		
		function setMessage(data) {
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

		
		//Expose functions on controller scope
		//$scope.search = search;

		
		// initialize the page
		init();
		
	}

})();

