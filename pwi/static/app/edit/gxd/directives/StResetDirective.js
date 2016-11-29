(function() {
	'use strict';
	angular.module('pwi.gxd')
		.directive('stReset', function() {
			return {
				require: '^stTable',
				scope: { stReset: "=stReset" },
				link: function (scope, element, attr, ctrl) {
                
					scope.$watch("stReset", function () {
						  
						if (scope.stReset) {

							// remove local storage
							if (attr.stPersist) {
								localStorage.removeItem(attr.stPersist);
							}

							// reset table state
							var tableState = ctrl.tableState();
							tableState.search = {};
							tableState.sort = {predicate: "name", reverse: false};
							ctrl.pipe();
							// reset scope value
							scope.stReset = false;
						}

					});
				}
			};
		});

})();
