(function() {
	'use strict';
	
	// Custom date format filter
	angular.module('pwi')
		.filter("rawHtml", ['$sce', function($sce) {
		  return function(htmlCode){
		    return $sce.trustAsHtml(htmlCode);
		  }
		}]);

})();
