(function() {
	'use strict';
	angular.module('pwi').controller('PageController', PageController);

	function PageController($scope, $http, $document, usSpinnerService) {
		$scope.usSpinnerService = usSpinnerService;

	}

})();
