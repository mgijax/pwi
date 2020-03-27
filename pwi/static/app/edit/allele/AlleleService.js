(function() {
	'use strict';
	angular.module('pwi.goannot')
		.factory('AlleleSearchAPI',		AlleleSearchAPIResource)
		.factory('AlleleGetAPI',		AlleleGetAPIResource)
		.factory('AlleleUpdateAPI',		AlleleUpdateAPIResource)
		.factory('AlleleTotalCountAPI',	AlleleTotalCountAPIResource)
		.factory('AlleleGetReferencesAPI',	AlleleGetReferencesAPIResource)
		.factory('AlleleReferenceReportAPI',	AlleleReferenceReportAPIResource)
		;

	// object summary search
	function AlleleSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function AlleleGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// object modification
	function AlleleUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'allele', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// total number of records
	function AlleleTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	
	
	// markerAllele/getReferences
	function AlleleGetReferencesAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/getReferences/:key', {}, {
			'': { method: 'JSONP' , isArray: true}
		});
	}

	// reference report
	function AlleleReferenceReportAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/getReferenceReport', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

})();

