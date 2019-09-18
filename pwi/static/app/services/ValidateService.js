(function() {
	'use strict';
	angular.module('pwi.validate')
		.factory('ValidateAlleleAPI', ValidateAlleleAPI)
		.factory('ValidateMarkerAPI', ValidateMarkerAPI)
		.factory('ValidateStrainAPI', ValidateStrainAPI)
		;

        function ValidateAlleleAPI($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'allele/validateAllele', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }

        //function ValidateMarkerAPI($resource, JAVA_API_URL) {
        //        return $resource(JAVA_API_URL + 'marker/validateOfficialStatus/:symbol', {}, {
        //                '': { method: 'JSONP', isArray: true } 
        //        });
       // }

        function ValidateMarkerAPI($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'marker/validateMarker', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }

        function ValidateStrainAPI($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'strain/validateStrain', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }

})();
