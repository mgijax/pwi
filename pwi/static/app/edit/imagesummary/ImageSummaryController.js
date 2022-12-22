
function ImageSummaryController () {}


(function() {
	'use strict';
	angular.module('pwi.imagesummary').controller('ImageSummaryController', ImageSummaryController);

	function ImageSummaryController(
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
                        SmartAlphaSort,
			// resource APIs
			ImageSummaryAPI,
                        ValidateAlleleAPI,
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
		vm.apiDomain = {alleleID:null};

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
                        const alleleID = document.location.search.split("?allele_id=")[1]
                        search(alleleID)
                };

                function search (alleleID) {
                    vm.apiDomain.alleleID = alleleID
                    ValidateAlleleAPI.search({accID:alleleID}, function (alleles) {
                        ImageSummaryAPI.search(alleleID, function (data) {
                            vm.apiDomain = data
                            prepareForDisplay(data)
                            vm.apiDomain.molecImages = data.images.filter(i => i.imageClass === 'Molecular')
                            vm.apiDomain.phenoImages = data.images.filter(i => i.imageClass === 'Phenotypes')
                            console.log(vm.apiDomain)
                        }, function (err) {
                            console.log(err)
                        })
                    }, function (err) {
                        console.log(err)
                    })

                }

                function prepareForDisplay (data) {
                    const maxImageDim = 400
                    const prepareImage = function (img) {
                        const pixAcc = img.editAccessionIds.filter(acc => acc.prefixPart === "PIX:")[0]
                        if (pixAcc) img.pixid = pixAcc.numericPart
                        img.caption = $scope.ntc.convert(img.captionNote.noteChunk)
                        img.copyright = $scope.ntc.convert(img.copyrightNote.noteChunk)
                        img.xdim = parseInt(img.xdim)
                        img.ydim = parseInt(img.ydim)
                        const xScale = Math.min(1, maxImageDim/img.xdim)
                        const yScale = Math.min(1, maxImageDim/img.ydim)
                        const scale = Math.min(xScale, yScale)
                        img.scaled = {
                          xdim: scale * img.xdim,
                          ydim: scale * img.ydim
                        }
                    }
                    const pane2image = {}
                    data.images.forEach(img => {
                        prepareImage(img)
                        if (img.thumbnailImage) prepareImage(img.thumbnailImage)
                        img.alleleAssocs = []
                        img.genotypeAssocs = []
                        img.imagePanes.forEach(p => pane2image[p.imagePaneKey] = img)
                    })
                    //
                    data.alleleAssocs.forEach(aa => {
                        pane2image[aa.imagePaneKey].alleleAssocs.push(aa)
                    })
                    data.genotypeAssocs.forEach(gg => {
                        pane2image[gg.imagePaneKey].genotypeAssocs.push(gg)
                    })
                }

	}
})();

