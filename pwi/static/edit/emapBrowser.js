(function(){
	"use strict";

	// javascript for emapBrowser

	/*
	 * Need to set following before use
	 *
	 * EMAPA_SEARCH_URL, EMAPA_DETAIL_URL, EMAPA_TREE_URL, EMAPA_TREE_CHILD_URL
	 *
	 */


	MGIAjax.TIMES_TO_RETRY = 1;

	// status variables
	window.currentEmapaId = '';

	var TERM_DETAIL_ID = "termDetailContent";


	/*
	 * handle AJAX errors
	 *
	 * TODO(kstone): maybe this belongs in a global library
	 * 		as a generic AJAX error handler
	 */
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


	/*
	 * Click on a parent term in the term detail section
	 */
	var termParentClick = function(){
		var parentId = $(this).attr("data_id");
		window.currentEmapaId = parentId;
		MGIAjax.loadContent(EMAPA_DETAIL_URL + parentId, TERM_DETAIL_ID, setupTermDetailsEvents);
	};

	/*
	 * Setup term detail events:
	 * Need to reconfigure javascript events listeners for newly loaded content
	 */
	var setupTermDetailsEvents = function(){
		$(".termDetailParent").click(termParentClick);

		// clear old tree view
		document.getElementById("emapTree").innerHTML = "";

		// initialize new tree view
		window.emapTree = new MGITreeView({
			target: "emapTree",
			dataUrl: EMAPA_TREE_URL + window.currentEmapaId,
			childUrl: EMAPA_TREE_CHILD_URL,
			nodeRenderer: treeNodeRenderer,
			LOADING_MSG: "Loading data for tree view..."
		});

		// highlight search result whose detail is being viewed
		$(".termSearchResult").removeClass("active");
		$(".termSearchResult[data_id=\""+ window.currentEmapaId +"\"]").addClass("active");
	};


	/*
	 * Click on a search result term
	 */
	var searchResultClick = function(){
		var termId = $(this).attr("data_id");
		window.currentEmapaId = termId;
		MGIAjax.loadContent(EMAPA_DETAIL_URL + termId, TERM_DETAIL_ID, setupTermDetailsEvents);
	};

	/*
	 * Setup term search events:
	 * Need to reconfigure javascript event listeners for newly loaded content
	 */
	var setupTermSearchEvents = function(){
		$(".termSearchResult").click(searchResultClick);

		// If there are results. Find the first result.
		var results = $(".termSearchResult");

		if (results.length > 0) {
			// navigate to term detail as well
			var termId = $(results[0]).attr("data_id");
			window.currentEmapaId = termId;
			MGIAjax.loadContent(EMAPA_DETAIL_URL + termId, TERM_DETAIL_ID, setupTermDetailsEvents);
		}

	};

	/*
	 * Handle query form submit
	 */
	$(document).on("submit", "#termSearchForm", function(e){
	    e.preventDefault();

		var searchString = $("#termSearch").val();
	    MGIAjax.loadContent(EMAPA_SEARCH_URL + searchString,"emapaSummaryContent", setupTermSearchEvents);

	    return  false;
	});

	$(document).ready(function () {

		/*
		 * resizable elements
		 */
	    $(".leftContainer").resizable({
	        handles: 'e',
	        minWidth: 260,
	        maxWidth: 800,
	        resize: function () {
	            $('.leftContainer').css('width', $('.leftContainer').outerWidth() / $('.browserWrapper').innerWidth() * 100 + '%');
	            $('.rightContainer').css('width', 99 - ($('.leftContainer').outerWidth() / $('.browserWrapper').innerWidth() * 100) + '%');
	        }
	    });

	    $("#emapTermArea").resizable({
	        handles: 's'
	    });
	    $("#emapClipBoard").resizable({
	        handles: 's'
	    });
	    $("#treeViewArea").resizable({
	        handles: 's'
	    });

		/*
		 * form pre-loading & submission
		 */
		$('#termSearch').val(TERM_SEARCH);
		$('#termSearchForm').submit();	});


	/*
	 * Initialize the tree view
	 */
	var treeNodeRenderer = function(node) {
		var label = node.label;
		if (node.id == window.currentEmapaId) {
			label = "<mark>" + label + "</mark>";
		}

		return label;
	};

})();