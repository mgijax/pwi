(function() {
	'use strict';
	
	// HACK:
	// Fix boolean to string conversion in angualar directives
	angular.module('pwi')
		.directive('convertToBoolean', function() {
		  return {
		    require: 'ngModel',
		    link: function(scope, element, attrs, ngModel) {
		      ngModel.$parsers.push(function(val) {
		    	  if (val == "true") {
		    		  return true;
		    	  } else if(val =="false") {
		    		  return false;
		    	  }
		    	  return null;
		      });
		      ngModel.$formatters.push(function(val) {
		        return val ? '' + val : null;
		      });
		    }
		  };
		});

})();
