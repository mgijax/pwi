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

                const downloadBase = JAVA_API_URL + "assay/"
                const summaryOptions = [{
                    idArg : 'refs_id',
                    idLabel: 'Reference',
		    apiArg: 'accid',
                    service: AssayGetByRefAPI,
                    download: downloadBase + 'downloadAssayByRef'
                },{
                    idArg : 'marker_id',
                    idLabel: 'Marker',
		    apiArg: 'accid',
                    service: AssayGetByMarkerAPI,
                    download: downloadBase + 'downloadAssayByMarker'
                },{
                    idArg : 'allele_id',
                    idLabel: 'Allele',
		    apiArg: 'accid',
                    service: AssayGetByAlleleAPI,
                    download: downloadBase + 'downloadAssayByAllele'
                },{
                    idArg : 'probe_id',
                    idLabel: 'Probe',
		    apiArg: 'accid',
                    service: AssayGetByProbeAPI,
                    download: downloadBase + 'downloadAssayByProbe'
                },{
                    idArg : 'antibody_id',
                    idLabel: 'Antibody',
		    apiArg: 'accid',
                    service: AssayGetByAntibodyAPI,
                    download: downloadBase + 'downloadAssayByAntibody'
                }]

		// Initializes the needed page values 
                this.$onInit = function () { 
                    const args = UrlParser.parseSearchString()
                    for (let oi = 0; oi < summaryOptions.length; oi++) {
                        const o = summaryOptions[oi]
                        if (args[o.idArg]) {
                            doSummary(args[o.idArg], o.idLabel, o.apiArg, o.service, o.download)
                            return
                        }
                    }
                    throw "No argument. Please specify one of: refs_id, marker_id, allele_id, probe_id, antibody_id."
                };

                function doSummary(id, idLabel, apiArg, service, download) {
                    vm.loading=true
                    vm.accid = id
                    vm.downloadUrl = download + "?" + apiArg + "=" + id
                    vm.youSearchForString = $scope.youSearchedFor([[idLabel + ' MGIID', id]])
		    const arg = {}
		    arg[apiArg] = id
                    service.search(arg, function (assays) {
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

        }
})();

