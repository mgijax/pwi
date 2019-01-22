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

		// count, and list of results data (fills summary)
		vm.resultCount = 0;
		vm.results = [];
		
		// Used to track which summary variant is highlighted / active
		vm.selectedIndex = 0;
		
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
			resetData();
			setFocus();
			
			// remove coloring of strand selection list
			$('#strand').removeClass('redBG').removeClass('whiteBG');
		}		

		// mapped to query 'Search' button
		function eiSearch() {				
		
			vm.hideLoadingHeader = false;
			
			// save off old request
			vm.oldRequest = vm.variantData;

			// copy a user-specified allele ID into the right spot in vm.variantData
			if ((vm.alleleID != null) && (vm.alleleID.trim() != "")) {
				vm.variantData.allele.mgiAccessionIds = [];
				vm.variantData.allele.mgiAccessionIds.push( {"accID" : vm.alleleID.trim().replace(/[ ,\n\r\t]/g, " ") } );
			}

			// copy any user-specified reference IDs into the right spot in vm.variantData
			if ((vm.jnumIDs != null) && (vm.jnumIDs.trim() != "")) {
				vm.variantData.allele.refAssocs = [];
				vm.variantData.allele.refAssocs.push( {"jnumid" : vm.jnumIDs.trim().replace(/[ ,\n\r\t]/g, " ") } );
			}
			
			// call API to search; pass query params (vm.selected)
			VariantSearchAPI.search(vm.variantData, function(data) {
				
				vm.results = data;
				vm.hideLoadingHeader = true;
				vm.selectedIndex = 0;
				if (vm.results.length > 0) {
					loadVariant();
				}

			}, function(err) { // server exception
				handleError("Error searching for variants.");
			});
		}		

		// mapped to 'Reset Search' button
		function resetSearch() {		
			resetData();
			vm.variantData = vm.oldRequest;
		}		

        // called when user clicks a row in the variant summary
		function setVariant(index) {
			vm.variantData = {};
			vm.selectedIndex = index;
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

        // mapped to 'Update' button
		function updateVariant() {
			
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
			console.log("Deleting Variant1");

			if ($window.confirm("Are you sure you want to delete this variant?")) {
			
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
		
		function resetData() {
			// reset submission/summary values
			vm.results = [];
			vm.selectedIndex = 0;
			vm.errorMsg = '';
			vm.resultCount = 0;

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
			if ((vm.results.length == 0) && (inputVariantKey != null) && (inputVariantKey != "")) {
				vm.summaryVariantKey = inputVariantKey;
			} else if (vm.results.length == 0) {
				return;
			} else {
				vm.summaryVariantKey = vm.results[vm.selectedIndex].variantKey;
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
		
		// error handling
		function handleError(msg) {
			vm.errorMsg = msg;
			vm.hideErrorContents = false;
			vm.hideLoadingHeader = true;
		}

		// a variant can be loaded from a search or create - this shared 
		// processing is called after endpoint data is loaded
		function postVariantLoad() {
			vm.editableField = false;

			// collect just the allele's J#s in a new attribute (and ensure uniqueness of J# displayed)
			vm.jnumIDs = "";
			var seen = {};
			for (var i = 0; i < vm.variantData.allele.refAssocs.length; i++) {
				var jnum = vm.variantData.allele.refAssocs[i].jnumid;
				if (!(jnum in seen)) {
					if (vm.jnumIDs != "") {
						vm.jnumIDs = vm.jnumIDs + " ";
					}
					vm.jnumIDs = vm.jnumIDs + jnum;
					seen[jnum] = 1;
				}
			}
			
			// collect just the variant's J#s in a new attribute (and ensure uniqueness of J# displayed)
			vm.variantJnumIDs = "";
			var vSeen = {};
			for (var i = 0; i < vm.variantData.refAssocs.length; i++) {
				var jnum = vm.variantData.refAssocs[i].jnumid;
				if (!(jnum in vSeen)) {
					if (vm.variantJnumIDs != "") {
						vm.variantJnumIDs = vm.variantJnumIDs + " ";
					}
					vm.variantJnumIDs = vm.variantJnumIDs + jnum;
					vSeen[jnum] = 1;
				}
			}
			
			// and collect the allele's MGI ID, too
			vm.alleleID = "";
			for (var i = 0; i < vm.variantData.allele.mgiAccessionIds.length; i++) {
				if ("1" === vm.variantData.allele.mgiAccessionIds[i].logicaldbKey) {
					vm.alleleID = vm.variantData.allele.mgiAccessionIds[i].accID;
					break;
				}
			}
			
			// display genomic sequence info for the source and curated columns
			vm.sourceDnaSeq = getSequence(vm.variantData.sourceVariant.variantSequences, "DNA");
			vm.curatedDnaSeq = getSequence(vm.variantData.sourceVariant.variantSequences, "DNA");
			
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

