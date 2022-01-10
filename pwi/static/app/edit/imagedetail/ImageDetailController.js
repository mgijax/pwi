(function() {
	'use strict';
	angular.module('pwi.imagedetail').controller('ImageDetailController', ImageDetailController);

	function ImageDetailController(
			// angular tools
			$document,
			$filter,
			$http,  
			$q,
			$scope, 
			$timeout,
			$window, 
			// assay purpose utilities
			ErrorMessage,
			FindElement,
			Focus,
                        NoteTagConverter,
			// resource APIs
			ImageSearchAPI,
			ImageGetAPI,
			ImageSearchAssayAPI,
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

			ImageSearchAPI.search(vm.apiDomain, function(data) {
			        if (data.length > 0) {
				        loadObject(data[0].imageKey);
			        }
		                pageScope.loadingEnd();
		        }, function(err) {
			        pageScope.handleError(vm, "API ERROR: ImageSearchAPI.search");
		                pageScope.loadingEnd();
		        });
		}		

		// load object by imageKey
		function loadObject(imageKey) {
			console.log("loadObject():" + imageKey);

			ImageGetAPI.get({key: imageKey}, function(data) {
				vm.apiDomain = data;
                                searchAssays(vm.apiDomain.imageKey);
                                vm.apiDomain.copyrightNote.noteChunk = $scope.ntc.convert(vm.apiDomain.copyrightNote.noteChunk);

                                if (vm.apiDomain.nonEditAccessionIds != null) {
                                        if (vm.apiDomain.nonEditAccessionIds[0].logicaldb == "GenePaint") {
                                                vm.apiDomain.nonEditAccessionIds[0].otherHtml = "http://www.genepaint.org/cgi-bin/mgrqcgi94?APPNAME=genepaint&PRGNAME=analysis_viewer&ARGUMENTS=-AQ76649667431800,-ADA,-A82,-Asetstart,-A1"
                                        }
                                        if (vm.apiDomain.nonEditAccessionIds[0].logicaldb == "GUDMAP") {
                                                vm.apiDomain.nonEditAccessionIds[0].otherHtml = "http://www.gudmap.org/gudmap/pages/ish_submission.html?id=" + vm.apiDomain.nonEditAccessionIds[0].accID
                                        }
                                }

			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ImageGetAPI.get");
			});
		}	

		// search assays by image key
		function searchAssays(imageKey) {				
			console.log("searchAssays():" + imageKey);
		
			ImageSearchAssayAPI.search(vm.apiDomain.imageKey, function(data) {
                                vm.apiDomain.assayData = [];
			        if (data.length > 0) {
                                        vm.apiDomain.assayData = data;
			        }
		        }, function(err) {
			        pageScope.handleError(vm, "API ERROR: ImageSearchAssayAPI.searchAssays");
		        });
		}		

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
	}

})();

