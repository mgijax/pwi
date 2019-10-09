(function() {
	'use strict';
	angular.module('pwi.voc')
		.factory('VocTermSearchAPI', VocTermSearchAPI)
		.factory('VocTermEMAPSSearchAPI', VocTermEMAPSSearchAPI)
		.factory('ValidateTermAPI', ValidateTermAPI)
		.factory('NoteTypeSearchAPI', NoteTypeSearchAPI)
		;

   function VocTermSearchAPI($resource, JAVA_API_URL) {
      return $resource(JAVA_API_URL + 'vocab/search', {}, {
	 'search': { method: 'POST' }
      });
   }

   function VocTermEMAPSSearchAPI($resource, API_PATH) {
      return $resource(API_PATH + 'vocterm/emaps/search', {}, {
         'search': { method: 'POST' }
      });
   }

   function ValidateTermAPI($resource, JAVA_API_URL) {
      return $resource(JAVA_API_URL + 'term/validateTerm', {}, {
      	'search': { method: 'POST', isArray: true }
      });
   }

   function NoteTypeSearchAPI($resource, JAVA_API_URL) {
      return $resource(JAVA_API_URL + 'noteType/search', {}, {
	 'search': { method: 'POST' }
      });
   }

})();
