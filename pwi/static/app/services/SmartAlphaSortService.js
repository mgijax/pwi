(function() {
	'use strict';
	angular.module('pwi.mgi')
		.factory('SmartAlphaSort', SmartAlphaSortService);

	function SmartAlphaSortService() {
            function makeKey (str) {
                const regexp = /([0-9]+)|([a-zA-Z_]+)/g;
                const array = [...str.matchAll(regexp)]
                return array.map(m => {
                    return m[0].match(/\d/) ? parseInt(m[0]) : m[0]
                });
            }

            function compare (str1, str2) {
                const k1 = makeKey(str1)
                const k2 = makeKey(str2)
                const minLen = Math.min(k1.length, k2.length)
                const shorter = minLen === k1.length ? 1 : 2
                for (let i = 0; i < minLen; i++) {
                    if (k1[i] < k2[i]) return -1
                    if (k1[i] > k2[i]) return 1
                }
                if (k1.length < k2.length) return -1
                if (k2.length > k2.length) return 1
                return 0
            }

            // sorts a list using smart alpha comparisons. 
            // Args:
            //   list - a list of items to be sorted
            //   accessor - how to access the sort key for each item. Accessor may be:
            //       1. null/undefined : each list item is the value to be sorted. (i.e., list is a list of strings)
            //       2. a string : each list item is an object, and the string specifies the field to use
            //       3. a number : each list item is an Array, and the number indicates which element to use
            //       4. a function : an arbitrary function which takes a list item and returns a string
            //
            function sort (list, accessor) {
                let keyFcn = x => x // identity function
                if (typeof(accessor) === "string") {
                    keyFcn = x => x[accessor]
                }
                else if (typeof(accessor) === "function") {
                    keyFcn = accessor
                }
                else if (typeof(accessor) === "number") {
                    keyFcn = x => x[accessor]
                }
                list.sort((a,b) => {
                    const k1 = keyFcn(a)
                    const k2 = keyFcn(b)
                    return compare(k1, k2)
                })
                return list
            }

            return {
                makeKey,
                compare,
                sort
            }
	}


})();
