(function () {
    'use strict';
    function PaginatorController($scope, $element, $attrs) {

      const ctrl = this

      let pageScope = $scope
      while (!pageScope.paginators) pageScope = pageScope.$parent
      pageScope.paginators.push(this)

      /* In order to support multiple paginator controls on a page (i.e., at the top and bottom of the results table),
       * they must either (1) all share the same underlying model data or (2) have their own model data but act in sync.
       * I went with (2). The page scope (see PageController) has a global list of all paginators on the page.
       * Each one adds itself when it is created. Actions list nextPage(), lastPage(), etc, are applied to all.
       */
      ctrl.allPaginators = pageScope.paginators
      
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
	  ctrl.pageNum = Math.min(Math.max(ctrl.pageNum,0), ctrl.nPages - 1)
	  ctrl.onFirstPage = (ctrl.pageNum === 0)
	  ctrl.onLastPage  = (ctrl.pageNum === ctrl.nPages - 1)
          ctrl.pageFirstRow = ctrl.pageSize * ctrl.pageNum + 1
          ctrl.pageLastRow  = Math.min(ctrl.pageFirstRow + ctrl.pageSize - 1, ctrl.totalRows)
          ctrl.gotoPages = [ctrl.pageNum - 1, ctrl.pageNum, ctrl.pageNum + 1].filter(p => p >=0 && p < ctrl.nPages)
	  // edge cases:
	  if (ctrl.pageNum === 0 && ctrl.nPages >= 3) {
	      ctrl.gotoPages.push(2);
	  } else if (ctrl.pageNum === ctrl.nPages - 1 && ctrl.nPages >= 3) {
	      ctrl.gotoPages.unshift(ctrl.nPages - 3);
	  }
          if (!quietly) ctrl.onUpdate({ pageFirstRow: ctrl.pageFirstRow, pageNRows: ctrl.pageSize })
      }

      //
      ctrl.applyToAll = function (name) {
          // apply the function. Only the first pagniator instance (index === 0) actually
          // announces the change to the controller.
          ctrl.allPaginators.forEach((p,i) => p[name](i === 0))
      }

      ctrl.firstPage = function () {
          ctrl.applyToAll('_firstPage')
      }
      ctrl.lastPage = function () {
          ctrl.applyToAll('_lastPage')
      }
      ctrl. nextPage = function () {
          ctrl.applyToAll('_nextPage')
      }
      ctrl.prevPage = function () {
          ctrl.applyToAll('_prevPage')
      }
      ctrl.gotoPage = function (n) {
          ctrl.allPaginators.forEach((p,i) => p._gotoPage(n, i === 0))
      }

      ctrl._firstPage = function (quietly) {
          ctrl.pageNum = 0
          recalc(quietly)
      }
      ctrl._lastPage = function (quietly) {
          ctrl.pageNum = ctrl.nPages - 1
          recalc(quietly)
      }
      ctrl._nextPage = function (quietly) {
          ctrl.pageNum = Math.min(ctrl.nPages - 1, ctrl.pageNum + 1)
          recalc(quietly)
      }
      ctrl._prevPage = function (quietly) {
          ctrl.pageNum = Math.max(0, ctrl.pageNum - 1)
          recalc()
      }
      ctrl._gotoPage = function (n, quietly) {
          ctrl.pageNum = Math.min(ctrl.nPages - 1, Math.max(0, n))
          recalc(quietly)
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
