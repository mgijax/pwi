(function() {
	'use strict';
	angular.module('pwi.probesummary').controller('ProbeSummaryController', ProbeSummaryController);

	function ProbeSummaryController(
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
                        SmartAlphaSort,
			// resource APIs
                        ProbeGetByMarkerAPI,
                        ProbeGetByJnumAPI,
                        ProbeGetBySearchAPI,
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

                // only show first N probes, unless/until user clicks show all
                vm.probesMax = 2500
                vm.probesTruncated = false;

                vm.loading = false;

		// api/json input/output
		vm.apiDomain = {};
                $scope.vmd = vm.apiDomain
                $scope.downloadTsvFile = downloadTsvFile

		// Initializes the needed page values 
                this.$onInit = function () { 
                        const args = UrlParser.parseSearchString()
                        const marker = document.location.search.split("?marker_id=")[1]
                        const jnum = document.location.search.split("?refs_id=")[1]
                        if (args.marker_id) {
                            vm.loading=true
                            vm.youSearchForString = $scope.youSearchedFor([['Marker ID',args.marker_id]])
                            ProbeGetByMarkerAPI.search(args.marker_id, function (probes) {
                                prepareForDisplay(probes)
                                vm.loading=false
                            }, function (err) {
                                pageScope.handleError(vm, "API ERROR: ProbeGetByMarker.search: " + err);
                            })
                        } else if (args.refs_id) {
                            vm.loading=true
                            vm.youSearchForString = $scope.youSearchedFor([['Reference JNum',args.refs_id]])
                            ProbeGetByJnumAPI.search(args.refs_id, function (probes) {
                                prepareForDisplay(probes)
                                vm.loading=false
                            }, function (err) {
                                pageScope.handleError(vm, "API ERROR: ProbeGetByJnum.search: " + err);
                            })
                        } else {
                            vm.loading=true
                            vm.youSearchForString = $scope.youSearchedFor(Object.entries(args))
                            ProbeGetBySearchAPI.search(args, function (probes) {
                                prepareForDisplay(probes)
                                vm.loading=false
                            }, function (err) {
                                pageScope.handleError(vm, "API ERROR: ProbeGetByJnum.search: " + err);
                            })
                        }
                };

                function prepareForDisplay (probes) {
                    SmartAlphaSort.sort(probes, p => p.name.toLowerCase())
                    probes.forEach(p => {
                        const replacementString = "&nbsp;|<br />"
                        p.markerSymbolHtml = (p.markerSymbol || "").replaceAll("|", replacementString)
                        p.markerIdHtml = (p.markerID || "").split("|").map( mid => {
                            const murl = $scope.url_for('pwi.markerdetail', {id:mid})
                            return `<a href="${murl}">${mid}</a>`
                        }).join(replacementString)
                        p.aliases = (p.aliases || "").replaceAll(",", " | ")
                        p.jnumsString = (p.jnumIDs || "").split("|").map(jnum => {
                            const jurl = $scope.url_for('pwi.referencesummary', { accids : jnum })
                            return `<a href="${jurl}">${jnum}</a>`
                        }).join (" | ")
                    })
                    vm.apiDomain.probes = probes
                    vm.apiDomain.allProbes = probes
                    if (probes.length > vm.probesMax) {
                        vm.apiDomain.probesTruncated = true
                        vm.apiDomain.probes = probes.slice(0,vm.probesMax)
                    }
                }

                function downloadTsvFile () {
                    FileWriter.writeDataToTsvFile('probe_summary', vm.apiDomain.allProbes, [
                        ["Probe ID", "probeID"],
                        ["Name", "name"],
                        ["Type", "segmentType"],
                        ["Markers", "markerSymbol"],
                        ["Marker IDs", "markerID"],
                        ["Primer Sequence 1", "primer1Sequence"],
                        ["Primer Sequence 2", "primer2Sequence"],
                        ["Aliases", "aliases"],
                        ["Organism", "organism"],
                        ["Parent ID", "parentID"],
                        ["Parent Name", "parentName"],
                        ["J#s", "jnumIDs"]
                        ])
                }
        }
})();

