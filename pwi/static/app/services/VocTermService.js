(function() {
	'use strict';
	angular.module('pwi.voc')
		.factory('VocTermSearchAPI', VocTermSearchAPI);

	function VocTermSearchAPI($resource, API_PATH) {
		return $resource(API_PATH + 'vocterm/search', {}, {
			'search': { method: 'POST' }
		});
	}

})();
