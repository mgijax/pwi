(function() {
	'use strict';
	
	// Custom date format filter
	angular.module('pwi')
		.filter('mgiDate', function($filter) {
		  var angularDateFilter = $filter('date');
		  return function(input) {
			  if (input) {
				  input = input.replace(" ", "T");
			  }
			  return angularDateFilter(new Date(input), "MM/dd/yyyy");
		  };
		});

})();
