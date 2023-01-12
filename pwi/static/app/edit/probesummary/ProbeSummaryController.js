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
			// resource APIs
                        ProbeGetByMarkerAPI,
                        ProbeGetByJnumAPI,
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
                        const marker = document.location.search.split("?marker_id=")[1]
                        const jnum = document.location.search.split("?refs_id=")[1]
                        if (marker) {
                            vm.loading=true
                            vm.youSearchForString = $scope.youSearchedFor([['Marker ID',marker]])
                            ProbeGetByMarkerAPI.search(marker, function (probes) {
                                prepareForDisplay(probes)
                                vm.loading=false
                            }, function (err) {
                                pageScope.handleError(vm, "API ERROR: ProbeGetByMarker.search: " + err);
                            })
                        } else if (jnum) {
                            vm.loading=true
                            vm.youSearchForString = $scope.youSearchedFor([['Reference JNum',jnum]])
                            ProbeGetByJnumAPI.search(jnum, function (probes) {
                                prepareForDisplay(probes)
                                vm.loading=false
                            }, function (err) {
                                pageScope.handleError(vm, "API ERROR: ProbeGetByJnum.search: " + err);
                            })
                        } else {
                            throw "No argument. Please specify marker_id or refs_id."
                        }
                };

                function prepareForDisplay (probes) {
                    probes.sort((pa, pb) => {
                        if (pa.name < pb.name) {
                            return -1
                        } else if (pa.name > pb.name) {
                            return 1
                        } else {
                            return 0
                        }
                    })
                    probes.forEach(p => {
                        const replacementString = "&nbsp;|<br />"
                        p.markerSymbolHtml = p.markerSymbol.replaceAll("|", replacementString)
                        p.markerIdHtml = p.markerID.split("|").map( mid => {
                            const murl = $scope.url_for('pwi.markerdetail', {id:mid})
                            return `<a href="${murl}">${mid}</a>`
                        }).join(replacementString)
                        p.aliases = p.aliases.replaceAll(",", " | ")
                        p.jnumsString = (p.jnumIDs || "").split("|").map(jnum => {
                            const jurl = $scope.url_for('pwi.referencesummary', { accids : jnum })
                            return `<a href="${jurl}">${jnum}</a>`
                        }).join (replacementString)
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

