(function() {
	'use strict';
	angular.module('pwi.validate')
		.factory('ValidateAlleleAPI', ValidateAlleleAPI)
 		.factory('ValidateAlleleAnyStatusAPI', ValidateAlleleAnyStatusAPI)
		.factory('ValidateAntibodyAPI', ValidateAntibodyAPI)
		.factory('ValidateDerivationAPI', ValidateDerivationAPI)
		.factory('ValidateGenotypeAPI', ValidateGenotypeAPI)
		.factory('ValidateImagePaneAPI', ValidateImagePaneAPI)
		.factory('ValidateMarkerAPI', ValidateMarkerAPI)
		.factory('ValidateMarkerAnyStatusAPI', ValidateMarkerAnyStatusAPI)
		.factory('ValidateMarkerOfficialStatusAPI', ValidateMarkerOfficialStatusAPI)
 		.factory('ValidateMutantCellLineAPI', ValidateMutantCellLineAPI)
 		.factory('ValidateParentCellLineAPI', ValidateParentCellLineAPI)
		.factory('ValidateStrainAPI', ValidateStrainAPI)
		.factory('ValidateTissueAPI', ValidateTissueAPI)
		.factory('ValidateProbeAPI', ValidateProbeAPI)
		.factory('ValidateProbeSourceAPI', ValidateProbeSourceAPI)
		;

        function ValidateAlleleAPI($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'allele/validateAllele', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }

        function ValidateAlleleAnyStatusAPI($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'allele/validateAlleleAnyStatus', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }

        function ValidateAntibodyAPI($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'antibody/validateAntibody', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }

        function ValidateDerivationAPI($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'allelecelllinederivation/validateDerivation', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }

        function ValidateGenotypeAPI($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'genotype/validateGenotype', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }

        function ValidateImagePaneAPI($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'imagepane/validateImagePane', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }


        function ValidateMarkerAPI($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'marker/validateMarker', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }

        function ValidateMarkerAnyStatusAPI($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'marker/validateAnyStatus/:symbol', {}, {
                        '': { method: 'JSONP', isArray: true } 
                });
        }

        function ValidateMarkerOfficialStatusAPI($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'marker/validateOfficialStatus/:symbol', {}, {
                        '': { method: 'JSONP', isArray: true } 
                });
        }

        function ValidateMutantCellLineAPI($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'cellline/validateMutantCellLine', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }

        function ValidateParentCellLineAPI($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'cellline/validateParentCellLine', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }

        function ValidateStrainAPI($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'strain/validateStrain', {}, {
                        'search': { method: 'POST', isArray: true }
                });

        }

        function ValidateTissueAPI($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'tissue/validateTissue', {}, {
                        'search': { method: 'POST', isArray: true }
                });

        }

        function ValidateProbeAPI($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'probe/validateProbe', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }

	function ValidateProbeSourceAPI($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'source/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

})();
