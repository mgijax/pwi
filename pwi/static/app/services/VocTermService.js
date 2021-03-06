(function() {
	'use strict';
	angular.module('pwi.voc')
		.factory('ChromosomeSearchAPI', ChromosomeSearchAPI)
		.factory('NoteTypeSearchAPI', NoteTypeSearchAPI)
		.factory('ReferenceAssocTypeSearchAPI', ReferenceAssocTypeSearchAPI)
		.factory('SynonymTypeSearchAPI', SynonymTypeSearchAPI)
		.factory('OrganismSearchAPI', OrganismSearchAPI)
		.factory('OrganismSearchMarkerAPI', OrganismSearchMarkerAPI)
		.factory('OrganismSearchDriverGeneAPI', OrganismSearchDriverGeneAPI)
		.factory('ValidateTermAPI', ValidateTermAPI)
		.factory('ValidateMPHeaderAPI', ValidateMPHeaderAPI)
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

   function OrganismSearchAPI($resource, JAVA_API_URL) {
      return $resource(JAVA_API_URL + 'organism/search', {}, {
	 'search': { method: 'POST', isArray: true }
      });
   }

   function OrganismSearchMarkerAPI($resource, JAVA_API_URL) {
      return $resource(JAVA_API_URL + 'organism/searchMarker', {}, {
	 'search': { method: 'POST', isArray: true }
      });
   }

   function OrganismSearchDriverGeneAPI($resource, JAVA_API_URL) {
      return $resource(JAVA_API_URL + 'organism/searchDriverGene', {}, {
	 'search': { method: 'POST', isArray: true }
      });
   }

   function ValidateTermAPI($resource, JAVA_API_URL) {
      return $resource(JAVA_API_URL + 'term/validateTerm', {}, {
      	'search': { method: 'POST', isArray: true }
      });
   }

   function ValidateMPHeaderAPI($resource, JAVA_API_URL) {
      return $resource(JAVA_API_URL + 'term/validateMPHeaderTerm', {}, {
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
