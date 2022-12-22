(function() {
	'use strict';
	angular.module('pwi.imagesummary')
		.factory('ImageSummaryAPI', ImageSummaryAPIResource)
		;

	//
	function ImageSummaryAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'image/getImageByAllele', {}, {
			'search': { method: 'POST', isArray: false }
		});
	}
})();

