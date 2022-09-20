(function() {
	'use strict';
	angular.module('pwi.alleledetail')
		.factory('AlleleSearchAPI',	        AlleleSearchAPIResource)
		.factory('AlleleGetAPI',	        AlleleGetAPIResource)
		.factory('GenotypeValidateAPI',   	GenotypeValidateAPIResource)
		.factory('GenotypeGetAPI',   	        GenotypeGetAPIResource)
		.factory('GenotypeGetByAlleleAPI',	GenotypeGetByAlleleAPIResource)
		.factory('ImageGetAPI',   	        ImageGetAPIResource)
		.factory('ImagePaneGetAPI',   	        ImagePaneGetAPIResource)
		.factory('VocTermAncestorsGetAPI',      VocTermAncestorsGetAPIResource)
		;

	//
	function AlleleSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	//
	function AlleleGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

        //
        function GenotypeValidateAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotype/validateGenotype', {}, {
			'validate': { method: 'POST', isArray: true }
		});
        }

	//
        function GenotypeGetByAlleleAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotype/getGenotypesByAllele', {}, {
			'get': { method: 'POST', isArray: true }
		});
        }

	//
	function GenotypeGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotype/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	//
	function ImageGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'image/:key', {}, {
			'': { method: 'JSONP' }
		});
	}

	//
	function ImagePaneGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'imagepane/:key', {}, {
			'': { method: 'JSONP' }
		});
	}

        //
        function VocTermAncestorsGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'term/getAncestorKeys', {}, {
			'get': { method: 'POST', isArray: true }
		});
        }



})();

