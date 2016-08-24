(function() {
   'use strict';
   angular.module('pwi').controller('PageController', PageController);

   function PageController($scope, $http, usSpinnerService) {
		// Implement Keyboard handlers here
		$scope.usSpinnerService = usSpinnerService;


	}

})();
