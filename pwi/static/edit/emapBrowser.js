(function(){
	"use strict";

	// javascript for emapBrowser

	/*
	 * Need to set following before use
	 *
	 * EMAPA_SEARCH_URL, EMAPA_DETAIL_URL
	 */

	var TERM_DETAIL_ID = "termDetailsArea";

	/*
	 * Click on a parent term in the term detail section
	 */
	var termParentClick = function(){
		var parentId = $(this).attr("data_id");
		MGIAjax.loadContent(EMAPA_DETAIL_URL + parentId, TERM_DETAIL_ID, setupTermDetailsEvents);
	};

	/*
	 * Setup term detail events:
	 * Need to reconfigure javascript events listeners for newly loaded content
	 */
	var setupTermDetailsEvents = function(){
		$(".termDetailParent").click(termParentClick);
	};


	/*
	 * Click on a search result term
	 */
	var searchResultClick = function(){
		var termId = $(this).attr("data_id");

		MGIAjax.loadContent(EMAPA_DETAIL_URL + termId, TERM_DETAIL_ID, setupTermDetailsEvents);
	};

	/*
	 * Setup term search events:
	 * Need to reconfigure javascript event listeners for newly loaded content
	 */
	var setupTermSearchEvents = function(){
		$(".termSearchResult").click(searchResultClick);
	};

	/*
	 * Handle query form submit
	 */
	$(document).on("submit", "#termSearchForm", function(e){
	    e.preventDefault();

		var searchString = $("#termSearch").val();
	    MGIAjax.loadContent(EMAPA_SEARCH_URL + searchString,"emapTermArea", setupTermSearchEvents);

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
	            $('.leftContainer').css('width', $('.leftContainer').outerWidth() * 100 / $(window).innerWidth() + '%');
	            $('.rightContainer').css('width', 99 - ($('.leftContainer').outerWidth() * 100 / $(window).innerWidth()) + '%');
	        }
	    });
		$('#termSearch').val(TERM_SEARCH);
		$('#termSearchForm').submit();	});


})();