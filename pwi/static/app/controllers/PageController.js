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

		$scope.loadingEnd = function() {
			$scope.usSpinnerService.stop('page-spinner');
			$scope.endtime = Date.now();
			$scope.loading = false;
		}
		

                /*
		 * Set error model on errors
		 */

                function setVisibleError(event, errorData) {
                        $scope.errors.api = errorData;
                }
                ErrorMessage.notifyErrorOn($scope, setVisibleError);


		// Note stuff

		// clearNote the note field
                $scope.clearNote = function(note) {

                        if (note != null) {

				// note type = accession id
                                if (note.accID != null) {
                                        note.processStatus = "d";
                                        note.accID = ""; 
					return;
                                }

				// note type = noteChunk
				if (note.noteChunk != null) {
                                        note.noteChunk = ""; 
					return;
                                }

				note = "";
                        }

                }

		// end Note stuff

		// Auto-Complete

		// search text in all places
		$scope.autocompleteAll = function(searchElement, searchList) {
                                searchElement.autocomplete({
                                	source: searchList,
                                	autoFocus: true
                                })
		}

		// search text starting at beginning only
		// found this at api.jqueryui.com/autocomplete
		$scope.autocompleteBeginning = function(searchElement, searchList) {
                                searchElement.autocomplete({
                                	source: function(request, response) { 
                                        	var matcher = new RegExp("^" + $.ui.autocomplete.escapeRegex(request.term), "i");
                                        	response($.grep(searchList, function(item) {
                                                	return matcher.test(item);
                                        	}));
                                	},
                                	autoFocus: true
                                })
		}

	}

})();
