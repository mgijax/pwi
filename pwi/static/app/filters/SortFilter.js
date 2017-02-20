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
					for(var i in array) {
						if("raw_sample" in array[i] && array[i].raw_sample && predicteObject in array[i].raw_sample) {
							array.sort(naturalSortService.naturalSort2("raw_sample", neg + predicteObject));
							return array;
						}
					}
					for(var i in array) {
						if("sample_domain" in array[i] && array[i].sample_domain && predicteObject in array[i].sample_domain) {
							array.sort(naturalSortService.naturalSort2("sample_domain", neg + predicteObject));
							return array;
						}
					}
					console.log(predicteObject + " not found in raw_sample fields or sample_domain fields");
				}
				array.sort(naturalSortService.naturalSort(neg + predicteObject));
				return array;
		}});
})();
