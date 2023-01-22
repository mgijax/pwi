(function () {
    'use strict';
    function PaginatorController($scope, $element, $attrs) {
      const ctrl = this
      // ------------------------
      // The following are properties passed into the component
      // ctrl.pageSize = 250 -- default page size is 250
      // ctrl.totalRows = 0  -- total number of rows in result
      // ------------------------
      ctrl.pageNum = 0
      ctrl.nPages = 0
      ctrl.pageFirstRow = 0
      ctrl.pageLastRow = 0
      ctrl.gotoPages = []

      ctrl.$onChanges = (chgObj) => {
          recalc(true)
      }

      function recalc (quietly) {
          ctrl.nPages = Math.ceil(ctrl.totalRows / ctrl.pageSize)
          ctrl.pageFirstRow = ctrl.pageSize * ctrl.pageNum + 1
          ctrl.pageLastRow  = Math.min(ctrl.pageFirstRow + ctrl.pageSize - 1, ctrl.totalRows)
          ctrl.gotoPages = [ctrl.pageNum - 1, ctrl.pageNum, ctrl.pageNum + 1].filter(p => p >=0 && p < ctrl.nPages)
          if (!quietly) ctrl.onUpdate({ pageFirstRow: ctrl.pageFirstRow, pageNRows: ctrl.pageSize })
      }

      ctrl.firstPage = function () {
          ctrl.pageNum = 0
          recalc()
      }
      ctrl. lastPage = function () {
          ctrl.pageNum = ctrl.nPages - 1
          recalc()
      }
      ctrl. nextPage = function () {
          ctrl.pageNum = Math.min(ctrl.nPages - 1, ctrl.pageNum + 1)
          recalc()
      }
      ctrl.prevPage = function () {
          ctrl.pageNum = Math.max(0, ctrl.pageNum - 1)
          recalc()
      }
      ctrl.gotoPage = function (n) {
          ctrl.pageNum = Math.min(ctrl.nPages - 1, Math.max(0, n))
          recalc()
      }
    }
    angular.module('pwi').component('paginator', {
        templateUrl: '/pwi/static/app/components/paginator/paginator.html',
        controller: PaginatorController,
        bindings: {
            pageSize: '<',
            totalRows: '<',
            onUpdate: '&'
        }
    })
})();
