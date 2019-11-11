(function() {
	'use strict';
	angular.module('pwi.voc')
		.factory('ChromosomeSearchAPI', ChromosomeSearchAPI)
		.factory('NoteTypeSearchAPI', NoteTypeSearchAPI)
		.factory('ReferenceAssocTypeSearchAPI', ReferenceAssocTypeSearchAPI)
		.factory('SynonymTypeSearchAPI', SynonymTypeSearchAPI)
		.factory('ValidateTermAPI', ValidateTermAPI)
		.factory('VocTermEMAPSSearchAPI', VocTermEMAPSSearchAPI)
		.factory('VocTermSearchAPI', VocTermSearchAPI)
		;

   function ChromosomeSearchAPI($resource, JAVA_API_URL) {
      return $resource(JAVA_API_URL + 'markerChromosome/search', {}, {
	 'search': { method: 'POST', isArray: true }
      });
   }

   function NoteTypeSearchAPI($resource, JAVA_API_URL) {
      return $resource(JAVA_API_URL + 'noteType/search', {}, {
	 'search': { method: 'POST' }
      });
   }

   function ReferenceAssocTypeSearchAPI($resource, JAVA_API_URL) {
      return $resource(JAVA_API_URL + 'mgiRefAssocType/search', {}, {
	 'search': { method: 'POST' }
      });
   }

   function SynonymTypeSearchAPI($resource, JAVA_API_URL) {
      return $resource(JAVA_API_URL + 'mgiSynonymType/search', {}, {
	 'search': { method: 'POST', isArray: true }
      });
   }

   function ValidateTermAPI($resource, JAVA_API_URL) {
      return $resource(JAVA_API_URL + 'term/validateTerm', {}, {
      	'search': { method: 'POST', isArray: true }
      });
   }

   function VocTermEMAPSSearchAPI($resource, API_PATH) {
      return $resource(API_PATH + 'vocterm/emaps/search', {}, {
         'search': { method: 'POST' }
      });
   }

   function VocTermSearchAPI($resource, JAVA_API_URL) {
      return $resource(JAVA_API_URL + 'vocab/search', {}, {
	 'search': { method: 'POST' }
      });
   }

})();
