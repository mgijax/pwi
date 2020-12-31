(function() {
	'use strict';
	angular.module('pwi.mgi')
		.factory('MGISetGetAPI', MGISetGetAPI)
		.factory('MGISetUpdateAPI', MGISetUpdateAPI)
		;

	// get clipboard members
	function MGISetGetAPI($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'mgiset/getBySetUser', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// update clipboard for user
	function MGISetUpdateAPI($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'mgiset', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

})();
