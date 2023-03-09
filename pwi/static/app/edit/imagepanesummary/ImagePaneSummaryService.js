(function() {
	'use strict';
	angular.module('pwi.imagepanesummary')
		.factory('ImagePaneGetByRefAPI', ImagePaneGetByRefAPIResource)
		;

	//
	function ImagePaneGetByRefAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'imagepane/getImagePaneByRef', {}, {
			'search': { method: 'GET', isArray: false }
		});
	}

})();

