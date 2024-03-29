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
                        FileWriter,
                        UrlParser,
			// resource APIs
                        GenotypeGetByRefAPI,
                        GenotypeGetByClipboardAPI,
                        GenotypeGetByAccIDAPI,
			// config
			JAVA_API_URL,
			USERNAME,
                        REQUEST_ARGS
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

                const downloadBase = JAVA_API_URL + "genotype/"
                const summaryOptions = [{
                    idArg : 'refs_id',
                    idLabel: 'Reference JNum',
                    apiArg: 'accid',
                    service: GenotypeGetByRefAPI,
                    download: downloadBase + 'downloadGenotypeByRef?accid='
                },{
                    idArg : 'user_id',
                    idLabel: 'Clipboard By User',
                    apiArg: 'accid',
                    service: GenotypeGetByClipboardAPI,
                    download: downloadBase + 'downloadGenotypeByClipboard?accid='
                },{
                    idArg : 'accid',
                    idLabel: 'Accession IDs',
                    apiArg: 'accid',
                    service: GenotypeGetByAccIDAPI,
                    download: downloadBase + 'downloadGenotypeByAccIDs?accid='
                }]

		// Initializes the needed page values 
                this.$onInit = function () { 
                    for (let oi = 0; oi < summaryOptions.length; oi++) {
                        const o = summaryOptions[oi]
                        if (REQUEST_ARGS[o.idArg]) {
                            const accid = REQUEST_ARGS[o.idArg]
                            vm.loading=true
			    vm.downloadUrl = o.download + accid
                            vm.youSearchForString = $scope.youSearchedFor([[o.idLabel,accid]])
                            this.service = o.service
                            if (o.idArg == "accid") {
                                this.serviceArg = accid
                                vm.page_size = 100000
                            } else {
                                this.serviceArg = {accid}
                            }
                            // load the first page
                            $scope.pageAction(1, vm.page_size, o.idArg)
                            return
                        }
                    }
                    throw "No argument. Please specify one of: refs_id, user_id, accid."
                };

                $scope.pageAction = (pageFirstRow, pageNRows, idArg) => {
                    if (idArg != "accid") {
                        this.serviceArg.offset = pageFirstRow - 1
                        this.serviceArg.limit = pageNRows
                    }
                    this.doSummary (idArg)
                }

                this.doSummary = function (idArg) {
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

