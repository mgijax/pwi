/*
* JS for the Vue user module client
*/
(function(){
	"user strict";
	
	// Prototype code goes here
	
	
	window.userVue = new Vue({
		
		el: "#target",
		
		data: {
			user: {
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
			}
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

	      // Examples based on Vue-Resource Tutorial
	      //
//	      // GET user/1000
//	      resource.get({key: 1000}).then((response) => {
//	    	  console.log("get success");
//	          this.$set('user', response.json())
//	      });

//	      // POST user
//	      resource.save(this.user).then((response) => {
//	          // success callback
//	    	  console.log(response.data);
//	      }, (response) => {
//	          // error callback
//	    	  console.log("post error");
//	      });
//
//	      // DELETE user/1560
//	      resource.delete({key: 1560}).then((response) => {
//	          // success callback
//	    	  console.log("delete success");
//	      }, (response) => {
//	          // error callback
//	    	  console.log("delete error");
//	      });
	      
	    },
	    
	    methods: {
	    	search: function() {
	    		this.userResource.get(this.user).then((response) => {
	    			console.log(response.data);
	    			this.searchResults = response.data
	    		});
	    	},
	    	
	    	reset: function() {
	    		this.user = {
					login:'',
					name:'',
					_usertype_key:null,
					_userstatus_key:null
				};
	    	},
	    	
	    	getUser: function(index) {
	    		var users = this.searchResults.results;
	    		console.log("get user = "+ users[index].login);
	    		this.user = users[index];
	    		// save index for when we delete
	    		this.user.arrayIndex = index;
	    	},
	    	
	    	save: function() {
	    		if (this.user._user_key) {
	    			// update existing user
	    			this.userResource.update({key: this.user._user_key}, this.user).then((response) => {
	    		          // success callback
	    				  this.user = response.data;
	    				  console.log("updated user " + this.user.login);
	    				  alert("updated user " + this.user.login);
	    		    	  console.log(response.data);
	    		    }, (response) => {
	    		          // error callback
	    		    	  console.log("update error");
	    		    	  alert("update error");
	    		    });
	    			
	    		}
	    		else {
	    			// create new user
	    			this.userResource.save(this.user).then((response) => {
	    		          // success callback
	    				  this.user = response.data;
	    				  console.log("created new user " + this.user.login);
	    				  alert("created new user " + this.user.login);
	    		    	  console.log(response.data);
	    		    }, (response) => {
	    		          // error callback
	    		    	  console.log("post error");
	    		    	  alert("post error");
	    		    });
	    		}
	    	},
	    	
	    	delete: function() {
	    		if (this.user._user_key && confirm("Do you want to delete user " + this.user.login + "?")) {
	    			// delete existing user
	    			this.userResource.delete({key: this.user._user_key}).then((response) => {
	    		          // success callback
	    				  console.log("deleted user");
	    				  
	    				  // remove from view
	    				  this.searchResults.results.splice(this.user.arrayIndex, 1);
	    				  this.searchResults.total_count -= 1;
	    				  this.reset();
	    				  
	    				  alert("deleted user");
	    		    	  console.log(response.data);
	    		    }, (response) => {
	    		          // error callback
	    		    	  console.log("delete error");
	    		    	  alert("delete error");
	    		    });
	    			
	    		}
	    	}
	    }

	});
	
})();