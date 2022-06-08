(function() {
	'use strict';
	angular.module('pwi.validate')
		.factory('ValidateJnumAPI', ValidateJnumAPI)
		.factory('ValidateJnumImageAPI', ValidateJnumImageAPI)
		.factory('ValidateJnumGxdIndexAPI', ValidateJnumGxdIndexAPI)
		;

        function ValidateJnumAPI($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'reference/validJnum/:jnum', {}, {
                        '': { method: 'JSONP', isArray: true } 
                });
        }

	function ValidateJnumImageAPI($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'reference/validateJnumImage', {}, {
			'validate': { method: 'POST', isArray: true }
		});
	}

        function ValidateJnumGxdIndexAPI($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'reference/validJnumGxdIndex/:jnum', {}, {
                        '': { method: 'JSONP', isArray: true } 
                });
        }

})();
