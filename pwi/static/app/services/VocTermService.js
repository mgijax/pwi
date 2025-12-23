(function() {
	'use strict';
	angular.module('pwi.voc')
		.factory('ChromosomeSearchAPI', ChromosomeSearchAPI)
		.factory('NoteTypeSearchAPI', NoteTypeSearchAPI)
		.factory('ReferenceAssocTypeSearchAPI', ReferenceAssocTypeSearchAPI)
		.factory('SynonymTypeSearchAPI', SynonymTypeSearchAPI)
		.factory('OrganismSearchAPI', OrganismSearchAPI)
		.factory('OrganismSearchDriverGeneAPI', OrganismSearchDriverGeneAPI)
		.factory('OrganismSearchMarkerAPI', OrganismSearchMarkerAPI)
		.factory('OrganismSearchProbeAPI', OrganismSearchProbeAPI)
		.factory('OrganismSearchRelationshipAPI', OrganismSearchRelationshipAPI)
		.factory('ValidateTermAPI', ValidateTermAPI)
		.factory('ValidateTermSlimAPI', ValidateTermSlimAPI)
		.factory('ValidateMPHeaderAPI', ValidateMPHeaderAPI)
		.factory('VocTermGetByAccidAPI', VocTermGetByAccidAPI)
		.factory('VocTermSearchAPI', VocTermSearchAPI)
		.factory('VocTermListAPI', VocTermListAPI)
		.factory('StrainListAPI', StrainListAPI)
		.factory('StrainListProbeAntibodyAPI', StrainListProbeAntibodyAPI)
		.factory('TissueListAPI', TissueListAPI)
		.factory('LibrarySearchAPI', LibrarySearchAPI)
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

   function OrganismSearchDriverGeneAPI($resource, JAVA_API_URL) {
      return $resource(JAVA_API_URL + 'organism/searchDriverGene', {}, {
	 'search': { method: 'POST', isArray: true }
      });
   }

   function OrganismSearchMarkerAPI($resource, JAVA_API_URL) {
      return $resource(JAVA_API_URL + 'organism/searchMarker', {}, {
	 'search': { method: 'POST', isArray: true }
      });
   }

   function OrganismSearchProbeAPI($resource, JAVA_API_URL) {
      return $resource(JAVA_API_URL + 'organism/searchProbe', {}, {
	 'search': { method: 'POST', isArray: true }
      });
   }

   function OrganismSearchRelationshipAPI($resource, JAVA_API_URL) {
      return $resource(JAVA_API_URL + 'organism/searchAlleleRelationship', {}, {
	 'search': { method: 'POST', isArray: true }
      });
   }

   function ValidateTermAPI($resource, JAVA_API_URL) {
      return $resource(JAVA_API_URL + 'term/validateTerm', {}, {
      	'search': { method: 'POST', isArray: true }
      });
   }

   function ValidateTermSlimAPI($resource, JAVA_API_URL) {
      return $resource(JAVA_API_URL + 'term/validateTermSlim', {}, {
      	'search': { method: 'POST', isArray: true }
      });
   }

   function ValidateMPHeaderAPI($resource, JAVA_API_URL) {
      return $resource(JAVA_API_URL + 'term/validateMPHeaderTerm', {}, {
      	'search': { method: 'POST', isArray: true }
      });
   }

   function VocTermGetByAccidAPI($resource, JAVA_API_URL) {
      return $resource(JAVA_API_URL + 'term/getByAccid/:accid', {}, {
         'get': { method: 'GET', isArray: false }
      });
   }

   function VocTermSearchAPI($resource, JAVA_API_URL) {
      return $resource(JAVA_API_URL + 'vocab/search', {}, {
	 'search': { method: 'POST' }
      });
   }

   function VocTermListAPI($resource, JAVA_API_URL) {
      return $resource(JAVA_API_URL + 'vocab/getVocabList', {}, {
	 'search': { method: 'POST' }
      });
   }

   function StrainListAPI($resource, JAVA_API_URL) {
       return $resource(JAVA_API_URL + 'strain/getStrainList', {}, {} );
   }

   function StrainListProbeAntibodyAPI($resource, JAVA_API_URL) {
       return $resource(JAVA_API_URL + 'strain/getStrainListProbeAntibody', {}, {} );
   }

   function TissueListAPI($resource, JAVA_API_URL) {
       return $resource(JAVA_API_URL + 'tissue/getTissueList', {}, {} );
   }

   function LibrarySearchAPI($resource, JAVA_API_URL) {
       return $resource(JAVA_API_URL + 'source/searchLibrarySet', {}, {
           'search': { method: 'POST', isArray: true }
       });
   }

})();

