(function() {
	'use strict';
	angular.module('pwi.variant')
		.factory('AlleleSearchAPI', AlleleSearchAPIResource)
		.factory('VariantSearchAPI', VariantSearchAPIResource)
		.factory('VariantKeySearchAPI', VariantKeySearchAPIResource)
		.factory('VariantCreateAPI', VariantCreateAPIResource)
		.factory('VariantUpdateAPI', VariantUpdateAPIResource)
		.factory('VariantDeleteAPI', VariantDeleteAPIResource);


	function AlleleSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	function VariantSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allelevariant/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	function VariantKeySearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allelevariant/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	function VariantCreateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'allelevariant', {},
				{'create': { method: 'POST', 
							 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	
	
	function VariantUpdateAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'allelevariant', {},
				{'update': { method: 'PUT', 
							 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	

	function VariantDeleteAPIResource($resource, JAVA_API_URL, USERNAME) {
		return $resource(JAVA_API_URL + 'allelevariant/:key', {},
				{'delete': { method: 'DELETE', 
							 headers: { 'api_access_token': access_token, 'username': USERNAME } 
				}
		});
	}	
	
})();


