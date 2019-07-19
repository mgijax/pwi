(function() {
	'use strict';
	angular.module('pwi').controller('PageController', PageController);

	function PageController(
			$scope,
			$http, 
			$document, 
			usSpinnerService, 
			ErrorMessage,
			UserLoggedInAPI,
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
			//console.log("Spinner Time: " + ($scope.endtime - $scope.starttime));
			$scope.loading = false;
		}
		
		/*
		 * Set error model on errors
		 */
		function setVisibleError(event, errorData) {
			$scope.errors.api = errorData;
		}
		ErrorMessage.notifyErrorOn($scope, setVisibleError);


	}

})();
