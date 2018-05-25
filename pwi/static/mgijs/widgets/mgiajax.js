/*
*
* Creates the MGIAjax widget
*
*	Usage:
*		MGIAjax.loadContent(url, divId);
*		MGIAjax.loadContent(url, divId, successCallbackFunction);
*
*
* Requires jQuery
* 
*/

(function(){
"use strict";

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
	/* 
	* To load ajax content, simply provide the url and the id of the 
	* container we want the content loaded into
	* the div of the loading gif must be of format "contentID_loading"
	* for multiple uses of this function, be sure to use unique contentIDs
	*
	* (optional) successCallback is called after content has been loaded
	*/
	loadContent : function(url, contentID, successCallback)
	{
		var contentID = "#"+contentID;
		var loadingID = contentID+"_loading";
		
		$(loadingID).show();

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

// expose global object
window.MGIAjax = MGIAjax;

})();
