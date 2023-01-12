(function() {
  'use strict';
  var appModule = angular.module('PWI', [
    'pwi',
    'pwi.actlogdb',
    'pwi.allele',
    'pwi.alleledetail',
    'pwi.allelederivation',
    'pwi.allelefear',
    'pwi.allelesummary',
    'pwi.antibody',
    'pwi.antibodydetail',
    'pwi.antibodysummary',
    'pwi.antigen',
    'pwi.assay',
    'pwi.assaydetail',
    'pwi.celltype',
    'pwi.clonelib',
    'pwi.gxd',
    'pwi.mgi',
    'pwi.image',
    'pwi.imagedetail',
    'pwi.imagepanesummary',
    'pwi.imagesummary',
    'pwi.mapping',
    'pwi.mappingdetail',
    'pwi.marker',
    'pwi.markerdetail',
    'pwi.markersummary',
    'pwi.mutantcellline',
    'pwi.nonmutantcellline',
    'pwi.genotype',
    'pwi.doalleleannot',
    'pwi.doannot',
    'pwi.goannot',
    'pwi.mpannot',
    'pwi.organism',
    'pwi.probe',
    'pwi.probedetail',
    'pwi.probesummary',
    'pwi.simplevocab',
    'pwi.strain',
    'pwi.triage',
    'pwi.variant',
    'pwi.validate',
    'pwi.voc',
    'pwi.voctermdetail'
  ]);
  
  appModule.config(['$locationProvider', function($locationProvider) {
	  $locationProvider.html5Mode({
		  enabled: true,
		  rewriteLinks: false
	  });
  }]);

// define root modules & dependencies
  angular.module('pwi', ['ui.bootstrap', 'ui.bootstrap.tpls', 'angularSpinner','duScroll']);
  angular.module('pwi.gxd', ['formly', 'formlyBootstrap', 'ui.bootstrap', 'ui.bootstrap.tpls', 'ngResource', 'smart-table', 'naturalSortService', 'sortFilter', 'lrDragNDrop']);
  angular.module('pwi.actlogdb', ['ngResource']);
  angular.module('pwi.allele', ['ngResource']);
  angular.module('pwi.alleledetail', ['ngResource','ngSanitize']);
  angular.module('pwi.allelederivation', ['ngResource']);
  angular.module('pwi.allelefear', ['ngResource']);
  angular.module('pwi.allelesummary', ['ngResource']);
  angular.module('pwi.antibody', ['ngResource']);
  angular.module('pwi.antibodydetail', ['ngResource','ngSanitize']);
  angular.module('pwi.antibodysummary', ['ngResource','ngSanitize']);
  angular.module('pwi.antigen', ['ngResource']);
  angular.module('pwi.assay', ['ngResource']);
  angular.module('pwi.assaydetail', ['ngResource','ngSanitize']);
  angular.module('pwi.celltype', ['ngResource']);
  angular.module('pwi.clonelib', ['ngResource']);
  angular.module('pwi.mgi', ['ngResource']);
  angular.module('pwi.image', ['ngResource']);
  angular.module('pwi.imagedetail', ['ngResource']);
  angular.module('pwi.imagepanesummary', ['ngResource','ngSanitize']);
  angular.module('pwi.imagesummary', ['ngResource','ngSanitize']);
  angular.module('pwi.mapping', ['ngResource']);
  angular.module('pwi.mappingdetail', ['ngResource','ngSanitize']);
  angular.module('pwi.marker', ['ngResource']);
  angular.module('pwi.markerdetail', ['ngResource','ngSanitize']);
  angular.module('pwi.markersummary', ['ngResource','ngSanitize']);
  angular.module('pwi.mutantcellline', ['ngResource']);
  angular.module('pwi.nonmutantcellline', ['ngResource']);
  angular.module('pwi.genotype', ['ngResource']);
  angular.module('pwi.doalleleannot', ['ngResource']);
  angular.module('pwi.doannot', ['ngResource']);
  angular.module('pwi.goannot', ['ngResource']);
  angular.module('pwi.mpannot', ['ngResource']);
  angular.module('pwi.organism', ['ngResource']);
  angular.module('pwi.probe', ['ngResource']);
  angular.module('pwi.probedetail', ['ngResource','ngSanitize']);
  angular.module('pwi.probesummary', ['ngResource','ngSanitize']);
  angular.module('pwi.simplevocab', ['ngResource']);
  angular.module('pwi.strain', ['ngResource']);
  angular.module('pwi.triage', ['ngResource']);
  angular.module('pwi.variant', ['ngResource']);
  angular.module('pwi.voc', ['ngResource']);
  angular.module('pwi.voctermdetail', ['ngResource','ngSanitize']);
  angular.module('pwi.validate', ['ngResource']);

})();
