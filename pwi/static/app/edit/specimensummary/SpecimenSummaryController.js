(function() {
	'use strict';
	angular.module('pwi.specimensummary').controller('SpecimenSummaryController', SpecimenSummaryController);

	function SpecimenSummaryController(
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
			// resource APIs
                        SpecimenGetByJnumAPI,
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
		vm.total_count = 0;

		// api/json input/output
		vm.apiDomain = {};
                $scope.vmd = vm.apiDomain

		// Initializes the needed page values 
                this.$onInit = function () { 
                        const jnum = document.location.search.split("?jnum=")[1]
                        if (jnum) {
                            vm.loading=true
			    vm.downloadUrl = JAVA_API_URL + 'specimen/downloadSpecimenByRef?accid=' + jnum
                            vm.youSearchForString = $scope.youSearchedFor([['Reference JNum',jnum]])
			    
                            this.service = SpecimenGetByJnumAPI
                            this.serviceArg = {accid:jnum}
                            // load the first page
                            $scope.pageAction(1, 250)
                        } else {
                            throw "No argument. Please specify refs_id."
                        }
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
                        pageScope.handleError(vm, "API ERROR: Get assays by " + idLabel + ": " + err);
                    })
                }

                function prepareForDisplay (specimens) {
		    const ntc = NoteTagConverter
                    specimens.forEach(s => {
		        s.markerSymbol = ntc.superscript(s.markerSymbol)
		        s.specimenLabel = ntc.superscript(s.specimenLabel)
		        s.alleleDetailNote = ntc.superscript(s.alleleDetailNote)
			s.genotypeBackground = ntc.superscript(s.genotypeBackground)
			if (s.conditional) s.alleleDetailNote += "<br/>(conditional)"
		        s.specimenNote = ntc.convert(ntc.superscript(s.specimenNote || ""))
                    })
                    vm.apiDomain.specimens = specimens
                }

        }
})();

