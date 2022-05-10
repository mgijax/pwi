(function() {
	'use strict';
	angular.module('pwi.triage')
		.factory('TriageSearchAPI', TriageSearchAPIResource)
		.factory('JournalAPI', JournalAPIResource)
		.factory('ReferenceSearchAPI', ReferenceSearchAPIResource)
		.factory('ReferenceKeySearchAPI', ReferenceKeySearchAPIResource)
		.factory('ReferenceCreateAPI', ReferenceCreateAPIResource)
		.factory('ReferenceUpdateAPI', ReferenceUpdateAPIResource)
		.factory('ReferenceDeleteAPI', ReferenceDeleteAPIResource)
		.factory('ReferenceBatchRefUpdateTagAPI', ReferenceBatchRefUpdateTagAPIResource)
		.factory('ActualDbSearchAPI', ActualDbSearchAPIResource)
		.factory('ReferenceAlleleAssocAPI', ReferenceAlleleAssocAPIResource)
		.factory('ReferenceMarkerAssocAPI', ReferenceMarkerAssocAPIResource)
		.factory('ReferenceStrainAssocAPI', ReferenceStrainAssocAPIResource)
		;


	function TriageSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'reference/search', {}, {
                        'search': { method: 'POST', isArray: true }
		});
	}

	function JournalAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'reference/getJournalList', {}, {} );
	}

	function ReferenceSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'littriage/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	function ReferenceKeySearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'littriageNew/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	function ActualDbSearchAPIResource($resource, API_PATH) {
		return $resource(API_PATH + 'actualdb/search', {}, {
			'search': { method: 'POST' }
		});
	}

        function ReferenceCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
                return $resource(JAVA_API_URL + 'reference', {}, 
                                {'create': { method: 'POST', 
                                 headers: { 'api_access_token': access_token, 'username': USERNAME } 
                                }   
                });
        }  

	function ReferenceUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'littriage', {},
				{'update': { method: 'PUT', 
				 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}
	
	function ReferenceDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'reference/:key', {},
				{'delete': { method: 'DELETE', 
				 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}
	
	function ReferenceBatchRefUpdateTagAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'littriage/bulkUpdate', {}, 
			{'update': { method: 'PUT',
				headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}
	
        function ReferenceAlleleAssocAPIResource($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'mgireferenceassoc/alleleByReference/:key', {}, {
                        '': { method: 'JSONP' , isArray: true}
                });
        }

        function ReferenceMarkerAssocAPIResource($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'mgireferenceassoc/markerByReference/:key', {}, {
                        '': { method: 'JSONP' , isArray: true}
                });
        }

        function ReferenceStrainAssocAPIResource($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'mgireferenceassoc/strainByReference/:key', {}, {
                        '': { method: 'JSONP' , isArray: true}
                });
        }

})();

