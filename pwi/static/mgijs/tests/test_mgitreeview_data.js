/* QUnit tests for MGITreeView data manager */

var module = QUnit.module,
    test = QUnit.test;

/**
* Example of how Qunit test suites work
*/

module( "MGITreeView data manager (MGITVData)", {
  beforeEach: function(assert) {
    // prepare something for all following tests
	// maybe inserting elements in the DOM
  },
  afterEach: function(assert) {
    // clean up after each test
	// remove any elements inserted during test setup
  }
});

test( "empty input", function(assert) {
	
	var data = new MGITVData([]);
	assert.deepEqual(data._dl,[],"invalid internal data list");
});


/*
 * Test turning tree into list (i.e. the _dl data list)
 */

test( "single node", function(assert) {
	
	var node1 = {id:"id1"};
	var data = new MGITVData([node1]);
	assert.deepEqual(data._dl,[node1],"invalid internal data list");
});

test( "many siblings", function(assert) {
	
	var node1 = {id:"id1"};
	var node2 = {id:"id2"};
	var node3 = {id:"id3"};
	var data = new MGITVData([node1, node2, node3]);
	assert.deepEqual(data._dl,[node1, node2, node3],"invalid internal data list");
});

test( "nested children", function(assert) {
	
	var node1 = {id:"id1"};
	var child1 = {id:"id2"};
	var grandchild1 = {id:"id4"};
	node1["children"] = [child1];
	child1["children"] = [grandchild1];
	
	var data = new MGITVData([node1]);
	assert.deepEqual(data._dl,[node1, child1, grandchild1],"invalid internal data list");
});

test( "multiple children", function(assert) {
	
	var node1 = {id:"id1"};
	var child1 = {id:"id2"};
	var child2 = {id:"id3"};
	node1["children"] = [child1, child2];
	
	var data = new MGITVData([node1]);
	assert.deepEqual(data._dl,[node1, child1, child2],"invalid internal data list");
});


test( "complex nesting", function(assert) {
	
	var node1 = {id:"id1"};
	var child1 = {id:"id2"};
	var child2 = {id:"id3"};
	var grandchild1 = {id:"id4"};
	node1["children"] = [child1, child2];
	child1["children"] = [grandchild1];
	
	var data = new MGITVData([node1]);
	assert.deepEqual(data._dl,[node1, child1, grandchild1, child2],"invalid internal data list");
});



/*
* Test assigning unique row ids (i.e. _rid)
*/

// helper functions

/*
 * All nodes in nodeList should have a different _rid value
 */
var assertUniqueRids = function (assert, nodeList) {
	for (var i=0; i<nodeList.length; i++) {
	
		var curNode = nodeList[i];
		// compare current node with all others
		for (var j=0; j<nodeList.length; j++) {
			var compareNode = nodeList[j];
			if (i!=j) {
				var errMsg = "nodes with ids=" + curNode.id 
					+ "," + compareNode.id + " should differ on _rid; "
					+ curNode._rid + "!=" + compareNode._rid;
				assert.notEqual(compareNode._rid, curNode._rid, errMsg);
			}
		}
	}
	
};

test( "assign _rid with distinct ids", function(assert) {
	
	var node1 = {id:"id1", children:[
         {id: "id2"},
         {id: "id3"}
	]};
	
	var data = new MGITVData([node1]);
	assertUniqueRids(assert, data._dl);
});

test( "assign _rid with duplicate ids", function(assert) {
	
	var node1 = {id:"id1", children:[
         {id: "id1"},
         {id: "id1"}
	]};
	
	var data = new MGITVData([node1]);
	assertUniqueRids(assert, data._dl);
});


test( "assign _rid after modifying original data", function(assert) {
	
	var child1 = {id: "id2"};
	var node1 = {id:"id1", children:[
         child1,
         {id: "id3"}
	]};
	
	var data = new MGITVData([node1]);
	
	child1["children"] = [{id:"id4"}];
	data.syncData();

	assert.equal(data._dl.length, 4);
	assertUniqueRids(assert, data._dl);
});


/*
* Test assigning depth value for nested elements
*/
test( "assign depth for flat list", function(assert) {
	
	var node1 = {id:"id1"};
	var node2 = {id:"id2"};
	var node3 = {id:"id3"};
	
	var data = new MGITVData([node1, node2, node3]);
	assert.equal(node1.depth, 0, "check node1 depth value");
	assert.equal(node2.depth, 0, "check node2 depth value");
	assert.equal(node3.depth, 0, "check node3 depth value");
});

test( "assign depth for nested children", function(assert) {
	
	var node1 = {id:"id1"};
	var node2 = {id:"id2"};
	var node3 = {id:"id3"};
	node1["children"] = [node2];
	node2["children"] = [node3];
	
	var data = new MGITVData([node1]);
	assert.equal(node1.depth, 0, "check node1 depth value");
	assert.equal(node2.depth, 1, "check node2 depth value");
	assert.equal(node3.depth, 2, "check node3 depth value");
});


/*
* Test assigning parent value for nested elements
*/
test( "assign parent for flat list", function(assert) {
	
	var node1 = {id:"id1"};
	var node2 = {id:"id2"};
	var node3 = {id:"id3"};
	
	var data = new MGITVData([node1, node2, node3]);
	assert.equal(node1.parent, undefined, "check node1 parent node");
	assert.equal(node2.parent, undefined, "check node2 parent node");
	assert.equal(node3.parent, undefined, "check node3 parent node");
});

test( "assign parent for nested children", function(assert) {
	
	var node1 = {id:"id1"};
	var node2 = {id:"id2"};
	var node3 = {id:"id3"};
	node1["children"] = [node2];
	node2["children"] = [node3];
	
	var data = new MGITVData([node1]);
	assert.equal(node1.parent, undefined, "check node1 parent node");
	assert.equal(node2.parent, node1, "check node2 parent node");
	assert.equal(node3.parent, node2, "check node3 parent node");
});
