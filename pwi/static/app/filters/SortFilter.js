(function() {
	'use strict';
	angular.module('sortFilter', ['naturalSortService'])
		.filter('sortFilter',function(naturalSortService) {
			return function(array, predicteObject, reverse) {
				var neg = "";
				if(reverse) {
					neg = "-";
				}
				if(predicteObject != "name") {
					if("raw_sample" in array[0] && array[0].raw_sample && predicteObject in array[0].raw_sample) {
						array.sort(naturalSortService.naturalSort2("raw_sample", neg + predicteObject));
						return array;
					}
					if("sample_domain" in array[0] && array[0].sample_domain && predicteObject in array[0].sample_domain) {
						array.sort(naturalSortService.naturalSort2("sample_domain", neg + predicteObject));
						return array;
					}
				}
				array.sort(naturalSortService.naturalSort(neg + predicteObject));
				return array;
		}});
})();
