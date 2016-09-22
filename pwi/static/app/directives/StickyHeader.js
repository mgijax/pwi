//--  >  09/09/1995
//--  <  09/09/1995
//--  >= 09/09/1995
//--  <= 09/09/1995
//--  07/01/2005..07/06/2005 (between)
//--  07/01/2005 (=)

(function() {
	'use strict';
	angular.module('pwi')

	.directive('stStickyHeader', ['$window', function ($window) {
		return {
			require: '^?stTable', link: function (scope, element, attr, ctrl) {
				var stickyHeader = lrStickyHeader(element[0]);
				scope.$on('$destroy', function () {
					stickyHeader.clean();
				});

				scope.$watch(function () {
					return ctrl.tableState();
				}, function () {
					$window.scrollTo(0, lrStickyHeader.treshold);
				}, true)
			}
		}
	}]);

})();
