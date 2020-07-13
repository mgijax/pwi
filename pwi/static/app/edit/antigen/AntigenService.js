(function() {
	'use strict';
	angular.module('pwi.antigen')
		.factory('AntigenSearchAPI',		AntigenSearchAPIResource)
		.factory('AntigenGetAPI',		AntigenGetAPIResource)
                .factory('AntigenCreateAPI',            AntigenCreateAPIResource)
		.factory('AntigenUpdateAPI',		AntigenUpdateAPIResource)
                .factory('AntigenDeleteAPI',            AntigenDeleteAPIResource)
		.factory('AntigenTotalCountAPI',	AntigenTotalCountAPIResource)
                .factory('AntigenOrganismSearchAPI',    AntigenOrganismSearchAPIResource)
                .factory('ValidateTermSlimAPI',         ValidateTermSlimAPIResource)
                .factory('TissueSearchAPI',             TissueSearchAPIResource)
                .factory('TissueListAPI',               TissueListAPIResource)
                .factory('StrainListAPI',               StrainListAPIResource)
                .factory('AntibodySearchAPI',           AntibodySearchAPIResource)
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
        
        // object creation
        function AntigenCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
                return $resource(JAVA_API_URL + 'antigen', {},
                                {'create': { method: 'POST',
                                 headers: { 'api_access_token': access_token, 'username': USERNAME }
                                }
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

        // antigen organism
        function AntigenOrganismSearchAPIResource($resource, JAVA_API_URL) {
                 return $resource(JAVA_API_URL + 'organism/searchAntigen', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }
        // used for cell line vocab validation
        function ValidateTermSlimAPIResource($resource, JAVA_API_URL) {
              return $resource(JAVA_API_URL + 'term/validateTermSlim', {}, {
                        'validate': { method: 'POST'}
                });
        }
        
        // search tissues - used for validation
        function TissueSearchAPIResource($resource, JAVA_API_URL) {
                 return $resource(JAVA_API_URL + 'tissue/search', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }

        // get list of tissues, used for autocomplete
         function TissueListAPIResource($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'tissue/getTissueList', {}, {} );
        }

        // get list of strains, used for autocomplete
        function StrainListAPIResource($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'strain/getStrainList', {}, {} );
        }
        // antbodies by antigen key
        function AntibodySearchAPIResource($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'antigen/getAntibodies/:key', {}, {
                        'search': { method: 'POST', isArray: true }                     
                });
        }

})();

