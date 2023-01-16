(function() {
	'use strict';
	angular.module('pwi.mgi')
		.factory('UrlParser', UrlParsingService);

        /*
         * Utility functions for parsing portions of a URL.
         * Currently limited to parsing the search string part of a URL.
         * If additional URL parsing services are needed, add them here.
         */
	function UrlParsingService() {
            /*
             * Parses the search string portion of a URL.
             * If no argument given, uses document.location.search.
             * Otherwise provide a URL query string (excluding the '?')
             * Returns an object
             */
            function parseSearchString (s) {
                s = s || document.location.search.split('?')[1] || ""
                if (!s) return {}
                return s.split('&').reduce((a,arg) => {
                    const i = arg.indexOf('=')
                    if (i === -1) {
                        a[arg] = undefined
                    } else {
                        const n = decodeURIComponent(arg.slice(0, i))
                        const v = decodeURIComponent(arg.slice(i+1))
                        a[n] = v
                    }
                    return a
                }, {})
            }

            return {
                parseSearchString
            }
	}
})();
