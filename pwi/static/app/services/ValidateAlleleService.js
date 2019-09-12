(function() {
	'use strict';
	angular.module('pwi.validate')
		.factory('ValidateAlleleAPI', ValidateAlleleAPI)
		;

        function ValidateAlleleAPI($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'allele/validateAllele', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }

})();
