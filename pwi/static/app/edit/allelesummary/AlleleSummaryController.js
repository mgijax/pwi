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
			// resource APIs
                        AlleleGetByMarkerAPI,
                        AlleleGetByJnumAPI,
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

                // only show first N alleles, unless/until user clicks show all
                vm.alleleMax = 1000
                vm.allelesTruncated = false;

                vm.loading = false;

		// api/json input/output
		vm.apiDomain = {};
                $scope.vmd = vm.apiDomain
                $scope.downloadTsvFile = downloadTsvFile

		// Initializes the needed page values 
                this.$onInit = function () { 
                        console.log("onInit")

                        const markerID = document.location.search.split("?marker_id=")[1]
                        const jnum = document.location.search.split("?refs_id=")[1]
                        if (markerID) {
                            vm.loading=true
                            vm.youSearchForString = $scope.youSearchedFor([['Marker MGIID', markerID]])
                            AlleleGetByMarkerAPI.search(markerID, function (alleles) {
                                prepareForDisplay(alleles)
                                vm.loading=false
                            }, function (err) {
                                pageScope.handleError(vm, "API ERROR: AlleleGetByMarker.search: " + err);
                            })
                        } else if (jnum) {
                            const jnum = document.location.search.split("?refs_id=")[1]
                            vm.loading=true
                            vm.youSearchForString = $scope.youSearchedFor([['Reference JNum',jnum]])
                            AlleleGetByJnumAPI.search(jnum, function (alleles) {
                                prepareForDisplay(alleles)
                                vm.loading=false
                            }, function (err) {
                                pageScope.handleError(vm, "API ERROR: AlleleGetByJnum.search: " + err);
                            })
                        } else {
                            throw "No argument. Please specify marker_id or refs_id."
                        }
                };

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

