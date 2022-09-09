(function() {
	'use strict';
	angular.module('pwi.antibodydetail')
		.factory('AntibodySearchAPI',	        AntibodySearchAPIResource)
		.factory('AntibodyGetAPI',	        AntibodyGetAPIResource)
		;

	//
	function AntibodySearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'antibody/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	//
	function AntibodyGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'antibody/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}
})();

