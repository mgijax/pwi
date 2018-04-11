/*
* Creates the MGITreeView widget
*
* Requires:
*   jQuery
*   D3
*   
* Contains following classes:
* 
* 	MGITreeView - The actual widget containing UI controls and display logic
*   MGITVData - Data manager for the rows and child relationships
*
*/

(function(){
"use strict";


/*
 * Acceptable config params are
 * 
 * 	Required:
 * 	  target - ID of the target div for the tree view container
 * 
 *  Optional:
 *    data - list of data nodes to initialize tree view
 *    dataUrl - data url to initialize tree view via AJAX
 *    childUrl - data url to expand child nodes flagged with {ex:True},
 *    			node 'id' will be appended to childUrl for AJAX call
 *    nodeRenderer - Define a customer renderer for each node in the tree.
 *    				Called as "nodeRenderer(node);" and will expect HTML returned
 *    afterUpdate - callback fired after every time tree is updated
 *    
 *    afterInitialUpdate - callback fired after first time tree is loaded
 *    
 *    Format of data nodes:
 *    	Required:
 *    		id - data ID of node
 *    		oc - defines if node is open or closed
 *    			valid values are "open" or "close"
 *      
 *      Optional:
 *      	label - display value (if not supplied, 'id' is shown)
 *      	children - list of child nodes
 *      	ex - Boolean flag, defines if node can be expanded by AJAX.
 * 
 * 
 */
var MGITreeView = function(config) {

  // closure variable
  var _self = this;
  
  
  /**
   * User callable functions
   */
  
  /*
   * scrolls the tree to the first node with
   * 	id == nodeId.
   * 
   * Requirements:
   * 	1) node must exist in tree
   * 	2) target container, or a parent of target container must
   * 		be able to be scrolled.
   * 
   */
  this.scrollTo = function(nodeId) {
	  
	  // Is the tree even scrollable?
	  var treeJq = $(getHtmlNode(_self.wrapperGroup));
	  
	  // recurse parents until one is scrollable
	  // Not sure how many we realistically need to check.
	  // Starting with 3
	  var parentsToCheck = 3;
	  var findScrollableContainer = function(container) {
		  
		  parentsToCheck -= 1;
		  
		  if (!container.parent() || parentsToCheck == 0) {
			  return null;
		  }
		  
		  if (container.height() > container.parent().height()) {
			  return container.parent();
		  }
		  return findScrollableContainer(container.parent());
	  };
	  
	  var scrollContainerJq = findScrollableContainer(treeJq);

	  // if we can't scroll, then nothing to do here
	  if (!scrollContainerJq) {
		  return;
	  }
	  
	  // find node to scroll to
	  var nodes = _self.wrapperGroup.selectAll("li");
	  var scrollNodeJq = null;
	  for (var i=0; i< nodes._groups[0].length; i++) {
          var htmlNode = nodes._groups[0][i];
		  var data = d3.select(htmlNode).datum();
		  if (data.id == nodeId) {
			  scrollNodeJq = $(htmlNode);
			  break;
		  }
	  }
	  
	  // nothing to do if we can't find node to scroll to
	  if (!scrollNodeJq) {
		  return;
	  }
	  
	  
	  // scroll to desired node
	  var nodePosition = scrollNodeJq.position().top - treeJq.position().top;
	  var scrollPosition = nodePosition - (scrollContainerJq.height() / 2) + (scrollNodeJq.height() / 2);
	  scrollContainerJq.scrollTop(scrollPosition);
	 
  };
  
  
  /**
   * MGITreeView internal functions
   */
  
  /*
   * Initialize tree view
   * 
   */
  this.init = function(config) {

		_self.target = config.target;
		_self.data = null;
		if (config.data) {
			_self.data = new MGITVData(config.data);
		}
		_self.dataUrl = config.dataUrl || null;
		_self.childUrl = config.childUrl || null;
		_self.nodeRenderer = config.nodeRenderer || _self.defaultNodeRenderer;
		
		_self.LOADING_MSG = config.LOADING_MSG || "Loading data...";
		
		_self.afterUpdate = config.afterUpdate || function(){};
		
		_self.afterInitialUpdate = config.afterInitialUpdate || function(){};
		
		// state variables

		_self._expanding = false;
		_self.target = d3.select("#"+_self.target);
		_self.wrapperGroup = _self.target.append("ul")
			.attr("class","mgitreeview");
		
		
		if (_self.dataUrl) {
			_self.initLoadData(_self.dataUrl);
		} else {	  
			_self.update();
			
			_self.afterInitialUpdate();
		}
  };
  
  
  /*
   * Load an initial batch of data from the given
   * 	dataUrl via AJAX
   */
  this.initLoadData = function(dataUrl) {
	  
	  // set loading icon and message
	  var loadingDiv = _self.target.insert("div", ":first-child");
	  loadingDiv.append("div")
	  	.attr("class","mgitvLoadingIcon");
	  loadingDiv.append("span")
	  	.text(_self.LOADING_MSG);
	  
	  $.ajax({
		  url: dataUrl,
		  type: 'GET',
		  dataType: 'json',
		  success: function(data){
			  _self.data = new MGITVData(data);
			  _self.update();
			  
			  loadingDiv.remove();
			  
			  _self.afterInitialUpdate();
		  }
	  });
  };
  
  
  /*
   * Update the display of the tree view
   */
  this.update = function() {
	  
	  // resync data display list with current state of node data
	  _self.data.syncData();
	  
	  // set d3 data objects, with uniqueness defined as _rid + id
	  var rows = _self.wrapperGroup.selectAll("li")
	  	.data(_self.data.getRows(), function(d){ return d._rid + "_" + d.id; });
	  
	  var enter = rows.enter()
                    .append("li");
	  
	  // for all new nodes
	  enter.each(function(node,i ){
		  if(node){
			  var liD3 = d3.select(this);
			  
			  // create the left padding for nested nodes
			  for(var i=0;i<node.depth;i++) {
				  
				  var depthClass = "";
				  
				  // show depth indicator if there are siblings below any parent nodes
				  var getDepthParent = function(node, depthIndex) {
					  if (depthIndex <= 0) {
						  return node;
					  }
					  // else
					  return getDepthParent(node.parent, depthIndex-1);
				  };
				  
				  
				  var parent = getDepthParent(node, node.depth - i);
				  if (_self.hasSiblingsBelow(parent)) {
					  depthClass = "depthIndicator";
				  }
				  
				  liD3.append("div")
				  	.attr("class","pad " + depthClass);
			  }
			  
			  // create open/close toggle
			  
			  // set "leaf", "open", "close" type
			  var toggleType = _self.getToggleType(node);
			  
			  var toggle = liD3.append("span");
			  
			  if (toggleType != "leaf") {
				  
				  // handle AJAX expansion if ex == "true" and childUrl set
				  if (node.ex && _self.childUrl) {
					  _self.addExpandHandler(getHtmlNode(toggle));
				  }
				  else if (toggleType == "close") {
					  // handle normal toggle open behavior
					  _self.addOpenHandler(getHtmlNode(toggle));
				  }
				  else {
					  _self.addCloseHandler(getHtmlNode(toggle));
				  }
			  
			  }

			  toggle.attr("class", _self.getToggleClasses(node));
			  
			  
			  // create the node display
			  // and call custom node renderer
			  var displayNode = liD3.append("div")
			  	.attr("class","node");
			  var innerHtml = _self.nodeRenderer(node);
			  getHtmlNode(displayNode).innerHTML = innerHtml;
			  
		  }
	  });
	  
	  // Rerun all the node renderers for any updated nodes
	  rows.each(function(node,i){
		  if(node){
			  var displayNode = d3.select(this).select(".node")
			  var node = displayNode.datum();
			  getHtmlNode(displayNode).innerHTML = _self.nodeRenderer(node);
		  }
	  });
	  
	  
	  // remove deleted nodes from the DOM
	  rows.exit().remove();
	  
	  
	  // ensure set is ordered by _rid sequence
      enter.merge(rows).order();
	  
	  // trigger afterUpdate callback
	  _self.afterUpdate();
  };
  
  /*
   * Return the toggle type for this node
   * 
   * 	one of "leaf", "open", "close"
   */
  this.getToggleType = function(node) {
	  var toggleType = "leaf";
	  
	  // node is togglable if there are children, or is set to be
	  //	AJAX expanded with the "ex" flag
	  if ((node.hasOwnProperty("children") && node.children.length > 0)
			  || (node.ex && _self.childUrl)) {
		  
		  toggleType = "open";
		  
		  // node is closed if oc="close"
		  if (node.hasOwnProperty("oc") && node.oc == "close") {
			  toggleType = "close";
		  }
		  // node is closed if we can AJAX expand it
		  else if ((node.ex && _self.childUrl)) {
			  toggleType = "close";
		  }
	  } 
	  
	  return toggleType;
  };
  
  /*
   * Get the css classes for a toggle element
   * 	Always: "pad", "toggle"
   * 	One of: "leaf", "open", "close"
   * 	Optional: "hasSiblings"
   */
  this.getToggleClasses = function(node) {
	  var toggleClasses = ["pad", "toggle"];
	  
	  toggleClasses.push(_self.getToggleType(node));
	  
	  if (_self.hasSiblingsBelow(node)) {
		  toggleClasses.push("hasSiblings");
	  }  
	  return toggleClasses.join(" ");
  };
  
  /*
   * Return if this node has siblings 
   * 	beneath itself in the tree
   */
  this.hasSiblingsBelow = function(node) {
	  
	  // default to top most parent
	  var siblings = _self.data.userdata;
	  
	  // if not the top node, get first parent
	  if (node.hasOwnProperty("parent") && node.parent) {
		  siblings = node.parent.children;
	  }
	  
	  // check if there are any siblings below 
	  //	the passed in node
	  for(var i=0; i<siblings.length; i++) {
		  var sibling = siblings[i];
		  if (sibling._rid == node._rid) {
			  if (i < siblings.length - 1) {
				  return true;
			  }
		  }
	  }
	  
	  return false;
  };
  
  /*
   * expandRow when element is clicked
   * 	row is expanded by making AJAX request
   */
  this.addExpandHandler = function(element) {
	  
	  var clickHandler = function(event) {
		  
		  // block the expand handler if we are already expanding
		  // 	another node's children
		  if (_self.expanding) {
			  return;
		  }
		  
		  _self.expanding = true;
		  var targetD3 = d3.select(event.target);
		  var node = targetD3.datum();
		  var url = _self.childUrl + node.id;
		  var _event = this;
		  $.ajax({
			  url: url,
			  type: 'GET',
			  dataType: 'json',
			  success: function(data){
				  node.children = data;
				  
				  node.oc = "open";
				  node.ex = false;
				  targetD3.attr("class", _self.getToggleClasses(node));
				  _event.removeEventListener('click', clickHandler);
				  _self.addCloseHandler(element);
				  
				  _self.update();
				  
				  _self.expanding = false;
			  },
			  error: function() {
				  _self.expanding = false;
			  }
		  });
	  };
	  element.addEventListener("click",clickHandler);  
  };
  
  /*
   * openRow when element is clicked
   */
  this.addOpenHandler = function(element) {
	  var clickHandler = function(event) {
		  var targetD3 = d3.select(event.target);
		  var node = targetD3.datum();
		  var _event = this;
		  
		  node.oc = "open";
		  targetD3.attr("class", _self.getToggleClasses(node));
		  _event.removeEventListener('click', clickHandler);
		  _self.addCloseHandler(element);
		  _self.update();
	  };
	  element.addEventListener("click",clickHandler);  
  };
  
  /*
   * closeRow when element is clicked
   */
  this.addCloseHandler = function(element) {
	  var clickHandler = function(event) {
		  var targetD3 = d3.select(event.target);
		  var node = targetD3.datum();
		  var _event = this;
		  
		  node.oc = "close";
		  targetD3.attr("class", _self.getToggleClasses(node));
		  _event.removeEventListener('click', clickHandler);
		  _self.addOpenHandler(element);
		  _self.update();
	  };
	  element.addEventListener("click",clickHandler);  
  };
  
  this.defaultNodeRenderer = function(node) {
	  var value = node.label || node.id;

	  return "<span>" + value + "</span>";
  };
  
  this.init(config);

};


/*
 * Manages data for the tree view
 */
var MGITVData = function(data) {
	
	this.userdata = data;
	
	// internal lookups
	// data list
	this._dl = [];
	// unique id counter
	this._rid = 0;
	
	// closure
	var _self = this;
	
	/*
	 * Initialize data handler
	 */
	this.init = function() {
		
		_self.syncData();
		
	};
	
	
	/*
	 * sync user data with lookups
	 * 
	 * Sets:
	 * 	node.depth
	 *  node._rid
	 *  node.parent
	 * 
	 * Adds nodes to master data display list (_self._dl)
	 * 
	 * 	ignores nodes where node.oc == "close"
	 * 
	 */
	this.syncData = function() {
		
		_self._dl = [];
		
		var setRidRecursively = function(node, depth) {

			// set nesting depth of node for display purposes
			depth = depth || 0;
			node.depth = depth;
			
			
			node._rid = _self._rid;
			_self._dl.push(node);
			
			// increment unique row id counter.
			_self._rid += 1;
			
			
			// ignore children of all closed nodes
			if (node.hasOwnProperty("oc") && node.oc == "close") {
				return;
			}
			else if (node.hasOwnProperty("children")) {
				
				// otherwise recurse through children
				node.children.forEach(function(child){
					child.parent = node;
					setRidRecursively(child, depth+1);
				});
			}
		};
		
		// set rid for all nodes (in display order)
		this.userdata.forEach(function(node){
			setRidRecursively(node);
		});
		
	};
	
	/*
	 * Get visible rows in order
	 */
	this.getRows = function() {
		return _self._dl;
	};
	
	
	this.init();
	
};


/*
* Method to extract single html node from D3 selection
*
* NOTE: behavior was updated in d3 v4
*   used to be d3Selection[0][0]
*/
function getHtmlNode(d3Selection) {
  return d3Selection._groups[0][0];
}



// expose global object
window.MGITreeView = MGITreeView;
window.MGITVData = MGITVData;
})();
