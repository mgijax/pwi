(function() {
	'use strict';
	angular.module('pwi').controller('PageController', PageController);

	function PageController(
			$scope,
			$http, 
			$document, 
			usSpinnerService, 
			UserLoggedInAPI,
			ErrorMessage,
			ValidateJnumAPI,
			ValidateJnumImageAPI,
			PWI_BASE_URL,
			PDFVIEWER_URL,
			PIXDB_URL,
			PRISM_URL,
			WEBSHARE_URL
	) {
		$scope.usSpinnerService = usSpinnerService;
		$scope.current_user = null;
		$scope.errors = {};
		$scope.loading = false;
		$scope.starttime = 0;
		$scope.endtime = 0;
		$scope.PWI_BASE_URL = PWI_BASE_URL;
		$scope.PDFVIEWER_URL = PDFVIEWER_URL;
		$scope.PIXDB_URL = PIXDB_URL;
		$scope.PRISM_URL = PRISM_URL;
		$scope.WEBSHARE_URL = WEBSHARE_URL;

		UserLoggedInAPI.get(function(data) {
			$scope.current_user = data;
		}, function(err) {
			$scope.current_user = null;
		});

                $scope.handleError = function(vm, msg) {
                        vm.errorMsg = msg;
                        vm.hideErrorContents = false;
                        vm.hideLoadingHeader = true;
                }

		$scope.pageModifyDisabled = function() {
			return $scope.current_user == null || !$scope.current_user.login || $scope.loading;
		}

		$scope.loadingStart = function() {
			$scope.loading = true;
			$scope.starttime = Date.now();
			$scope.usSpinnerService.spin('page-spinner');
		}

		$scope.isLoading = function() {
			return $scope.loading;
		}

		$scope.loadingFinished = function() {
			$scope.usSpinnerService.stop('page-spinner');
			$scope.endtime = Date.now();
			$scope.loading = false;
		}
		
		//
		// Validation functions
		//

        	// validate jnum
		// 
		// will set these vm fields:
		// 	vm:
		// 		needsDXDOIid
		// 		displayCreativeCommentsWarning
		//
		// 	vm.refObject:
		// 		jnumid
		// 		jnumid
		// 		short_citation
		// 		copyrightNote
		//
		$scope.validateJnumImage = function(vm, refObject) {		
			$scope.validateJnum(vm, refObject, 2);
		}

		$scope.validateJnum = function(vm, refObject, mode=1) {		
			console.log("validateJnumImage(): begin");

			var validate = true;

			if (refObject.jnumid == "")
			{
				validate = false;
			}
			if (refObject.jnumid.includes("%"))
			{
				validate = false;
			}

			// create local JSON package for validation submission
			var jsonPackage = {"jnumid":"", "copyright":""}; 
			jsonPackage.jnumid = refObject.jnumid;

		    	if (refObject.copyrightNote != null) {
		    		jsonPackage.copyright = refObject.copyrightNote.noteChunk;
		    	} else {
		          	jsonPackage.copyright = "";
		    	}

			// validate against DB
			if (validate) {

                        	var input = document.getElementById ("JNumID");

				// image mode includes copyright/DXDOI/creative commons
				if (mode == 2) {
					ValidateJnumImageAPI.validate(jsonPackage, function(data) {
						if (data.length == 0) {
							alert("Invalid Reference: " + refObject.jnumid);
                                        		refObject.refsKey = ""; 
                                        		refObject.jnumid = ""; 
                                        		refObject.short_citation = ""; 
                        				if (refObject.copyrightNote == null) {
                                				refObject.copyrightNote = {}; 
                                				refObject.copyrightNote.noteKey = ""; 
                                				refObject.copyrightNote.noteChunk = "";    
                        				}
                        				else {
                                				refObject.copyrightNote.noteKey = ""; 
                        				}
                        				input.focus();
						} else {
							console.log("validateJnumImage(): successful");
							refObject.refsKey = data[0].refsKey;
							refObject.jnumid = data[0].jnumid;
							if (data[0].short_citation != null) {
								refObject.short_citation = data[0].short_citation;
							}
							if (data[0].copyright != null) {
								if (refObject.copyrightNote == null) {
									refObject.copyrightNote = {};
								}
								refObject.copyrightNote.noteChunk = data[0].copyright;
							}
							vm.needsDXDOIid = data[0].needsDXDOIid;
							vm.displayCreativeCommonsWarning = data[0].isCreativeCommons;
					}
						vm.hideErrorContents = true;

					}, function(err) {
						handleError(vm, "Invalid Reference");
                                        	refObject.refsKey = ""; 
                                        	refObject.jnumid = ""; 
                                        	refObject.short_citation = ""; 
                        			if (refObject.copyrightNote == null) {
                                			refObject.copyrightNote = {}; 
                                			refObject.copyrightNote.noteKey = ""; 
                                			refObject.copyrightNote.noteChunk = "";    
                        			}
                        			else {
                                			refObject.copyrightNote.noteKey = ""; 
                        			}
                        			input.focus();
					});
				}

				// mode = 1
				else {
					ValidateJnumAPI.validate(jsonPackage, function(data) {
						if (data.length == 0) {
							alert("Invalid Reference: " + refObject.jnumid);
                                        		refObject.refsKey = ""; 
                                        		refObject.jnumid = ""; 
                                        		refObject.short_citation = ""; 
                        				input.focus();
						} else {
							console.log("validateJnumImage(): successful");
							refObject.refsKey = data[0].refsKey;
							refObject.jnumid = data[0].jnumid;
							if (data[0].short_citation != null) {
								refObject.short_citation = data[0].short_citation;
							}
					}
						vm.hideErrorContents = true;

					}, function(err) {
						handleError(vm, "Invalid Reference");
                                        	refObject.refsKey = ""; 
                                        	refObject.jnumid = ""; 
                                        	refObject.short_citation = ""; 
                        			input.focus();
					});
				}
			}
		}		

	}

})();
