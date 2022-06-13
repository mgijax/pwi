(function() {
	'use strict';
	angular.module('pwi.alleledetail').controller('AlleleDetailController', AlleleDetailController);

	function AlleleDetailController(
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
			AlleleSearchAPI,
			AlleleGetAPI,
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

		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		// Initializes the needed page values 
                this.$onInit = function () { 
                        console.log("onInit")
                        var searchByAccId = document.location.search.split("?id=")
                        search(searchByAccId[1]);
                };

                this.$postLink = function () { 
                        console.log("postLink")
                };

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

		// search by accession id
		function search(accID) {				
			console.log("search():" + accID);
		
			pageScope.loadingStart();
			
                        vm.apiDomain.accID = accID

			AlleleSearchAPI.search(vm.apiDomain, function(data) {
			        if (data.length > 0) {
				        loadObject(data[0].alleleKey);
			        }
		                pageScope.loadingEnd();
		        }, function(err) {
			        pageScope.handleError(vm, "API ERROR: AlleleSearchAPI.search");
		                pageScope.loadingEnd();
		        });
		}		

		// load object by alleleKey
		function loadObject(alleleKey) {
			console.log("loadObject():" + alleleKey);

			AlleleGetAPI.get({key: alleleKey}, function(data) {
				vm.apiDomain = data;
                                prepareForDisplay(vm.apiDomain)
                                // for shorter refs
                                $scope.vmd = vm.apiDomain
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AlleleGetAPI.get");
			});
		}	

                //
                function prepareForDisplay (d) {
                    const sup = $scope.ntc.superscript
                    const SEP = ", "

                    // basic allele info
                    d.synonymDisplay = (d.synonyms || []).map(s => sup(s.synonym)).join(SEP)
                    d.alleleAttributeDisplay = (d.subtypeAnnots || []).map(s => s.term).join(SEP)
                    d.locationDisplay = ''
                    if (d.chromosome) {
                        d.locationDisplay = 'Chr' + d.chromosome
                        if (d.startCoordinate !== "null") {
                            d.locationDisplay += `:${d.startCoordinate}-${d.endCoordinate} bp, ${d.strand} strand`
                        }
                    }
                    d.markerDisplay = d.markerSymbol + ' ' + d.markerName

                    // mutant cell line(s)
                    const mcls = (d.mutantCellLineAssocs || []).map(m => m.mutantCellLine)
                    d.mclDisplay = mcls.map(m => m.cellLine).join(SEP)
                    // parent cell line
                    const pclDerivation = mcls.length ? mcls[0].derivation : null
                    const pcl = pclDerivation ? pclDerivation.parentCellLine : null
                    d.pclDisplay = pcl ? pcl.cellLine : ''
                    d.pclTypeDisplay = pcl ? pcl.cellLineType : ''


                    // transmission reference
                    const tref = (d.refAssocs || []).filter(ra => ra.refAssocType === 'Transmission')[0]
                    d.trefDisplay = tref ? tref.jnumid : ''

                    // recombinase info
                    d.driverGeneDisplay = (d.driverGenes || []).map(g => g.markerSymbol).join(SEP)
                    d.inducibleNoteDisplay = d.inducibleNote ? d.inducibleNote.noteChunk : ''

                    // molecular mutation
                    d.mutDisplay = (d.mutations || []).map(m => m.mutation).join(SEP)
                    // vector
                    d.vecDisplay = pclDerivation ? pclDerivation.vector : ''
                    d.vecTypeDisplay = pclDerivation ? pclDerivation.vectorType : ''
                    // molecularNote
                    d.mNoteDisplay = d.molecularNote ? d.molecularNote.noteChunk : ''
                    // molecular reference
                    const mref = (d.refAssocs || []).filter(ra => ra.refAssocType === 'Molecular')[0]
                    d.mRefDisplay = mref ? mref.jnumid : ''
                    // general note
                    d.genNoteDisplay = d.generalNote ? d.generalNote.noteChunk : ''
                    // marker detail clip
                    d.clipDisplay = d.detailClip ? d.detailClip.note : ''
                    // references link URL
                    d.referencesUrl = pageScope.PWI_BASE_URL + "summary/reference?allele_id=" + d.accID;
                }

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
	}

})();

