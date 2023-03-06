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
			// resource APIs
                        MarkerGetByRefAPI,
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

                vm.loading = false;
		vm.total_count = 0;

		// api/json input/output
		vm.apiDomain = {};
                $scope.vmd = vm.apiDomain

		// Initializes the needed page values 
                this.$onInit = function () { 
                        const jnum = document.location.search.split("?refs_id=")[1]
                        if (jnum) {
                            vm.loading=true
			    vm.downloadUrl = JAVA_API_URL + 'marker/downloadMarkerByRef?accid=' + jnum
                            vm.youSearchForString = $scope.youSearchedFor([['Reference JNum',jnum]])
			    
                            this.service = MarkerGetByRefAPI
                            this.serviceArg = {accid:jnum}
                            // load the first page
                            $scope.pageAction(1, 1000)
                        } else {
                            throw "No argument. Please specify jnum."
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

                function prepareForDisplay (markers) {
                    const ntc = NoteTagConverter
                    markers.forEach(s => {
                        s.synonyms = (s.synonyms || "").replaceAll(",", ", ")
                    })
                    vm.apiDomain.markers = markers
                    vm.apiDomain.allMarkers = markers
                    if (markers.length > vm.markersMax) {
                        vm.apiDomain.markersTruncated = true
                        vm.apiDomain.markers = markers.slice(0,vm.markersMax)
                    }
                }
        }
})();

