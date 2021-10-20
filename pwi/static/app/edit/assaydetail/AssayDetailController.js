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
                                if (vm.apiDomain.isInSitu) {
                                        fixImagePanesInSitu()
                                        uniqueImagePanesInSitu();
                                        crossStructuresByCellTypesInSitu();
                                }
                                else {
                                        uniqueImagePanesGel();
                                }
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AssayGetAPI.get");
			});
		}	
		
                // Display code assumes every image pane has valid values for x,y,width,height
                // Some panes have nulls for these parameters. Here we fix those panes to have the dimensions of the whole image.
                function fixImagePanesInSitu() {
                    vm.apiDomain.specimens.forEach(spec => {
                        spec.sresults.forEach(sres => {
                            (sres.imagePanes || []).forEach(pane => {
                                if (pane.x === null) pane.x = 0
                                if (pane.y === null) pane.y = 0
                                if (pane.width === null) pane.width = pane.xdim
                                if (pane.height === null) pane.height = pane.ydim
                            })
                        })
                    })
                }

                // For each insitu specimen's result, generates the cross-product of structures and celltypes in the result.
                // This will be used to generate a table with one structure and one celltype per row.
                function crossStructuresByCellTypesInSitu() {
                    vm.apiDomain.specimens.forEach(spec => {
                        spec.sresults.forEach(sres => {
                            // for each result, cross its structures by its celltypes.
                            sres.structureCellType = []
                            sres.structures.forEach(str => {
                               (sres.celltypes || [null]).forEach(cty => {
                                   sres.structureCellType.push({structure:str, celltype:cty})
                               })
                            })
                            
                        })
                    })
                }

                // For each insitu specimen, finds the set of unique (by id) image panes
                // across that specimen's results.
                function uniqueImagePanesInSitu() {
                    console.log("uniqueImagePanesInSitu()");
                    vm.apiDomain.specimens.forEach(spec => {
                        const seen = new Set()
                        spec.uniqueImagePanes = []
                        spec.sresults.forEach(sres => {
                            (sres.imagePanes || []).forEach(pane => {
                               if (!seen.has(pane.imagePaneKey)) {
                                   seen.add(pane.imagePaneKey)
                                   spec.uniqueImagePanes.push(pane)
                               }
                            })
                        })
                    })
                }

                /*
                function uniqueImagePanesInSitu() {
			console.log("uniqueImagePanesInSitu()");

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
                }
                */

                function uniqueImagePanesGel() {
			console.log("uniqueImagePanesGel()");
                }

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
	}

})();

