(function() {
	'use strict';
	angular.module('pwi.goannot')
		.factory('AlleleFearSearchAPI',		AlleleFearSearchAPIResource)
		.factory('AlleleFearGetAPI',		AlleleFearGetAPIResource)
		.factory('AlleleFearUpdateAPI',		AlleleFearUpdateAPIResource)
		.factory('AlleleFearTotalCountAPI',	AlleleFearTotalCountAPIResource)
		.factory('AlleleFearSearchPropertyAccIdAPI',	AlleleFearSearchPropertyAccIdAPIResource)
		;

	// object summary search
	function AlleleFearSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allelefear/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function AlleleFearGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allelefear/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// object modification
	function AlleleFearUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'allelefear', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}	

	// total number of records
	function AlleleFearTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allelefear/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	
	
	// search property accession id
	function AlleleFearSearchPropertyAccIdAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allelefear/searchPropertyAccId', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

})();

