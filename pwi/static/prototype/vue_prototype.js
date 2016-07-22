/*
* JS for the Vue user module client
*/
(function(){
	"user strict";
	
	// Prototype code goes here
	
	
	window.userVue = new Vue({
		
		el: "#target",
		
		data: {
			userForm: {
				login:'',
				name:'',
				_usertype_key:null,
				_userstatus_key:null
			},
			
			userTypes: [],
			userStatuses: [],
			searchResults: {
				total_count: 0,
				results: []
			},
			dataModified: false,
			processing: false,
			editedUsers:{},
			
		},

	    ready: function() {
	      var typeResource = this.$resource(TYPE_LIST_URL);
	      
	      typeResource.get().then((response) => {
	    	  this.userTypes = response.data.choices;
	      });
	      
	      var statusResource = this.$resource(STATUS_LIST_URL);
	      
	      statusResource.get().then((response) => {
	    	  this.userStatuses = response.data.choices;
	      });
	      

	      this.userResource = this.$resource(USER_API_BASE_URL+'{/key}');

	    },
	    
	    methods: {
	    	search: function() {
	    		
	    		this.processing = true;
	    		var _self = this;
	    		this.userResource.get(this.userForm).then((response) => {
	    			console.log(response.data);
	    		
	    			for(var i=0; i<response.data.results.length; i++) {
	    				response.data.results[i].selected = false;
	    			}
	    			this.searchResults = response.data;
	    			
	    		}, (response) => {
  		          // error callback
  		    	  console.log(response.data.error);
  		    	alert(response.data.error);
	    		}).finally(function(){
	    			_self.processing = false;
	    		});
	    	},
	    	
	    	reset: function() {
	    		this.userForm = {
					login:'',
					name:'',
					_usertype_key:null,
					_userstatus_key:null
				};
	    		this.searchResults = {
					total_count: 0,
					results: []
				};
	    		this.dataModified = false;
	    		this.editedUsers = {};
	    	},
	    	
	    	createUser: function() {
	    		
    			// create new user
	    		this.processing = true;
	    		var _self = this;
    			this.userResource.save(this.userForm).then((response) => {
    		          // success callback
    				  this.userForm = response.data;
    				  console.log("created new user " + this.user.login);
    		    	  console.log(response.data);
    		    }, (response) => {
    		          // error callback
    		    	  console.log(response.data.error);
    		    	  alert(response.data.error);
    		    }).finally(function(){
    		    	_self.processing = false;
    		    });
	    	},
	    	
	    	
	    	deleteUser: function(user) {
	    		
	    		if (user._user_key && confirm("Do you want to delete user " + user.login + "?")) {
	    			// delete existing user
	    			this.processing = true;
	    			var _self = this;
	    			this.userResource.delete({key: this.user._user_key}).then((response) => {
	    		          // success callback
	    				  console.log("deleted user");
	    				  
	    				  // remove from view
	    				  //this.searchResults.results.splice(this.user.arrayIndex, 1);
	    				  //this.searchResults.total_count -= 1;
	    				  
	    		    	  console.log(response.data);
	    		    }, (response) => {
	    		          // error callback
	    		    	  console.log(response.data.error);
	    		    	  alert(response.data.error);
	    		    }).finally(function(){
	    		    	_self.processing = false;
	    		    });
	    			
	    		}
	    	},
	    	
	    	editedUser: function(user) {
	    		this.editedUsers[user._user_key] = user;
	    		this.dataModified = true;
	    	},

	    	
	    	saveUsers: function() {
	    		
	    		
	    		var saveCount = 0;
	    		var _self = this;
	    		for (key in this.editedUsers) {
	    		  saveCount += 1;
	    		  
	    		  this.processing = true;	
	    		  var user = this.editedUsers[key];
	    		  // save existing user
    			  this.userResource.update({key: user._user_key}, user).then((response) => {
    		          // success callback
    		    	  saveCount -= 1;
    				  console.log("updated user " + response.data.login);
    				  
    		    	  console.log(response.data);
    		      }, (response) => {
    		          // error callback
    		    	  saveCount -= 1;
    		    	  console.log(response.data.error);
    		    	  alert(response.data.error);
    		      }).finally(function(){
    		    	  if (saveCount <= 0) {
    		    		  _self.processing = false;
    		    	  }
    		      });

	    		}
	    		

	    		this.dataModified = false;
	    		this.editedUsers = {};
	    	}
	    }

	});
	
})();