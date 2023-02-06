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

		// api/json input/output
		vm.apiDomain = {};
                $scope.vmd = vm.apiDomain

		// Initializes the needed page values 
                this.$onInit = function () { 
                        const jnum = document.location.search.split("?jnum=")[1]
                        if (jnum) {
                            vm.loading=true
                            vm.youSearchForString = $scope.youSearchedFor([['Reference JNum',jnum]])
                            SpecimenGetByJnumAPI.search({accid:jnum}, function (specimens) {
                                prepareForDisplay(specimens.items)
                                vm.loading=false
				$scope.restoreScrollPosition(1)
                            }, function (err) {
                                pageScope.handleError(vm, "API ERROR: SpecimenGetByJnum.search: " + err);
                            })
                        } else {
                            throw "No argument. Please specify refs_id."
                        }
                };

                function prepareForDisplay (specimens) {
		    const ntc = NoteTagConverter
                    specimens.forEach(s => {
		        s.markerSymbol = ntc.superscript(s.markerSymbol)
		        s.specimenLabel = ntc.superscript(s.specimenLabel)
		        s.alleleDetailNote = ntc.superscript(s.alleleDetailNote)
			if (s.conditional) s.alleleDetailNote += "<br/>(conditional)"
		        s.specimenNote = ntc.convert(ntc.superscript(s.specimenNote || ""))
                    })
                    vm.apiDomain.specimens = specimens
                }

        }
})();

