(function() {
	'use strict';
	angular.module('pwi.prism')
		.factory('ImageSearchAPI',		ImageSearchAPIResource)
		.factory('ImageGatherByKeyAPI',	        ImageGatherByKeyAPIResource)
		.factory('ImageCreateAPI', 		ImageCreateAPIResource)
		.factory('ImageUpdateAPI',		ImageUpdateAPIResource)
		.factory('ImageDeleteAPI',		ImageDeleteAPIResource)
		.factory('ImageTotalCountAPI',		ImageTotalCountAPIResource)
		.factory('ImageUpdateAlleleAssocAPI',	ImageUpdateAlleleAssocAPIResource)
		.factory('ImageAlleleAssocAPI',		ImageAlleleAssocAPIResource)
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

	// object creation
	function ImageCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'image', {},
				{'create': { method: 'POST', 
				 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
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

	// object deletion
	function ImageDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'image/:key', {},
				{'delete': { method: 'DELETE', 
				 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	

	// object update allele assoc
	function ImageUpdateAlleleAssocAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'image/updateAlleleAssoc', {},
				{'update': { method: 'PUT', 
				 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	

	// get allele/image pane assoc by image
	function ImageAlleleAssocAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/getAlleleByImagePane', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// total number of records
	function ImageTotalCountAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'image/getObjectCount', {}, {
			'getObjectCount': { method: 'JSONP' } 
		});
	}	
	
})();

