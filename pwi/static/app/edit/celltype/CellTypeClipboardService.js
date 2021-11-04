(function() {
	'use strict';
	angular.module('pwi.gxd')
		.factory('TermSearchAPI', TermSearchAPIResource)
                .factory('MGISetGetBySeqNumAPI', MGISetGetBySeqNumAPIResource)
                .factory('MGISetMemberDeleteAPI', MGISetMemberDeleteAPIResource)
		.factory('EMAPADetailAPI', EMAPADetailAPIResource);


	function TermSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'term/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}
        function MGISetGetBySeqNumAPIResource($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'mgiset/getBySetUserBySeqNum', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }

        function MGISetMemberDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
                return $resource(JAVA_API_URL + 'mgisetmember/:key', {},
                        {'delete': { method: 'DELETE',
                         headers: { 'api_access_token': access_token, 'username': USERNAME }
                        }
                });
        }

	function EMAPADetailAPIResource($resource, API_PATH) {
		return $resource(API_PATH + 'EMAPA/detail/:id');
	}
	
	

})();
