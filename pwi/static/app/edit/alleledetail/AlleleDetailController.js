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
                        GenotypeSearchAPI,
                        GenotypeGetAPI,
                        GenotypeMPAnnotGetAPI,
                        GenotypeDOAnnotGetAPI,
                        ImageGetAPI,
                        ImagePaneGetAPI,
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
			        pageScope.handleError(vm, "API ERROR: AlleleSearchAPI.search: " + err);
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
                                loadGenotypeData(alleleKey, "genotypes")
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: AlleleGetAPI.get: " + err);
			});
		}	

                function loadGenotypeData (alleleKey, genotypeField) {
                    const searchArg = { "allelePairs": [{ "alleleKey1": alleleKey }] }
                    const genotypes = vm.apiDomain[genotypeField] = []
                    // first, find all genotypes for this allele (this only gives us slim objects)
                    GenotypeSearchAPI.search(searchArg, function (genoSlimRecs) {
                        // next, for each genotype, get its details
                        //
                        // With this implementation, genotypes may be returned in different order than they were requested.
                        // First, determine the order we want, then feed the correct position index in with each request.
                        genoSlimRecs.sort((a,b) => {
                            if (a.accID < b.accID) return -1
                            if (a.accID > b.accID) return 1
                            return 0
                        })
                        genoSlimRecs.forEach(gsr => genotypes.push({}))
                        genoSlimRecs.forEach((g,gindex) => {
                            // get the full genotype object
                            const genotypeKey = g.genotypeKey
                            GenotypeGetAPI.get({key: genotypeKey}, function (genotype) {
                                // got one genotype. 
                                // prep some display values
                                const adnote = genotype.alleleDetailNote
                                genotype.genotypeDisplay = $scope.ntc.superscript(adnote.noteChunk) + (genotype.isConditional === "1" ? '<br/>(conditional)' : '')
                                genotype.backgroundDisplay = $scope.ntc.superscript(genotype.strain)
                                // Primary image
                                genotype.primaryImageUrl = ''
                                genotype.primaryImageCaption = ''
                                const primaryImagePane = (genotype.imagePaneAssocs || []).filter(ipa => ipa.isPrimary === "1")[0]
                                if (primaryImagePane) {
                                    getImageInfo(primaryImagePane.imagePaneKey, img => {
                                        const thumbnail = img.thumbnailImage
                                        const thumbPixId = thumbnail ? thumbnail.editAccessionIds.filter(eai => eai.prefixPart === 'PIX:')[0] : ''
                                        genotype.primaryImageUrl = thumbPixId ? $scope.url_for('pwi.pixeldb', thumbPixId.numericPart) : ''
                                        genotype.primaryImageCaption = (thumbnail && thumbnail.captionNote) ? thumbnail.captionNote.noteChunk : ''
                                    })
                                }
                                // Get its MP annotations. Group by header term. (Note an annotation can be grouped under more than one header.)
                                genotype.mpAnnots = []
                                const byHeader = {}
                                GenotypeMPAnnotGetAPI.get({key: genotypeKey}, function(mpAnnots) {
                                    mpAnnots.annots.forEach(a => {
                                        const note = (a.properties || []).filter(p => p.propertyTerm === "MP-Sex-Specificity" && p.value !== "NA")[0]
                                        a.sexNoteDisplay = note ? `(Sex: ${note.value})` : '';
                                        (a.headersByAnnot || []).forEach(hdr => {
                                            if (!byHeader[hdr.headerTermKey]) byHeader[hdr.headerTermKey] = []
                                            byHeader[hdr.headerTermKey].push(a)
                                        })
                                    })
                                    mpAnnots.headers.forEach(hdr => {
                                        const annots = byHeader[hdr.termKey]
                                        if (annots) {
                                            annots.sort((a,b) => {
                                                if (a.term < b.term) return -1
                                                if (a.term > b.term) return 1
                                                return 0
                                            })
                                            genotype.mpAnnots.push([hdr, annots])
                                        }
                                    })
                                }, function (err) {
                                    pageScope.handleError(vm, "API ERROR: GenotypeMPAnnotGetAPI.get: " + err);
                                })
                                // Get its DO annotations
                                genotype.doAnnots = []
                                GenotypeDOAnnotGetAPI.get({key: genotypeKey}, function(doAnnots) {
                                    genotype.doAnnots = doAnnots.annots
                                }, function (err) {
                                    pageScope.handleError(vm, "API ERROR: GenotypeDOAnnotGetAPI.get: " + err);
                                })
                                // finally, put the genotype in its correct position
                                genotypes[gindex] = genotype

                            }, function (err) {
                                pageScope.handleError(vm, "API ERROR: GenotypeGetAPI.get: " + err);
                            })
                            g.genotypeDisplay = $scope.ntc.superscript(g.genotypeDisplay)
                        })
                    }, function (err) {
                        pageScope.handleError(vm, "API ERROR: GenotypeSearchAPI.search: " + err);
                    })
                }

                //
                function getImageInfo (panekey, callback) {
                    ImagePaneGetAPI.get({key: panekey}, function(pane) {
                        ImageGetAPI.get({key: pane.imageKey}, function (image) {
                            callback(image, pane)
                        }, function (err) {
                            pageScope.handleError(vm, "API ERROR: ImageGetAPI.get: " + err);
                        })
                    }, function (err) {
                            pageScope.handleError(vm, "API ERROR: ImagePaneGetAPI.get: " + err);
                    })
                }
                //
                function getImageCallback (image, dstObj, urlField, captionField) {
                    const thumbnail = image.thumbnailImage
                    const thumbPixId = thumbnail ? thumbnail.editAccessionIds.filter(eai => eai.prefixPart === 'PIX:')[0] : ''
                    dstObj[urlField] = thumbPixId ? $scope.url_for('pwi.pixeldb', thumbPixId.numericPart) : ''
                    dstObj[captionField] = image.captionNote.noteChunk
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
                    // molecular references
                    const mrefs = (d.refAssocs || []).filter(ra => ra.refAssocType === 'Molecular')
                    d.mRefDisplay = mrefs.map(ra => ra.jnumid).join(' ')
                    // general note
                    d.genNoteDisplay = d.generalNote ? d.generalNote.noteChunk : ''
                    // marker detail clip
                    d.clipDisplay = d.detailClip ? d.detailClip.note : ''
                    // references link URL
                    d.referencesUrl = $scope.url_for('pwi.referencesummary', { allele_id : d.accID }) 
                    // images link URL
                    d.imagesUrl = d.imagePaneAssocs ?  $scope.url_for('pwi.imagesummary', { allele_id : d.accID }) : ''
                    // primary image. Have to do additional API calls, so just set to blank for now
                    d.primaryImageUrl = ''
                    d.primaryImageCaption = ''
                    const primaryImagePane = (d.imagePaneAssocs || []).filter(ipa => ipa.isPrimary === "1")[0]
                    if (primaryImagePane) {
                        getImageInfo(primaryImagePane.imagePaneKey, img => getImageCallback(img, d, 'primaryImageUrl', 'primaryImageCaptionDisplay'))
                    }
                    // molecular image.
                    d.molecImageUrl = ''
                    d.molecImageCaption = ''
                    const molecImagePane = (d.imagePaneAssocs || []).filter(ipa => ipa.imageClass === "Molecular")[0]
                    if (molecImagePane) {
                        getImageInfo(molecImagePane.imagePaneKey, img => getImageCallback(img, d, 'molecImageUrl', 'molecImageCaptionDisplay'))
                    }

                }

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
	}

})();

