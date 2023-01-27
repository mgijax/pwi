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
                        AlleleGetByJnumAPI,
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

                // only show first N alleles, unless/until user clicks show all
                vm.alleleMax = 1000
                vm.allelesTruncated = false;

                vm.loading = false;

		// api/json input/output
		vm.apiDomain = {};
                $scope.vmd = vm.apiDomain
                $scope.downloadTsvFile = downloadTsvFile

                const downloadBase = JAVA_API_URL + "allele/download/"
                const summaryOptions = [{
                    idArg : 'refs_id',
                    idLabel: 'Reference',
                    apiArg: 'accid',
                    service: AlleleGetByJnumAPI,
                    download: downloadBase + 'getAlleleByRef'
                },{
                    idArg : 'marker_id',
                    idLabel: 'Marker',
                    apiArg: 'accid',
                    service: AlleleGetByMarkerAPI,
                    download: downloadBase + 'getAlleleByMarker'
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
                    throw "No argument. Please specify one of: refs_id, marker_id."
                };

                function doSummary(id, idLabel, argName, service, download) {
                    vm.loading=true
                    vm.accid = id
                    vm.downloadUrl = download + "/" + id
                    vm.youSearchForString = $scope.youSearchedFor([[idLabel + ' MGIID', id]])
                    const arg = {}
                    arg[argName] = id
                    service.search(arg, function (alleles) {
                        prepareForDisplay(alleles)
                        vm.loading=false
                    }, function (err) {
                        pageScope.handleError(vm, "API ERROR: Get alleles by " + idLabel + ": " + err);
                    })
                }

                function prepareForDisplay (alleles) {
                    alleles.forEach(a => {
                        a.attributeString = (a.subtypeAnnots || []).map(sa => sa.term).join(", ")
                        a.diseaseAnnots = (a.diseaseAnnots || "").replace(/,/g, ", ")
                        a.synonymString = (a.synonyms || []).map(s => s.synonym).join(", ")
                    })
                    vm.apiDomain.alleles = alleles
                    vm.apiDomain.allAlleles = alleles
                    if (alleles.length > vm.alleleMax) {
                        vm.apiDomain.allelesTruncated = true
                        vm.apiDomain.alleles = alleles.slice(0,vm.alleleMax)
                    }
                }

                function downloadTsvFile () {
                    FileWriter.writeDataToTsvFile('allele_summary', vm.apiDomain.allAlleles, [
                        ["Symbol", "symbol"],
                        ["MGI ID", "accID"],
                        ["Name", "name"],
                        ["Synonyms", "synonymString"],
                        ["Transmission", "transmission"],
                        ["AlleleStatus", "alleleStatus"],
                        ["Generation Type", "alleleType"],
                        ["Attributes", "attributeString"],
                        ["MP Annotations", "mpAnnots"],
                        ["Disease Annotations", "diseaseAnnots"]
                        ])
                }


        }
})();

