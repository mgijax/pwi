(function() {
	'use strict';
	angular.module('pwi.resultsummary').controller('ResultSummaryController', ResultSummaryController);

	function ResultSummaryController(
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
                        FileWriter,
			// resource APIs
                        ResultGetByRefAPI,
                        ResultGetByMarkerAPI,
                        ResultGetByStructureAPI,
                        ResultGetByCellTypeAPI,
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

                // only show first N results, unless/until user clicks show all
                vm.resultsMax = 1000
                vm.resultsTruncated = false

                vm.loading = false
                vm.total_count = 0
                vm.page_size = 250

		// api/json input/output
		vm.apiDomain = {};
                $scope.vmd = vm.apiDomain
                $scope.downloadTsvFile = downloadTsvFile

                const summaryOptions = [{
                    idArg : 'refs_id',
                    idLabel: 'Reference',
                    apiArg: 'jnumid',
                    service: ResultGetByRefAPI
                },{
                    idArg : 'marker_id',
                    idLabel: 'Marker',
                    apiArg: 'markerID',
                    service: ResultGetByMarkerAPI
                },{
                    idArg : 'structure_id',
                    idLabel: 'Structure',
                    apiArg: 'structureID',
                    service: ResultGetByStructureAPI
                },{
                    idArg : 'celltype_id',
                    idLabel: 'Cell Type',
                    apiArg: 'cellTypeID',
                    service: ResultGetByCellTypeAPI
                }]
		// 
                this.$onInit = function () { 
                    const args = UrlParser.parseSearchString()
                    for (let oi = 0; oi < summaryOptions.length; oi++) {
                        const o = summaryOptions[oi]
                        if (args[o.idArg]) {
                            vm.youSearchForString = $scope.youSearchedFor([[o.idLabel + ' ID', args[o.idArg]]])
                            this.service = o.service
                            this.serviceArg = {}
                            this.serviceArg[o.apiArg] = args[o.idArg]
                            // load the first page
                            $scope.pageAction(1, 250)
                            return
                        }
                    }
                    throw "No argument. Please specify one of: " + summaryOption.map(o => idArg).join(", ")
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
                    }, function (err) {
                        pageScope.handleError(vm, "API ERROR: Get assays by " + idLabel + ": " + err);
                    })
                }

                function prepareForDisplay (results) {
                    results.forEach(m => {
                        m.synonyms = (m.synonyms || "").replaceAll(",", ", ")
                    })
                    vm.apiDomain.results = results
                    vm.apiDomain.allResults = results
                    if (results.length > vm.resultsMax) {
                        vm.apiDomain.resultsTruncated = true
                        vm.apiDomain.results = results.slice(0,vm.resultsMax)
                    }
                }

                function downloadTsvFile () {
                    FileWriter.writeDataToTsvFile('result_summary', vm.apiDomain.allResults, [
                        ])
                }
        }
})();

