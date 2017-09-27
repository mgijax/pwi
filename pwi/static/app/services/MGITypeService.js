(function() {
	'use strict';
	angular.module('pwi.voc')
		.factory('MGITypeSearchAPI', MGITypeSearchAPI);

	function MGITypeSearchAPI($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'mgitype/search', {}, {
			'search': { method: 'POST' }
		});
	}

})();
