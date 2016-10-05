(function() {
	'use strict';
	angular.module('sortFilter', ['naturalSortService'])
		.filter('sortFilter',function(naturalSortService) {
			return function(array, predicteObject, reverse) {
				var neg = "";
				if(reverse) {
					neg = "-";
				}
				array.sort(naturalSortService.naturalSort(neg + predicteObject));
				return array;
		}});
})();
