/*
* Creates the MGIHistory widget
*
* Requires:
*   jQuery
*
*
* Usage:
*   // send events whenever something happens you want to track
*   MGIHistory.pushEvent({event1 : "value"});
*   MGIHistory.pushEvent({event2 : "value2"});
*   
*   // state will look like {event1: "value", event2: "value"}
*
*   // Then override onchange function to instrument your state changes
*   MGIHistory.onchange = function(state, changed) {
*   {
*     if ("event1" in changed) { ... do code to replay event1 ... }
*     if ("event2" in changed) { ... do code to replay event2 ... }
*     //etc...
*   }
*
*   // onchange is only called when user hits back / forward buttons
*   // OR if reloaded from a bookmark
*
*/

(function(){
"use strict";


var MGIHistory = {


  // Stores the current state object
  CURRENT_STATE : {},

  /*
  * push {...} params into the history object
  *   If any of the variables in params differ from 
  *   the current state, we register a new history state.
  *
  * NOTE: Any param in current state, but not params is treated
  *   as unchanged. Keys cannot be removed from the current state, but
  *   can only be set to null explicitly.
  */
  pushEvent : function(params){
    
    var isChanged = false;

    for (var key in params) {
      if (MGIHistory.CURRENT_STATE[key] != params[key]) {
        
        isChanged = true;
        MGIHistory.CURRENT_STATE[key] = params[key];
      }
    } 

    // only push new history state if current state has changed
    if (isChanged) {
      var url = "#" + $.param(MGIHistory.CURRENT_STATE);
      history.pushState(MGIHistory.CURRENT_STATE,"",url);
    }
  },


  /*
  * Override this method, which is called on every state change.
  *   A state change is only detected if values from one event
  *   to the next are different.
  * Is automatically called on page load if url fragment exists
  *
  * Arguments:
  *   state: the current state object
  *   changed: only the key value pairs that have changed since last state
  */
  onchange : function(state, changed) {},

  /*
  * reverse of jQuery $.param
  *  turns string representation into object
  */
  deparam : function(query_string) {
    var query_obj = {};
    var vars = query_string.split("&");
    for (var i=0;i<vars.length;i++) {
      var pair = vars[i].split("=");
      pair[0] = decodeURIComponent(pair[0]);

      // if array format, remove brackets
      if (pair[0].slice(-2) == '[]') {
        pair[0] = pair[0].slice(0,-2);
      }

      pair[1] = decodeURIComponent(pair[1]);
      // If first entry with this name
      if (typeof query_obj[pair[0]] === "undefined") {
        query_obj[pair[0]] = pair[1];
      // If second entry with this name
      } else if (typeof query_obj[pair[0]] === "string") {
        var arr = [ query_obj[pair[0]], pair[1] ];
        query_obj[pair[0]] = arr;
      // If third or later entry with this name
      } else {
        query_obj[pair[0]].push(pair[1]);
      }
    } 
    return query_obj;
  },


  /*
  * Check if newState is different from CURRENT_STATE
  *  If so, fire onchange function
  */
  checkHistoryChange : function(newState) {
      var changed = {};
      // check if state has changed
      for (var key in newState) {
        if (MGIHistory.CURRENT_STATE[key] != newState[key]) {
          changed[key] = newState[key];
        }
      }

      // call onchange if state has changed
      if (!$.isEmptyObject(changed)) {
        MGIHistory.CURRENT_STATE = newState;
        MGIHistory.onchange(newState, changed);
      }
    
  },

  /* 
  * initialize necessary event listeners
  */ 
  init : function() {
    $(window).on("popstate",function(event) {
      var newState = event.originalEvent.state;
      MGIHistory.checkHistoryChange(newState);
    });

    // also check window state on initialization
    var currentState = history.state;
    if (!currentState) {
      // check hash
      if (window.location.hash) {
        var url = window.location.hash.slice(1);
        currentState = MGIHistory.deparam(url);
      }
    }

    if (currentState) {
      MGIHistory.checkHistoryChange(currentState);
    }
   
  }

};


$(function(){
  MGIHistory.init();
});

// expose global object
window.MGIHistory = MGIHistory;

})();
