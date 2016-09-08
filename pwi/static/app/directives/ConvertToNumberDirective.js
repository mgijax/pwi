(function() {
	'use strict';
	
	// HACK:
	// Fix number to string conversion in angualar directives
	angular.module('pwi')
		.directive('convertToNumber', function() {
		  return {
		    require: 'ngModel',
		    link: function(scope, element, attrs, ngModel) {
		      ngModel.$parsers.push(function(val) {
		        return val ? parseInt(val, 10) : null;
		      });
		      ngModel.$formatters.push(function(val) {
		        return val ? '' + val : null;
		      });
		    }
		  };
		});

})();
