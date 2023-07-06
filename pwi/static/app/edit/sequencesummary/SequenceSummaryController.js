(function() {
	'use strict';
	angular.module('pwi.sequencesummary').controller('SequenceSummaryController', SequenceSummaryController);

	function SequenceSummaryController(
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
                        SequenceGetByMarkerAPI,
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

		const downloadBase = JAVA_API_URL + "/sequence"
                const summaryOptions = [{
                    idArg : 'marker_id',
                    idLabel: 'Marker',
		    apiArg: 'accid',
                    service: SequenceGetByMarkerAPI,
		    download: downloadBase + "downloadRefByMarker"
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

                function prepareForDisplay (sequences) {
                    sequences.forEach(r => {
		        r.markers = (r.markers || "").split(",").map(m => {
			    const pts = m.split("|")
			    const symbol = pts[0]
			    const accid = pts[1]
			    const url = $scope.url_for('pwi.markerdetail', {id:accid})
			    return `<a href="${url}">${symbol}</a>`
			}).join(', ')
                    })
                    vm.apiDomain.sequences = sequences
                }

        }
})();

