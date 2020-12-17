(function() {
	'use strict';
	angular.module('pwi.strain')
		.factory('StrainSearchAPI',	        StrainSearchAPIResource)
		.factory('StrainSearchDuplicatesAPI',	StrainSearchDuplicatesAPIResource)
		.factory('StrainGetAPI',		StrainGetAPIResource)
                .factory('StrainCreateAPI',             StrainCreateAPIResource)
		.factory('StrainUpdateAPI',	        StrainUpdateAPIResource)
		.factory('StrainDeleteAPI',	        StrainDeleteAPIResource)
		.factory('StrainTotalCountAPI',	        StrainTotalCountAPIResource)
		.factory('StrainGetDataSetsAccAPI',	StrainGetDataSetsAccAPIResource)
		.factory('StrainGetDataSetsRefAPI',	StrainGetDataSetsRefAPIResource)
		.factory('StrainGetByRefAPI',	        StrainGetByRefAPIResource)
		.factory('LogicalDBSearchAPI',	        LogicalDBSearchAPIResource)
		.factory('StrainProcessMergeAPI',	StrainProcessMergeAPIResource)
		;

	// object summary search
	function StrainSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'strain/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// search duplicates
	function StrainSearchDuplicatesAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'strain/searchDuplicates', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function StrainGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'strain/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// create
	function StrainCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'strain', {},
			{'create': { method: 'POST', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// update
	function StrainUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'strain', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// delete
	function StrainDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'strain/:key', {},
			{'delete': { method: 'DELETE', 
			headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// total number of records
	function StrainTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'strain/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	
	
	// strain/getDataSetsAcc
	function StrainGetDataSetsAccAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'strain/getDataSetsAcc/:key', {}, {
			'': { method: 'JSONP' , isArray: true}
		});
	}

	// strain/getDataSetsRef
	function StrainGetDataSetsRefAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'strain/getDataSetsRef/:key', {}, {
			'': { method: 'JSONP' , isArray: true}
		});
	}

	// strain/getStrainByRef
	function StrainGetByRefAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'strain/getByRef/:key', {}, {
			'': { method: 'JSONP' , isArray: true}
		});
	}

	// logical db for strain set
	function LogicalDBSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'logicaldb/searchProbeStrainSet', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}
        
	// process merge
	function StrainProcessMergeAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'strain/processMerge', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

})();

