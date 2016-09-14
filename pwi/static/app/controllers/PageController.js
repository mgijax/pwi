(function() {
	'use strict';
	angular.module('pwi').controller('PageController', PageController);

	function PageController($scope, $http, $document, usSpinnerService, UserLoggedInAPI) {
		$scope.usSpinnerService = usSpinnerService;
		$scope.current_user = null;

		UserLoggedInAPI.get(function(data) {
			$scope.current_user = data;
		}, function(err) {
			$scope.current_user = null;
		});

		$scope.pageModifyDisabled = function() {
			return !$scope.current_user.login;
		}

	}

})();
