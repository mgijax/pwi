/*
* JS for the Vue user module client
*/
(function(){
	"user strict";
	
	// Prototype code goes here
	
	
	// initialize toastr error messages
	toastr.options = {
	  "closeButton": true,
	  "debug": false,
	  "newestOnTop": false,
	  "progressBar": false,
	  "positionClass": "toast-top-center",
	  "preventDuplicates": true,
	  "onclick": null,
	  "showDuration": "300",
	  "hideDuration": "1000",
	  "timeOut": 0,
	  "extendedTimeOut": 0,
	  "tapToDismiss": false,
	  "showEasing": "swing",
	  "hideEasing": "linear",
	  "showMethod": "fadeIn",
	  "hideMethod": "fadeOut"
	}
	
	
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
			termLookup: {},
			searchResults: {
				total_count: 0,
				items: []
			},
			dataModified: false,
			processing: false,
			editedUsers:{},
			
		},

	    ready: function() {
	    	
	      this.searchResults.items = [];
	      
	      
	      // set up our REST endpoints
	      var typeResource = this.$resource(TYPE_LIST_URL);
	      
	      typeResource.get().then((response) => {
	    	  this.userTypes = response.data.choices;
	      });
	      
	      var statusResource = this.$resource(STATUS_LIST_URL);
	      
	      statusResource.get().then((response) => {
	    	  this.userStatuses = response.data.choices;
	    	  for (var i=0; i< this.userStatuses.length; i++) {
	    		  var term = this.userStatuses[i];
	    		  this.termLookup[term.term] = term._term_key;
	    		  this.termLookup[term._term_key] = term.term;
	    	  }
	      });
	      

	      this.userResource = this.$resource(USER_API_BASE_URL+'{key}');

	    },
	    
	    methods: {
	    	search: function() {
	    		
	    		this.loadingOn("Performing Search");
	    		
	    		var _self = this;
	    		this.userResource.get(this.userForm).then((response) => {
	    			console.log(response.data);
	    		
	    			this.searchResults = response.data;
	    			
	    		}, (response) => {
    		    	_self.ajaxError(response);
    		    }).finally(this.loadingOff);
	    		
	    		this.dataModified = false;
	    		this.editedUsers = {};
	    	},
	    	
	    	reset: function() {
	    		this.userForm = {
					login:'',
					name:'',
					_usertype_key:null,
					_userstatus_key:null
				};
	    	},
	    	
	    	createUser: function() {
	    		
    			// create new user
	    		this.loadingOn("Creating User " + this.userForm.login);
	    		var _self = this;
    			this.userResource.save(this.userForm).then((response) => {
    		          // success callback
    				  this.userForm = response.data;
    				  console.log("created new user " + this.user.login);
    		    	  console.log(response.data);
    		    }, (response) => {
    		    	_self.ajaxError(response);
    		    }).finally(this.loadingOff);
	    	},
	    	
	    	
	    	deleteUser: function(index) {
	    		
	    		var user = this.searchResults.items[index];
	    		if (user._user_key) {

	    			var _self = this;
	    			
	    			this.displayAreYouSure("Are you sure you want to delete user " + user.login + "?", function(){
		    			// delete existing user
		    			_self.loadingOn("Deleting User " + user.login);
		    			_self.userResource.delete({key: user._user_key}).then((response) => {
		    		          // success callback
		    				  console.log("deleted user");
		    				  
		    				  // remove from view
		    				  _self.searchResults.items.splice(index, 1);
		    				  _self.searchResults.total_count -= 1;
		    				  
		    		    	  console.log(response.data);
		    		    }, (response) => {
		    		    	_self.ajaxError(response);
		    		    }).finally(_self.loadingOff);
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
	    		  
	    		  this.loadingOn("Saving Changes to Users");
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
    		    	  _self.ajaxError(response);
    		      }).finally(function(){
    		    	  if (saveCount <= 0) {
    		    		  _self.loadingOff();
    		    	  }
    		      });

	    		}
	    		
	    		this.dataModified = false;
	    		this.editedUsers = {};
	    	},
		    
	    	copyUser: function(user) {
	    		this.userForm = user;
	    	},
	    	
	    	
	    	// All functions below could be global utilities
	    	
		    loadingOn: function(msg) {
		    	this.processing = true;
		    	
		    	var customElement = $("<div>", {
		    		text: msg,
		    		css: {
		    			'font-size': '50px',
		    			'margin-top': '-200px'
		    		}
		    	});
		    	$("main").LoadingOverlay("show", {
		    		resizeInterval: 20,
		    		custom: customElement
		    	});
		    },
		    
		    loadingOff: function() {
		    	this.processing = false;
		    	$("main").LoadingOverlay("hide", true);
		    },
		    
		    ajaxError: function(response) {
		    	console.log(response.data.message);
		    	this.displayError(response.data.message);
		    },
		    
		    displayError: function(msg) {
		    	var toast = toastr.error(msg + '<br><br><button type="button" class="btn clear">Acknowledge</button>', 'Error');
		    	$(".toast-message .clear").click(function(){
		    		toastr.clear(toast, { force: true });
		    	});
		    },
		    
		    displayAreYouSure: function(msg, callback) {
		    	var toast = toastr.warning(msg + '<br><br><button type="button" class="btn clear">Yes</button>');
		    	$(".toast-message .clear").click(function(){
		    		toastr.clear(toast, { force: true });
		    		callback();
		    	}); 
		    }
	    },

	});
	
})();