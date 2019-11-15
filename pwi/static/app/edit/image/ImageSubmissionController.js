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
			ImageSubmissionSubmitAPI,
			ValidateJnumImageAPI
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {};

		// mapping of object data 
		vm.apiDomain = {};

		// results list and data
		vm.results = [];
		
		// default booleans for page functionality 
		vm.hideApiDomain = true;       // JSON package
		vm.hideVmData = true;          // JSON package + other vm objects
		vm.hideLoadingHeader = true;   // display loading header
		vm.hideErrorContents = true;   // display error message
		
		// error message
		vm.errorMsg = '';
		
		// used to submit the files
		vm.submitForm = new FormData();

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
		function eiSearch() {				
		
			console.log("eiSearch(): begin");

			if (vm.apiDomain.jnumid == "") {
				return;
			}

			pageScope.loadingStart();
			vm.hideLoadingHeader = false;
			
			console.log("eiSearch(): calling API");
			console.log("jnumid = " + vm.apiDomain.jnumid);
			ImageSubmissionSearchAPI.search(vm.apiDomain, function(data) {
				vm.results = data;
				vm.hideLoadingHeader = true;
				vm.submitForm = new FormData();
				pageScope.loadingEnd();
			}, function(err) {
				pageScope.handleError(vm, "Error while searching");
				pageScope.loadingEnd();
				setFocus();
			});
		}		

        	// verifing jnum & citation
		function jnumOnBlur() {		
			console.log("jnumOnBlur() : begin");

			// ensure we want to send the validation request
			var validate = true;

			if (vm.apiDomain.jnumid == "")
			{
				validate = false;
			}
			if (vm.apiDomain.jnumid.includes("%"))
			{
				validate = false;
			}

			// create local JSON package for validation submission
			var jsonPackage = {"jnumid":""}; 
			jsonPackage.jnumid = vm.apiDomain.jnumid;

			// validate against DB
			if (validate) {
				ValidateJnumImageAPI.validate(jsonPackage, function(data) {
					if (data.length == 0) {
						alert("Invalid Reference: " + vm.apiDomain.jnumid);
						vm.apiDomain.jnumid = "";
						setFocus();
					} else {
						console.log("jnum validated");
						vm.apiDomain.refsKey = data[0].refsKey;
						vm.apiDomain.jnumid = data[0].jnumid;
						if (data[0].short_citation != null) {
							vm.apiDomain.short_citation = data[0].short_citation;
						}
						eiSearch();
					}
					vm.hideErrorContents = true;

				}, function(err) {
					pageScope.handleError(vm, "Invalid Reference");
					vm.apiDomain.jnumid = "";
					setFocus();
				});
			}
		}		
		// fill in the form
		function fileNameChanged(file) {
			vm.submitForm.append("imageKey_" + file.id, file.id);
			vm.submitForm.append("file_" + file.id, file.files[0]);
			vm.submitForm.append("name_" + file.id, file.value);
			vm.submitForm.append("jnumid", vm.apiDomain.jnumid);

			for (var key of vm.submitForm.keys()) {
				console.log(key);
			}
			for (var value of vm.submitForm.values()) {
				console.log(value);
			}
		}

        	// mapped to 'Submit' button
		function submitObject() {

			pageScope.loadingStart();

			// call process API
			ImageSubmissionSubmitAPI.submit(vm.submitForm, function(data) {
				// check for API returned error
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					eiSearch();
				}
				pageScope.loadingEnd();
			}, function(err) {
				pageScope.handleError(vm, "Error submitting image.");
				pageScope.loadingEnd();
				setFocus();
			});
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
			vm.submitForm = new FormData();

			// rebuild empty apiDomain submission object, else bindings fail
			vm.apiDomain = {};
			vm.apiDomain.refsKey = "";	
			vm.apiDomain.jnumid = "";	
			vm.apiDomain.short_citation = "";

			resetOther()
		}

		// setting of mouse focus
		function setFocus () {
			var input = document.getElementById ("JNumID");
			input.focus ();
		}

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.eiSearch = eiSearch;
		$scope.eiClear = eiClear;
		$scope.jnumOnBlur = jnumOnBlur;
		$scope.submitObject = submitObject;
		$scope.fileNameChanged = fileNameChanged;

		// global shortcuts
		$scope.KclearAll = function() { $scope.eiClear(); $scope.$apply(); }
		$scope.Ksearch = function() { $scope.eiSearch(); $scope.$apply(); }

		var globalShortcuts = Mousetrap($document[0].body);
		globalShortcuts.bind(['ctrl+alt+c'], $scope.KclearAll);
		globalShortcuts.bind(['ctrl+alt+s'], $scope.Ksearch);

		// call to initialize the page, and start the ball rolling...
		init();
	}

})();

