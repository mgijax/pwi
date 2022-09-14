(function() {
	'use strict';
	angular.module('pwi.probedetail')
		.factory('ProbeSearchAPI',	        ProbeSearchAPIResource)
		.factory('ProbeGetAPI',	                ProbeGetAPIResource)
		;

	//
	function ProbeSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'probe/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	//
	function ProbeGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'probe/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}
})();

