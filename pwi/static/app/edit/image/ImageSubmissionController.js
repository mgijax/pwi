(function() {
	'use strict';
	angular.module('pwi.image').controller('ImageSubmissionController', ImageSubmissionController);

	function ImageSubmissionController(
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
			ImageSubmissionSearchAPI,
			ImageSubmissionProcessAPI,
			JnumValidationAPI
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {};

		// mapping of object data 
		vm.objectData = {};

		// results list and data
		vm.results = [];
		
		// default booleans for page functionality 
		vm.hideVmData = true;            // JSON data
		vm.hideObjectData = true;		// Display JSON package of object
		vm.hideLoadingHeader = true;   // display loading header
		vm.hideErrorContents = true;   // display error message
		
		// error message
		vm.errorMsg = '';
		
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			resetData();
		}

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        	// mapped to 'Clear' button; called from init();  resets page
		function eiClear() {		
			resetData();
			setFocus();
		}		

		// mapped to query 'Search' button
		// default is to select first result
		function eiSearch() {				
		
			pageScope.loadingStart();
			vm.hideLoadingHeader = false;
			
			// call API to search; pass query params (vm.selected)
			ImageSubmissionSearchAPI.search(vm.objectData, function(data) {
				
				vm.results = data;
				vm.hideLoadingHeader = true;

				if (vm.results.length > 0) {
					vm.queryMode = false;
				}
				else {
					vm.queryMode = true;
				}
				pageScope.loadingFinished();

			}, function(err) { // server exception
				handleError("Error while searching");
				pageScope.loadingFinished();
				setFocus();
			});
		}		

        	// mapped to 'Submit' button
		function submitObject() {

			console.log("Submitting to update endpoint");
			var fd = document.getElementById("imageKey_490251");
			var allowCommit = false;

			if (allowCommit){

				pageScope.loadingStart();

				// call process API
				ImageSubmissionProcessAPI.process(vm.results, function(data) {
					// check for API returned error
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						alert("Submission process");
						//eiSearch();
					}
					pageScope.loadingFinished();
				}, function(err) {
					handleError("Error updating image.");
					pageScope.loadingFinished();
				});
			}
		}		
		
        	// verifing jnum & citation
		function jnumOnBlur() {		
			console.log("Into jnumOnBlur()");

			// ensure we want to send the validation request
			var validate = true;

			if (vm.objectData.jnumid == "")
			{
				validate = false;
			}
			if (vm.objectData.jnumid.includes("%"))
			{
				validate = false;
			}

			// create local JSON package for validation submission
			var jsonPackage = {"jnumid":""}; 
			jsonPackage.jnumid = vm.objectData.jnumid;

			// validate against DB
			if (validate) {
				JnumValidationAPI.validate(jsonPackage, function(data) {
					if (data.length == 0) {
						alert("Invalid Reference: " + vm.objectData.jnumid);
						vm.objectData.jnumid = "";
						setFocus();
					} else {
						console.log("jnum validated");
						vm.objectData.refsKey = data[0].refsKey;
						vm.objectData.jnumid = data[0].jnumid;
						if (data[0].short_citation != null) {
							vm.objectData.short_citation = data[0].short_citation;
						}
						eiSearch();
					}
					vm.hideErrorContents = true;

				}, function(err) {
					handleError("Invalid Reference");
					vm.objectData.jnumid = "";
					setFocus();
				});
			}
		}		
		
		/////////////////////////////////////////////////////////////////////
		// Utility methods
		/////////////////////////////////////////////////////////////////////
		
		// reset other stuff
		function resetOther() {
			console.log("into resetOther");

			//
			// reset display booleans
			vm.hideErrorContents = true;
			vm.hideLoadingHeader = true;
			vm.queryMode = true;
		}

		// resets page data
		function resetData() {
			console.log("into resetData");

			// reset submission/summary values
			vm.results = [];
			vm.errorMsg = '';
			vm.fileList = [];

			// rebuild empty objectData submission object, else bindings fail
			vm.objectData = {};
			vm.objectData.refsKey = "";	
			vm.objectData.jnumid = "";	
			vm.objectData.short_citation = "";

			resetOther()
		}

		// setting of mouse focus
		function setFocus () {
			var input = document.getElementById ("JNumID");
			input.focus ();
		}

		// error handling
		function handleError(msg) {
			vm.errorMsg = msg;
			vm.hideErrorContents = false;
			vm.hideLoadingHeader = true;
		}

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.eiSearch = eiSearch;
		$scope.eiClear = eiClear;
		$scope.submitObject = submitObject;

		// other functions: buttons, onBlurs and onChanges
		$scope.jnumOnBlur = jnumOnBlur;
		
		// global shortcuts
		$scope.KclearAll = function() { $scope.eiClear(); $scope.$apply(); }
		$scope.Ksearch = function() { $scope.eiSearch(); $scope.$apply(); }
		$scope.Kmodify = function() { $scope.modifyObject(); $scope.$apply(); }

		var globalShortcuts = Mousetrap($document[0].body);
		globalShortcuts.bind(['ctrl+alt+c'], $scope.KclearAll);
		globalShortcuts.bind(['ctrl+alt+s'], $scope.Ksearch);
		globalShortcuts.bind(['ctrl+alt+m'], $scope.Kmodify);

		// call to initialize the page, and start the ball rolling...
		init();
	}

})();

