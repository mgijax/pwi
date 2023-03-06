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
			// resource APIs
                        AntibodyGetByMarkerAPI,
                        AntibodyGetByRefAPI,
			// config
                        JAVA_API_URL,
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
                vm.total_count = 0;

		// api/json input/output
		vm.apiDomain = {};
                $scope.vmd = vm.apiDomain

		// Initializes the needed page values 
                this.$onInit = function () { 
                        const marker = document.location.search.split("?marker_id=")[1]
                        const jnum = document.location.search.split("?refs_id=")[1]
                        if (jnum) {
                            vm.loading=true
			    vm.downloadUrl = JAVA_API_URL + 'antibody/downloadAntibodyByRef?accid=' + jnum
                            vm.youSearchForString = $scope.youSearchedFor([['Reference JNum',jnum]])
                            this.service = AntibodyGetByRefAPI
                            this.serviceArg = {accid:jnum}
                            $scope.pageAction(1, 1000)
                        } else if (marker) {
                            vm.loading=true
			    vm.downloadUrl = JAVA_API_URL + 'antibody/downloadAntibodyByMarker?accid=' + jnum
                            vm.youSearchForString = $scope.youSearchedFor([['Marker ID',marker]])
                            this.service = AntibodyGetByMarkerAPI
                            this.serviceArg = {accid:marker}
                            $scope.pageAction(1, 1000)
                        } else {
                            throw "No argument. Please specify refs_id or marker_id."
                        }
                };

                $scope.pageAction = (pageFirstRow, pageNRows) => {
                    this.serviceArg.offset = pageFirstRow - 1
                    this.serviceArg.limit = pageNRows
                    this.doSummary ()
                }

                this.doSummary = function () {
                    vm.loading=true
                    this.service.search(this.serviceArg, function (results) {
                        prepareForDisplay(results.items)
                        vm.loading=false
                        vm.total_count = results.total_count
                        $scope.restoreScrollPosition(1)
                    }, function (err) {
                        pageScope.handleError(vm, "API ERROR: Get markesr by " + idLabel + ": " + err);
                    })
                }

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
        }
})();

