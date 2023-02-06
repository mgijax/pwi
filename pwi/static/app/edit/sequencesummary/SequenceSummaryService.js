(function() {
	'use strict';
	angular.module('pwi.sequencesummary')
		.factory('SequenceGetByMarkerAPI', SequenceGetByMarkerAPIResource)
		;

	//
	function SequenceGetByMarkerAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'sequence/getSequenceByMarker', {}, {
			'search': { method: 'GET', isArray: false }
		});
	}
})();

