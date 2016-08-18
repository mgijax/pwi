(function() {
  'use strict';
  angular.module('PWI', [
    'pwi.gxd',
  ]);

// define root modules & dependencies
  angular.module('pwi.gxd', ['formly', 'formlyBootstrap', 'ui.bootstrap', 'ui.bootstrap.tpls', 'ngResource']);

})();
