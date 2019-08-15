(function() {
	'use strict';
	angular.module('pwi.validate')
		.factory('ValidateJnumAPI', ValidateJnumAPI)
		.factory('ValidateJnumImageAPI', ValidateJnumImageAPI)
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

})();
