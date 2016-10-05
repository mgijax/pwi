(function() {
	'use strict';
	angular.module('pwi.mgi')
		.factory('UserLoggedInAPI', UserLoggedInAPI)
		.factory('UserAPI', UserAPI);

	function UserAPI($resource, API_PATH) {
		return $resource(API_PATH + 'user');
	}
	function UserLoggedInAPI($resource, API_PATH) {
		return $resource(API_PATH + 'user/loggedin');
	}


})();
