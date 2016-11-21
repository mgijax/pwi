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
			PWI_BASE_URL
	) {
		$scope.usSpinnerService = usSpinnerService;
		$scope.current_user = null;
		$scope.errors = {};
		$scope.loading = false;
		$scope.PWI_BASE_URL = PWI_BASE_URL;

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
			$scope.usSpinnerService.spin('page-spinner');
		}

		$scope.isLoading = function() {
			return $scope.loading;
		}

		$scope.loadingFinished = function() {
			$scope.usSpinnerService.stop('page-spinner');
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
