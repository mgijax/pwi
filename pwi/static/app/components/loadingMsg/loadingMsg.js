(function () {
    'use strict';
    function LoadingMsgController($scope, $element, $attrs, $timeout) {
      var ctrl = this;
      ctrl.start = function () {
          ctrl.startTime = new Date()
          ctrl.elapsedTime = 0 // in sec
          ctrl.tick()
      }
      ctrl.tick = function () {
          const currTime = new Date()
          ctrl.elapsedTime = Math.floor((currTime - ctrl.startTime) / 1000)
          // Cannot use window.setTimeout here.
          // See https://stackoverflow.com/questions/41301805/angular-1-5-1-view-value-not-updating
          if (ctrl.showing) $timeout(ctrl.tick, 1000)
      }
      ctrl.$onChanges = function (chg) {
          if (chg.showing) {
              if (chg.showing.currentValue = true) {
                  ctrl.start()
              }
          }
      }
    }
    angular.module('pwi').component('loadingMsg', {
        templateUrl: '/pwi/static/app/components/loadingMsg/loadingMsg.html',
        controller: LoadingMsgController,
        bindings: {
            showing: '<'
        }
    })
})();
