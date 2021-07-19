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
                .factory('GenotypeCreateStrainAPI',     GenotypeCreateStrainAPIResource)
                .factory('CreateTissueAPI',             CreateTissueAPIResource)
                .factory('TissueSearchAPI',             TissueSearchAPIResource)
                .factory('TissueListAPI',               TissueListAPIResource)
                .factory('StrainListAPI',               StrainListAPIResource)
                .factory('TermListAPI',                 TermListAPIResource)
                .factory('CellLineListAPI',             CellLineListAPIResource)
                .factory('AntibodySearchAPI',           AntibodySearchAPIResource)
                .factory('TermCreateAPI',               TermCreateAPIResource)
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

        // create strain
        function GenotypeCreateStrainAPIResource($resource, JAVA_API_URL, USERNAME) {
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
        // create term (cell line), done via the term service create
        function TermCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
                return $resource(JAVA_API_URL + 'term', {},
                                {'create': { method: 'POST',
                                 headers: { 'api_access_token': access_token, 'username': USERNAME }
                                }
                });
        }

        // search tissues - used for validation
        function TissueSearchAPIResource($resource, JAVA_API_URL) {
                 return $resource(JAVA_API_URL + 'tissue/validateTissue', {}, {
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

        // get list of celllines, used for autocomplete
        function CellLineListAPIResource($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'vocab/getTermList', {}, {} );
        }
        // antbodies by antigen key
        function AntibodySearchAPIResource($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'antigen/getAntibodies', {}, {
                        'search': { method: 'POST', isArray: true }                     
                });
        }

        // get list of terms for a vocab  7/16 deferred to another story
        // as this is not working as expected. Error in pwi: 
        // angular.js:12011 GET http://bhmgiweb06ld.jax.org:8098/api/term/getVocabTermList?vocabKey=18 404 (Not Found)
        function TermListAPIResource($resource, JAVA_API_URL, USERNAME) {
                return $resource(JAVA_API_URL + 'vocab/getVocabTermList', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }


})();

