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
			loadVariant();		// added temporarily (until we get searching) -- JSB
		}


		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI via buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////		

        // mapped to 'Clear' button; called from init();  resets page
		function eiClear() {		
			vm.oldRequest = {};
			resetData();
			setFocus();
		}		

		// mapped to query 'Search' button
		function eiSearch() {				
		
			vm.hideLoadingHeader = false;
			
			// save off old request
			vm.oldRequest = vm.variantData;

			// call API to search; pass query params (vm.selected)
			VariantSearchAPI.search(vm.variantData, function(data) {
				
				vm.results = data;
				vm.hideLoadingHeader = true;
				vm.selectedIndex = 0;
				loadVariant();

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
			if ((vm.results.length == 0) && (inputVariantKey != null)) {
				vm.summaryVariantKey = inputVariantKey;
			} else {
				vm.summaryVariantKey = vm.results[vm.selectedIndex].variantKey;
			}
			
			// call API to gather variant for given key
			VariantKeySearchAPI.get({ key: vm.summaryVariantKey }, function(data) {
				vm.variantData = data;
				postVariantLoad();
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

			// collect just the J# in a new attribute
			vm.variantData.jnumIDs = "";
			for (var i = 0; i < vm.variantData.refAssocs.length; i++) {
				if (vm.variantData.jnumIDs == "") {
					vm.variantData.jnumIDs = vm.variantData.jnumIDs + " ";
				}
				vm.variantData.jnumIDs = vm.variantData.jnumIDs + vm.variantData.refAssocs[i].jnumid;
			}
			
			// and collect the allele's MGI ID, too
			vm.variantData.allele.mgiID = "";
			for (var i = 0; i < vm.variantData.allele.mgiAccessionIds.length; i++) {
				if ("1" === vm.variantData.allele.mgiAccessionIds[i].logicaldbKey) {
					vm.variantData.allele.mgiID = vm.variantData.allele.mgiAccessionIds[i].accID;
				}
			}
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

