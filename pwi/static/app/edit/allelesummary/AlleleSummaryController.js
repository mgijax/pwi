(function() {
	'use strict';
	angular.module('pwi.allelesummary').controller('AlleleSummaryController', AlleleSummaryController);

	function AlleleSummaryController(
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
                        AlleleGetByMarkerAPI,
                        AlleleGetByRefAPI,
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

                // only show first N alleles, unless/until user clicks show all
                vm.alleleMax = 1000
                vm.allelesTruncated = false;

                vm.loading = false;
                vm.total_count = 0;
                vm.page_size = 1000

		// api/json input/output
		vm.apiDomain = {};
                $scope.vmd = vm.apiDomain

                const downloadBase = JAVA_API_URL + "allele/"
                const summaryOptions = [{
                    idArg : 'refs_id',
                    idLabel: 'Reference JNum',
                    apiArg: 'accid',
                    service: AlleleGetByRefAPI,
                    download: downloadBase + 'downloadAlleleByRef?accid='
                },{
                    idArg : 'marker_id',
                    idLabel: 'Marker',
                    apiArg: 'accid',
                    service: AlleleGetByMarkerAPI,
                    download: downloadBase + 'downloadAlleleByMarker?accid='
                }]

		// Initializes the needed page values 
                this.$onInit = function () { 
                    const args = UrlParser.parseSearchString()
                    for (let oi = 0; oi < summaryOptions.length; oi++) {
                        const o = summaryOptions[oi]
                        if (args[o.idArg]) {
                            const accid = document.location.search.split("?" + o.idArg + "=")[1]
                            vm.loading=true
			    vm.downloadUrl = o.download + accid
                            vm.youSearchForString = $scope.youSearchedFor([[o.idLabel,accid]])
                            this.service = o.service
                            this.serviceArg = {accid}
                            // load the first page
                            $scope.pageAction(1, vm.page_size)
                            return
                        }
                    }
                    throw "No argument. Please specify one of: refs_id, marker_id."
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
                        pageScope.handleError(vm, "API ERROR: Get allele by " + idLabel + ": " + err);
                    })
                }

                function prepareForDisplay (alleles) {
                    alleles.forEach(a => {
                        a.attrs = (a.attrs || "").replace(/,/g, ", ")
                        a.diseases = (a.diseases || "").replace(/,/g, ", ")
                        a.synonyms = (a.synonyms || "").replace(/,/g, ", ")
                    })
                    vm.apiDomain.alleles = alleles
                    vm.apiDomain.allAlleles = alleles
                    if (alleles.length > vm.alleleMax) {
                        vm.apiDomain.allelesTruncated = true
                        vm.apiDomain.alleles = alleles.slice(0,vm.alleleMax)
                    }
                }

        }
})();

