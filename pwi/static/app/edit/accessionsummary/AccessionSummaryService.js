(function() {
	'use strict';
	angular.module('pwi.accessionsummary')
		.factory('AccessionGetByAccidAPI', AccessionGetByAccidAPIResource)
		;

	//
	function AccessionGetByAccidAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'accession/getQSResultByAccid', {}, {
			'search': { method: 'GET', isArray: true }
		});
	}
})();

