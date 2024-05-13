(function() {
	'use strict';
	angular.module('pwi.triage')
		.factory('ReferenceSearchAPI', ReferenceSearchAPIResource)
		.factory('ReferenceGetAPI', ReferenceGetAPIResource)
		.factory('ReferenceCreateAPI', ReferenceCreateAPIResource)
		.factory('ReferenceUpdateAPI', ReferenceUpdateAPIResource)
		.factory('ReferenceDeleteAPI', ReferenceDeleteAPIResource)
		.factory('ReferenceBatchRefUpdateTagAPI', ReferenceBatchRefUpdateTagAPIResource)
		.factory('ReferenceAlleleAssocAPI', ReferenceAlleleAssocAPIResource)
		.factory('ReferenceMarkerAssocAPI', ReferenceMarkerAssocAPIResource)
		.factory('ReferenceStrainAssocAPI', ReferenceStrainAssocAPIResource)
		.factory('ReferenceDOIDAssocAPI', ReferenceDOIDAssocAPIResource)
		.factory('JournalAPI', JournalAPIResource)
		.factory('ActualDbGetAPI', ActualDbGetAPIResource)
                .factory('StrainToolSearchAPI', StrainToolSearchAPIResource)
		.factory('LogicalDBSearchAPI',	LogicalDBSearchAPIResource)
		;


	function ReferenceSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'reference/search', {}, {
                        'search': { method: 'POST', isArray: true }
		});
	}

	function ReferenceGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'reference/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	function ActualDbGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'logicaldb/:key', {}, {
			'': { method: 'JSONP' } 
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
		return $resource(JAVA_API_URL + 'reference', {},
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
		return $resource(JAVA_API_URL + 'reference/bulkUpdate', {}, 
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

        function ReferenceDOIDAssocAPIResource($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'mgireferenceassoc/doidByReference/:key', {}, {
                        '': { method: 'JSONP' , isArray: true}
                });
        }

	function JournalAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'reference/getJournalList', {}, {} );
	}

        function StrainToolSearchAPIResource($resource, JAVA_API_URL) {
                return $resource(JAVA_API_URL + 'strain/searchStrainTool', {}, {
                        'search': { method: 'POST', isArray: true }
                });
        }

	// logical db for strain set
	function LogicalDBSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'logicaldb/searchProbeStrainSet', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}
        
})();

