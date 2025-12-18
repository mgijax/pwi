(function() {
	'use strict';
	angular.module('pwi.antibodysummary').controller('AntibodySummaryController', AntibodySummaryController);

	function AntibodySummaryController(
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
                        AntibodyGetByMarkerAPI,
                        AntibodyGetByJnumAPI,
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

                // only show first N antibodies, unless/until user clicks show all
                vm.antibodiesMax = 1000
                vm.antibodiesTruncated = false;

                vm.loading = false;

		// api/json input/output
		vm.apiDomain = {};
                $scope.vmd = vm.apiDomain
                $scope.downloadTsvFile = downloadTsvFile

		// Initializes the needed page values 
                this.$onInit = function () { 
                        const marker = document.location.search.split("?marker_id=")[1]
                        const jnum = document.location.search.split("?refs_id=")[1]
                        if (jnum) {
                            vm.loading=true
                            vm.youSearchForString = $scope.youSearchedFor([['Reference JNum',jnum]])
                            AntibodyGetByJnumAPI.search(jnum, function (antibodies) {
                                prepareForDisplay(antibodies)
                                vm.loading=false
				$scope.restoreScrollPosition(1)
                            }, function (err) {
                                pageScope.handleError(vm, "API ERROR: AntibodyGetByJnum.search: " + err);
                            })
                        } else if (marker) {
                            vm.loading=true
                            vm.youSearchForString = $scope.youSearchedFor([['Marker ID',marker]])
                            AntibodyGetByMarkerAPI.search(marker, function (antibodies) {
                                prepareForDisplay(antibodies)
                                vm.loading=false
				$scope.restoreScrollPosition(1)
                            }, function (err) {
                                pageScope.handleError(vm, "API ERROR: AntibodyGetByMarker.search: " + err);
                            })
                        } else {
         
         throw "No argument. Please specify refs_id or marker_id."
                        }
                };

                function prepareForDisplay (antibodies) {
                    antibodies.sort((a,b) => {
                        const ma = a.markerSymbol
                        const mb = b.markerSymbol
                        if (ma < mb) {
                            return -1
                        } else if (ma > mb) {
                            return 1
                        } else if (ma === null && mb !== null) {
                            return 1
                        } else if (ma !== null && mb === null) {
                            return -1
                        } else if (a.antibodyName < b.antibodyName) {
                            return -1
                        } else if (a.antibodyName > b.antibodyName) {
                            return 1
                        } else if (a.antibodyID < b.antibodyID) {
                            return -1
                        } else if (a.antibodyID > b.antibodyID) {
                            return 1
                        } else {
                            return 0
                        }
                    })
                    antibodies = antibodies.reduce((v,a) => {
                        const p = v[v.length - 1] // previous antibody
                        if (p && a.antibodyID === p.antibodyID) {
                            p.markerSymbol += ', ' + a.markerSymbol
                        } else {
                            v.push(a)
                        }
                        return v
                    }, [])
                    vm.apiDomain.antibodies = antibodies
                    vm.apiDomain.allAntibodies = antibodies
                    if (antibodies.length > vm.antibodiesMax) {
                        vm.apiDomain.antibodiesTruncated = true
                        vm.apiDomain.antibodies = antibodies.slice(0,vm.antibodiesMax)
                    }
                }

                function downloadTsvFile () {
                    FileWriter.writeDataToTsvFile('antibody_summary', vm.apiDomain.allAntibodies, [
                        ["MGI ID","antibodyID"],
                        ["Name","antibodyName"],
                        ["Alias(es)","aliases"],
                        ["Organism","antibodyOrganism"],
                        ["Type","antibodyType"],
                        ["Class","antibodyClass"],
                        ["Notes","antibodyNote"],
                        ["Antigen Organism","antigenOrganism"],
                        ["Region","regionCovered"],
                        ["Notes","antigenNote"],
                        ["Markers","markerSymbol"],
                        ["Reference ID","jnumID"],
                        ["Citation","shortCitation"],
                    ])
                }
        }
})();

