(function() {
	'use strict';
	angular.module('pwi.gxd')
		.factory('GxdIndexAPI', GxdIndexAPIResource)
		.factory('GxdIndexSearchAPI', GxdIndexSearchAPIResource)
		.factory('ValidReferenceAPI', ValidReferenceResource)
		.factory('ConditionalMutantsVocabAPI', ConditionalMutantsVocabResource)
		.factory('IndexAssayVocabAPI', IndexAssayVocabResource)
		.factory('PriorityVocabAPI', PriorityVocabResource)
		.factory('StageidVocabAPI', StageidVocabResource);

	function GxdIndexAPIResource($resource) {
		return $resource('/pwi/api/gxdindex/:key', null, {
			'update': { method: 'PUT' }
		});
	}
	function GxdIndexSearchAPIResource($resource) {
		return $resource('/pwi/api/gxdindex/search', {}, {
			'search': { method: 'POST' }
		});
	}
	
	/*
	 * Validating Reference J-Number
	 */
	function ValidReferenceResource($resource) {
		return $resource('/pwi/api/reference/valid');
	}
	
	/*
	 * Vocab lists for key translations
	 */
	function ConditionalMutantsVocabResource($resource) {
		return $resource('/pwi/api/gxdindex/conditionalmutants');
	}
	function IndexAssayVocabResource($resource) {
		return $resource('/pwi/api/gxdindex/indexassay');
	}
	function PriorityVocabResource($resource) {
		return $resource('/pwi/api/gxdindex/priority');
	}
	function StageidVocabResource($resource) {
		return $resource('/pwi/api/gxdindex/stageid');
	}

})();
