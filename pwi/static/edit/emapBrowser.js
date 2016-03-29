
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

	MGIAjax.TIMES_TO_RETRY = 0;
	MGIAjax.enableAjaxErrorDefaultPopup();
	
	// constants
	var TERM_DETAIL_ID = "termDetailContent";
	var TREE_VIEW_ID = "treeViewArea";
	
	// Create an object to manage EMAPA browser state
	var pageState = new function(){
		
		// state
		this.state = {
			// current EMAPA ID
			emapa_id: '',
			// current term data ID, either EMAPA or EMAPS
			data_id: '',
			// current stage, 0 == 'all'
			stage: 0,
			// whether to redraw tree on refresh()
			reloadTree: true
		};
		
		// nextState used on refresh();
		this.nextState = $.extend({}, this.state);
		
		// closure
		var _self = this;
		
		
		/*
		 * update with a new EMAPA ID or EMAPS ID
		 */
		this.newId = function(id) {
			
			var emapaId = id;
			var dataId = id;
			
			if (id.indexOf("EMAPS") >= 0) {
				// resolve EMAPA ID from EMAPS
				emapaId = _self.convertToEmapaId(id);
			}
			// EMAPA
			else if (_self.nextState.stage > 0){
				// create EMAPS ID from EMAPA
				dataId = _self.convertToEmapsId(id, _self.nextState.stage);
			}
			
			_self.nextState.emapa_id = emapaId;
			_self.nextState.data_id = dataId;
			
		};
		
		this.newStage = function(stage) {
			_self.nextState.stage = stage;
			// ensure data_id is in sync with new stage setting
			_self.newId(_self.nextState.emapa_id);
		};
		
		this.dontReloadTree = function() {
			_self.nextState.reloadTree = false;
		};
		
		
		this.convertToEmapsId = function(emapaId, stage) {
			if (stage < 10) {
				stage = "0" + stage;
			}
			return emapaId.replace("EMAPA","EMAPS") + stage;
		};
		
		/*
		 * Convert EMAPS ID to EMAPAID
		 */
		this.convertToEmapaId = function(emapsId) {
			var stageIdx = emapsId.length - 2;
			var emapaId = emapsId.substr(0, stageIdx);
			emapaId = emapaId.replace("EMAPS","EMAPA");
			return emapaId;
		};
		
		
		/*
		 * Refresh browser to nextState
		 * 
		 * updates:
		 * 	term detail,
		 *  tree view,
		 *  highlights,
		 *  clipboard input
		 *  
		 */
		this.refresh = function() {
			
			if (_self.nextState.stage != _self.state.stage) {
				//
			}
			
			if (_self.nextState.stage && _self.nextState.stage != '') {
				
				// set stage input on clipboard
				setClipboardInput(_self.nextState.stage);
			}
			
			if (_self.nextState.data_id != _self.state.data_id) {
				
				// reload term detail
				loadTermDetail(_self.nextState.data_id);
				
				// reload tree view
				if (_self.nextState.reloadTree) {
					loadTreeView(_self.nextState.data_id);
				}
				else {
					highlightTreeNode(_self.nextState.data_id);
					_self.nextState.reloadTree = true;
				}
			}

			// highlight term search item
			highlightTermSearch(_self.nextState.emapa_id);
			

			
			// always bring focus to clipboard
			focusClipboard();
			
			// reset state for next refresh()
			_self.state = _self.nextState;
			_self.nextState = $.extend({}, _self.state);
			
		};
		
		
	}();
	
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

	var hideFormErrors = function() {
		$("#clipboardError").text('');
		$(".clipboardError").hide();
		$("#stageSearchError").text('');
		$(".stageSearchError").hide();
	};
	
	var showStageSearchError = function(msg) {
		$("#stageSearchError").text(msg);
		$(".stageSearchError").show();
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
		if (stage == 0) {
			// clear clipboard for "all" stages selection
			stage = "";
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
	 * highlight selected node in tree view
	 */
	var highlightTreeNode = function(id) {
		$(".nodeClick").removeClass("active");
		$(".nodeClick[data_id=\"" + id + "\"]").addClass("active");
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
			
			// add clickable area
			label = "<a class=\"nodeClick fakeLink\" data_id=\"" + node.id + "\">"
				+ label 
				+ "</a>";

			return label;
		};
		
		var clickNode = function(e) {
			e.preventDefault();
			
			// expand this node when term is clicked
			$(this).parent().parent().find(".close").click()
			
			// navigate to this term
			var termId = $(this).attr("data_id");
			pageState.newId(termId);
			pageState.dontReloadTree();
			pageState.refresh();
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
			afterInitialUpdate: function() {

				// after update, auto-scroll to node with current ID
				window.emapTree.scrollTo(id);
			},
			afterUpdate: function() {
				
				$(".nodeClick").off("click");
				
				// add nodeClick event handlers after every update
				$(".nodeClick").click(clickNode);
				
				pageState.refresh();
				
				highlightTreeNode(pageState.state.data_id);
			}
		});
	};
	
	/*
	 * Reload the EMAPA clipboard
	 */
	var loadClipboard = function() {
		MGIAjax.loadContent(EMAPA_CLIPBOARD_URL,"emapClipBoardContent",
			function(){
				// reset clipboard count
				$("#clipboardCount").text($("#clipboard li").length);
			}
		);
	};





	/*
	 * Handle query form submit
	 */
	$(document).on("submit", "#termSearchForm", function(e){
	    e.preventDefault();

		var terms = $("#termSearch").val();
		var stages = $("#stageSearch").val();
		var searchString = ["termSearch=" + terms, "stageSearch=" + stages].join("&");
		
	    MGIAjax.loadContent(EMAPA_SEARCH_URL + searchString,"emapaSummaryContent",
	    	// on success
	    	function(){
	    		setupTermSearchEvents();

	    		// If there are results. Find the first result.
	    		var results = $(".termSearchResult");

	    		if (results.length > 0) {
	    		    
	    		    // check if only one stage was submitted
	    			// must be integer between 1 and 28
	    		    var selectedStage = Number(stages);
	    		    if (!selectedStage 
	    		    		|| (selectedStage % 1 != 0)
	    		    		|| (selectedStage < 0)
	    		    		|| (selectedStage > 28)
	    		    ) {
	    		    	// otherwise set to all stages
	    				selectedStage = 0;
	    			}
	    		    
	    			// navigate to term detail as well
	    			var termId = $(results[0]).attr("data_id");
	    			pageState.newId(termId);
	    			pageState.newStage(selectedStage);
	    			pageState.refresh();
	    			
	    			if (selectedStage == 0 && stages != "") {
	    				// reset clipboard input to whatever is in stage search,
	    				// 	even though it is not a single stage
	    				setClipboardInput(stages);
	    			}
	    			
	    		}
	    	},
	    	// on error
	    	function(jqxhr, settings, thrownError) {
	    		if (jqxhr.responseJSON && jqxhr.responseJSON.message) {
		    		showStageSearchError(jqxhr.responseJSON.message);
	    		}
	    	}
	    );

	    // move cursor to clipboard
		focusClipboard();

		hideFormErrors();

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
		hideFormErrors();

	    return  false;
	});

	/*
	 * Handle clipboard add term/stages
	 */
	$(document).on("submit", "#clipboardSubmitForm", function(e){
	    e.preventDefault();

	    var emapaId = pageState.state.emapa_id;
	    var stages = $(this).find("#clipboardInput").val();

	    
	    if (!emapaId || emapaId == '') {

	    	showClipboardError("No term selected");
	    	return false;
	    }


	    if (stages) {

	    	hideFormErrors();

		    $.ajax({
		    	method: 'GET',
		    	url: EMAPA_CLIPBOARD_EDIT_URL,
		    	data: {
		    		stagesToAdd: stages,
		    		emapaId: emapaId
		    		},

		    	success: function(){
		    		// refresh clipboard
		    		loadClipboard();
		    	},
		    	error: function(jqxhr, settings, thrownError){
		    		// on error
			    	if (jqxhr.responseJSON && jqxhr.responseJSON.message) {
				    	showClipboardError(jqxhr.responseJSON.message);
			    	}
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
		if($('#termSearch').val() != '' ||
				$('#stageSearch').val() != ''){
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
			
			var stage = pageState.state.stage;
			
			if (stage > 0) {
				
				startstage = parseInt(startstage);
				endstage = parseInt(endstage);
				// verify stage is valid for this term
				if (stage < startstage || stage > endstage) {
					// if not reset to "all" stages
					stage = 0;
				}
			}
			
			pageState.newId(termId);
			pageState.newStage(stage)
			pageState.refresh();
		});
	};
	

	/*
	 * Setup term detail events:
	 * Need to reconfigure javascript events listeners for newly loaded content
	 */
	var setupTermDetailsEvents = function(){
		$(".termDetailParent").click(function(e) {
			e.preventDefault();
			
			var parentId = $(this).attr("data_id");
			pageState.newId(parentId);
			pageState.refresh();
		});
		
		$(".stageSelector").click(function() {
			var stage = $(this).attr("data_stage");
			pageState.newStage(stage);
			pageState.refresh();
			
		});
		
		// highlight stage
		highlightStageSelector(pageState.state.stage);
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

	window.pageState = pageState;
	
	// expose delete clipboard item function
	window.deleteClipboardTerm = deleteClipboardTerm;
	
})();

