(function() {
	'use strict';
	angular.module('pwi.probedetail').controller('ProbeDetailController', ProbeDetailController);

	function ProbeDetailController(
			// angular tools
			$document,
			$filter,
			$http,  
			$q,
			$scope, 
			$timeout,
			$window, 
			// utilities
			ErrorMessage,
			FindElement,
			Focus,
                        NoteTagConverter,
			// resource APIs
			ProbeSearchAPI,
			ProbeGetAPI,
			// config
			USERNAME
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		$scope.USERNAME = USERNAME;

                // make utility functions available in scope
		$scope.ntc = NoteTagConverter

		var vm = $scope.vm = {};

		// api/json input/output
		vm.apiDomain = {};

                // default booleans for page functionality
		vm.hideApiDomain = true;       // JSON package
		vm.hideVmData = true;          // JSON package + other vm objects
                vm.hideErrorContents = true;	// display error message
                //
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		// Initializes the needed page values 
                this.$onInit = function () { 
                        console.log("onInit")
                        var searchByAccId = document.location.search.split("?id=")
                        search(searchByAccId[1]);
                };

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

		// search by accession id
		function search(accID) {				
			console.log("search():" + accID);
		
			pageScope.loadingStart();
			
                        vm.apiDomain.accID = accID

			ProbeSearchAPI.search(vm.apiDomain, function(data) {
			        if (data.length > 0) {
				        loadObject(data[0].probeKey);
			        }
		                pageScope.loadingEnd();
		        }, function(err) {
			        pageScope.handleError(vm, "API ERROR: ProbeSearchAPI.search: " + err);
		                pageScope.loadingEnd();
		        });
		}		

		// load object by antobodyKey
		function loadObject(probeKey) {
			console.log("loadObject():" + probeKey);

			ProbeGetAPI.get({key: probeKey}, function(data) {
				vm.apiDomain = data;
                                prepareForDisplay(vm.apiDomain)
                                // for shorter refs
                                $scope.vmd = vm.apiDomain
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ProbeGetAPI.get: " + err);
			});
		}	

                //
                function prepareForDisplay (vmd) {
                    vmd.otherMgiIds = (vmd.mgiAccessionIds || []).filter(i => i.accID !== vmd.accID)
                }

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
	}

})();

