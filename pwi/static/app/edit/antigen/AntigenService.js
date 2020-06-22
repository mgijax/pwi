(function() {
	'use strict';
	angular.module('pwi.antigen')
		.factory('AntigenSearchAPI',		AntigenSearchAPIResource)
		.factory('AntigenGetAPI',		AntigenGetAPIResource)
		.factory('AntigenUpdateAPI',		AntigenUpdateAPIResource)
                .factory('AntigenDeleteAPI',            AntigenDeleteAPIResource)
		.factory('AntigenTotalCountAPI',	AntigenTotalCountAPIResource)
                .factory('OrganismSearchAPI',           OrganismSearchAPIResource)
                .factory('ValidateTermSlimAPI',         ValidateTermSlimAPIResource)
                .factory('TissueSearchAPI',             TissueSearchAPIResource)
		;

	// object summary search
	function AntigenSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'antigen/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function AntigenGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'antigen/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// object modification
	function AntigenUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'antigen', {},
				{'update': { method: 'PUT', 
				 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	

        function AntigenDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
                return $resource(JAVA_API_URL + 'antigen/:key', {},
                        {'delete': { method: 'DELETE',
                         headers: { 'api_access_token': access_token, 'username': USERNAME }
                        }
                });
        }

	// total number of records
	function AntigenTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'antigen/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}

        // all organisms
        function OrganismSearchAPIResource($resource, JAVA_API_URL) {
                 return $resource(JAVA_API_URL + 'organism/search', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }
        // used for cell line vocab validation
        function ValidateTermSlimAPIResource($resource, JAVA_API_URL) {
              return $resource(JAVA_API_URL + 'term/validateTermSlim', {}, {
                        'validate': { method: 'POST'}
                });
        }
        
        //
        function TissueSearchAPIResource($resource, JAVA_API_URL) {
                 return $resource(JAVA_API_URL + 'tissue/search', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }
	
})();

