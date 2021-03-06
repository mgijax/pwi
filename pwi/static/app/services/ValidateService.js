(function() {
	'use strict';
	angular.module('pwi.validate')
		.factory('ValidateAlleleAPI', ValidateAlleleAPI)
 		.factory('ValidateAlleleAnyStatusAPI', ValidateAlleleAnyStatusAPI)
		.factory('ValidateDerivationAPI', ValidateDerivationAPI)
		.factory('ValidateImagePaneAPI', ValidateImagePaneAPI)
		.factory('ValidateMarkerAPI', ValidateMarkerAPI)
		.factory('ValidateMarkerAnyStatusAPI', ValidateMarkerAnyStatusAPI)
		.factory('ValidateMarkerOfficialStatusAPI', ValidateMarkerOfficialStatusAPI)
 		.factory('ValidateMutantCellLineAPI', ValidateMutantCellLineAPI)
 		.factory('ValidateParentCellLineAPI', ValidateParentCellLineAPI)
		.factory('ValidateStrainAPI', ValidateStrainAPI)
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

        function ValidateDerivationAPI($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'allelecelllinederivation/validateDerivation', {}, {
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

})();
