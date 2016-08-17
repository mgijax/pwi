/*
* JS template for user module prototype
* Using angular
*/
(function(){
	"user strict";
	
	// Prototype code goes here
	
	var userApp = angular.module('userApp', ['ngResource']);
	
	// HACK:
	// Fix number to string conversion in angualar directives
	userApp.directive('convertToNumber', function() {
		  return {
		    require: 'ngModel',
		    link: function(scope, element, attrs, ngModel) {
		      ngModel.$parsers.push(function(val) {
		        return val ? parseInt(val, 10) : null;
		      });
		      ngModel.$formatters.push(function(val) {
		        return val ? '' + val : null;
		      });
		    }
		  };
		});
	
	
	// set up our REST API resources
	
	userApp.factory('Users', ['$resource', function($resource) {
		return $resource(window.USER_API_BASE_URL + ':key', null,
				{
					'update': {method: 'PUT'}
				});
	}]);
	
	userApp.factory('UserStatuses', ['$resource', function($resource) {
		return $resource(window.STATUS_LIST_URL);
	}]);
	
	userApp.factory('UserTypes', ['$resource', function($resource) {
		return $resource(window.TYPE_LIST_URL);
	}]);
	
	
	
	userApp.controller('UserController', 
	  ['$scope', 'Users', 'UserStatuses', 'UserTypes',
		function UserController($scope, Users, UserStatuses, UserTypes) {
	
		// define the model
		$scope.vm = {
			userForm: {
				login:'',
				name:'',
				_usertype_key:null,
				_userstatus_key:null
			},
			
			userTypes: [],
			userStatuses: [],
			termLookup: {},
			searchResults: {
				total_count: 0,
				items: []
			},
			dataModified: false,
			processing: false,
			editedUsers:{}	
		};
		
		
		// initialize the dropdowns
		UserStatuses.get(function(response){
			$scope.vm.userStatuses = response.choices;
		});
	
		UserTypes.get(function(response){
			$scope.vm.userTypes = response.choices;
		});
		
		
		$scope.search = function() {
			
	    	$scope.loadingOn("Performing Search");
	    		
			Users.get($scope.vm.userForm).$promise
			.then(function(response){
				// success callback
				$scope.vm.searchResults = response;
			}, function(error){
				$scope.ajaxError(error);
			}).finally($scope.loadingOff);
			
    		$scope.vm.dataModified = false;
    		$scope.vm.editedUsers = {};
		};
		
		$scope.createUser = function() {
    		
			// create new user
    		$scope.loadingOn("Creating User " + $scope.vm.userForm.login);

			Users.save($scope.vm.userForm).$promise
			.then(function(response) {
		          // success callback
				  $scope.vm.userForm = response;
		    }, function(error) {
		    	$scope.ajaxError(error);
		    }).finally(this.loadingOff);
			
    	};
    	
    	$scope.deleteUser = function(index) {
    		
    		var user = $scope.vm.searchResults.items[index];
    		if (user._user_key) {
    			
    			// delete existing user
    			$scope.loadingOn("Deleting User " + user.login);
    			Users.delete({key: user._user_key}).$promise
    			.then(function(response) {
    		          // success callback
    				  console.log("deleted user");
    				  
    				  // remove from view
    				  $scope.vm.searchResults.items.splice(index, 1);
    				  $scope.vm.searchResults.total_count -= 1;
    				  
    		    	  console.log(response.data);
    		    }, function(error) {
    		    	$scope.ajaxError(error);
    		    }).finally($scope.loadingOff);
    			
    		}
    	};
    	
    	
    	$scope.saveUsers = function() {
    		
    		
    		var saveCount = 0;
    		for (key in $scope.vm.editedUsers) {
    		  saveCount += 1;
    		  
    		  $scope.loadingOn("Saving Changes to Users");
    		  var user = $scope.vm.editedUsers[key];
    		  // save existing user
			  Users.update({key: user._user_key}, user).$promise
			  .then(function(response) {
		          // success callback
		    	  saveCount -= 1;
				  console.log("updated user " + response.login);
				  
		    	  console.log(response);
		      }, function(error) {
		          // error callback
		    	  saveCount -= 1;
		    	  $scope.ajaxError(error);
		      }).finally(function(){
		    	  if (saveCount <= 0) {
		    		  $scope.loadingOff();
		    	  }
		      });

    		}
    		
    		$scope.vm.dataModified = false;
    		$scope.vm.editedUsers = {};
    	};
		
		
		$scope.reset = function() {
    		$scope.vm.userForm = {
				login:'',
				name:'',
				_usertype_key:null,
				_userstatus_key:null
			};
    	};
    	
    	$scope.editedUser = function(user) {
    		$scope.vm.editedUsers[user._user_key] = user;
    		$scope.vm.dataModified = true;
    	};
    	
    	
    	
    	$scope.copyUser = function(user) {
    		$scope.vm.userForm = user;
    	};
    	
    	
    	$scope.loadingOn = function(msg) {
	    	$scope.vm.processing = true;
	    	
//	    	var customElement = $("<div>", {
//	    		text: msg,
//	    		css: {
//	    			'font-size': '50px',
//	    			'margin-top': '-200px'
//	    		}
//	    	});
//	    	$("main").LoadingOverlay("show", {
//	    		resizeInterval: 20,
//	    		custom: customElement
//	    	});
	    };
	    
	    $scope.loadingOff = function() {
	    	$scope.vm.processing = false;
	    	//$("main").LoadingOverlay("hide", true);
	    };
	    
	    
	    $scope.ajaxError = function(error) {
	    	console.log(error.data.error + " - " + error.data.message);
	    	alert(error.data.error + " - " + error.data.message);
	    };
		
	}]);
	
})();