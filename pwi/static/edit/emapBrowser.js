
(function(){
	"use strict";

	// javascript for emapBrowser

	/*
	 * Need to set following before use
	 *
	 *   EMAPA_SEARCH_URL,
	 *   EMAPA_DETAIL_URL,
	 *   EMAPA_TREE_URL,
	 *   EMAPA_TREE_CHILD_URL,
	 *   EMAPA_CLIPBOARD_URL
	 *   EMAPA_CLIPBOARD_EDIT_URL
	 *   EMAPA_CLIPBOARD_SORT_URL
	 *
	 */

	MGIAjax.TIMES_TO_RETRY = 1;


	// status variables
	window.currentEmapaId = '';
	window.currentStage = 'all';

	var TERM_DETAIL_ID = "termDetailContent";
	var TREE_VIEW_ID = "treeViewArea";
	
	
	/**
	 * Helper functions
	 */
	
	/*
	 * Convert EMAPA ID + stage to EMAPS ID
	 */
	var getEmapsId = function(emapaId, stage) {
		return emapaId.replace("EMAPA","EMAPS") + stage;
	};


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
		else {
			/* Check server response for InvalidStageInputError */
			if (response.indexOf("===InvalidStageInputError") >= 0){

				var error = response.substr(
						response.indexOf("===InvalidStageInputError")
						+ "===InvalidStageInputError".length
						+ 2
				)

				showClipboardError(error);
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
	
	
	/**
	 * Action methods
	 */
	
	/*
	 * Display input error messages
	 */
	var showClipboardError = function(msg) {
		$("#clipboardError").text(msg);
		$(".clipboardError").show();
	};

	var hideClipboardError = function() {
		$("#clipboardError").text('');
		$(".clipboardError").hide();
	};
	

	/*
	 * Navigate browser to a new term
	 * 
	 * updates detail section and browser
	 */
	var navigateNewTerm = function(id, stage) {
		
		window.currentEmapaId = id;
		window.currentStage = stage || window.currentStage;
		
		
		var detailId = id;
		// set to EMAPS if we have a currentStage set
		if (window.currentStage && 
				window.currentStage.toLowerCase() != "all") {
			
			detailId = getEmapsId(id, window.currentStage);
		}
		
		
		// reload term detail
		loadTermDetail(detailId);
		
		// reload tree view
		loadTreeView(detailId);
		
		// highlight term search item
		highlightTermSearch(window.currentEmapaId);
		
		// focus clipboard
		focusClipboard();
		
	};
	
	
	/*
	 * set focus to term search input
	 */
	var focusTermSearch = function() {
		$( "#termSearch" ).focus();
	};
	
	/*
	 * set focus to clipboard input
	 */
	var focusClipboard = function() {
		$("#clipboardInput").focus();
	};
	
	/*
	 * Set value of clipboard input
	 */
	var setClipboardInput = function(stage) {
		if (stage.toLowerCase() == "all") {
			stage = "*";
		}
		$("#clipboardInput").val(stage);
	};
	
	/*
	 * highlight term search item for EMAPA ID
	 */
	var highlightTermSearch = function(id) {
		// highlight search result whose detail is being viewed
		$(".termSearchResult").removeClass("active");
		$(".termSearchResult[data_id=\""+ id +"\"]").addClass("active");
	};
	
	/*
	 * highlight stage selector (in term detail)
	 */
	var highlightStageSelector = function(stage) {
		$(".stageSelector").removeClass("active");
		$(".stageSelector[data_stage=\""+ stage +"\"]").addClass("active");
	};

	
	/*
	 * Reload term detail
	 */
	var loadTermDetail = function(id) {
		var detailUrl = EMAPA_DETAIL_URL + id;
		MGIAjax.loadContent(detailUrl, 
				TERM_DETAIL_ID, 
			function() { 
				setupTermDetailsEvents(); 
			}
		);
	};
	
	
	/*
	 * Reload tree view
	 */
	var loadTreeView = function(id) {
		
		/*
		 * Tree configuration
		 */
		var treeNodeRenderer = function(node) {
			var label = node.label;
			if (node.id == id) {
				label = "<mark>" + label + "</mark>";
				
				//label += " - <a href=\"\">" + node["results_count"] + "</a>";
			}

			return label;
		};
		
		// clear old tree view
		document.getElementById("emapTree").innerHTML = "";
		
		// initialize new tree view
		window.emapTree = new MGITreeView({
			target: "emapTree",
			dataUrl: EMAPA_TREE_URL + id,
			childUrl: EMAPA_TREE_CHILD_URL,
			nodeRenderer: treeNodeRenderer,
			LOADING_MSG: "Loading data for tree view...",
			afterUpdate: function() {
				// after update, auto-scroll to node with current ID
				window.emapTree.scrollTo(id);
			}
		});
	};
	
	/*
	 * Reload the EMAPA clipboard
	 */
	var loadClipboard = function() {
		MGIAjax.loadContent(EMAPA_CLIPBOARD_URL,"emapClipBoardContent");
	};





	/*
	 * Handle query form submit
	 */
	$(document).on("submit", "#termSearchForm", function(e){
	    e.preventDefault();

		var searchString = $("#termSearch").val();
		var stages = $("#stageSearch").val();
		
	    MGIAjax.loadContent(EMAPA_SEARCH_URL + searchString,"emapaSummaryContent",
	    	function(){
	    		setupTermSearchEvents();

	    		// If there are results. Find the first result.
	    		var results = $(".termSearchResult");

	    		if (results.length > 0) {
	    			// navigate to term detail as well
	    			var termId = $(results[0]).attr("data_id");
	    			navigateNewTerm(termId, "all");
	    		}
	    	}
	    );

	    // move cursor to clipboard
		focusClipboard();

		hideClipboardError();

	    return  false;
	});


	$(document).on("click", "#clipboardSort", function(e){
	    e.preventDefault();

	    $.ajax({
	    	method: 'GET',
	    	url: EMAPA_CLIPBOARD_SORT_URL,
	    	success: function(){
	    		// refresh clipboard
	    		loadClipboard();
	    	}
	    });
	    return  false;
	});


	$(document).on("reset", "#termSearchForm", function(e){
	    e.preventDefault();

		$("#clipboardSubmitForm")[0].reset();
		hideClipboardError();

	    return  false;
	});

	/*
	 * Handle clipboard add term/stages
	 */
	$(document).on("submit", "#clipboardSubmitForm", function(e){
	    e.preventDefault();

	    var stages = $(this).find("#clipboardInput").val();

	    if (!window.currentEmapaId) {

	    	showClipboardError("No term selected");
	    	return false;
	    }


	    if (stages) {

	    	hideClipboardError();

		    $.ajax({
		    	method: 'GET',
		    	url: EMAPA_CLIPBOARD_EDIT_URL,
		    	data: {
		    		stagesToAdd: stages,
		    		emapaId: window.currentEmapaId
		    		},

		    	success: function(){
		    		// refresh clipboard
		    		loadClipboard();
		    	}
		    });

	    }
	    else {
	    	showClipboardError("Please enter a valid stage");
	    }

	    // move cursor to clipboard
		focusClipboard();
	    return  false;
	});

	/*
	 * Handle clearing of clipboard
	 */
	$(document).on("click", "#clipboardClear", function(e){
	    e.preventDefault();

	    $.ajax({
	    	method: 'GET',
	    	url: EMAPA_CLIPBOARD_EDIT_URL,
	    	data: {
	            keysToDelete: CLIPBOARD_MEMBER_KEYS
    		},
	    	success: function(){
	    		// refresh clipboard
	    		loadClipboard();
	    	}
	    });
	    return  false;
	});


	/*
	 * Handle clipboard functions form submit
	 */
	$(document).on("click", "#clipboardFunctionsForm", function(e){
	    e.preventDefault();

	    loadClipboard();
	    return  false;
	});


	/*
	 * To execute when document ready
	 */
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

	    $("#emapTermAreaWrapper").resizable({
	        handles: 's',
	        minHeight: 100,
	        resize: function () {
	            $('#emapTermArea').css('height', $('#emapTermAreaWrapper').outerHeight() - 15 );
	        }
	    });
	    $("#emapClipBoard").resizable({
	        handles: 's'
	    });
	    $("#treeViewAreaWrapper").resizable({
	        handles: 's',
	        minHeight: 100,
	        resize: function () {
	            $('#treeViewArea').css('height', $('#treeViewAreaWrapper').outerHeight() - 15 );
	        }
	    });

		/*
		 * form pre-loading & submission
		 */
		$('#termSearch').val(TERM_SEARCH);
		if($('#termSearch').val() != ''){
			$('#termSearchForm').submit();
		}

		// pre-load clipboard
		loadClipboard();

	});

	
	var deleteClipboardTerm = function(_setmember_key){
	    $.ajax({
	        method: 'GET',
	        url: EMAPA_CLIPBOARD_EDIT_URL,
	        data: {
	            keysToDelete: _setmember_key
	        },
	        success: function(){
	            // refresh clipboard
	            loadClipboard();
	        }
	    });
	};
	
	
	/**
	 * Wire up keyboard events / shortcuts
	 */
	

	/*
	 * Setup term search events:
	 * Need to reconfigure javascript event listeners for newly loaded content
	 */
	var setupTermSearchEvents = function(){
		$(".termSearchResult").click(function(e){
			e.preventDefault();
			
			var termId = $(this).attr("data_id");
			var startstage = $(this).attr("data_startstage");
			var endstage = $(this).attr("data_endstage");
			
			var stage = window.currentStage || "all";
			
			// verify stage is valid for this term
			if (stage < startstage || stage > endstage) {
				stage = "all";
			}
			
			navigateNewTerm(termId, stage);
		});

		// If there are results. Find the first result.
		var results = $(".termSearchResult");

		if (results.length > 0) {
			// navigate to term detail as well
			var termId = $(results[0]).attr("data_id");
			navigateNewTerm(termId);
		}

	};
	

	/*
	 * Setup term detail events:
	 * Need to reconfigure javascript events listeners for newly loaded content
	 */
	var setupTermDetailsEvents = function(){
		$(".termDetailParent").click(function(e) {
			e.preventDefault();
			
			var parentId = $(this).attr("data_id");
			navigateNewTerm(parentId);
		});
		
		$(".stageSelector").click(function() {
			var stage = $(this).attr("data_stage");
			navigateNewTerm(window.currentEmapaId, stage);
			
			setClipboardInput(stage);
			
		});
		
		// highlight stage
		highlightStageSelector(window.currentStage);
	};

	
	
	/*
	 * Focus term search when tab out of clipboard
	 */
	$( "#clipboardInput" ).keydown(function(event) {

		if ($(this).is(":focus")) {
			var code = event.keyCode || event.which;
			// check 9 for TAB
			if (code == '9') {

				event.preventDefault();
				focusTermSearch();
				return false;
			}
		}
	});

})();

