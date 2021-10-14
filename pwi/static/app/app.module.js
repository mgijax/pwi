(function() {
  'use strict';
  var appModule = angular.module('PWI', [
    'pwi',
    'pwi.actlogdb',
    'pwi.allele',
    'pwi.allelederivation',
    'pwi.antibody',
    'pwi.antigen',
    'pwi.assay',
    'pwi.assaydetail',
    'pwi.clonelib',
    'pwi.gxd',
    'pwi.mgi',
    'pwi.image',
    'pwi.mapping',
    'pwi.marker',
    'pwi.mutantcellline',
    'pwi.nonmutantcellline',
    'pwi.genotype',
    'pwi.doalleleannot',
    'pwi.doannot',
    'pwi.goannot',
    'pwi.mpannot',
    'pwi.organism',
    'pwi.probe',
    'pwi.simplevocab',
    'pwi.strain',
    'pwi.triage',
    'pwi.variant',
    'pwi.validate',
    'pwi.voc',
    'pwi.celltype'
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
  angular.module('pwi.allelederivation', ['ngResource']);
  angular.module('pwi.antibody', ['ngResource']);
  angular.module('pwi.antigen', ['ngResource']);
  angular.module('pwi.assay', ['ngResource']);
  angular.module('pwi.assaydetail', ['ngResource']);
  angular.module('pwi.clonelib', ['ngResource']);
  angular.module('pwi.mgi', ['ngResource']);
  angular.module('pwi.image', ['ngResource']);
  angular.module('pwi.mapping', ['ngResource']);
  angular.module('pwi.marker', ['ngResource']);
  angular.module('pwi.mutantcellline', ['ngResource']);
  angular.module('pwi.nonmutantcellline', ['ngResource']);
  angular.module('pwi.genotype', ['ngResource']);
  angular.module('pwi.doalleleannot', ['ngResource']);
  angular.module('pwi.doannot', ['ngResource']);
  angular.module('pwi.goannot', ['ngResource']);
  angular.module('pwi.mpannot', ['ngResource']);
  angular.module('pwi.organism', ['ngResource']);
  angular.module('pwi.probe', ['ngResource']);
  angular.module('pwi.simplevocab', ['ngResource']);
  angular.module('pwi.strain', ['ngResource']);
  angular.module('pwi.triage', ['ngResource']);
  angular.module('pwi.variant', ['ngResource']);
  angular.module('pwi.voc', ['ngResource']);
  angular.module('pwi.validate', ['ngResource']);
  angular.module('pwi.celltype', ['ngResource']);

})();
