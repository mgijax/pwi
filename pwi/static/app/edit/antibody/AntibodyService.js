(function() {
	'use strict';
	angular.module('pwi.antibody')
		.factory('AntibodySearchAPI',		AntibodySearchAPIResource)
		.factory('AntibodyGetAPI',		AntibodyGetAPIResource)
		.factory('AntibodyUpdateAPI',		AntibodyUpdateAPIResource)
                .factory('AntibodyDeleteAPI',            AntibodyDeleteAPIResource)
		.factory('AntibodyTotalCountAPI',	AntibodyTotalCountAPIResource)
                .factory('OrganismSearchAPI',           OrganismSearchAPIResource)
                .factory('ValidateTermSlimAPI',         ValidateTermSlimAPIResource)
                .factory('TissueSearchAPI',             TissueSearchAPIResource)
                .factory('AntibodyTypeSearchAPI',       AntibodyTypeSearchAPIResource)
                .factory('AntibodyClassSearchAPI',       AntibodyClassSearchAPIResource)
		;

	// object summary search
	function AntibodySearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'antibody/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function AntibodyGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'antibody/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// object modification
	function AntibodyUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'antibody', {},
				{'update': { method: 'PUT', 
				 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	

        function AntibodyDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
                return $resource(JAVA_API_URL + 'antibody/:key', {},
                        {'delete': { method: 'DELETE',
                         headers: { 'api_access_token': access_token, 'username': USERNAME }
                        }
                });
        }

	// total number of records
	function AntibodyTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'antibody/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}

        // all organisms
        function OrganismSearchAPIResource($resource, JAVA_API_URL) {
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
        
        //
        function TissueSearchAPIResource($resource, JAVA_API_URL) {
                 return $resource(JAVA_API_URL + 'tissue/search', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }

        function AntibodyTypeSearchAPIResource($resource, JAVA_API_URL) {
                 return $resource(JAVA_API_URL + 'antibodytype/search', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }

        function AntibodyClassSearchAPIResource($resource, JAVA_API_URL) {
         return $resource(JAVA_API_URL + 'antibodyclass/search', {}, {
                'search': { method: 'POST', isArray: true }
        });
        }



})();
