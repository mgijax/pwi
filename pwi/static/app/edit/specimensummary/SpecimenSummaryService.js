(function() {
	'use strict';
	angular.module('pwi.specimensummary')
		.factory('SpecimenGetByJnumAPI', SpecimenGetByJnumAPIResource)
		;

	//
	function SpecimenGetByJnumAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'specimen/getSpecimenByRef', {}, {
			'search': { method: 'GET', isArray: false }
		});
	}

})();

