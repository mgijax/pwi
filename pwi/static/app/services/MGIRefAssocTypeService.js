(function() {
	'use strict';
	angular.module('pwi.voc')
		.factory('MGIRefAssocTypeSearchAPI', MGIRefAssocTypeSearchAPI);

   function MGIRefAssocTypeSearchAPI($resource, JAVA_API_URL) {
      return $resource(JAVA_API_URL + 'mgiRefAssocType/search', {}, {
         'search': { method: 'POST' }
      }); 
   } 

})();
