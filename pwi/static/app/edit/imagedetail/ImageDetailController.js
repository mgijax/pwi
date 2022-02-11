(function() {
	'use strict';
	angular.module('pwi.imagedetail').controller('ImageDetailController', ImageDetailController);

	function ImageDetailController(
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
                        NoteTagConverter,
			// resource APIs
			ImageSearchAPI,
			ImageGetAPI,
			ImageSearchAssayAPI,
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

			ImageSearchAPI.search(vm.apiDomain, function(data) {
			        if (data.length > 0) {
				        loadObject(data[0].imageKey);
			        }
		                pageScope.loadingEnd();
		        }, function(err) {
			        pageScope.handleError(vm, "API ERROR: ImageSearchAPI.search");
		                pageScope.loadingEnd();
		        });
		}		

		// load object by imageKey
		function loadObject(imageKey) {
			console.log("loadObject():" + imageKey);

			ImageGetAPI.get({key: imageKey}, function(data) {
				const d = vm.apiDomain = data;
                                searchAssays(d.imageKey);
                                if (!d.assayData) d.assayData = []
                                if (!d.imagePanes) d.imagePanes = []
                                if (d.copyrightNote) {
                                    d.copyrightNote.noteChunk = $scope.ntc.convert(d.copyrightNote.noteChunk);
                                }

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ImageGetAPI.get");
			});
		}	

		// search assays by image key
		function searchAssays(imageKey) {				
			console.log("searchAssays():" + imageKey);
		
			ImageSearchAssayAPI.search(vm.apiDomain.imageKey, function(data) {
                                vm.apiDomain.assayData = [];
			        if (data.length > 0) {
                                        const d = vm.apiDomain
                                        d.assayData = data;
                                        const seen = new Set(d.assayData.map(ad => ad.imagePaneKey))
                                        d.imagePanes.forEach(p => {
                                            if (seen.has(p.imagePaneKey)) return
                                            d.assayData.push({
                                                imageKey: p.imageKey,
                                                imagePaneKey: p.imagePaneKey,
                                                paneLabel: p.paneLabel,
                                                assays: []
                                            })
                                        })
			        }
		        }, function(err) {
			        pageScope.handleError(vm, "API ERROR: ImageSearchAssayAPI.searchAssays");
		        });
		}		

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
	}

})();

