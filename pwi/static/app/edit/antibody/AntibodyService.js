(function() {
	'use strict';
	angular.module('pwi.antibody')
		.factory('AntibodySearchAPI',		AntibodySearchAPIResource)
		.factory('AntibodyGetAPI',		AntibodyGetAPIResource)
                .factory('AntibodyCreateAPI',           AntibodyCreateAPIResource)
		.factory('AntibodyUpdateAPI',		AntibodyUpdateAPIResource)
                .factory('AntibodyDeleteAPI',           AntibodyDeleteAPIResource)
		.factory('AntibodyTotalCountAPI',	AntibodyTotalCountAPIResource)
                .factory('AntibodyOrganismSearchAPI',   AntibodyOrganismSearchAPIResource)
                .factory('AntigenOrganismSearchAPI',    AntigenOrganismSearchAPIResource)
                .factory('TissueSearchAPI',             TissueSearchAPIResource)
                .factory('TissueListAPI',               TissueListAPIResource)
		.factory('CreateStrainAPI',     	CreateStrainAPIResource)
		.factory('CreateTissueAPI',             CreateTissueAPIResource)
                .factory('ValidateAntibodyAccAPI',      ValidateAntibodyAccAPIResource)
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

        // create object
        function AntibodyCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
                return $resource(JAVA_API_URL + 'antibody', {},
                                {'create': { method: 'POST',
                                 headers: { 'api_access_token': access_token, 'username': USERNAME }
                                }
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

        // all antibody organisms
        function AntibodyOrganismSearchAPIResource($resource, JAVA_API_URL) {
                 return $resource(JAVA_API_URL + 'organism/searchAntibody', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }

        // all antigen organisms
        function AntigenOrganismSearchAPIResource($resource, JAVA_API_URL) {
                 return $resource(JAVA_API_URL + 'organism/searchAntigen', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }

        //
        function TissueSearchAPIResource($resource, JAVA_API_URL) {
                 return $resource(JAVA_API_URL + 'tissue/validateTissue', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }

        // get list of tissues, used for autocomplete
         function TissueListAPIResource($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'tissue/getTissueList', {}, {} );
        }


        // create strain
        function CreateStrainAPIResource($resource, JAVA_API_URL, USERNAME) {
                return $resource(JAVA_API_URL + 'strain', {},
                                {'create': { method: 'POST',
                                 headers: { 'api_access_token': access_token, 'username': USERNAME }
                                }
                });
        }

        // create tissue
        function CreateTissueAPIResource($resource, JAVA_API_URL, USERNAME) {
                return $resource(JAVA_API_URL + 'tissue', {}, 
				{'create': { method: 'POST',
                                 headers: { 'api_access_token': access_token, 'username': USERNAME }
                                }
                });
        }

        function ValidateAntibodyAccAPIResource($resource, JAVA_API_URL) {
         return $resource(JAVA_API_URL + 'antibody/searchAccession', {}, {
                'search': { method: 'POST', isArray: true }
        });
        }

})();

