(function() {
	'use strict';
	angular.module('pwi.genotypesummary').controller('GenotypeSummaryController', GenotypeSummaryController);

	function GenotypeSummaryController(
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
                        GenotypeGetByRefAPI,
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
                vm.page_size = 250

		// api/json input/output
		vm.apiDomain = {};
                $scope.vmd = vm.apiDomain

		// Initializes the needed page values 
                this.$onInit = function () { 
                        const accid = document.location.search.split("?refs_id=")[1]
                        if (accid) {
                            vm.loading=true
			    vm.downloadUrl = JAVA_API_URL + 'genotype/downloadGenotypeByRef?accid=' + accid
                            vm.youSearchForString = $scope.youSearchedFor([['Reference JNum',accid]])
                            this.service = GenotypeGetByRefAPI
                            this.serviceArg = {accid}
                            // load the first page
                            $scope.pageAction(1, vm.page_size)
                        } else {
                            throw "No argument. Please specify jnum."
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
                        pageScope.handleError(vm, "API ERROR: Get genotypes by " + idLabel + ": " + err);
                    })
                }

                function prepareForDisplay (genotypes) {
		    const ntc = NoteTagConverter
                    genotypes.forEach(s => {

		        s.alleleDetailNote = ntc.superscript(s.alleleDetailNote)
                        if (s.isConditional) s.alleleDetailNote += "<br/>(conditional)"

			s.genotypeBackground = ntc.superscript(s.genotypeBackground)

                        if (s.hasAssay) s.displayAssay = "yes"
                        if (s.hasMPAnnot) s.displayMPAnnot = "yes"
                        if (s.hasDOAnnot) s.displayDOAnnot = "yes"
                    })
                    vm.apiDomain.genotypes = genotypes
                }

        }
})();

