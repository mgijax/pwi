(function() {
	'use strict';
	angular.module('pwi.voc')
		.factory('MGITypeSearchAPI', MGITypeSearchAPI);

	function MGITypeSearchAPI($resource, JAVA_API_PATH) {
		return $resource(JAVA_API_PATH + 'mgitype/search', {}, {
			'search': { method: 'POST' }
		});
	}

})();
