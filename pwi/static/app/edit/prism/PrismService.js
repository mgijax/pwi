(function() {
	'use strict';
	angular.module('pwi.prism')
		.factory('ImageSearchAPI',		ImageSearchAPIResource)
		.factory('ImageGatherByKeyAPI',	        ImageGatherByKeyAPIResource)
		.factory('ImageUpdateAPI',		ImageUpdateAPIResource)
		;

	// object summary search
	function ImageSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'image/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function ImageGatherByKeyAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'image/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// object modification
	function ImageUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'image', {},
				{'update': { method: 'PUT', 
				 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	
})();

