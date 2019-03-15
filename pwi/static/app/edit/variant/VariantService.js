(function() {
	'use strict';
	angular.module('pwi.variant')
		.factory('AlleleSearchAPI', AlleleSearchAPIResource)
		.factory('AllAlleleSearchAPI', AllAlleleSearchAPIResource)
		.factory('AccessionSearchAPI', AccessionSearchAPIResource)
		.factory('TermSearchAPI', TermSearchAPIResource)
		.factory('TermSetAPI', TermSetAPIResource)
		.factory('JnumLookupAPI', JnumLookupAPIResource)
		.factory('VariantSearchAPI', VariantSearchAPIResource)
		.factory('VariantKeySearchAPI', VariantKeySearchAPIResource)
		.factory('VariantCreateAPI', VariantCreateAPIResource)
		.factory('VariantUpdateAPI', VariantUpdateAPIResource)
		.factory('VariantDeleteAPI', VariantDeleteAPIResource);


	// search for alleles, even those without variants
	function AllAlleleSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// search only for alleles with variants
	function AlleleSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/searchVariant', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	function AccessionSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'accession/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	function TermSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'term/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	function TermSetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'term/termset', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	function JnumLookupAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'reference/validJnum/:jnumid', {}, {
			'': { method: 'GET', isArray: true } 
		});
	}

	function VariantSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allelevariant/getByAllele', {}, {
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


