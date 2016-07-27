/*
* JS template for user module prototype
*/
(function(){
	"user strict";
	
	// Prototype code goes here
	
	App.Router.map(function() {
		this.route("users", {path: "/pwi/api/user"});
		this.route("user", {path: "/pwi/api/user/:key"});
	});
	
	App.UsersRoute = Ember.Route.extend({
		model: function(params) {
			return App.User.find();
		}
	});
	
	App.UserRoute = Ember.Route.extend({
		mode: function(params) {
			return App.User.find(params.key);
		}
	});
	
	App.User = DS.Model.extend({
		login: DS.attr("string"),
		name: DS.attr("string")
	});
	
	
	App.UserController = Ember.ObjectController.extend({
	  
	});
	
	App.UserView = Ember.View.extend({
	  // This can be omitted when we're created by a route.
	  templateName: 'user'

	  // Any HTML event handlers would go here if we needed them.  Our job is to
	  // map between HTML events and events understood by the controller.
	  //doubleClick: function (evt) {
	  //  // We'll actually bind this to a specific button, not a click event.
	  //  this.get("controller").send("showLowRatedComments");
	  //}
	});
	
	
})();