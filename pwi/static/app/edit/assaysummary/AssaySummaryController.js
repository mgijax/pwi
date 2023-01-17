(function() {
	'use strict';
	angular.module('pwi.assaysummary').controller('AssaySummaryController', AssaySummaryController);

	function AssaySummaryController(
			// angular tools
			$document,
			$filter,
			$http,  
			$q,
			$scope, 
			$timeout,
			$window, 
			// utilities
                        NoteTagConverter,
                        FileWriter,
                        UrlParser,
			// resource APIs
                        AssayGetByRefAPI,
                        AssayGetByMarkerAPI,
                        AssayGetByAlleleAPI,
			// config
			USERNAME
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		$scope.USERNAME = USERNAME;

                // make utility functions available in scope
		$scope.ntc = NoteTagConverter

		var vm = $scope.vm = {};

                // default booleans for page functionality
		vm.hideApiDomain = true;       // JSON package
		vm.hideVmData = true;          // JSON package + other vm objects
                vm.hideErrorContents = true;	// display error message

                // only show first N assays, unless/until user clicks show all
                vm.assaysMax = 1000
                vm.assaysTruncated = false;

                vm.loading = false;

		// api/json input/output
		vm.apiDomain = {};
                $scope.vmd = vm.apiDomain
                $scope.downloadTsvFile = downloadTsvFile

		// Initializes the needed page values 
                this.$onInit = function () { 
                        const args = UrlParser.parseSearchString()
                        if (args.refs_id) {
                            vm.loading=true
                            vm.youSearchForString = $scope.youSearchedFor([['Reference JNum',args.refs_id]])
                            AssayGetByRefAPI.search(args.refs_id, function (assays) {
                                prepareForDisplay(assays)
                                vm.loading=false
                            }, function (err) {
                                pageScope.handleError(vm, "API ERROR: AssayGetByRef.search: " + err);
                            })
                        } else if (args.marker_id) {
                            vm.loading=true
                            vm.youSearchForString = $scope.youSearchedFor([['Marker MGIID',args.marker_id]])
                            AssayGetByMarkerAPI.search(args.marker_id, function (assays) {
                                prepareForDisplay(assays)
                                vm.loading=false
                            }, function (err) {
                                pageScope.handleError(vm, "API ERROR: AssayGetByMarker.search: " + err);
                            })
                        } else if (args.allele_id) {
                            vm.loading=true
                            vm.youSearchForString = $scope.youSearchedFor([['Allele MGIID',args.allele_id]])
                            AssayGetByAlleleAPI.search(args.allele_id, function (assays) {
                                prepareForDisplay(assays)
                                vm.loading=false
                            }, function (err) {
                                pageScope.handleError(vm, "API ERROR: AssayGetByAllele.search: " + err);
                            })
                        } else {
                            throw "No argument. Please specify refs_id or marker_id or allele_id."
                        }
                };

                function prepareForDisplay (assays) {
                    assays.forEach(m => {
                    })
                    vm.apiDomain.assays = assays
                    vm.apiDomain.allAssays = assays
                    if (assays.length > vm.assaysMax) {
                        vm.apiDomain.assaysTruncated = true
                        vm.apiDomain.assays = assays.slice(0,vm.assaysMax)
                    }
                }

                function downloadTsvFile () {
                    FileWriter.writeDataToTsvFile('assay_summary', vm.apiDomain.allAssays, [
                        ["Assay ID", "accID"],
                        ["Gene", "markerSymbol"],
                        ["Gene MGI ID", "markerAccID"],
                        ["Assay Type", "assayType"],
                        ["Reference J#", "jnumid"],
                        ["Short Citation", "short_citation"],
                        ])
                }
        }
})();

