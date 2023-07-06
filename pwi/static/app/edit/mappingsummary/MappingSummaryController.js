(function() {
	'use strict';
	angular.module('pwi.mappingsummary').controller('MappingSummaryController', MappingSummaryController);

	function MappingSummaryController(
			// angular tools
			$document,
			$filter,
			$http,  
			$q,
			$scope, 
			$timeout,
			$window, 
			// utilities
                        UrlParser,
                        NoteTagConverter,
			// resource APIs
                        MappingGetByMarkerAPI,
			MappingGetByJnumAPI,
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
		vm.total_count = 0
                vm.page_size = 250

		// api/json input/output
		vm.apiDomain = {};
                $scope.vmd = vm.apiDomain

		const downloadBase = JAVA_API_URL + "mapping/"
                const summaryOptions = [{
                    idArg : 'marker_id',
                    idLabel: 'Marker',
		    apiArg: 'accid',
                    service: MappingGetByMarkerAPI,
		    download: downloadBase + "downloadExptsByMarker"
		},{
                    idArg : 'refs_id',
                    idLabel: 'Jnum',
		    apiArg: 'accid',
                    service: MappingGetByJnumAPI,
		    download: downloadBase + "downloadExptsByRef"
		}]

		// Initializes the needed page values 
                this.$onInit = function () { 
                    const args = UrlParser.parseSearchString()
                    for (let oi = 0; oi < summaryOptions.length; oi++) {
                        const o = summaryOptions[oi]
                        if (args[o.idArg]) {
			    vm.youSearchForString = $scope.youSearchedFor([[o.idLabel + ' ID', args[o.idArg]]])
			    vm.downloadUrl = o.download + '?' + o.apiArg + '=' + args[o.idArg]
			    this.service = o.service
			    this.serviceArg = {}
			    this.serviceArg[o.apiArg] = args[o.idArg]
                            // load the first page
                            $scope.pageAction(1, vm.page_size)
                            return
                        }
                    }
                    throw "No argument. Please specify one of: " + summaryOptions.map(o => o.idArg).join(", ")
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
                        pageScope.handleError(vm, "API ERROR: " + err);
                    })
                }

                function prepareForDisplay (expts) {
                    expts.forEach(e => {
                    })
                    vm.apiDomain.expts = expts
                }

        }
})();

