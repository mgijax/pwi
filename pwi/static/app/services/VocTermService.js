(function() {
	'use strict';
	angular.module('pwi.voc')
		.factory('VocTermSearchAPI', VocTermSearchAPI);

	function VocTermSearchAPI($resource) {
		return $resource('/pwi/api/vocterm/search', {}, {
			'search': { method: 'POST' }
		});
	}

})();
