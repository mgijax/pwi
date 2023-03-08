(function() {
	'use strict';
	angular.module('pwi.mgi')
		.factory('UserLoggedInAPI', UserLoggedInAPI);

	function UserLoggedInAPI($resource, PWI_BASE_URL) {
		return $resource(PWI_BASE_URL + 'loggedin');
	}


})();
