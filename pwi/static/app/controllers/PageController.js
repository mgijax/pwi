(function() {
	'use strict';
	angular.module('pwi').controller('PageController', PageController);

	function PageController($scope, $http, $document, usSpinnerService) {
		$scope.usSpinnerService = usSpinnerService;

		// Broadcast all keyboard events so that
		// any child controllers can implement
		// them as needed
		$document.on("keydown", function(event) {
			$scope.$broadcast("keyboard" + event.key + "Key", event.keyCode);
			$scope.$apply(function() {});
		});

	}

})();
