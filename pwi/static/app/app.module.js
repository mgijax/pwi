(function() {
  'use strict';
  angular.module('PWI', [
    'pwi',
    'pwi.gxd',
    'pwi.mgi',
    'pwi.voc'
  ]);

// define root modules & dependencies
  angular.module('pwi', ['ui.bootstrap', 'ui.bootstrap.tpls', 'angularSpinner']);
  angular.module('pwi.gxd', ['formly', 'formlyBootstrap', 'ui.bootstrap', 'ui.bootstrap.tpls', 'ngResource']);
  angular.module('pwi.mgi', ['ngResource']);
  angular.module('pwi.voc', ['ngResource']);

})();
