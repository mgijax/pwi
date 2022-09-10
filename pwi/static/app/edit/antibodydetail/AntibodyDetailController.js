(function() {
	'use strict';
	angular.module('pwi.antibodydetail').controller('AntibodyDetailController', AntibodyDetailController);

	function AntibodyDetailController(
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
			AntibodySearchAPI,
			AntibodyGetAPI,
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

			AntibodySearchAPI.search(vm.apiDomain, function(data) {
			        if (data.length > 0) {
				        loadObject(data[0].antibodyKey);
			        }
		                pageScope.loadingEnd();
		        }, function(err) {
			        pageScope.handleError(vm, "API ERROR: AntibodySearchAPI.search: " + err);
		                pageScope.loadingEnd();
		        });
		}		

		// load object by antibodyKey
		function loadObject(antibodyKey) {
			console.log("loadObject():" + antibodyKey);

			AntibodyGetAPI.get({key: antibodyKey}, function(data) {
				vm.apiDomain = data;
                                prepareForDisplay(vm.apiDomain)
                                // for shorter refs
                                $scope.vmd = vm.apiDomain
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AntibodyGetAPI.get: " + err);
			});
		}	

                //
                function prepareForDisplay (vmd) {
                    // sort aliases by db key (to match prior display)
                    vmd.aliases && vmd.aliases.sort((a,b) => {
                        return parseInt(a.antibodyAliasKey) - parseInt(b.antibodyAliasKey)
                    })
                    // sort refs by J#
                    vmd.refAssocs && vmd.refAssocs.sort((a,b) => {
                        return a.jnum - b.jnum
                    })

                }

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
	}

})();

