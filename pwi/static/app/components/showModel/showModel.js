(function () {
    'use strict';
    function ShowModelController($scope, $element, $attrs) {
      var ctrl = this;
      ctrl.hideApiDomain = true
      ctrl.hideVmData = true
    }
    angular.module('pwi').component('showModel', {
        templateUrl: '/pwi/static/app/components/showModel/showModel.html',
        controller: ShowModelController,
        bindings: {
            vm: '='
        }
    })
})();
