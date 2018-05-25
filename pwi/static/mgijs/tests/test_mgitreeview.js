/* QUnit tests for MGITreeView widget */

var module = QUnit.module,
  test = QUnit.test;


var targetDivJq;
module( "MGITreeView widget", {
  beforeEach: function() {
	  // Insert test div into the DOM with id="testTarget"
	  targetDivJq = $("<div id=\"testTarget\"></div>").appendTo("body");
  },
  afterEach: function() {
	  // clean up after each test
	  // remove any elements inserted during test setup
	  targetDivJq.remove();
  }
});

test( "basic tree", function(assert) {
	
	var data = [
        {id:"id1", children:[
	         {id:"id3"},
	         {id:"id4", children:[
                  {id:"id5"}
	         ]}
        ]},
        {id:"id2"}
	];
	var tree = new MGITreeView({
		target: "testTarget",
		data: data
	});
	
	// verify that 5 DOM nodes were created
	var nodes = $("#testTarget .node");
	assert.equal(nodes.length, 5, "DOM nodes not created");
});


test( "label display", function(assert) {
	
	var data = [
        {id:"id1", label:"parent1", children:[
	         {id:"id3", label:"child1"},
	         {id:"id4", label:"child2", children:[
                  {id:"id5", label:"grandchild"}
	         ]}
        ]},
        {id:"id2"}
	];
	var tree = new MGITreeView({
		target: "testTarget",
		data: data
	});
	
	// verify that labels are displayed instead of ids
	var nodes = $("#testTarget .node");
	assert.equal($(nodes[0]).text(), "parent1", "display label");
	assert.equal($(nodes[1]).text(), "child1", "display label");
	assert.equal($(nodes[2]).text(), "child2", "display label");
	assert.equal($(nodes[3]).text(), "grandchild", "display label");
	
	// verify id is displayed when there is no label
	assert.equal($(nodes[4]).text(), "id2", "display id when there is no label");
	
});

test( "custom node renderer", function(assert) {
	
	var data = [
        {id:"id1", extraAttr:"Some extra display"}
	];
	
	var customRenderer = function(node) {
		return "<b>"+node.id + "</b>:" + node.extraAttr;
	};
	
	var tree = new MGITreeView({
		target: "testTarget",
		data: data,
		nodeRenderer: customRenderer
	});
	
	// verify that custom renderer is displayed
	var nodes = $("#testTarget .node");
	assert.equal(nodes[0].innerHTML, "<b>id1</b>:Some extra display", "display custom renderer for node");
	
});

test( "open close child node", function(assert) {
	
	var data = [
        {id:"id1", children:[{id:"id2"}]}
	];
	
	var tree = new MGITreeView({
		target: "testTarget",
		data: data
	});
	
	// verify that both parent and child node exist
	var nodes = $("#testTarget .node");
	assert.equal(nodes.length, 2, "2 nodes shown");
	
	// now close the parent node
	$("#testTarget .toggle.open").click();
	nodes = $("#testTarget .node");
	assert.equal(nodes.length, 1, "only 1 node shown after closing toggle");
	
	// now reopen the parent node
	$("#testTarget .toggle.close").click();
	nodes = $("#testTarget .node");
	assert.equal(nodes.length, 2, "2 nodes shown after opening toggle");
});

/*
* Test CSS classes
*/
test( "CSS toggle hasSiblings icon", function(assert) {
	
	var data = [
        {id:"id1", children:[{id:"id2"},{id:"id3"}]}
	];
	
	var tree = new MGITreeView({
		target: "testTarget",
		data: data
	});

	var toggles = $("#testTarget .toggle");
	
	// verify that first and last nodes are not flagged
	assert.notOk($(toggles[0]).hasClass("hasSiblings"), "node1 hasSibling check");
	assert.notOk($(toggles[2]).hasClass("hasSiblings"), "node3 hasSibling check");
	
	// verify that second item is flagged
	assert.ok($(toggles[1]).hasClass("hasSiblings"), "node2 hasSibling check");
});

test( "CSS toggle icon type", function(assert) {
	
	var data = [
        {id:"id1", children:[
           {id:"id2", oc:"close",children:[
               {id:"hiddenChild"} // this node will not be rendered
           ]},
           {id:"id3"}]}
	];
	
	var tree = new MGITreeView({
		target: "testTarget",
		data: data
	});

	var toggles = $("#testTarget .toggle");
	
	// verify that first node is "open"
	assert.ok($(toggles[0]).hasClass("open"), "node1 open check");
	
	// verify that second node is "close"
	assert.ok($(toggles[1]).hasClass("close"), "node2 close check");
	
	// verify that third node is "leaf"
	assert.ok($(toggles[2]).hasClass("leaf"), "node3 leaf check");
});


/*
* afterUpdate callback
*/
test( "afterUpdate callback", function(assert) {
	
	var data = [
        {id:"id1"}
	];
	
	// update a testVariable inside the afterUpdate callback
	var testVariable = 0;
	
	
	var tree = new MGITreeView({
		target: "testTarget",
		data: data,
		afterUpdate: function(assert) {
			testVariable = 1;
		}
	});

	assert.equal(testVariable, 1);
});


var parentJq;
var targetDivJq;
module( "MGITreeView widget scrolling", {
  beforeEach: function(assert) {
	  // Insert test div into the DOM with id="testTarget"
	  parentJq = $("<div id=\"parent\"></div>").appendTo("body");
	  targetDivJq = $("<div id=\"testTarget\"></div>").appendTo(parentJq);
  },
  afterEach: function(assert) {
	  // clean up after each test
	  // remove any elements inserted during test setup
	  targetDivJq.remove();
	  parentJq.remove();
  }
});


/*
 * Helper functions
 */

/*
 * Get the offset position of this node to the parent scrollable div
 */
var getNodeOffset = function(nodeIndex, scrollDivJq) {
	var nodeJq = $($(targetDivJq).find(".node")[nodeIndex]);
	return nodeJq.position().top - scrollDivJq.position().top;
};



/*
* Test scrollTo feature
*/
test( "scrollTo node with id ", function(assert) {
	
	var data = [
        {id:"id1"},
        {id:"id2"},
        {id:"id3"},
        {id:"id4"},
        {id:"id5"},
        {id:"id6"},
        {id:"id7"},
        {id:"id8"},
        {id:"id9"},
        {id:"id10"},
        {id:"id11"},
        {id:"id12"},
        {id:"id13"}
	];
	
	var containerHeight = 40;
	
	// set target with a height that will overflow
	targetDivJq.height(containerHeight);
	targetDivJq.css("overflow-y","scroll");
	
	var tree = new MGITreeView({
		target: "testTarget",
		data: data,
	});
	
	// node (id10) should be off screen
	var node10Position = getNodeOffset(9, targetDivJq);
	assert.ok(node10Position > containerHeight, 
			"node10.position of " + node10Position +" > " + containerHeight);
	
	
	tree.scrollTo("id10");
	
	
	// node (id10) should be on screen
	node10Position = getNodeOffset(9, targetDivJq);
	assert.ok(node10Position < containerHeight, 
			"node10.position of " + node10Position +" < " + containerHeight);
});


test( "scrollTo with parent div being scrollable ", function(assert) {
	
	var data = [
        {id:"id1"},
        {id:"id2"},
        {id:"id3"},
        {id:"id4"},
        {id:"id5"},
        {id:"id6"},
        {id:"id7"},
        {id:"id8"},
        {id:"id9"},
        {id:"id10"},
        {id:"id11"},
        {id:"id12"},
        {id:"id13"}
	];
	
	var containerHeight = 40;
	
	// set target with a height that will overflow
	parentJq.height(containerHeight);
	parentJq.css("overflow-y","scroll");
	
	var tree = new MGITreeView({
		target: "testTarget",
		data: data,
	});
	
	// node (id10) should be off screen
	var node10Position = getNodeOffset(9, parentJq);
	assert.ok(node10Position > containerHeight, 
			"node10.position of " + node10Position +" > " + containerHeight);
	
	
	tree.scrollTo("id10");
	
	
	// node (id10) should be on screen
	node10Position = getNodeOffset(9, parentJq);
	assert.ok(node10Position < containerHeight, 
			"node10.position of " + node10Position +" < " + containerHeight);
});
