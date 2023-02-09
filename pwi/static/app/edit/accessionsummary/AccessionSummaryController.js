(function() {
	'use strict';
	angular.module('pwi.accessionsummary').controller('AccessionSummaryController', AccessionSummaryController);

	function AccessionSummaryController(
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
			AccessionGetByAccidAPI,
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

		// api/json input/output
		vm.apiDomain = {};
                $scope.vmd = vm.apiDomain

                const summaryOptions = [{
                    idArg : 'ids',
                    idLabel: 'Accession ID(s)',
		    apiArg: 'ids',
                    service: AccessionGetByAccidAPI,
		    download: null
		}]

		const typemap = {
		    Reference: {
		        page: "pwi.referencesummary",
			argName: "accids"
		    },
		    Marker: {
		        page: "pwi.markerdetail",
			argName: "id"
		    },
		    Allele: {
		        page: "pwi.alleledetail",
			argName: "id"
		    },
		    Antibody: {
		        page: "pwi.antibodydetail",
			argName: "id"
		    },
		    Segment: {
		        page: "pwi.probedetail",
			displayType: "Probe",
			argName: "id"
		    },
		    Experiment: {
		        page: "pwi.mappingdetail",
			displayType: "MappingExperiment",
			argName: "id"
		    },
		    Assay: {
		        page: "pwi.assaydetail",
			argName: "id"
		    },
		    Image: {
		        page: "pwi.imagedetail",
			argName: "id"
		    },
		    "Vocabulary Term" : {
		    	page: "pwi.voctermdetail",
			displayType: "VocTerm",
			argName: "id"
		    }
		};

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
			    const a = args[o.idArg].replaceAll(",", " ").split(" ").filter(x => x).join(",")
			    this.serviceArg[o.apiArg] = a
			    this.doSummary()
                            return
                        }
                    }
                    throw "No argument. Please specify one of: " + summaryOptions.map(o => o.idArg).join(", ")
                };

                this.doSummary = function () {
                    vm.loading=true
                    this.service.search(this.serviceArg, (results) => {
                        this.prepareForDisplay(results)
                        vm.loading=false
                        vm.total_count = results.length
			$scope.restoreScrollPosition(1)
                    }, function (err) {
                        pageScope.handleError(vm, "API ERROR: " + err);
                    })
		};

                this.prepareForDisplay = function (accessions) {
                    accessions.forEach(r => {
			const tmap = typemap[r.mgiTypeName]
		        if (tmap) {
			    const arg = {}
			    arg[tmap.argName] = r.accID
			    r.mgiTypeKey = parseInt(r.mgiTypeKey)
			    r.url = $scope.url_for(tmap.page, arg)
			    r.mgiTypeName = tmap.displayType || r.mgiTypeName
			}
                    })
		    accessions = accessions.filter(a => a.url)
		    if (accessions.length === 1) {
			// if there's only one result, forward to that page
		        window.location = accessions[0].url
		    } else {
			accessions.sort((a,b) => {
			    const n = a.mgiTypeKey - b.mgiTypeKey
			    if (n != 0) return n
			    if (a.accID < b.accID) return -1
			    if (a.accID > b.accID) return 1
			    return 0
			})
			vm.apiDomain.accessions = accessions
		    }
                }

        }
})();

