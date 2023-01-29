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
                        AssayGetByAntibodyAPI,
                        AssayGetByProbeAPI,
			// config
			USERNAME,
                        JAVA_API_URL
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

                const downloadBase = JAVA_API_URL + "assay/download/"
                const summaryOptions = [{
                    idArg : 'refs_id',
                    idLabel: 'Reference',
                    service: AssayGetByRefAPI,
                    download: downloadBase + 'getAssayByRef'
                },{
                    idArg : 'marker_id',
                    idLabel: 'Marker',
                    service: AssayGetByMarkerAPI,
                    download: downloadBase + 'getAssayByMarker'
                },{
                    idArg : 'allele_id',
                    idLabel: 'Allele',
                    service: AssayGetByAlleleAPI,
                    download: downloadBase + 'getAssayByAllele'
                },{
                    idArg : 'probe_id',
                    idLabel: 'Probe',
                    service: AssayGetByProbeAPI,
                    download: downloadBase + 'getAssayByProbe'
                },{
                    idArg : 'antibody_id',
                    idLabel: 'Antibody',
                    service: AssayGetByAntibodyAPI,
                    download: downloadBase + 'getAssayByAntibody'
                }]

		// Initializes the needed page values 
                this.$onInit = function () { 
                    const args = UrlParser.parseSearchString()
                    for (let oi = 0; oi < summaryOptions.length; oi++) {
                        const o = summaryOptions[oi]
                        if (args[o.idArg]) {
                            doSummary(args[o.idArg], o.idLabel, o.service, o.download)
                            return
                        }
                    }
                    throw "No argument. Please specify one of: refs_id, marker_id, allele_id, probe_id, antibody_id."
                };

                function doSummary(id, idLabel, service, download) {
                    vm.loading=true
                    vm.accid = id
                    vm.downloadUrl = download + "/" + id
                    vm.youSearchForString = $scope.youSearchedFor([[idLabel + ' MGIID', id]])
                    service.search(id, function (assays) {
                        prepareForDisplay(assays)
                        vm.loading=false
			$scope.restoreScrollPosition(1)
                    }, function (err) {
                        pageScope.handleError(vm, "API ERROR: Get assays by " + idLabel + ": " + err);
                    })
                }

                function prepareForDisplay (assays) {
                    assays.forEach(a => {
                        const n = a.assayNote ? a.assayNote.assayNote : ''
                        const ntc = $scope.ntc
                        a.note = ntc.convert(ntc.escapeHtml(n))
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

