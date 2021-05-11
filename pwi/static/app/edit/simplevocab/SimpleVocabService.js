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
		.factory('GelControlSearchAPI',	        GelControlSearchAPIResource)
		.factory('GelControlUpdateAPI',	        GelControlUpdateAPIResource)
		.factory('EmbeddingMethodSearchAPI',	EmbeddingMethodSearchAPIResource)
		.factory('EmbeddingMethodUpdateAPI',	EmbeddingMethodUpdateAPIResource)
		.factory('FixationMethodSearchAPI',	FixationMethodSearchAPIResource)
		.factory('FixationMethodUpdateAPI',	FixationMethodUpdateAPIResource)
		.factory('VisualizationMethodSearchAPI',VisualizationMethodSearchAPIResource)
		.factory('VisualizationMethodUpdateAPI',VisualizationMethodUpdateAPIResource)
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

	// object search
	function GelControlSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'gelcontrol/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object modification
	function GelControlUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'gelcontrol', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}

	// object search
	function EmbeddingMethodSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'gxdembedding/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object modification
	function EmbeddingMethodUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'gxdembedding', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}

	// object search
	function FixationMethodSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'gxdfixation/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object modification
	function FixationMethodUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'gxdfixation', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}

	// object search
	function VisualizationMethodSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'gxdvisualization/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object modification
	function VisualizationMethodUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'gxdvisualization', {},
			{'update': { method: 'PUT', 
			 headers: { 'api_access_token': access_token, 'username': USERNAME } 
			}
		});
	}

})();

