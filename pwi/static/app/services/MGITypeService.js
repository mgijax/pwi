(function() {
	'use strict';
	angular.module('pwi.voc')
		.factory('MGITypeSearchAPI', MGITypeSearchAPI);

	function MGITypeSearchAPI($resource, API_PATH) {
		return $resource(API_PATH + 'mgitype/search', {}, {
			'search': { method: 'POST' }
		});
	}

})();
