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
			ErrorMessage,
			FindElement,
			Focus,
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

		// mapping of variant data 
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
			if (vm.variantData.allele.symbol) {
				vm.alleleParams.symbol = vm.variantData.allele.symbol;
			}
			if (vm.variantData.chromosome != '') {
				vm.alleleParams.chromosome = vm.variantData.chromosome;
			}
			if (vm.variantData.strand != '') {
				vm.alleleParams.strand = vm.variantData.strand;
			}
			if ((vm.alleleID != null) && (vm.alleleID.trim() != "")) {
				vm.alleleParams.mgiAccessionIds = [];
				vm.alleleParams.mgiAccessionIds.push( {"accID" : vm.alleleID.trim().replace(/[ ,\n\r\t]/g, " ") } );
			}
			if ((vm.jnumIDs != null) && (vm.jnumIDs.trim() != "")) {
				vm.alleleParams.refAssocs = [];
				vm.alleleParams.refAssocs.push( {"jnumid" : vm.jnumIDs.trim().replace(/[ ,\n\r\t]/g, " ") } );
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
			resetData();
			vm.alleleParams = vm.oldRequest;
			vm.jnumIDs = collectRefIDs(vm.alleleParams.refAssocs);
			vm.alleleID = getAlleleID(vm.alleleParams.mgiAccessionIds);
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
			vm.variantData = {};
			vm.selectedIndex = index;
			resetCaches();
			if (vm.results.length > index) {
				loadAllele();
			}
		}		

        // called when user clicks a row in the variant table
		function setVariant(index) {
			vm.variantData = {};
			vm.variantIndex = index;
			resetCaches();
			loadVariant();
		}		

        // mapped to 'Create' button
		function createVariant() {

			// call API to create variant
			console.log("Submitting to variant creation endpoint");
			console.log(vm.variantData);
			VariantCreateAPI.create(vm.variantData, function(data) {
				
				// check for API returned error
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					// update variant data
					vm.variantData = data.items[0];
					postVariantLoad();

					// update summary section
					var result={
						variantKey:vm.variantData.variantKey, 
						symbol:vm.variantData.symbol};
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
			console.log('looking up: ' + jnum);
			
			JnumLookupAPI.query({ jnumid: jnum }, function(data) {
				console.log('found: ' + jnum);
				processReference(jnum, data);
			}, function(err) {
				handleError("Error retrieving reference: " + jnum);
				console.log(err);
				processReference(jnum, null);
			});
		}		
		
		// ensure that the data in vm.variantData reflects the variant's reference data as
		// edited in vm.variantJnumIDs
		function applyReferenceChanges() {
			// build map of J# from the API's data
			var inData = {};
			var jnumInData = collectRefIDs(vm.variantData.refAssocs);
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
			console.log('in processReference(' + jnum + ',' + data + ')');
			if (vm.refsKeyCache[jnum] == -1) {
				if (data == null) {
					vm.refsKeyCache[jnum] = null;
					console.log(jnum + ' : null');
				} else {
					vm.refsKeyCache[jnum] = data[0].refsKey; 
					console.log(jnum + ' : ' + data[0].refsKey);
				}
				vm.refsKeyCount = vm.refsKeyCount - 1;
				console.log('To go: ' + vm.refsKeyCount);
			} else {
				console.log('Already have ' + jnum + ' as ' + vm.refsKeyCache[jnum]);
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
		
		function updateVariantPart2() {
			vm.variantData.processStatus = "u";		// The current variant has updates.
			applyReferenceChanges();
			
			// if the source and/or curated DNA sequences have changed, flag them for updates
			if (vm.sourceDnaSeqJson != JSON.stringify(vm.sourceDnaSeq)) {
				vm.sourceDnaSeq.processStatus = "u";``
			}
			if (vm.curatedDnaSeqJson != JSON.stringify(vm.curatedDnaSeq)) {
				vm.curatedDnaSeq.processStatus = "u";``
			}
			
			// call API to update variant
			console.log("Submitting to variant update endpoint");
			console.log(vm.variantData);
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
			console.log("Deleting Variant");

			if ($window.confirm("Are you sure you want to delete this variant?")) {
			
				var oldAllele = vm.selectedIndex;
				
				// call API to delete variant
				VariantDeleteAPI.delete({ key: vm.variantData.variantKey }, function(data) {


					// check for API returned error
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						// success
						alert("Variant Deleted!");
						vm.variantData = {};
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

		 // Hide/Show note sections
		function hideShowEditorNote() {
			vm.hideEditorNote = !vm.hideEditorNote;
		}
		function hideShowSequenceNote() {
			vm.hideSequenceNote = !vm.hideSequenceNote;
		}
		function hideShowVariantRevisionNote() {
			vm.hideVariantRevisionNote = !vm.hideVariantRevisionNote;
		}
		function hideShowStrainSpecificNote() {
			vm.hideStrainSpecificNote = !vm.hideStrainSpecificNote;
		}
		function hideShowLocationNote() {
			vm.hideLocationNote = !vm.hideLocationNote;
		}
		
		/////////////////////////////////////////////////////////////////////
		// Utility methods
		/////////////////////////////////////////////////////////////////////		
		
		// iterate through seqList and look for a sequence with the given seqType,
		// returning the first one found (if any) or {} (if none of that type)
		function getSequence(seqList, seqType) {
			for (var i = 0; i < seqList.length; i++) {
				if (seqList[i]['sequenceTypeTerm'] == seqType) {
					return seqList[i];
				}
			}
			return {};
		}
		
		// iterate through the SO annotations given and return a string containing
		// "ID (term)" for each annotation on a separate line
		function getTerms(annotations) {
			var s = "";
			for (var i = 0; i < annotations.length; i++) {
				if (s != "") { s = s + "\n"; }
				s = s + annotations[i].alleleVariantSOIds[0].accID + " ("
					+ annotations[i].term + ")";
			}
			return s;
		}
		
		function resetCaches() {
			// rebuild empty variantData submission object, else bindings fail
			vm.variantData = {};
			vm.variantData.allele = {}
			vm.variantData.allele.mgiAccessionIds = [];
			vm.variantData.allele.mgiAccessionIds[0] = {"accID":""};
			
			// caches of various IDs
			vm.jnumIDs = "";
			vm.variantJnumIDs = "";
			vm.alleleID = "";
			
			// caches of genomic sequence data
			vm.sourceDnaSeq = {};
			vm.curatedDnaSeq = {};
			
			// cache of SO annotations (effects and types)
			vm.effects = "";
			vm.types = "";
		}
		
		function resetData() {
			// reset submission/summary values
			vm.results = [];
			vm.selectedIndex = 0;
			vm.errorMsg = '';
			vm.resultCount = 0;

			resetCaches();
			
			// reset booleans for fields and display
			vm.hideErrorContents = true;
			vm.hideLoadingHeader = true;
			vm.hideEditorNote = true;
			vm.hideSequenceNote = true;
			vm.hideVariantRevisionNote = true;
			vm.hideStrainSpecificNote = true;
			vm.hideLocationNote = true;
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

			// derive the key of the selected result summary variant
			if ((vm.variants.length == 0) && (inputVariantKey != null) && (inputVariantKey != "")) {
				vm.summaryVariantKey = inputVariantKey;
			} else if (vm.variants.length == 0) {
				return;
			} else {
				vm.summaryVariantKey = vm.variants[vm.variantIndex].variantKey;
			}
			
			// call API to gather variant for given key
			VariantKeySearchAPI.get({ key: vm.summaryVariantKey }, function(data) {
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
			console.log(msg);
			vm.errorMsg = msg;
			vm.hideErrorContents = false;
			vm.hideLoadingHeader = true;
		}

		function getAlleleID(alleleIDs) {
			if ((alleleIDs != null) && (alleleIDs != undefined)) {
				for (var i = 0; i < alleleIDs.length; i++) {
					if ("1" === alleleIDs[i].logicaldbKey) {
						return alleleIDs[i].accID;
					}
				}
				if (alleleIDs.length == 1) {
					return alleleIDs[0].accID;
				}
			}
			return "";
		}
		
		function collectRefIDs(refIDs) {
			var variantJnumIDs = "";
			if ((refIDs != null) && (refIDs != undefined)) {
				var vSeen = {};
				for (var i = 0; i < refIDs.length; i++) {
					var jnum = refIDs[i].jnumid;
					if (!(jnum in vSeen)) {
						if (variantJnumIDs != "") {
							variantJnumIDs = variantJnumIDs + " ";
						}
						variantJnumIDs = variantJnumIDs + jnum;
						vSeen[jnum] = 1;
					}
				}
			}
			return variantJnumIDs;
		}
		
		// a variant can be loaded from a search or create - this shared 
		// processing is called after endpoint data is loaded
		function postVariantLoad() {
			vm.editableField = false;

			// collect just the allele's J#s in a new attribute (and ensure uniqueness of J# displayed)
			vm.jnumIDs = collectRefIDs(vm.variantData.allele.refAssocs);
			
			// collect just the variant's J#s in a new attribute (and ensure uniqueness of J# displayed)
			vm.variantJnumIDs = collectRefIDs(vm.variantData.refAssocs);
			
			// and collect the allele's MGI ID, too
			vm.alleleID = getAlleleID(vm.variantData.allele.mgiAccessionIds);
			
			// display genomic sequence info for the source and curated columns
			vm.sourceDnaSeq = getSequence(vm.variantData.sourceVariant.variantSequences, "DNA");
			vm.curatedDnaSeq = getSequence(vm.variantData.variantSequences, "DNA");
			
			// store a string version of the source & curated DNA sequences to use for easy comparisons
			// later on
			vm.sourceDnaSeqJson = JSON.stringify(vm.sourceDnaSeq);
			vm.curatedDnaSeqJson = JSON.stringify(vm.curatedDnaSeq);
			
			// Find the longest of the genomic sequences.  If any are more than 8 characters,
			// then show two rows in each genomic sequence box.
			var longest = Math.max(
				vm.sourceDnaSeq.referenceSequence.length,
				vm.sourceDnaSeq.variantSequence.length,
				vm.curatedDnaSeq.referenceSequence.length,
				vm.curatedDnaSeq.variantSequence.length
				);
			if (longest > 8) {
				angular.element('#srcDnaRefAllele').attr('rows', 2);
				angular.element('#srcDnaVarAllele').attr('rows', 2);
				angular.element('#curDnaRefAllele').attr('rows', 2);
				angular.element('#curDnaVarAllele').attr('rows', 2);
			}
			
			// display SO effects and types
			vm.effects = getTerms(vm.variantData.variantEffects);
			vm.types = getTerms(vm.variantData.variantTypes);
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

		$scope.hideShowEditorNote = hideShowEditorNote;
		$scope.hideShowSequenceNote = hideShowSequenceNote;
		$scope.hideShowVariantRevisionNote = hideShowVariantRevisionNote;
		$scope.hideShowStrainSpecificNote = hideShowStrainSpecificNote;
		$scope.hideShowLocationNote = hideShowLocationNote;
		
		// call to initialize the page, and start the ball rolling...
		init();
	}

})();

