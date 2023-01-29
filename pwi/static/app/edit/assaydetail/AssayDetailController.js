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
                                vm.apiDomain.isGxdType = vm.apiDomain.assayTypeKey !== "10" && vm.apiDomain.assayTypeKey !== "11"
                                doNotesConversions();
                                if (vm.apiDomain.isInSitu) {
                                    fixImagePanesInSitu()
                                    uniqueImagePanesInSitu();
                                    crossStructuresByCellTypesInSitu();
                                }
                                else {
                                    fixImagePanesGel();
                                    uniqueBandNotes();
                                    vm.apiDomain.gelLanes.forEach(lane => {
                                      lane.isControl = lane.gelControl !== "No"
                                    })
                                }

				$scope.restoreScrollPosition(1)

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AssayGetAPI.get");
			});
		}	

                //
                function doNotesConversions () {
                    const n = $scope.ntc
                    if (vm.apiDomain.assayNote) {
                        vm.apiDomain.assayNoteTip = "Displaying text verbatim and notes tag converted."
                        vm.apiDomain.assayNote.assayNote = n.convert(n.escapeHtml(vm.apiDomain.assayNote.assayNote))
                    }
                    if (vm.apiDomain.isInSitu) {
                        if (vm.apiDomain.isGxdType) {
                            vm.apiDomain.specimenNoteTip = "Displaying text superscripted and notes tag converted."
                            vm.apiDomain.resultNoteTip   = "Displaying text verbatim."
                            vm.apiDomain.specimens.forEach(spec => {
                                if (spec.specimenNote === null) spec.specimenNote = ''
                                if (spec.sresults === null) spec.sresults = []
                                spec.specimenNote = $scope.ntc.convert($scope.ntc.superscript(spec.specimenNote))
                                spec.sresults.forEach(res => res.resultNote = $scope.ntc.escapeHtml(res.resultNote))
                            })
                        } else {
                            vm.apiDomain.specimenNoteTip = "Displaying text superscripted."
                            vm.apiDomain.resultNoteTip   = "Displaying text HTML enabled."
                            vm.apiDomain.specimens.forEach(spec => {
                                spec.specimenNote = $scope.ntc.superscript(spec.specimenNote)
                                // Cre result notes are html enabled. No action needed.
                            })
                        }
                    }
                }

                // Gel Band notes are often repeated in a table. This routine finds the unique notes, 
                // assigns them numbers, and adds that number to the band object (for display).
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

                //
                // Display code assumes every image pane has valid values for x,y,width,height
                // Some panes have nulls for these parameters. Here we fix those panes to have 
                // the dimensions of the whole image.
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
                    const maxWidth = 300
                    const maxHeight = 250
                    const wScale = pane.width > maxWidth ? maxWidth / pane.width : 1
                    const hScale = pane.height > maxHeight ? maxHeight / pane.height : 1
                    pane.scale = Math.min(wScale, hScale)
                    //
                    return pane
                }

                // Gel panes have (at most) one image. Fix it and make it available in the scope.
                function fixImagePanesGel() {
                    if (!vm.apiDomain.imagePane) return
                    const p = $scope.gelPane = fixPane(vm.apiDomain.imagePane)
                }

                // Fix all the image panes in the in situ.
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
                            sres.structureCellType = [];
                            (sres.structures || [null]).forEach(str => {
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

