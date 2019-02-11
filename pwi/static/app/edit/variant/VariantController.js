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
			$timeout,
			$window, 
			// general purpose utilities
//			ErrorMessage,
//			FindElement,
//			Focus,
			// resource APIs
			AlleleSearchAPI,
			JnumLookupAPI,
			VariantSearchAPI,
			VariantKeySearchAPI,
			VariantCreateAPI,
			VariantUpdateAPI,
			VariantDeleteAPI
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {}

		vm.logging = true;		// show logging to console (true or false)?
		
		// mapping of variant data in PWI format (converted by VariantTranslator)
		vm.variant = vt.getEmptyPwiVariant();
		
		// mapping of variant data in API format
		vm.variantData = {};
		
		vm.alleleParams = {};	// search parameters for alleles

		vm.resultCount = 0;		// number of alleles returned by search
		vm.results = [];		// list of alleles returned by search
		vm.variants = [];		// list of variants for the selected allele
		
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
		
		 // Initializes the needed page values 
		function init() {
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

		// mapped to query 'Search' button
		function eiSearch() {				
		
			vm.hideLoadingHeader = false;
			
			// pull search fields into an allele-compliant data structure
			vm.alleleParams = {};
			if (vm.variant.allele.symbol) {
				vm.alleleParams.symbol = vm.variant.allele.symbol;
			}
			if (vm.variant.chromosome != '') {
				vm.alleleParams.chromosome = vm.variant.chromosome;
			}
			if (vm.variant.strand != '') {
				vm.alleleParams.strand = vm.variant.strand;
			}
			if ((vm.variant.allele.accID != null) && (vm.variant.allele.accID.trim() != "")) {
				vm.alleleParams.mgiAccessionIds = [];
				vm.alleleParams.mgiAccessionIds.push( {"accID" : vm.variant.allele.accID.trim().replace(/[ ,\n\r\t]/g, " ") } );
			}
			if ((vm.variant.allele.references != null) && (vm.variant.allele.references.trim() != "")) {
				vm.alleleParams.refAssocs = [];
				vm.alleleParams.refAssocs.push( {"jnumid" : vm.variant.allele.references.trim().replace(/[ ,\n\r\t]/g, " ") } );
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
				}

			}, function(err) { // server exception
				handleError("Error searching for variants.");
			});
		}		

		// mapped to 'Reset Search' button
		function resetSearch() {		
			log('in resetSearch()');
			resetData();
			vm.alleleParams = vm.oldRequest;
			vm.jnumIDs = vt.collectRefIDs(vm.alleleParams.refAssocs);
			vm.alleleID = vt.getAlleleID(vm.alleleParams.mgiAccessionIds);
			vm.variantData = {
				allele : {
					symbol : vm.alleleParams.symbol,
				},
				strand : vm.alleleParams.strand,
				chromosome : vm.alleleParams.chromosome
			};
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

			// call API to create variant
			log("Submitting to variant creation endpoint");
			log(vm.variant);
			VariantCreateAPI.create(vm.variant, function(data) {
				
				// check for API returned error
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					// update variant data
					vm.variant = vt.apiToPwiVariant(data.items[0]);
					postVariantLoad();

					// update summary section
					var result={
						variantKey:vm.variant.variantKey, 
						symbol:vm.variant.allele.symbol};
					vm.results[0] = result;
					alert("Variant Created!");
				}
				
			}, function(err) {
				handleError("Error creating variant.");
			});
		}		

		// get a slim reference domain object corresponding to the given J#
		// (null in case of failure or a bad J#)
		function lookupJNum(jnum, retries) {
			log('looking up: ' + jnum);
			
			JnumLookupAPI.query({ jnumid: jnum }, function(data) {
				log('found: ' + jnum);
				processReference(jnum, data);
			}, function(err) {
				handleError("Error retrieving reference: " + jnum);
				log(err);
				processReference(jnum, null);
			});
		}		
		
		// ensure that the data in vm.variant reflects the variant's reference data as
		// edited in vm.variantJnumIDs
		function applyReferenceChanges() {
			// build map of J# from the API's data
			var inData = {};
			var jnumInData = vt.collectRefIDs(vm.variantData.refAssocs);
			jnumInData = jnumInData.replace(/,/g, ' ').replace(/[ \t\n]+/g, ' ').toUpperCase().split(' ');
			for (var i = 0; i < jnumInData.length; i++) {
				inData[jnumInData[i]] = 1;
			}
			
			// flag for removal any references that do not appear in vm.variantJnumIDs
			
			for (var i = 0; i < vm.variantData.refAssocs.length; i++) {
				var assoc = vm.variantData.refAssocs[i];
				if (!(assoc.jnumid in vm.refsKeyCache)) {
					assoc.processStatus = 'd';			// delete this one
				}
			}
			
			// flag for creation any references in vm.variantJnumIDs that are not in vm.variantData
			
			var jnumInForm = vm.variantJnumIDs.replace(/,/g, ' ').replace(/[ \t\n]+/g, ' ').toUpperCase().split(' ');
			for (var i = 0; i < jnumInForm.length; i++) {
				var jnum = jnumInForm[i];
				if (!(jnum in inData)) {
					var refsKey = vm.refsKeyCache[jnum];
					if (refsKey != null) {
						var newRef = {
							processStatus : 'c',			// create an association with this reference
							jnumid : jnum,
							refAssocTypeKey : 1030,			// General reference for variants
							refAssocType : 'General',
							mgiTypeKey : 45,				// variants
							refsKey : refsKey
						}
						vm.variantData.refAssocs.push(newRef);
					}
				}
			}
		}
		
		// For the given J#, we got back a string of JSON 'data' that contains (among other fields),
		// the corresponding reference's key.  Store it, decrement the counter of responses we're
		// awaiting, and if it is 0, then move on with the updating function.
		function processReference(jnum, data) {
			log('in processReference(' + jnum + ',' + data + ')');
			if (vm.refsKeyCache[jnum] == -1) {
				if (data == null) {
					vm.refsKeyCache[jnum] = null;
					log(jnum + ' : null');
				} else {
					vm.refsKeyCache[jnum] = data[0].refsKey; 
					log(jnum + ' : ' + data[0].refsKey);
				}
				vm.refsKeyCount = vm.refsKeyCount - 1;
				log('To go: ' + vm.refsKeyCount);
			} else {
				log('Already have ' + jnum + ' as ' + vm.refsKeyCache[jnum]);
			}
			
			if (vm.refsKeyCount == 0) {
				updateVariantPart2();
			}
		}
		
		// go through the variant's J# and look up their reference keys (asynchronously)
		function lookupReferences() {
			vm.refsKeyCache = {};
			vm.refsKeyCount = 0;

			var jnumInForm = vm.variantJnumIDs.replace(/,/g, ' ').replace(/[ \t\n]+/g, ' ').toUpperCase().split(' ');
			for (var i = 0; i < jnumInForm.length; i++) {
				vm.refsKeyCache[jnumInForm[i]] = -1;
				lookupJNum(jnumInForm[i]);				// send asynchronous request of API
			}
			vm.refsKeyCount = jnumInForm.length;
		}
		
        // mapped to 'Update' button -- This is part 1, as we need to asynchronously map any entered J#
		// to their corresponding reference keys.  Once the references have been looked up, the last
		// one will automatically pass control on to updateVariantPart2().
		function updateVariant() {
			lookupReferences();
		}
		
		// get the proper operation for the given sequence key ('c' for create if the key is null, or
		// 'u' for update if it is not null)
		function op(seqKey) {
			if (seqKey == null) { return 'c'; }
			return 'u';
		}

		function updateVariantPart2() {
			applyReferenceChanges();
			
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
			
			// call API to update variant
			log("Submitting to variant update endpoint");
			log(vm.variantData);
			VariantUpdateAPI.update(vm.variantData, function(data) {
				
				// check for API returned error
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					// update variant data
					vm.variantData = data.items[0];
					postVariantLoad();

					alert("Variant Updated!");
				}
				
			}, function(err) {
				handleError("Error updating variant.");
			});

		}		
		
        // mapped to 'Delete' button
		function deleteVariant() {
			log("Deleting Variant");

			if ($window.confirm("Are you sure you want to delete this variant?")) {
			
				var oldAllele = vm.selectedIndex;
				
				// call API to delete variant
				VariantDeleteAPI.delete({ key: vm.variant.variantKey }, function(data) {


					// check for API returned error
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						// success
						alert("Variant Deleted!");
						vm.variantData = {};
						vm.variant = vt.getEmptyPwiVariant();
						vm.results = [];
						resetSearch();
						eiSearch();
						setTimeout(function() { setAllele(oldAllele); }, 1000);
					}
				
				}, function(err) {
					handleError("Error deleting variant.");
				});
			}
		}		

		/////////////////////////////////////////////////////////////////////
		// Utility methods
		/////////////////////////////////////////////////////////////////////		
		
		// get the key (as a string) corresponding to the given sequence type
		function typeKey(seqType) {
			if (seqType == 'DNA') { return '316347'; }
			if (seqType == 'RNA') { return '316346'; }
			if (seqType == 'Polypeptide') { return '316348'; }
			return '316349';
		}
		
		// iterate through seqList and look for a sequence with the given seqType,
		// returning the first one found (if any) or {} (if none of that type)
		function getSequence(seqList, seqType, variantKey) {
			for (var i = 0; i < seqList.length; i++) {
				if (seqList[i]['sequenceTypeTerm'] == seqType) {
					return seqList[i];
				}
			}
			
			// At this point, we didn't find a sequence of the given type, so add one.
			var seq = {
				'processStatus' : 'x',
				'sequenceTypeTerm' : seqType,
				'sequenceTypeKey' : typeKey(seqType),
				'variantKey' : variantKey,
			}
			seqList.push(seq);
			return seq;
		}
		
		function resetCaches() {
			// rebuild empty variantData submission object, else bindings fail
			log('in resetCaches()');
			
			vm.variantData = {};
			vm.variantData.allele = {}
			vm.variantData.allele.mgiAccessionIds = [];
			vm.variantData.allele.mgiAccessionIds[0] = {"accID":""};
			
			// caches of various IDs
			vm.jnumIDs = "";
			vm.variantJnumIDs = "";
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
				log('got data for ' + vm.summaryVariantKey);
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
		
		// Take a list of full variant objects and consolidate them into something more useful for our purposes.
		// (We need to pre-identify the genomic, transcript, and protein sequence objects.)
		function preprocessVariants(variants) {
			var out = [];
			for (var i = 0; i < variants.length; i++) {
				var v = {
					'raw' : variants[i],
					'variantKey' : variants[i].variantKey,
					'dna' : getSequence(variants[i].variantSequences, 'DNA'),
					'rna' : getSequence(variants[i].variantSequences, 'RNA'),
					'polypeptide' : getSequence(variants[i].variantSequences, 'Polypeptide')
					};
				out.push(v);
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
				vm.variantIndex = 0;
				loadVariant();
			}, function(err) {
				handleError("Error retrieving variants for allele.");
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
/*			
			// collect just the allele's J#s in a new attribute (and ensure uniqueness of J# displayed)
			vm.jnumIDs = vt.collectRefIDs(vm.variantData.allele.refAssocs);
			
			// collect just the variant's J#s in a new attribute (and ensure uniqueness of J# displayed)
			vm.variantJnumIDs = vt.collectRefIDs(vm.variantData.refAssocs);
			
			// and collect the allele's MGI ID, too
			vm.alleleID = vt.getAlleleID(vm.variantData.allele.mgiAccessionIds);
			
			var variantKey = vm.variantData.variantKey;
			
			// display genomic, transcript, and protein sequence info for the source and curated columns
			vm.sourceDnaSeq = getSequence(vm.variantData.sourceVariant.variantSequences, "DNA");
			vm.curatedDnaSeq = getSequence(vm.variantData.variantSequences, "DNA");
			vm.sourceRnaSeq = getSequence(vm.variantData.sourceVariant.variantSequences, "RNA");
			vm.curatedRnaSeq = getSequence(vm.variantData.variantSequences, "RNA");
			vm.sourceProteinSeq = getSequence(vm.variantData.sourceVariant.variantSequences, "Polypeptide");
			vm.curatedProteinSeq = getSequence(vm.variantData.variantSequences, "Polypeptide");

			// store a string version of the source & curated sequences to use for easy comparisons
			// later on
			vm.sourceDnaSeqJson = JSON.stringify(vm.sourceDnaSeq);
			vm.curatedDnaSeqJson = JSON.stringify(vm.curatedDnaSeq);
			vm.sourceRnaSeqJson = JSON.stringify(vm.sourceRnaSeq);
			vm.curatedRnaSeqJson = JSON.stringify(vm.curatedRnaSeq);
			vm.sourceProteinSeqJson = JSON.stringify(vm.sourceProteinSeq);
			vm.curatedProteinSeqJson = JSON.stringify(vm.curatedProteinSeq);
			
			// cache the sequence IDs
			vm.sourceRnaID = getSeqID(vm.sourceRnaSeq);
			vm.curatedRnaID = getSeqID(vm.curatedRnaSeq);
			vm.sourceProteinID = getSeqID(vm.sourceProteinSeq);
			vm.curatedProteinID = getSeqID(vm.curatedProteinSeq);
			
			// will need to apply changes for the above fields into the sequence objects themselves...
			
			
			

			// Find the longest of the genomic sequences.  If any are more than 8 characters, then show
			// two rows in each genomic sequence box.  Ditto for the transcript and protein sequences.
			if (maxLength( [ vm.sourceDnaSeq, vm.curatedDnaSeq ] ) > 8) {
				setRows( [ 'srcDnaRefAllele', 'srcDnaVarAllele', 'curDnaRefAllele', 'curDnaVarAllele' ], 2);
			}
			if (maxLength( [ vm.sourceRnaSeq, vm.curatedRnaSeq ] ) > 8) {
				setRows( [ 'srcRnaRefAllele', 'srcRnaVarAllele', 'curRnaRefAllele', 'curRnaVarAllele' ], 2);
			}
			if (maxLength( [ vm.sourceProteinSeq, vm.curatedProteinSeq ] ) > 8) {
				setRows( [ 'srcProteinRefAllele', 'srcProteinVarAllele', 'curProteinRefAllele', 'curProteinVarAllele' ], 2);
			}
			
			// display SO effects and types
			vm.effects = getTerms(vm.variantData.variantEffects);
			vm.types = getTerms(vm.variantData.variantTypes);
*/					
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

		// call to initialize the page, and start the ball rolling...
		init();
	}

})();
