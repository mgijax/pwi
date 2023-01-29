(function() {
	'use strict';
	angular.module('pwi.markersummary').controller('MarkerSummaryController', MarkerSummaryController);

	function MarkerSummaryController(
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
			// resource APIs
                        MarkerGetByJnumAPI,
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

                // only show first N markers, unless/until user clicks show all
                vm.markersMax = 1000
                vm.markersTruncated = false;

                vm.loading = false;

		// api/json input/output
		vm.apiDomain = {};
                $scope.vmd = vm.apiDomain
                $scope.downloadTsvFile = downloadTsvFile

		// Initializes the needed page values 
                this.$onInit = function () { 
                        const jnum = document.location.search.split("?refs_id=")[1]
                        if (jnum) {
                            vm.loading=true
                            vm.youSearchForString = $scope.youSearchedFor([['Reference JNum',jnum]])
                            MarkerGetByJnumAPI.search(jnum, function (markers) {
                                prepareForDisplay(markers)
                                vm.loading=false
				$scope.restoreScrollPosition(1)
                            }, function (err) {
                                pageScope.handleError(vm, "API ERROR: MarkerGetByJnum.search: " + err);
                            })
                        } else {
                            throw "No argument. Please specify refs_id."
                        }
                };

                function prepareForDisplay (markers) {
                    markers.forEach(m => {
                        m.synonyms = (m.synonyms || "").replaceAll(",", ", ")
                    })
                    vm.apiDomain.markers = markers
                    vm.apiDomain.allMarkers = markers
                    if (markers.length > vm.markersMax) {
                        vm.apiDomain.markersTruncated = true
                        vm.apiDomain.markers = markers.slice(0,vm.markersMax)
                    }
                }

                function downloadTsvFile () {
                    FileWriter.writeDataToTsvFile('marker_summary', vm.apiDomain.allMarkers, [
                        ["Symbol", "symbol"],
                        ["Marker Status", "markerStatus"],
                        ["MGI ID", "accID"],
                        ["Name", "name"],
                        ["Synonyms", "synonyms"],
                        ["Feature Type", "featureType"],
                        ["Marker Type", "markerType"]
                        ])
                }
        }
})();

