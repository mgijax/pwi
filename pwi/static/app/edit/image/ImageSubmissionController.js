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
				vm.submitForm = new FormData();
				pageScope.loadingFinished();

			}, function(err) { // server exception
				pageScope.handleError(vm, "Error while searching");
				pageScope.loadingFinished();
				setFocus();
			});
		}		

		// fill in the form
		function fileNameChanged(file) {
			vm.submitForm.append("imageKey_" + file.id, file.id);
			vm.submitForm.append("file_" + file.id, file.files[0]);
			vm.submitForm.append("name_" + file.id, file.value);
			vm.submitForm.append("jnumid", vm.objectData.jnumid);

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
				pageScope.loadingFinished();
			}, function(err) {
				pageScope.handleError(vm, "Error submitting image.");
				pageScope.loadingFinished();
				setFocus();
			});
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
					pageScope.handleError(vm, "Invalid Reference");
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
			vm.submitForm = new FormData();

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

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.eiSearch = eiSearch;
		$scope.eiClear = eiClear;
		$scope.submitObject = submitObject;
		$scope.fileNameChanged = fileNameChanged;

		// other functions: buttons, onBlurs and onChanges
		$scope.jnumOnBlur = jnumOnBlur;
		
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
