(function() {
	'use strict';
	angular.module('pwi.voc')
		.factory('VocTermSearchAPI', VocTermSearchAPI)
		.factory('VocTermEMAPSSearchAPI', VocTermEMAPSSearchAPI);

	function VocTermSearchAPI($resource, JAVA_API_PATH) {
		return $resource(JAVA_API_PATH + 'term/search', {}, {
			'search': { method: 'POST' }
		});
	}
   function VocTermEMAPSSearchAPI($resource, API_PATH) {
      return $resource(API_PATH + 'vocterm/emaps/search', {}, {
         'search': { method: 'POST' }
      });
   }

})();
