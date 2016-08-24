//--  >  09/09/1995
//--  <  09/09/1995
//--  >= 09/09/1995
//--  <= 09/09/1995
//--  07/01/2005..07/06/2005 (between)
//--  07/01/2005 (=)

(function() {
	'use strict';
	angular.module('pwi.gxd')
		.directive('dateformatmodal', function () {
			return {
				template: '<div class="modal fade">' + 
						'<div class="modal-dialog">' + 
							'<div class="modal-content">' + 
								'<div class="modal-header">' + 
									'<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' + 
									'<h2>Date Format Search Options</h2>' +
								'</div>' + 
								'<div class="modal-body" ng-transclude>' +
									'<h4>mm/dd/yyyy</h4> for records that are equal to this date' + 
									'<h4>>  mm/dd/yyyy</h4> for records greater than this date' + 
									'<h4><  mm/dd/yyyy</h4> for records less than this date' + 
									'<h4>>=  mm/dd/yyyy</h4> for records greater than or equal to this date' + 
									'<h4><=  mm/dd/yyyy</h4> for records less than or equal to this date' + 
									'<h4>mm/dd/yyyy..mm/dd/yyyy</h4> for records between these two dates' + 

								'</div>' + 
							'</div>' + 
						'</div>' + 
					'</div>',
				restrict: 'E',
				transclude: true,
				replace:true,
				scope:true,
				link: function postLink(scope, element, attrs) {
					scope.$watch(attrs.visible, function(value) {
						if(value == true)
							$(element).modal('show');
						else
							$(element).modal('hide');
					});

					$(element).on('shown.bs.modal', function() {
						scope.$apply(function(){
							scope.$parent[attrs.visible] = true;
						});
					});

					$(element).on('hidden.bs.modal', function() {
						scope.$apply(function(){
							scope.$parent[attrs.visible] = false;
						});
					});
				}
			};
		});

})();
