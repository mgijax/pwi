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
                        console.log("onInit")
                        var searchByAccId = document.location.search.split("?id=")
                        search(searchByAccId[1]);
                };

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

		// search by accession id
		function search(accID) {				
			console.log("search():" + accID);
		
			pageScope.loadingStart();
			
                        vm.apiDomain.accID = accID

			MarkerSearchAPI.search(vm.apiDomain, function(data) {
			        if (data.length > 0) {
				        loadObject(data[0].markerKey);
			        }
		                pageScope.loadingEnd();
		        }, function(err) {
			        pageScope.handleError(vm, "API ERROR: MarkerSearchAPI.search: " + err);
		                pageScope.loadingEnd();
		        });
		}		

		// load object by antobodyKey
		function loadObject(markerKey) {
			console.log("loadObject():" + markerKey);

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

                    vmd.featureType = (vmd.featureTypes || []).map(t => t.term).join(", ")

                    vmd.synonymsDisplay = (vmd.synonyms || []).map(s => $scope.ntc.superscript(s.synonym)).join(", ")

                    vmd.hasBiotypeConflict = (vmd.biotypes || []).filter(b => b.isBiotypeConflict).length > 0

                    if (vmd.chromosome === "UN" || vmd.startCoordinate === "null") {
                        vmd.location = 'Chr' + vmd.chromosome
                    } else {
                        vmd.location = `Chr${vmd.chromosome}:${vmd.startCoordinate}-${vmd.endCoordinate} bp, ${vmd.strand} strand From ${vmd.provider} annotation of ${vmd.version}`
                    }
                }

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
	}

})();

