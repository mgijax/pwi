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
	loadContent : function(url,contentID)
	{
		var contentID = "#"+contentID;
		var loadingID = contentID+"_loading";

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
		}

		//Ajax Error function
		var ajaxError = function(jqXHR, textStatus, errorThrown)
		{
			MGIAjax.handleAjaxError(textStatus,contentID,loadingID,loadJson);
		}

		// set cross origin support
		$.support.cors = true;
		// set the ajax timeout
		$.ajaxSetup({ timeout: MGIAjax.AJAX_TIMEOUT });
		// kick off the ajax call
		loadJson();
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
