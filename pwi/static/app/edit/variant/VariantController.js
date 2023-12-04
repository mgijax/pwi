(function() {
	'use strict';
	angular.module('pwi.variant').controller('VariantController', VariantController);

	function VariantController(
			// angular tools
			$document,
			$filter,
			$http,  
			$q,
			$scope, 
			$sce,
			$timeout,
			$window, 
			// global resource APIs
			ValidateAlleleAnyStatusAPI,
			ValidateJnumAPI,
			AlleleSearchAPI,
			// local resource APIs
			AccessionSearchAPI,
			TermSearchAPI,
			TermSetAPI,
			VariantSearchAPI,
			VariantKeySearchAPI,
			VariantCreateAPI,
			VariantUpdateAPI,
			VariantDeleteAPI,
			VariantHGVSAPI
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {}

		vm.logging = true;		// show logging to console (true or false)?
		vm.hideAdd = false;		// hide the Add button
		vm.lastAdd = 0;			// time of last Add event
		vm.minAddGap = 2000;	// minimum time (in milliseconds) between Add events
		
		// mapping of variant data in PWI format (converted by VariantTranslator)
		vm.variant = vt.getEmptyPwiVariant();
	
		// display value of symbol 
		//vm.symbolWithStatus = "";
		// mapping of variant data in API format
		vm.variantData = {};
		
		vm.alleleParams = {};	// search parameters for alleles

		vm.resultCount = 0;		// number of alleles returned by search
		vm.results = [];		// list of alleles returned by search
		vm.variants = [];		// list of variants for the selected allele
		vm.aminoAcids = [];		// complete list of amino acids
		vm.genomeBuilds = [];	// complete list of genome builds
		vm.variantTypes = [];		// list of variant types from SO vocab 
		vm.variantEffects = [];		// list of variant effects from SO vocab
		
		// Used to track which summary allele (in vm.results) is highlighted / active
		vm.selectedIndex = 0;
		
		// tracks which variant (in vm.variants) is highlighted / active
		vm.variantIndex = 0;
		
		// default booleans for page functionality 
		vm.hideData = true;            // JSON data
		vm.hideLoadingHeader = true;   // display loading header
		vm.hideErrorContents = true;   // display error message
		vm.editableField = true;       // used to disable field edits
		
		// error message
		vm.errorMsg = '';
		
		// convenience function for logging to console & easily turning it on and off
		function log(s) {
			if (vm.logging) {
				console.log(s);
			}
		}
		
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		// compare two amino acid objects by (integer) sequenceNum
		function seqNumCompare(a, b) {
			var ai = parseInt(a.sequenceNum);
			var bi = parseInt(b.sequenceNum);
			
			if (ai < bi) return -1;
			if (ai > bi) return 1;
			return 0;
		}
		
		// compare two startCoordinate
		function startCoordinateCompare(a, b) {
			var ai = parseInt(a.dna.startCoordinate);
			var bi = parseInt(b.dna.startCoordinate);
			
			if (ai < bi) return -1;
			if (ai > bi) return 1;
			return 0;
		}
		
		// go through the list of 'raw' terms, look up their full equivalents, and 
		// put them in the same order into the 'full' terms.  'termType' should be
		// either 'types' or 'effects' to ensure that we appropriately initialize
		// the SOHandler.js library.
		function fleshOutTerms(raw, full, termType) {
			// if still any to do, look up the next one
			if (raw.length > full.length) {
				var nextKey = raw[full.length].termKey;
				TermSearchAPI.search( { "termKey" : nextKey }, function(data) {
					if (data.length > 0) {
						full.push(data[0]);
						fleshOutTerms(raw, full, termType);
					}
				}, function(err) {
					handleError("Error retrieving SO term key: " + nextKey);
					log(err);
				});
				
			} else if (termType == 'types') {
				so.cacheTerms(full, false);
				vm.typeChoices = so.typeChoices;
				
			} else if (termType == 'effects') {
				so.cacheTerms(full, true);
				vm.effectChoices = so.effectChoices;
			}
		}
		
		// get the list of variant effect SO terms, store in vm.variantEffects
		function fetchVariantEffects() {
			if (vm.variantEffects.length == 0) {
				TermSetAPI.search( "SO Variant Effects", function(data) {
					fleshOutTerms(data, vm.variantEffects, "effects");
				}, function(err) { // server exception
					handleError("Error searching for SO Variant Effects.");
				});
			}
		}

		// get the list of variant type SO terms, store in vm.variantTypes
		function fetchVariantTypes() {
			if (vm.variantTypes.length == 0) {
				TermSetAPI.search( "SO Variant Types", function(data) {
					fleshOutTerms(data, vm.variantTypes, "types");
				}, function(err) { // server exception
					handleError("Error searching for SO Variant Types.");
				});
			}
		}

		// get the list of amino acid terms, store in vm.aminoAcids
		function fetchAminoAcids() {
			if (vm.aminoAcids.length == 0) {
				TermSearchAPI.search( { "vocabKey" : "141" }, function(data) {
					data.sort(seqNumCompare);
					vm.aminoAcids = data;
				}, function(err) { // server exception
					handleError("Error searching for amino acids.");
				});
			}
		}

		// get the list of genome build terms, store in vm.genomeBuilds
		function fetchGenomeBuilds() {
			if (vm.genomeBuilds.length == 0) {
				TermSearchAPI.search( { "vocabKey" : "140" }, function(data) {
					data.sort(seqNumCompare);
					vm.genomeBuilds = data;
				}, function(err) { // server exception
					handleError("Error searching for genome builds.");
				});
			}
		}

		 // Initializes the needed page values 
		function init() {
			fetchGenomeBuilds();
			fetchAminoAcids();
			fetchVariantEffects();
			fetchVariantTypes();
			resetData();
			if (inputVariantKey != null) {
				loadVariant();	
			}
		}


		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI via buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////		

        // mapped to 'Clear' button; called from init();  resets page
		function eiClear() {		
			vm.oldRequest = {};
			vm.alleleParams = {};
			vm.variants = [];
			resetData();
			setFocus();
			
			// remove coloring of strand selection list
			$('#strand').removeClass('redBG').removeClass('whiteBG');
		}		

		// search for an allele using either the ID or the symbol fields (then populate the other allele 
		// data fields with the result found).  If the symbol field contains a wildcard, or if more than
		// one of the fields is populated, then we just skip the lookup.
		function lookupAllele() {
			log("in lookupAllele");
			vm.hideErrorContents = true;		// no errors yet
			var messageField = "#symbolLookupMessage";	// default

			// pull search fields together
			var params = {};
			if ((vm.variant.allele.symbol != null) && (vm.variant.allele.symbol != undefined) && (vm.variant.allele.symbol.trim() != "")) {
				if (vm.variant.allele.symbol.indexOf('%') >= 0) {
					// if wildcard in symbol, no auto-populate
					log("wildcard present - return");
					return;
				}
				log("no wildcard present, symbol not null/undefined/empty, set params.symbol from allele.symbol");
				params.symbol = vm.variant.allele.symbol;
			}
			if ((vm.variant.allele.accID != null) && (vm.variant.allele.accID != undefined) && (vm.variant.allele.accID.trim() != "")) {
				if ('symbol' in params) {
					// Both parameters have values, so must already have done a lookup.  Skip this one.
					log("Both params present - return");
					return;
				}
				log("just accID present, set params.accID from allele.accID")
				params.accID = vm.variant.allele.accID.trim().replace(/[ ,\n\r\t]/g, " ");
				messageField = "#idLookupMessage";
			}
			
			// if we had either parameter, execute the lookup
			if (JSON.stringify(params) != '{}') {
				log("have params calling ValidateAlleleAnyStatusAPI.search");
				$(messageField).removeClass('hidden');
				// call API to search, passing in allele parameters
				ValidateAlleleAnyStatusAPI.search(params, function(data) {
					$(messageField).addClass('hidden');
					if (data.length == 1) {
						log("allele status data[0]: " + data[0].alleleStatus);
						vm.variant.allele.alleleKey = data[0].alleleKey;
						vm.variant.allele.symbol = data[0].symbol;
						vm.variant.allele.chromosome = data[0].chromosome;
						vm.variant.allele.strand = data[0].strand;
						vm.variant.allele.accID = data[0].accID;
						vm.variant.allele.alleleStatus = data[0].alleleStatus
						vm.variant.allele.references = vt.collectRefIDs(data[0].refAssocs);
						cacheExistingVariants(vm.variant.allele.alleleKey);
						log("found allele");
						setTimeout(function() {
							// color the strand selection list appropriately, but wait for Angular to have
							// time to get the data in-place
							$('#strand').removeClass('redBG').removeClass('whiteBG');
							$('#strand').addClass($('#strand').children(':selected').attr('class'));
							}, 250);
					} else if (data.length < 1) {
						handleError("Found no alleles that match the parameters.");
					} else {
						handleError("Found too many (" + data.length + ") alleles that match the parameters.");
					}

				}, function(err) { // server exception
					$(messageField).addClass('hidden');
					handleError("Could not look up allele data.");
				});
			}
		}
		
		// mapped to query 'Search' button
		function eiSearch() {				
		
			pageScope.loadingStart();
			vm.hideLoadingHeader = false;
			
			// pull search fields into an allele-compliant data structure
			vm.alleleParams = {};
			if (vm.variant.allele.symbol) {
				vm.alleleParams.symbol = vm.variant.allele.symbol;
			}
			if (vm.variant.chromosome != '') {
				vm.alleleParams.chromosome = vm.variant.allele.chromosome;
			}
			if (vm.variant.strand != '') {
				vm.alleleParams.strand = vm.variant.allele.strand;
			}
			if ((vm.variant.allele.accID != null) && (vm.variant.allele.accID.trim() != "")) {
				vm.alleleParams.accID = vm.variant.allele.accID.trim().replace(/[ ,\n\r\t]/g, " ");
			}
			if ((vm.variant.allele.references != null) && (vm.variant.allele.references.trim() != "")) {
				vm.alleleParams.refAssocs = [];
				vm.alleleParams.refAssocs.push( {"jnumid" : vm.variant.allele.references.trim().replace(/[ ,\n\r\t]/g, " ") } );
			}

                        // the next four if statements dealing with created/modifiedBy and
                        // creation/modificationDate are a kludge - we set the VARIANT
                        // attributes in the vm.alleleParams. alleleParams is what this Controller sends
                        // to the java API searchvariant endpoint which in turn calls the search
                        // endpoint where isVariant = true. Since this module is based on the allele
                        // there is currently no way to search by these variant attributes unless we
                        // assign their values to the alleleParams in this fashion
                        if (vm.variantData.createdBy != '') {
                                vm.alleleParams.createdBy = vm.variantData.createdBy;
                        }
                        if (vm.variantData.modifiedBy != '') {
                                vm.alleleParams.modifiedBy = vm.variantData.modifiedBy;
                        }
                        if (vm.variantData.creation_date != '') {
                                vm.alleleParams.creation_date = vm.variantData.creation_date;
                        }
                        if (vm.variantData.modification_date != '') {
                                vm.alleleParams.modification_date = vm.variantData.modification_date;
                        }

			// save off old request
			vm.oldRequest = vm.alleleParams;

			// call API to search; pass query params (vm.selected)
			AlleleSearchAPI.search(vm.alleleParams, function(data) {
				
				vm.results = data;
				vm.hideLoadingHeader = true;
				vm.selectedIndex = 0;
				if (vm.results.length > 0) {
					loadAllele();
					pageScope.loadingEnd();
					setFocus();
				}
				else {
					pageScope.loadingEnd();
					setFocus();
				}
			}, function(err) { // server exception
				handleError("Error searching for variants.");
				pageScope.loadingEnd();
				setFocus();
			});
		}		

		// mapped to 'Reset Search' button
		function resetSearch() {		
			log('in resetSearch()');
			resetData();
			vm.alleleParams = vm.oldRequest;
			vm.variantData = { allele : vm.alleleParams };
			vm.variant = vt.apiToPwiVariant(vm.variantData);
		}	

        // called when user clicks a row in the allele summary
		function setAllele(index) {
			vm.variant = vt.getEmptyPwiVariant();
			vm.selectedIndex = index;
			resetCaches();
			if (vm.results.length > index) {
				loadAllele();
			}
		}		

        // called when user clicks a row in the variant table
		function setVariant(index) {
			log('in setVariant(' + index + ')');
			vm.variant = vt.getEmptyPwiVariant();
			vm.variantIndex = index;
			resetCaches();
			loadVariant();
		}		

        // mapped to 'Create' button
		function createVariant() {
			if (!vm.hideAdd) {
				vm.hideAdd = true;
				checkSeqIDs('create');
				vm.hideAdd = false;
			}
		}		

		// get a slim reference domain object corresponding to the given J#
		// (null in case of failure or a bad J#)
		function lookupJNum(jnum, mode) {
			if ((jnum != null) && (jnum != undefined) && (jnum.trim() != '')) {
				ValidateJnumAPI.query({ jnum: jnum }, function(data) {
					processReference(jnum, data, mode);
				}, function(err) {
					handleError("Error retrieving reference: " + jnum);
					log(err);
					processReference(jnum, null, mode);
				});
			} else {
				processReference(jnum, null, mode);
			}
		}		
		
		// For the given J#, we got back a string of JSON 'data' that contains (among other fields),
		// the corresponding reference's key.  Store it, decrement the counter of responses we're
		// awaiting, and if it is 0, then move on with the updating/creating function.
		function processReference(jnum, data, mode) {
			log('in processReference(' + jnum + ',' + data + ')');
			if (vm.refsKeyCache[jnum] == -1) {
				if (data.length == 0) {
					vm.refsKeyCache[jnum] = null;
					log(jnum + ' : null');
					alert("Invalid Reference: " + jnum);
                                        return;
				} else {
					vm.refsKeyCache[jnum] = data[0].refsKey; 
					log(jnum + ' : ' + data[0].refsKey);
				}
				vm.refsKeyCount = vm.refsKeyCount - 1;
				log('To go: ' + vm.refsKeyCount);
			} else {
				log('Already have ' + jnum + ' as ' + vm.refsKeyCache[jnum]);
			}
			
			if (vm.refsKeyCount <= 0) {
				saveVariant(mode);
			}
		}
		
		// go through the variant's J# and look up their reference keys (asynchronously).
		function lookupReferences(mode) {
			vm.refsKeyCache = {};
			vm.refsKeyCount = 0;

			if ((vm.variant.references != null) && (vm.variant.references != undefined) && (vm.variant.references.trim() != '')) {
				var jnumInForm = vm.variant.references.replace(/,/g, ' ').replace(/[ \t\n]+/g, ' ').toUpperCase().split(' ');
				for (var i = 0; i < jnumInForm.length; i++) {
					vm.refsKeyCache[jnumInForm[i]] = -1;
					lookupJNum(jnumInForm[i], mode);				// send asynchronous request of API
				}
				vm.refsKeyCount = jnumInForm.length;
			} else {
				saveVariant(mode);
			}
		}

		// get a term object corresponding to the given seq ID
		// (null in case of failure or a bad J#)
		function lookupSeqID(seqID, mode) {
			AccessionSearchAPI.search( { "accID" : seqID }, function(data) {
				processSeqID(seqID, data, mode);
			}, function(err) { // server exception
				handleError("Error searching for sequence IDs.");
				log(err);
				processSeqID(seqID, null, mode);
			});
		}		
		
		// process the 'data' retrieved for the given 'seqID' via Ajax.
		function processSeqID(seqID, data, mode) {
			// Make sure we haven't already handled a response for this one; if so, skip it.
			if (vm.seqIDs[seqID].logicaldbKey == -1) {
				if (data == null) {
					// error condition (no valid API response)
					vm.seqIDs[seqID].logicaldbKey = null;
				} else {
					// Seq IDs may also match markers and probes, so make sure we have a sequence object.
					for (var i = 0; i < data.length; i++) {
						if (data[i]['mgiTypeKey'] == '19') {
							vm.seqIDs[seqID] = {
								logicaldbKey : data[i]['logicaldbKey'],
								logicaldb : data[i]['logicaldb']
							}
						}
					}
				}
				vm.seqIDCount = vm.seqIDCount - 1;

			} else {
				log('Already got ' + seqID);
			}
			
			if (vm.seqIDCount == 0) {
				// all done looking them up, so proceed
				validateAndCheckReferences(mode);
			}
		}
		
		// look up needed data for each transcript and polypeptide sequence ID entered by the user.  Once these
		// have been looked up, then automatically carry on with the next piece of the variant update process.
		function checkSeqIDs(mode) {
			vm.seqIDs = {};			// { seqID : { logicaldbKey : x, logicaldb : y } }
			vm.seqIDCount = 0;
			
			var enteredIDs = [ vm.variant.sourceTranscript.accID, vm.variant.sourcePolypeptide.accID,
				vm.variant.curatedTranscript.accID, vm.variant.curatedPolypeptide.accID ];
			
			for (var i = 0; i < enteredIDs.length; i++) {
				if (enteredIDs[i] != null) {
					var seqID = enteredIDs[i].trim();
					if ((seqID != null) && (seqID != undefined) && (seqID.trim().length > 0)) {
						if (!(seqID in vm.seqIDs)) {
							vm.seqIDCount = vm.seqIDCount + 1;
							vm.seqIDs[seqID] = { logicaldbKey : -1, logicaldb : null };
							lookupSeqID(seqID, mode);
						}
					}
				}
			}

			if (vm.seqIDCount == 0) {
				// no seq IDs to look up, so proceed to part 2
				validateAndCheckReferences(mode);
			}
		}
		
        // mapped to 'Update' button -- This is part 1, where we need to look up data for any sequence IDs
		// entered by the user.  Once those have been looked up, control automatically passed to the next step.
		function updateVariant() {
			checkSeqIDs('update');
		}
		
        // This is part 2 of the variant update process.  We need to asynchronously map any entered J#
		// to their corresponding reference keys.  Once the references have been looked up, the last
		// one will automatically pass control on to the next step in the update/create process.
		function validateAndCheckReferences(mode) {
			var errors = vv.runValidationChecks(vm.variant, vm.seqIDs);
			log('errors (' + errors.length + '): ' + errors.join('\n'));
			if (errors.length > 0) {
				$('#errorList').html('<li>' + errors.join('</li><li>') + '</li>');
				showErrorPopup();
			} else {
				lookupReferences(mode);
			}
		}
		
		// get the proper operation for the given sequence key ('c' for create if the key is null, or
		// 'u' for update if it is not null)
		function op(seqKey) {
			if (seqKey == null) { return 'c'; }
			return 'u';
		}

		function saveVariant(mode) {
			// If we haven't had a reasonable gap between button clicks, suppress those after the first
			// to prevent adding duplicate variants.
			var gap = Date.now() - vm.lastAdd;
			log("Timing of Add: " + gap + " ms since " + vm.lastAdd);
			if (gap < vm.minAddGap) {
				log("Repeated click of Add button detected (gap of " + gap + " ms) - skipping event");
				return;
			}
			vm.lastAdd = Date.now();
			log("Updated vm.lastAdd to be " + vm.lastAdd + " ms");

			pageScope.loadingStart();
			log('in saveVariant(' + mode + ')');
			vm.variantData = vt.applyPwiVariantToApi(vm.variant, vm.variantData, vm.refsKeyCache, vm.seqIDs);
			
			// if the source and/or curated sequences have changed, flag them for updates
			if (vm.sourceDnaSeqJson != JSON.stringify(vm.sourceDnaSeq)) {
				vm.sourceDnaSeq.processStatus = op(vm.sourceDnaSeq.variantSequenceKey);
			}
			if (vm.curatedDnaSeqJson != JSON.stringify(vm.curatedDnaSeq)) {
				vm.curatedDnaSeq.processStatus = op(vm.curatedDnaSeq.variantSequenceKey);
			}
			if (vm.sourceRnaSeqJson != JSON.stringify(vm.sourceRnaSeq)) {
				vm.sourceRnaSeq.processStatus = op(vm.sourceRnaSeq.variantSequenceKey);
			}
			if (vm.curatedRnaSeqJson != JSON.stringify(vm.curatedRnaSeq)) {
				vm.curatedRnaSeq.processStatus = op(vm.curatedRnaSeq.variantSequenceKey);
			}
			if (vm.sourceProteinSeqJson != JSON.stringify(vm.sourceProteinSeq)) {
				vm.sourceProteinSeq.processStatus = op(vm.sourceProteinSeq.variantSequenceKey);
			}
			if (vm.curatedProteinSeqJson != JSON.stringify(vm.curatedProteinSeq)) {
				vm.curatedProteinSeq.processStatus = op(vm.curatedProteinSeq.variantSequenceKey);
			}
			
			if (mode == 'update') {
				// call API to update variant
				log("Submitting to variant update endpoint");
				VariantUpdateAPI.update(vm.variantData, function(data) {
				
					// check for API returned error
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					} else {
						// update variant data
						vm.variantData = data.items[0];
						postVariantLoad();
						updateAllVariantTable();
						showTimedInfoPopup("Variant Updated!");
						pageScope.loadingEnd();
						setFocus();
					}
				}, function(err) {
					handleError("Error updating variant.");
					pageScope.loadingEnd();
					setFocus();
				});
			} else if (mode == 'create') {
				// call API to create a new variant
				log("Submitting to variant creation endpoint");
				log("vm.variantData: " + JSON.stringify(vm.variantData));
				
				VariantCreateAPI.create(vm.variantData, function(data) {
				
					// check for API returned error
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					} else {
						// update variant data
						vm.variantData = data.items[0];
						postVariantLoad();
						updateAllVariantTable();
						showTimedInfoPopup("Variant Created!");
						pageScope.loadingEnd();
						setFocus();
					}
				}, function(err) {
					handleError("Error creating variant.");
					pageScope.loadingEnd();
					setFocus();
				});
			}
		}		
		
        	// mapped to 'Delete' button
		function deleteVariant() {
			log("Deleting Variant");

			if ($window.confirm("Are you sure you want to delete this record?")) {
			
				pageScope.loadingStart();
				var oldAllele = vm.selectedIndex;
				
				// call API to delete variant
				VariantDeleteAPI.delete({ key: vm.variant.variantKey }, function(data) {


					// check for API returned error
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						// success
						showTimedInfoPopup("Variant Deleted!");
						vm.variantData = {};
						vm.variant = vt.getEmptyPwiVariant();
						vm.results = [];
						resetSearch();
						eiSearch();
						setTimeout(function() { setAllele(oldAllele); }, 1000);
						pageScope.loadingEnd();
						setFocus();
					}
				
				}, function(err) {
					handleError("Error deleting variant.");
					pageScope.loadingEnd();
					setFocus();
				});
			}
		}		

		/////////////////////////////////////////////////////////////////////
		// Utility methods
		/////////////////////////////////////////////////////////////////////		
		
		// iterate through seqList and look for a sequence with the given seqType,
		// returning the first one found (if any) or {} (if none of that type)
		function getSequence(seqList, seqType, variantKey) {
			if ((seqList != null) && (seqList != undefined)) {
				for (var i = 0; i < seqList.length; i++) {
					if (seqList[i]['sequenceTypeTerm'] == seqType) {
						return seqList[i];
					}
				}
			}
			
			// At this point, we didn't find a sequence of the given type, so add one.
			var seq = {
				'processStatus' : 'x',
				'sequenceTypeTerm' : seqType,
				'sequenceTypeKey' : vt.typeKey(seqType),
				'variantKey' : variantKey,
			}
			if ((seqList != null) && (seqList != undefined)) {
				seqList.push(seq);
			}
			return seq;
		}
		
		function resetCaches() {
			// rebuild empty variantData submission object, else bindings fail
			log('in resetCaches()');
			
			vm.variantData = {};
			vm.variantData.allele = {}
			
			// caches of various IDs
			vm.alleleID = "";
			
			// caches of genomic, transcript, and protein sequence data
			vm.sourceDnaSeq = {};
			vm.curatedDnaSeq = {};
			vm.sourceRnaSeq = {};
			vm.curatedRnaSeq = {};
			vm.sourceProteinSeq = {};
			vm.curatedProteinSeq = {};
			
			// caches of transcript & protein sequence IDs
			vm.sourceRnaID = "";
			vm.curatedRnaID = "";
			vm.sourceProteinID = "";
			vm.curatedProteinID = "";
			
			// cache of SO annotations (effects and types)
			vm.effects = "";
			vm.types = "";
		}
		
		function resetData() {
			// reset submission/summary values
			log('in resetData()');
			
			vm.variantData = {};
			vm.variant = vt.getEmptyPwiVariant();
			vm.results = [];
			vm.selectedIndex = 0;
			vm.errorMsg = '';
			vm.resultCount = 0;

			resetCaches();
			
			// reset booleans for fields and display
			vm.hideErrorContents = true;
			vm.hideLoadingHeader = true;
			vm.editableField = true;
		}

		// setting of mouse focus
		function setFocus () {
			var input = document.getElementById ("alleleSymbol");
        		if (input != null) {
                		input.focus (); 
        		}
		}
		
		// load a variant from summary 
		function loadVariant() {
			log('in loadVariant()');

			// derive the key of the selected result summary variant
			if ((vm.variants.length == 0) && (inputVariantKey != null) && (inputVariantKey != "")) {
				vm.summaryVariantKey = inputVariantKey;
				log('found inputVariantKey ' + inputVariantKey);
			} else if (vm.variants.length == 0) {
				log('no inputVariantKey --> blank QF');
				return;
			} else {
				vm.summaryVariantKey = vm.variants[vm.variantIndex].variantKey;
				log('show the selected variant: ' + vm.summaryVariantKey);
			}
			
			// call API to gather variant for given key
			VariantKeySearchAPI.get({ key: vm.summaryVariantKey }, function(data) {
				log('data: ' + data  + 'alleleStatus: ' + alleleStatus)
				vm.variantData = data;
				postVariantLoad();
			
				setTimeout(function() {
					// color the strand selection list appropriately, but wait for Angular to have
					// time to get the data in-place
					$('#strand').removeClass('redBG').removeClass('whiteBG');
					$('#strand').addClass($('#strand').children(':selected').attr('class'));
					}, 250);
			}, function(err) {
				handleError("Error retrieving variant.");
			});
		}		
		
		var ldbToUrl = {
			'9' : 'https://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=nuccore&id=@@@@',
			'13' : 'http://www.uniprot.org/entry/@@@@',
			'27' : 'https://www.ncbi.nlm.nih.gov/entrez/viewer.cgi?val=@@@@',
			'41' : 'http://www.uniprot.org/entry/@@@@',
			'133' : 'http://www.ensembl.org/Mus_musculus/Transcript/Summary?db=core;t=@@@@',
			'134' : 'http://www.ensembl.org/Mus_musculus/Transcript/ProteinSummary?db=core;p=@@@@'
		};
		
		// if 'seq' has an accession ID, return an HTML link to it.  Return "-" otherwise.
		function sequenceLink(seq) {
			if (vv.isNullOrUndefined(seq) || vv.isNullOrUndefined(seq.accessionIds) || (seq.accessionIds.length == 0)) {
				return "-";
			}
			
			if (seq.accessionIds[0].logicaldbKey in ldbToUrl) {
				var url = ldbToUrl[seq.accessionIds[0].logicaldbKey].replace('@@@@', seq.accessionIds[0].accID);
				return "<a href='" + url + "' target='_blank'>" + seq.accessionIds[0].accID + "</a>";
			}
			return seq.accessionIds[0].accID;
		}
		
		// If current variant is already represented in the table of All Variants, replace its row.  If not, add one.
		function updateAllVariantTable() {
			var rowNum = null;
			var sameAllele = true;
			
			for (var i = 0; i < vm.variants.length; i++) {
				if (vm.variants[i].raw.allele.alleleKey != vm.variantData.allele.alleleKey) {
					sameAllele = false;
				}
				
				if (vm.variants[i].variantKey == vm.variantData.variantKey) {
					rowNum = i;
					break;
				}
			}
			
			// if we found a different allele, we need to clear the search results and the All Variants table
			if (!sameAllele) {
				vm.variants = [];		// contents of All Variants table
				vm.resultCount = 0;		// number of alleles returned by search
				vm.results = [];		// list of alleles returned by search
				vm.selectedIndex = 0;	// which allele in vm.results is active?
			}
			
			if (!sameAllele || (rowNum == null)) {
				// new variant, so add new row
				vm.variants.push(preprocessVariant(vm.variantData));
			} else {
				// existing variant, so update it
				vm.variants[rowNum] = preprocessVariant(vm.variantData);
			}
		}
		
		// Consolidate a single API-style variant into a preprocessed set of data for the All Variants table.
		function preprocessVariant(variant) {
			var seqType = [ "DNA", "RNA", "Polypeptide" ];
			
			var v = {
				'raw' : variant,
				'variantKey' : variant.variantKey,
				'dna' : getSequence(variant.variantSequences, 'DNA'),
				'dnaClass' : 'isCurated',
				'rna' : getSequence(variant.variantSequences, 'RNA'),
				'rnaClass' : 'isCurated',
				'rna' : getSequence(variant.variantSequences, 'RNA'),
				'polypeptideClass' : 'isCurated',
				'polypeptide' : getSequence(variant.variantSequences, 'Polypeptide')
				};
				
			for (var j = 0; j < seqType.length; j++) {
				var stLower = seqType[j].toLowerCase();
				if ((v[stLower].createdBy == null) || (v[stLower].createdBy == undefined)) {
					v[stLower] = getSequence(variant.sourceVariant.variantSequences, seqType[j]);
					if ((v[stLower].createdBy == null) || (v[stLower].createdBy == undefined)) {
						v[stLower + 'Class'] = '';
					} else {
						v[stLower + 'Class'] = 'isSource';
					}
				}
			}
			return v;
		}
		
		// Take a list of full variant objects and consolidate them into something more useful for our purposes.
		// (We need to pre-identify the genomic, transcript, and protein sequence objects.)
		function preprocessVariants(variants) {
			var out = [];
			
			for (var i = 0; i < variants.length; i++) {
				out.push(preprocessVariant(variants[i]));
			}
			return out;
		}
		
		// load an allele (main results table is for alleles).  When a search is executed or when a new
		// allele is clicked, we need to:  1. populate the variant table for that allele, and 2. show the
		// first variant from that table
		function loadAllele() {
			vm.variants = [];		// reset the list of variants for the selected allele
			if ( (vm.results.length == 0) && (vm.selectedIndex < 0) ) {
				return;
			}
			var variantParams = vm.results[vm.selectedIndex].alleleKey;
			
			// call API to gather variants for given allele key
			VariantSearchAPI.search(variantParams, function(data) {
				vm.variants = preprocessVariants(data);
				vm.variants.sort(startCoordinateCompare);
				vm.variantIndex = 0;
				loadVariant();
			}, function(err) {
				handleError("Error retrieving variants for allele.");
			});
		}
		
		// cache the existing variants for the current allele
		function cacheExistingVariants(alleleKey) {
			vv.resetVariantCache();
			log('Retrieving variants for allele ' + alleleKey);

			// call API to gather variants for given allele key
			VariantSearchAPI.search(alleleKey, function(data) {
				if ((data != undefined) && (data != null)) {
					for (var i = 0; i < data.length; i++) {
						vv.addVariantToCache(data[i]);
					}
					log('Got ' + data.length + ' variants for allele');
				}
			}, function(err) {
				log('Could not retrieve variants for allele (for checking for duplicates)');
			});
		}
		
		// error handling
		function handleError(msg) {
			log(msg);
			vm.errorMsg = msg;
			vm.hideErrorContents = false;
			vm.hideLoadingHeader = true;
		}

		// a variant can be loaded from a search or create - this shared 
		// processing is called after endpoint data is loaded
		function postVariantLoad() {
			log('in postVariantLoad');
			vm.editableField = false;

			vm.variant = vt.apiToPwiVariant(vm.variantData);
		}
		
		// If string 's' is null, return length 0.  Otherwise, return the length of the string.
		function smartLength(s) {
			if (s == null) { return 0; }
			return s.length;
		}
		
		// 'sequences' is a list of sequence objects, each with referenceSequence and variantSequence attributes;
		// return the maximum length of all the referenceSequence and variantSequence attributes across all of
		// the given 'sequences'.
		function maxLength(sequences) {
			var mx = 0;
			for (var i = 0; i < sequences.length; i++) {
				if (sequences[i] != null) {
					mx = Math.max(mx, smartLength(sequences[i].variantSequence), smartLength(sequences[i].referenceSequence));
				}
			}
			return mx;
		}
		
		// set the 'rows' attribute of the elements with the given 'ids' to be the given 'count'
		function setRows(ids, count) {
			for (var i = 0; i < ids.length; i++) {
				angular.element('#' + ids[i]).attr('rows', count);
			}
		}

		// handles seven flavors of the "copy source to curated data" functionality:
		//		all : all source data
		//		genomicCoords : genome build + coordinates
		//		genomicAlleles : reference + variant allele
		//		transcriptCoords : transcript: ID + coordinates
		//		transcriptAlleles : reference + variant allele
		//		polypeptideCoords : polypeptide: ID + coordinates
		//		polypeptideAlleles : polypeptide: reference + variant allele
		// These copy their respective data from the PWI-format variant's source sequence
		// fields to its curated sequence fields.
		function copyOver(flavor) {
			var all = (flavor == 'all');

			if (all || (flavor == 'genomicCoords')) {
				vm.variant.curatedGenomic.genomeBuild = vm.variant.sourceGenomic.genomeBuild;
				vm.variant.curatedGenomic.startCoordinate = vm.variant.sourceGenomic.startCoordinate;
				vm.variant.curatedGenomic.endCoordinate = vm.variant.sourceGenomic.endCoordinate;
			}
			if (all || (flavor == 'genomicAlleles')) {
				vm.variant.curatedGenomic.referenceSequence = vm.variant.sourceGenomic.referenceSequence;
				vm.variant.curatedGenomic.variantSequence = vm.variant.sourceGenomic.variantSequence;
			}
			if (all || (flavor == 'transcriptCoords')) {
				vm.variant.curatedTranscript.accID = vm.variant.sourceTranscript.accID;
				vm.variant.curatedTranscript.startCoordinate = vm.variant.sourceTranscript.startCoordinate;
				vm.variant.curatedTranscript.endCoordinate = vm.variant.sourceTranscript.endCoordinate;
			}
			if (all || (flavor == 'transcriptAlleles')) {
				vm.variant.curatedTranscript.referenceSequence = vm.variant.sourceTranscript.referenceSequence;
				vm.variant.curatedTranscript.variantSequence = vm.variant.sourceTranscript.variantSequence;
			}
			if (all || (flavor == 'polypeptideCoords')) {
				vm.variant.curatedPolypeptide.accID = vm.variant.sourcePolypeptide.accID;
				vm.variant.curatedPolypeptide.startCoordinate = vm.variant.sourcePolypeptide.startCoordinate;
				vm.variant.curatedPolypeptide.endCoordinate = vm.variant.sourcePolypeptide.endCoordinate;
			}
			if (all || (flavor == 'polypeptideAlleles')) {
				vm.variant.curatedPolypeptide.referenceSequence = vm.variant.sourcePolypeptide.referenceSequence;
				vm.variant.curatedPolypeptide.variantSequence = vm.variant.sourcePolypeptide.variantSequence;
			}
		}

		// start a new variant record using the same allele as the current one
		function copyAllele() {
			// fix PWI-format variant
			var newOne = vt.getEmptyPwiVariant();
			newOne.allele = vm.variant.allele;
			vm.variant = newOne;

			// fix API-format variant
			var vdAllele = vm.variantData.allele;
			vm.variantData = { allele : vdAllele };
		}
		
		// start a new variant record that's a copy of the current one
		function copyVariant() {
			// fix PWI-format variant by removing fields that need to have values assigned by
			// the API later on
			
			var empty = vt.getEmptyPwiVariant();
			var alleleSymbol = vm.variant.allele.symbol;
			
			vm.variant.allele = empty.allele;
			if ((alleleSymbol != null) && (alleleSymbol != undefined) && (alleleSymbol.trim() != '')) {
				// just keep the marker symbol portion of the allele symbol
				vm.variant.allele.symbol = alleleSymbol.replace(/<[^>]*>/, '');
			}
			vm.variant.variantKey = null;
			vm.variant.createdBy = null;
			vm.variant.modifiedBy = null;
			vm.variant.creationDate = null;
			vm.variant.modificationDate = null;
			vm.variant.sourceGenomic.variantSequenceKey = null;
			vm.variant.sourceGenomic.apiSeq = null;
			vm.variant.sourceTranscript.variantSequenceKey = null;
			vm.variant.sourceTranscript.apiSeq = null;
			vm.variant.sourcePolypeptide.variantSequenceKey = null;
			vm.variant.sourcePolypeptide.apiSeq = null;
			vm.variant.curatedGenomic.variantSequenceKey = null;
			vm.variant.curatedGenomic.apiSeq = null;
			vm.variant.curatedTranscript.variantSequenceKey = null;
			vm.variant.curatedTranscript.apiSeq = null;
			vm.variant.curatedPolypeptide.variantSequenceKey = null;
			vm.variant.curatedPolypeptide.apiSeq = null;

			// fix API-format variant
			vm.variantData = {};
		}
		
                // copy HGVS
		function copyHGVS() {
			console.log('copyHGVS()');

                        if (
                                vm.variant.allele.chromosome == null
                                || vm.variant.curatedGenomic.startCoordinate == null
                                || vm.variant.curatedGenomic.referenceSequence  == null
                                || vm.variant.curatedGenomic.variantSequence == null
                                || vm.variant.allele.chromosome == ''
                                || vm.variant.curatedGenomic.startCoordinate == ''
                                || vm.variant.curatedGenomic.referenceSequence  == ''
                                || vm.variant.curatedGenomic.variantSequence == ''
                                ) {
                                alert("HGVS requires:\nChromosome\nCurated Genomic Start Coordinate\nCuratored Genomic Referencce Sequence\nCuratoed Genomic Variant Allele\n");
                                return;
                        }

			var hgvsParams = "chr" + vm.variant.allele.chromosome + ":" + vm.variant.curatedGenomic.startCoordinate + vm.variant.curatedGenomic.referenceSequence + ">" + vm.variant.curatedGenomic.variantSequence;
			
                        pageScope.loadingStart();

			// call API to gather hgvs
			VariantHGVSAPI.search(hgvsParams, function(data) {
				if (data.length > 0) {
                                        const tokens = data[0].split('\t');
                                        vm.variant.description = tokens[5];
                                }
                                pageScope.loadingEnd();
			}, function(err) {
				handleError("Error running  copyHGVS.");
                                pageScope.loadingEnd();
			});
		}
		
		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		//Expose functions on controller scope
		$scope.eiSearch = eiSearch;
		$scope.eiClear = eiClear;
		$scope.resetSearch = resetSearch;
		$scope.setAllele = setAllele;
		$scope.setVariant = setVariant;
		$scope.createVariant = createVariant;
		$scope.updateVariant = updateVariant;
		$scope.deleteVariant = deleteVariant;
		$scope.lookupAllele = lookupAllele;
		$scope.copyOver = copyOver;
		$scope.copyAllele = copyAllele;
		$scope.copyVariant = copyVariant;
	 	$scope.sequenceLink = sequenceLink;
	 	$scope.trust = $sce.trustAsHtml;
	 	$scope.copyHGVS = copyHGVS;

		// call to initialize the page, and start the ball rolling...
		init();
	}

})();
