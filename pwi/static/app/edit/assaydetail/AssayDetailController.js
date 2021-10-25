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
                        NoteTagConverter,
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
                                        fixImagePanesGel();
                                        uniqueBandNotes();
                                }
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AssayGetAPI.get");
			});
		}	
		
                // Display code assumes every image pane has valid values for x,y,width,height
                // Some panes have nulls for these parameters. Here we fix those panes to have the dimensions of the whole image.
                function fixPane (pane) {
                    // first supply default values, if needed
                    if (pane.x === null) pane.x = "0"
                    if (pane.y === null) pane.y = "0"
                    if (pane.width === null) pane.width = pane.xdim
                    if (pane.height === null) pane.height = pane.ydim
                    // now convert everything from strings to floats
                    pane.xdim = parseFloat(pane.xdim)
                    pane.ydim = parseFloat(pane.ydim)
                    pane.x = parseFloat(pane.x)
                    pane.y = parseFloat(pane.y)
                    pane.width = parseFloat(pane.width)
                    pane.height = parseFloat(pane.height)
                    // last, compute the scale factor
                    // max dimension (width or height) should be limited to 250px
                    const maxSize = 400
                    pane.scale = maxSize / Math.max(pane.width, pane.height, maxSize)
                    return pane
                }

                function fixImagePanesGel() {
                    if (!vm.apiDomain.imagePane) return
                    const p = $scope.gelPane = fixPane(vm.apiDomain.imagePane)
                }

                function uniqueBandNotes() {
                    const uniqueNotes = vm.apiDomain.uniqueNotes = []
                    vm.apiDomain.gelLanes.forEach(lane => {
                        lane.gelBands.forEach(band => {
                            if (band.bandNote) {
                              const i = uniqueNotes.indexOf(band.bandNote)
                              if (i >= 0) {
                                  band.bandNoteIndex = i + 1
                              } else {
                                  uniqueNotes.push(band.bandNote)
                                  band.bandNoteIndex = uniqueNotes.length
                              }
                            }
                        })
                    })
                }

                function fixImagePanesInSitu() {
                    vm.apiDomain.specimens.forEach(spec => {
                        spec.sresults.forEach(sres => {
                            (sres.imagePanes || []).forEach(pane => fixPane(pane))
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

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
	}

})();

