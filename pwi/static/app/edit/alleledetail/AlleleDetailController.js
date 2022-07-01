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
                        GenotypeGetByAlleleAPI,
                        ImageGetAPI,
                        ImagePaneGetAPI,
                        VocTermAncestorsGetAPI,
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
                vm.hasGenotypes = false
                vm.loadingGenotypes = false

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

                function processOneGenotype (genotype, mpKey2ancestors) {
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
                    // DO annotations
                    (genotype.doAnnots || []).forEach(da => {
                        da.termid = da.doIds[0].accID
                    })

                    // MP annotations. 
                    // First, group the annotations for this genotype under their appropriate headers.
                    // Annotations can be grouped under multiple headers.
                    const hdr2sortKey = {}
                    const byHeader = {};
                    (genotype.mpAnnots || []).forEach(ma => {
                        if (ma.headersByAnnot === null) {
                            if (!byHeader[ma.term]) byHeader[ma.term] = []
                            hdr2sortKey[ma.term] = 1 // ?
                            byHeader[ma.term].push(ma)
                        } else {
                            ma.headersByAnnot.forEach(hdr => {
                                if (!byHeader[hdr.headerTerm]) byHeader[hdr.headerTerm] = []
                                byHeader[hdr.headerTerm].push(ma)
                                hdr2sortKey[hdr.headerTerm] = hdr.headerSequenceNum
                            })
                        }
                        // While we're at it, compute sex-specificity note
                        ma.evidence.forEach(ev => {
                            const note = (ev.properties || []).filter(p => p.propertyTerm === "MP-Sex-Specificity" && p.value !== "NA")[0]
                            ev.sexNoteDisplay = note ? `(Sex: ${note.value})` : '';
                        })
                    })
                    // Now order the headers, and arrange the annotation within each section
                    const headers = Object.entries(hdr2sortKey)
                    headers.sort((a,b) => {
                        return a[1] - b[1]
                    })
                    genotype.mpAnnotsDisplay = headers.map(h => {
                        const hAnnots = byHeader[h[0]]
                        const arrangedAnnots = arrangeAnnots(hAnnots, mpKey2ancestors)
                        return [h[0], arrangedAnnots]
                    })
                }

                function processGenotypes (genotypes) {
                    // First we need to collect up all the MP terms for all the genotypes 
                    // and make one API call to get all their ancestors. This data is needed
                    // for doing the proper indenting of MP annotations according to the
                    // ontology structure
                    const allMPkeys = new Set()
                    genotypes.forEach(g => {
                        (g.mpAnnots || []).forEach(ma => allMPkeys.add(ma.termKey))
                    })
                    const mpKey2ancestors = {}
                    const keyListArg = Array.from(allMPkeys).join(",")
                    VocTermAncestorsGetAPI.get(keyListArg, function (data) {
                        // here's where we build a map from MP key to list of ancestors' MP keys
                        (data || []).forEach(d => mpKey2ancestors[''+d.termKey] = d.ancestors.map(a => ''+a))
                        // Now we can process the genotypes
                        genotypes.forEach(g => processOneGenotype(g, mpKey2ancestors))
                        vm.loadingGenotypes = false
                    }, function (err) {
                        pageScope.handleError(vm, "API ERROR: VocTermAncestorsGetAPI.get: " + err);
                    })
                }

                function loadGenotypeData (alleleKey, genotypeField) {
                    vm.apiDomain[genotypeField] = []
                    vm.hasGenotypes = true
                    vm.loadingGenotypes = true
                    GenotypeGetByAlleleAPI.get(alleleKey, function(genotypes) {
                        if (genotypes.length === 0) {
                            vm.hasGenotypes = false
                            vm.loadingGenotypes = false
                        } else {
                            processGenotypes(genotypes)
                            vm.apiDomain[genotypeField] = genotypes
                        }
                    }, function (err) {
                        pageScope.handleError(vm, "API ERROR: GenotypeGetByAlleleAPI.get: " + err);
                    })
                }

                // Arranges (i.e., orders and indents) the annotations under one header for one genotype.
                // Args:
                //     annots (list of annotation domain objects)
                //     term2ancestors (mapping from MP term keys to to the keys of their ancestors
                // Returns:
                //     list of {annot:annotation, indent:int}
                //     The indent is an integer count of depth (i.e., it's not pixels)
                function arrangeAnnots(annots, term2ancestors) {
                    const byTerm = function (a,b) {
                        if (a.annot.termSequenceNum < b.annot.termSequenceNum) return -1
                        if (a.annot.termSequenceNum > b.annot.termSequenceNum) return 1
                        return 0
                    }
                    // set of MP term keys in the given annotations
                    const aSet = new Set(annots.map(a => a.termKey))
                    // for each annotation, list of ancestor term keys that are also in aSet
                    let remainder = annots.map(a => {
                        const ancestors = (term2ancestors[a.termKey] || []).filter(ak => aSet.has(ak))
                        return { annot:a, ancestors: ancestors }
                    })
                    const finalSort = []
                    function _arrange (indent) {
                        const thisLevel = remainder.filter(r => r.ancestors.length === 0)
                        remainder = remainder.filter(r => r.ancestors.length)
                        thisLevel.sort(byTerm)
                        thisLevel.forEach(a => {
                            const akey = a.annot.termKey
                            finalSort.push({annot: a.annot, indent: indent})
                            remainder.forEach(r => {
                                r.ancestors = r.ancestors.filter(ra => ra !== akey)
                            })
                            _arrange(indent + 1)
                        })
                    }
                    _arrange(1)
                    //
                    return finalSort
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

