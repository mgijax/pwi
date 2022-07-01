(function() {
	'use strict';
	angular.module('pwi.alleledetail')
		.factory('AlleleSearchAPI',	        AlleleSearchAPIResource)
		.factory('AlleleGetAPI',	        AlleleGetAPIResource)
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
        function GenotypeGetByAlleleAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotype/getGenotypesByAllele', {}, {
			'get': { method: 'POST', isArray: true }
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

