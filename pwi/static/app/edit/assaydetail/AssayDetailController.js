(function() {
	'use strict';
	angular.module('pwi.assaydetail').controller('AssayDetailController', AssayDetailController);

	function AssayDetailController(
			// angular tools
			$document,
			$filter,
			$http,  
			$q,
			$scope, 
			$timeout,
			$window, 
			// assay purpose utilities
			ErrorMessage,
			FindElement,
			Focus,
                        TextTranslation,
			// resource APIs
			AssaySearchAPI,
			AssayGetAPI,
			// config
			USERNAME
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		$scope.USERNAME = USERNAME;

                // make utility functions available in scope
		$scope.tt = TextTranslation

		var vm = $scope.vm = {};

		// api/json input/output
		vm.apiDomain = {};

                // default booleans for page functionality
		vm.hideApiDomain = true;       // JSON package
		vm.hideVmData = true;          // JSON package + other vm objects
                vm.hideErrorContents = true;	// display error message

		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		// Initializes the needed page values 
                this.$onInit = function () { 
                        console.log("onInit")
                        var searchByAccId = document.location.search.split("?id=")
                        search(searchByAccId[1]);
                };

                this.$postLink = function () { 
                        console.log("postLink")
                };

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

		// search by accession id
		function search(accID) {				
			console.log("search():" + accID);
		
			pageScope.loadingStart();
			
                        vm.apiDomain.accID = accID
                        vm.apiDomain.detectionKey = ""

			AssaySearchAPI.search(vm.apiDomain, function(data) {
			        if (data.length > 0) {
				        loadObject(data[0].assayKey);
			        }
		                pageScope.loadingEnd();
		        }, function(err) {
			        pageScope.handleError(vm, "API ERROR: AssaySearchAPI.search");
		                pageScope.loadingEnd();
		        });
		}		

		// load object by assayKey
		function loadObject(assayKey) {
			console.log("loadObject():" + assayKey);

			AssayGetAPI.get({ key: assayKey }, function(data) {
				vm.apiDomain = data;

                                // create unique set of specimen/image panes
                                for(var i=0;i<vm.apiDomain.specimens.length;i++) {
                                        vm.apiDomain.specimens[i].uniqueImagePanes = [];
                                        for(var j=0;j<vm.apiDomain.specimens[i].sresults.length;j++) {
                                                if (vm.apiDomain.specimens[i].sresults[j].imagePanes == null) {
                                                        continue;
                                                }
                                                for(var k=0;k<vm.apiDomain.specimens[i].sresults[j].imagePanes.length; k++) {
                                                        var imagePaneKey = vm.apiDomain.specimens[i].sresults[j].imagePanes[k].imagePaneKey;
                                                        if (vm.apiDomain.specimens[i].uniqueImagePanes.length == 0) {
                                                                vm.apiDomain.specimens[i].uniqueImagePanes.push(vm.apiDomain.specimens[i].sresults[j].imagePanes[k]);
                                                        }
                                                        else {
                                                                var foundImage = false;
                                                                for(var z=0;z<vm.apiDomain.specimens[i].uniqueImagePanes.length; z++) {
                                                                        if (vm.apiDomain.specimens[i].uniqueImagePanes[z].imagePaneKey == imagePaneKey) {
                                                                                foundImage = true;
                                                                        }
                                                                }
                                                                if (foundImage == false) {
                                                                        vm.apiDomain.specimens[i].uniqueImagePanes.push(vm.apiDomain.specimens[i].sresults[j].imagePanes[k]);
                                                                }
                                                        }
                                                }
                                        }
                                } 
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AssayGetAPI.get");
			});
		}	
		
		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
	}

})();

