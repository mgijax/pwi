(function() {
  'use strict';
  var appModule = angular.module('PWI', [
    'pwi',
    'pwi.gxd',
    'pwi.mgi',
    'pwi.triage',
    'pwi.marker',
    'pwi.voc'
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
  angular.module('pwi.voc', ['ngResource']);
  angular.module('pwi.mgi', ['ngResource']);
  angular.module('pwi.marker', ['ngResource']);
  angular.module('pwi.triage', ['ngResource']);

})();
