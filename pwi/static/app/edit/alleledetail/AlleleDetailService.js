(function() {
	'use strict';
	angular.module('pwi.alleledetail')
		.factory('AlleleSearchAPI',	        AlleleSearchAPIResource)
		.factory('AlleleGetAPI',	        AlleleGetAPIResource)
		.factory('GenotypeSearchAPI',	        GenotypeSearchAPIResource)
		.factory('GenotypeGetAPI',	        GenotypeGetAPIResource)
		.factory('GenotypeMPAnnotGetAPI',       GenotypeMPAnnotGetAPIResource)
		.factory('GenotypeDOAnnotGetAPI',       GenotypeDOAnnotGetAPIResource)
		.factory('ImageGetAPI',   	        ImageGetAPIResource)
		.factory('ImagePaneGetAPI',   	        ImagePaneGetAPIResource)
		.factory('VocTermAncestorsGetAPI',      VocTermAncestorsGetAPIResource)
		;

	// object summary search
	function AlleleSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function AlleleGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'allele/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	// 
	function GenotypeSearchAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotype/search', {}, {
			'search': { method: 'POST', isArray: true }
		});
	}

	// object retrieval by key
	function GenotypeGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotype/:key', {}, {
			'': { method: 'JSONP' } 
		});
	}

	//
	function GenotypeMPAnnotGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotypeMPannot/:key', {}, {
			'': { method: 'JSONP' }
		});
	}

	//
	function GenotypeDOAnnotGetAPIResource($resource, JAVA_API_URL) {
		return $resource(JAVA_API_URL + 'genotypeDOannot/:key', {}, {
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

