(function() {
	'use strict';
	angular.module('pwi.imagepanesummary')
		.factory('ImagePaneSummaryAPI',	ImagePaneSummaryAPIResource)
		.factory('ImagePaneSummaryValidJnumAPI', ImagePaneSummaryValidJnum)
		;

	//
	function ImagePaneSummaryAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'imagepane/getSummaryByReference', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}
        //
        function ImagePaneSummaryValidJnum($resource, JAVA_API_URL) {
            return $resource(JAVA_API_URL + 'reference/validJnum/:key', {}, {
                'get': { method: 'GET', isArray: true }
                });
        }

})();

