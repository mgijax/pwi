(function() {
  'use strict';
  angular.module('PWI', [
    'pwi',
    'pwi.gxd',
    'pwi.voc'
  ]);

// define root modules & dependencies
  angular.module('pwi', ['ui.bootstrap', 'ui.bootstrap.tpls', 'angularSpinner', 'angular-keyboard']);
  angular.module('pwi.gxd', ['formly', 'formlyBootstrap', 'ui.bootstrap', 'ui.bootstrap.tpls', 'ngResource', 'angular-keyboard']);
  angular.module('pwi.voc', ['ngResource']);

})();
