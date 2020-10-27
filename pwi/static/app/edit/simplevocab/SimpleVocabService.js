(function() {
	'use strict';
	angular.module('pwi.simplevocab')
		.factory('SVSearchAPI',	                SVSearchAPIResource)
		.factory('SVGetAPI',		        SVGetAPIResource)
		.factory('SVUpdateAPI',	                SVUpdateAPIResource)
		.factory('SVTotalCountAPI',	        SVTotalCountAPIResource)
		.factory('AntibodyClassSearchAPI',	AntibodyClassSearchAPIResource)
		.factory('AntibodyClassUpdateAPI',	AntibodyClassUpdateAPIResource)
		.factory('GXDLabelSearchAPI',	        GXDLabelSearchAPIResource)
		.factory('GXDLabelUpdateAPI',	        GXDLabelUpdateAPIResource)
		.factory('PatternSearchAPI',	        PatternSearchAPIResource)
		.factory('PatternUpdateAPI',	        PatternUpdateAPIResource)
		;

	// object summary search
	function SVSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'vocab/searchsimple', {}, {
			'searchsimple': { method: 'GET', isArray: true }
		}); 
	}

	// object retrieval by key
	function SVGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'vocab/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// object modification
	function SVUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'vocab', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}

	// total number of records
	function SVTotalCountAPIResource($resource, JAVA_API_URL) {
		console.log(JAVA_API_URL + 'vocab/getObjectCount', {}, {
                        'getObjectCount': { method: 'JSONP' }
                });
		return $resource(JAVA_API_URL + 'vocab/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}
        
	// object search
	function AntibodyClassSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'antibodyclass/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object modification
	function AntibodyClassUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'antibodyclass', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}

	// object search
	function GXDLabelSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'gxdlabel/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object modification
	function GXDLabelUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'gxdlabel', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}

	// object search
	function PatternSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'gxdpattern/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object modification
	function PatternUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'gxdpattern', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}

})();

