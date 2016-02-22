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
		
		// reload tree view
		emapTree.initLoadData(EMAPA_TREE_URL + window.currentEmapaId);
		
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
		 * Setup horizontal resizing of page
		 */
	    $(".leftContainer").resizable({
	        handles: 'e',
	        minWidth: 280,
	        maxWidth: 800,
	        resize: function () {
	            $('.leftContainer').css('width', $('.leftContainer').outerWidth() / $('.browserWrapper').innerWidth() * 100 + '%');
	            $('.rightContainer').css('width', 99 - ($('.leftContainer').outerWidth() / $('.browserWrapper').innerWidth() * 100) + '%');
	        }
	    });
	    $("#emapTermArea").resizable({
	        handles: 's',
	        resize: function () {
	            $('#emapTermArea').css('height', $('#emapTermArea').outerHeight() / $('#resizeTermClipboardWrapper').innerHeight() * 100 + '%');
	            $('#emapClipBoard').css('height', 99 - ($('#emapTermArea').outerHeight() / $('#resizeTermClipboardWrapper').innerHeight() * 100) + '%');
	        }
	    });
		$('#termSearch').val(TERM_SEARCH);
		$('#termSearchForm').submit();	});


	/*
	 * Initialize the tree view
	 */
	var nodeRenderer = function(node) {
		var label = node.label;
		if (node.id == window.currentEmapaId) {
			label = "<mark>" + label + "</mark";
		}
		
		return label;
	};
	window.emapTree = new MGITreeView({
		target: "emapTree",
		data: [],
		childUrl: EMAPA_TREE_CHILD_URL,
		nodeRenderer: nodeRenderer
	});

})();