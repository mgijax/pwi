// Place to put global MGI helper functions

/*
* Special helper class for dealing with dynamic content
* author: kstone
*/
var MGIAjax = {
	// Global config variables that can be modified if needed
	// number of times to retry a failed ajax call
	TIMES_TO_RETRY:5,
	// time between retries
	RETRY_TIMEOUT:2000,// 2 seconds
	AJAX_TIMEOUT:90000, // 90 seconds. If users get this error a lot, we should probably up this.

	RETRY_MESSAGE:"<span>Failed to retrieve content. Retrying...</span>",
	GENERIC_ERROR_MESSAGE:"<span style=\"color:red;\">Error retrieving content.</span> "+
		"<a href=\"http://www.informatics.jax.org/mgihome/support/mgi_inbox.shtml\">Please contact user support.</a>",
	TIMEOUT_ERROR_MESSAGE:"<span style=\"color:red;\">Error request timed out.</span> "+
		"<a href=\"http://www.informatics.jax.org/mgihome/support/mgi_inbox.shtml\">Please contact user support.</a>",
	// Variable to track status of multiple ajax calls when errors occur
	RETRY_TRACKER : {},
	handleAjaxError : function(textStatus,contentID,loadingID,loadFunction)
	{
		// retry until the retry limit... unles we have a timeout error
		if(MGIAjax.RETRY_TRACKER[contentID] < MGIAjax.TIMES_TO_RETRY && textStatus!="timeout")
		{
			MGIAjax.RETRY_TRACKER[contentID]+=1;
			// set the error indicating we are attempting to retry the ajax call.
			if(MGIAjax.RETRY_TRACKER[contentID]==1) $(contentID).append(MGIAjax.RETRY_MESSAGE);
			setTimeout(loadFunction,MGIAjax.RETRY_TIMEOUT);
		}
		else
		{
			$(loadingID).hide();
			if(textStatus=="timeout"){ $(contentID).html(MGIAjax.TIMEOUT_ERROR_MESSAGE); }
			else{ $(contentID).html(MGIAjax.GENERIC_ERROR_MESSAGE); }
		}
	},
	// to load ajax content, simply provide the url and the id of the container we want the content loaded into
	// the div of the loading gif must be of format "contentID_loading"
	// for multiple uses of this function, be sure to use unique contentIDs
	loadContent : function(url, contentID, successCallback, errorCallback)
	{
		var contentID = "#"+contentID;
		var loadingID = contentID+"_loading";
		
		$(loadingID).show();
		
		url = window.encodeURI(url);

		// use contentID as key for error handling
		MGIAjax.RETRY_TRACKER[contentID] = 0;

		// define the load function
		var loadJson = function ()
		{
			$.get(url, ajaxResponse)
			.error(ajaxError );
		}

		// define the success and error handling functions

		//Ajax Success function
		var ajaxResponse = function(data)
		{
			$(contentID).html(data);
			$(loadingID).hide();
			
			if (successCallback) {
				successCallback();
			}
		}

		//Ajax Error function
		var ajaxError = function(jqXHR, textStatus, errorThrown)
		{
			// if defined errorCallback
			if (errorCallback) {
				errorCallback(jqXHR, textStatus, errorThrown);
			}
			MGIAjax.handleAjaxError(textStatus,contentID,loadingID,loadJson);
		}

		// set cross origin support
		$.support.cors = true;
		// set the ajax timeout
		$.ajaxSetup({ timeout: MGIAjax.AJAX_TIMEOUT });
		// kick off the ajax call
		loadJson();
	},
	
	/*
	 * Set a default popup to appear for all ajax errors
	 * 
	 * any ajax error that returns as a JSON response with the flag
	 * 	"jsonerror": true
	 * will not trigger the popup. This is the default response type
	 * for all pwi JSON requests that throw specific validation errors
	 * Such errors are meant to be caught separately, such as in 
	 * an errorCallback, and inspected on jqXHR.responseJSON
	 *
	 *
	 * To enable, call MGIAjax.enableAjaxErrorDefaultPopup()
	 */
	enableAjaxErrorDefaultPopup: function() {
		var errorDialog = $("<div></div>").appendTo("body")
			.attr("id","errorDialog");
	
		errorDialog.dialog({
			modal: true,
			buttons: {
				Ok: function() {
					errorDialog.dialog("close");
				}
			},
			close: function() {
				errorDialog.html("");
			},
			height: 500,
			width: 500,
			dialogClass: "error"
		}).dialog("close");
	
		$(document).ajaxError(function(event, jqxhr, settings, thrownError){
	
			var title = thrownError.name || thrownError;
			if (!title || title == "") {
				title = "Error";
			}
	
			var response = jqxhr.responseText;
			if (!response || response == "") {
				if (jqxhr.status == 0) {
					response = "No response from server. Server might be down.";
				}
			}
			else {
				if (response.indexOf("\"jsonerror\": true") >= 0) {
					
					return;
				}
			}
	
			$("<pre></pre>").appendTo(errorDialog)
				.addClass("error")
				.text(thrownError.stack);
	
			var iframe = document.createElement('iframe');
			iframe.src = 'data:text/html;chartset=utf-8,' + encodeURI(response);
			iframe.style.width = "100%";
			iframe.style.height = "100%";
			errorDialog.append(iframe);
	
			errorDialog.dialog( {title: title} );

		});	
	}
};


/*
* Can contain various browser related actions that require javascript to perfom
*/
MGIActions = {
	/*
	* Sends a post request by mocking a form object and attaching the supplied params
	* Usage: MGI_ACTIONS.post_to_url("someformurl",{"arg1":"val1","arg2":"val2"});
	*/
	postToUrl : function(path,params)
	{
		method = "post";
		// The rest of this code assumes you are not using a library.
		// It can be made less wordy if you use one.
		var form = document.createElement("form");
		form.setAttribute("method", method);
		form.setAttribute("action", path);

		for(var key in params) {
		    if(params.hasOwnProperty(key)) {
			var hiddenField = document.createElement("input");
			hiddenField.setAttribute("type", "hidden");
			hiddenField.setAttribute("name", key);
			hiddenField.setAttribute("value", params[key]);

			form.appendChild(hiddenField);
		     }
		}

		document.body.appendChild(form);
		form.submit();
	}
};


// global helpers via jquery
// * can be turned off by adjusting the config settings before page load * 
var DO_CONFIRM_DIALOGS=true;
$(function(){
	if (DO_CONFIRM_DIALOGS)
	{
		/*
		* User can define a button with a confirmation dialog by adding the class 'confirm'.
		* further you can change the default text of the dialog by defining the attribute
		*	confirmText="whatever text you want"
		*/
		$('.confirm').click(function(item){
			var confirmText = "Are you sure?"; // default text if none defined
			var userConfirmText = $(item.currentTarget).attr('confirmText');
			if(userConfirmText!="") confirmText=userConfirmText;
			var answer = confirm(confirmText);
			if (answer) return true;
			return false;
		});
	}
});


// Passive class based functionality
/*
 * enable tab to indent inside textarea with class "allowTab"
 */
$(function(){
	$(document).delegate('.allowTab', 'keydown', function(e) {
		  var keyCode = e.keyCode || e.which;

		  if (keyCode == 9) {
		    e.preventDefault();
		    var start = $(this).get(0).selectionStart;
		    var end = $(this).get(0).selectionEnd;

		    // set textarea value to: text before caret + tab + text after caret
		    $(this).val($(this).val().substring(0, start)
		                + "\t"
		                + $(this).val().substring(end));

		    // put caret at right position again
		    $(this).get(0).selectionStart =
		    $(this).get(0).selectionEnd = start + 1;
		  }
		});
});

/*
 * enable hiding content behind toggle with class "behindToggle"
 */
$(function(){
	
	var toggleOnText = "Click to view";
	var toggleOffText = "Click to hide";
	
	var toToggles = $('.behindToggle');
	
	toToggles.each(function(i, el){
		
		var toggleId = "behindToggle_"+i; 
		
		// wrap div around togglable content
		$(el).wrap("<div></div>");
		
		// insert element for toggle click
		var wrapDiv = el.parentElement;
		$(wrapDiv).prepend("<span id=\""+toggleId+"\" class=\"fakeLink\">"+toggleOnText+"</span>");
		
		// add the "click to show" event
		$("#"+toggleId).click(function(e){
			// parentDiv == wrapDiv for this instance
			var parentDiv = e.currentTarget.parentElement;
			$(parentDiv).find(".behindToggle").toggle();
			
			var toggleText = $(e.currentTarget).text();
			$(e.currentTarget).text(toggleText == toggleOnText ? toggleOffText : toggleOnText);
		});
		
	});
	
	toToggles.hide();
	
});


/* global function used by MGI captions */
window.play = function(yid, width, height, left, top){
	
	var movieDivClass = 'movieDiv';
	
    var targets = $("[id=YT]");
    // find which one has this id in it
    var target = targets[0];
    if (targets.length > 1) {
	    targets.each(function(i, el){
	    	if ($(el).attr("href").indexOf(yid) > 0){
	    		target = el;
	    	}
	    });
	    if (!target) {
	    	throw new Error("Could not find which id=YT element this movie belongs to.");
	    }
    }
    
    /* create a div and put the You Tube player in it */
    var newdiv = document.createElement('div');
    if (width) {
            newdiv.style.width = width;
    }
    if (height) {
            newdiv.style.height = height;
    }
    if ((left || top) || (left && top)) {
            newdiv.style.position = "absolute";
            if (left) {
                newdiv.style.left = left;
            }
            if (top){
                newdiv.style.top = top;
            }
    }
    /*  You Tube link parameters:
	    &autoplay=1   set to play the video as soon as it loads
	    &autohide=1   hides the player controls until user mouses over the video
	    &loop=1&playlist='+yid+'   sets the video to play continuous loop,
	            must specify video ID again as its own playlist
	    &rel=0   hides any "related videos" that You Tube might promote
	    frameborder="0" allowfullscreen    these are usually included in
	            examples though they don't do anything for us here
	*/
    newdiv.innerHTML = '<iframe width="'+width+'" height="'+height+'" src="http://www.youtube.com/v/'+yid+'&autoplay=1&autohide=1&loop=1&playlist='+yid+'&rel=0" frameborder="0" allowfullscreen></iframe>';
    $(newdiv).addClass(movieDivClass);
    
    /* remove any previous movie elements */
    $(target).prev('.movieDiv').remove();
    
    /* insert movie immediately before target */
    $(newdiv).insertBefore(target);
}


var DO_FORM_RESET_AS_CLEAR=true;
$(function(){
	if (DO_FORM_RESET_AS_CLEAR)
	{
		/*
		* input type="reset" clears the form, not resets
		*/
		$("form input[type='reset']").click(function(event){
			
			event.preventDefault();
			
			var elements = event.target.form.elements;

			event.target.form.reset();

			for(i=0; i<elements.length; i++) {

				var field_type = elements[i].type.toLowerCase();

				switch(field_type) {

					case "text":
					case "password":
					case "textarea":
						  case "hidden":

					  elements[i].value = "";
					  break;

					case "radio":
					case "checkbox":
						if (elements[i].checked) {
						  elements[i].checked = false;
					  }
					  break;

					case "select":
					case "select-one":
					case "select-multi":
					case "select-multiple":
								elements[i].selectedIndex = -1;
					  break;

					default:
					  break;
				}
			}
		});
	}
});
