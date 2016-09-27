(function() {
	'use strict';
	angular.module('pwi.mgi')
		.factory('UserLoggedInAPI', UserLoggedInAPI)
		.factory('UserAPI', UserAPI);

	function UserAPI($resource) {
		return $resource('/pwi/api/user');
	}
	function UserLoggedInAPI($resource) {
		return $resource('/pwi/api/user/loggedin');
	}


})();
