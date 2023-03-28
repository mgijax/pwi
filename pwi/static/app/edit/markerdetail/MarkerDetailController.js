(function() {
	'use strict';
	angular.module('pwi.markerdetail').controller('MarkerDetailController', MarkerDetailController);

	function MarkerDetailController(
			// angular tools
			$document,
			$filter,
			$http,  
			$q,
			$scope, 
			$timeout,
			$window, 
			// utilities
			ErrorMessage,
			FindElement,
			Focus,
                        NoteTagConverter,
			// resource APIs
                        AccessionSearchAPI,
			MarkerSearchAPI,
			MarkerGetAPI,
			// config
			USERNAME
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		$scope.USERNAME = USERNAME;

                // make utility functions available in scope
		$scope.ntc = NoteTagConverter

		var vm = $scope.vm = {};

		// api/json input/output
		vm.apiDomain = {};

                // default booleans for page functionality
		vm.hideApiDomain = true;       // JSON package
		vm.hideVmData = true;          // JSON package + other vm objects
                vm.hideErrorContents = true;	// display error message
                //
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		// Initializes the needed page values 
                this.$onInit = function () { 
                        const accID = document.location.search.split("?id=")[1]
                        if (accID) {
                            search(accID);
                        } else {
                            const key = document.location.search.split("?key=")[1]
                            loadObject(key)
                        }
                };

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

		// search by accession id
		function search(accID) {				
		
                        vm.apiDomain.accID = accID

			AccessionSearchAPI.search(vm.apiDomain, function(data) {
                            const mgiId = data.filter(a => a.logicaldbKey === "1" && a.mgiTypeKey === "2" && a.preferred === "1")[0]
                            if (mgiId) {
                                loadObject(mgiId.objectKey)
                            } else {
			        vm.error = "No marker found for id=" + vm.apiDomain.accID
                            }
		        }, function(err) {
			        pageScope.handleError(vm, "API ERROR: AccessionMarkerSearchAPI.search: " + err);
		        });
		}		

		// load object by marker key
		function loadObject(markerKey) {

			MarkerGetAPI.get({key: markerKey}, function(data) {
				vm.apiDomain = data;
                                prepareForDisplay(vm.apiDomain)
                                // for shorter refs
                                $scope.vmd = vm.apiDomain
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: MarkerGetAPI.get: " + err);
			});
		}	

                //
                function prepareForDisplay (vmd) {
                    vmd.accID = ''
                    const mgiidObj = (vmd.mgiAccessionIds || []).filter(i => i.preferred === "1")[0]
                    if (mgiidObj) vmd.accID = mgiidObj.accID

                    vmd.secondaryIds = (vmd.mgiAccessionIds || []).filter(i => i.preferred === "0" && i.prefixPart === "MGI:").map(i => i.accID).join(', ')

                    vmd.featureType = (vmd.featureTypesDirect || []).map(t => t.term).join(", ")

                    vmd.synonymsDisplay = (vmd.synonyms || []).map(s => $scope.ntc.superscript(s.synonym)).join(", ")
                    vmd.hasBiotypeConflict = (vmd.biotypes || []).filter(b => b.isBiotypeConflict).length > 0
                    if (vmd.chromosome === "UN" || vmd.startCoordinate === "null") {
                        vmd.location = 'Chr' + vmd.chromosome
                    } else {
                        vmd.location = `Chr${vmd.genomicChromosome}:${vmd.startCoordinate}-${vmd.endCoordinate} bp, ${vmd.strand} strand From ${vmd.provider} annotation of ${vmd.version}`
                    }

                    vmd.hasLinks = vmd.hasAllele || vmd.hasAntibody || vmd.hasGxdAssay || vmd.hasGxdIndex || 
                                   vmd.hasGxdResult || vmd.hasMapping || vmd.hasProbe || vmd.hasReference ||
                                   vmd.hasSequence
                }

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

	}

})();

