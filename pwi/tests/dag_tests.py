"""
Test the DagBuilder Module
"""

import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

import unittest
from pwi.util.dag.DagBuilder import TreeNode, buildDagTrees
from pwi.util.dag.ADDagBuilder import TreeNodeForAD, buildDagTrees as buildADDagTrees
from pwi.model import DagNode, VocTerm, DagEdge, ADStructure

class BuildDagTreesTestCase(unittest.TestCase):
    
    def test_dagnode_leaf(self):
        n1 = self.dag_node(1, 't1')
        dt = buildDagTrees([n1], batchloadOn=False)
        self.assertEquals([[n1]], self.convertTrees(dt))
        
    def test_dagnode_one_child(self):
        n1 = self.dag_node(1, 't1')
        n2 = self.dag_node(2, 't2')
        self.addChild(n1, n2, '')
        dt = buildDagTrees([n2], batchloadOn=False)
        self.assertEquals([[n1, n2]], self.convertTrees(dt))
        
    def test_dagnode_siblings(self):
        n1 = self.dag_node(1, 't1')
        n2 = self.dag_node(2, 't2')
        n3 = self.dag_node(3, 't3')
        self.addChild(n1, n2, '')
        self.addChild(n1, n3, '')
        dt = buildDagTrees([n3], batchloadOn=False)
        self.assertEquals([[n1, n2, n3]], self.convertTrees(dt))
        
    def test_dagnode_nested_children(self):
        n1 = self.dag_node(1, 't1')
        n2 = self.dag_node(2, 't2')
        n3 = self.dag_node(3, 't3')
        self.addChild(n1, n2, '')
        self.addChild(n2, n3, '')
        
        dt = buildDagTrees([n3], batchloadOn=False)
        self.assertEquals([[n1, n2, n3]], self.convertTrees(dt))
        
    def test_dagnode_nested_children_and_siblings(self):
        n1 = self.dag_node(1, 't1')
        n2 = self.dag_node(2, 't2')
        n3 = self.dag_node(3, 't3')
        n4 = self.dag_node(4, 't4')
        n5 = self.dag_node(5, 't5')
        self.addChild(n1, n2, '')
        self.addChild(n2, n3, '')
        self.addChild(n2, n4, '')
        self.addChild(n2, n5, '')
        
        dt = buildDagTrees([n4], batchloadOn=False)
        self.assertEquals([[n1, n2, n3, n4, n5]], self.convertTrees(dt))
        
    def test_dagnode_two_parents(self):
        n1 = self.dag_node(1, 't1')
        n2 = self.dag_node(2, 't2')
        n3 = self.dag_node(3, 't3')
        self.addChild(n1, n3, '')
        self.addChild(n2, n3, '')
        
        dt = buildDagTrees([n3], batchloadOn=False)
        self.assertEquals([[n1, n3], [n2, n3]], self.convertTrees(dt))
        
    def test_dagnode_two_parents_two_levels(self):
        n1 = self.dag_node(1, 't1')
        n2 = self.dag_node(2, 't2')
        n3 = self.dag_node(3, 't3')
        n4 = self.dag_node(4, 't4')
        n5 = self.dag_node(5, 't5')
        self.addChild(n1, n2, '')
        self.addChild(n2, n5, '')
        
        self.addChild(n3, n4, '')
        self.addChild(n4, n5, '')
        
        dt = buildDagTrees([n5], batchloadOn=False)
        
        self.assertEquals([[n1, n2, n5], [n3, n4, n5]], self.convertTrees(dt))
        
    def test_dagnode_two_parents_and_children(self):
        n1 = self.dag_node(1, 't1')
        n2 = self.dag_node(2, 't2')
        n3 = self.dag_node(3, 't3')
        n4 = self.dag_node(4, 't4')
        self.addChild(n1, n2, '')
        self.addChild(n2, n3, '')
        
        self.addChild(n4, n2, '')
        
        dt = buildDagTrees([n3], batchloadOn=False)
        
        self.assertEquals([[n1, n2, n3], [n4, n2, n3]], self.convertTrees(dt))

    # helpers
    
    def dag_node(self, key, term):
        dn = DagNode()
        dn._node_key = key
        dn._object_key = key
        
        vt = VocTerm()
        vt.term = term
        
        dn.vocterm = vt
        return dn
    
    def addChild(self, parent, child, label):
        de = DagEdge()
        de.child_node = child
        de.label = label
        de.parent_node = parent
        
            
    def convertTrees(self, dagtrees):
        l = []
        for tree in dagtrees:
            nodes = tree['root'].tree_list
            l.append([n.dagnode for n in nodes])
        return l
    

class BuildADDagTreesTestCase(unittest.TestCase):
    """
    AD specific DAG builder
    TODO(kstone): to be removed when AD retires
    """
    
    def test_dagnode_leaf(self):
        n1 = self.structure(1, 't1')
        dt = buildADDagTrees([n1])
        self.assertEquals([[n1]], self.convertTrees(dt))
        
    def test_dagnode_one_child(self):
        n1 = self.structure(1, 't1')
        n2 = self.structure(2, 't2')
        self.addChild(n1, n2)
        dt = buildADDagTrees([n2])
        self.assertEquals([[n1, n2]], self.convertTrees(dt))
        
    def test_dagnode_siblings(self):
        n1 = self.structure(1, 't1')
        n2 = self.structure(2, 't2')
        n3 = self.structure(3, 't3')
        self.addChild(n1, n2)
        self.addChild(n1, n3)
        dt = buildADDagTrees([n3])
        self.assertEquals([[n1, n2, n3]], self.convertTrees(dt))
        
    def test_dagnode_nested_children(self):
        n1 = self.structure(1, 't1')
        n2 = self.structure(2, 't2')
        n3 = self.structure(3, 't3')
        self.addChild(n1, n2)
        self.addChild(n2, n3)
        
        dt = buildADDagTrees([n3])
        self.assertEquals([[n1, n2, n3]], self.convertTrees(dt))
        
    def test_dagnode_nested_children_and_siblings(self):
        n1 = self.structure(1, 't1')
        n2 = self.structure(2, 't2')
        n3 = self.structure(3, 't3')
        n4 = self.structure(4, 't4')
        n5 = self.structure(5, 't5')
        self.addChild(n1, n2)
        self.addChild(n2, n3)
        self.addChild(n2, n4)
        self.addChild(n2, n5)
        
        dt = buildADDagTrees([n4])
        self.assertEquals([[n1, n2, n3, n4, n5]], self.convertTrees(dt))

   
    # helpers
    
    def structure(self, key, term):
        s = ADStructure()
        s._structure_key = key
        s.printname = term
        
        return s
    
    def addChild(self, parent, child):
        
        child.parent = parent
        parent.children.append(child)
        
            
    def convertTrees(self, dagtrees):
        l = []
        for tree in dagtrees:
            nodes = tree['root'].tree_list
            l.append([n.dagnode for n in nodes])
        return l
        
        
class TreeNodeTestCase(unittest.TestCase):
    
    def test_treenode_leaf(self):
        n1 = self.tree_node(1, 't1')
        self.assertEquals([n1], n1.tree_list)
        
        
    def test_treenode_one_child(self):
        n1 = self.tree_node(1, 't1')
        n2 = self.tree_node(2, 't2')
        self.addChild(n1, n2)
        self.assertEquals([n1, n2], n1.tree_list)
        
    def test_treenode_children(self):
        n1 = self.tree_node(1, 't1')
        n2 = self.tree_node(2, 't2')
        n3 = self.tree_node(3, 't3')
        self.addChild(n1, n2)
        self.addChild(n1, n3)
        self.assertEquals([n1, n2, n3], n1.tree_list)
        
    def test_treenode_nested_children(self):
        n1 = self.tree_node(1, 't1')
        n2 = self.tree_node(2, 't2')
        n3 = self.tree_node(3, 't3')
        self.addChild(n1, n2)
        self.addChild(n2, n3)
        self.assertEquals([n1, n2, n3], n1.tree_list)
        
    def test_treenode_with_parent(self):
        n1 = self.tree_node(1, 't1')
        n2 = self.tree_node(2, 't2')
        self.addChild(n1, n2)
        self.assertEquals([n2], n2.tree_list)
        
    def test_treenode_nested_children_in_middle(self):
        n1 = self.tree_node(1, 't1')
        n2 = self.tree_node(2, 't2')
        n3 = self.tree_node(3, 't3')
        n4 = self.tree_node(4, 't4')
        self.addChild(n1, n2)
        self.addChild(n2, n3)
        self.addChild(n1, n4)
        self.assertEquals([n1, n2, n3, n4], n1.tree_list)
        
    def test_treenode_complex(self):
        n1 = self.tree_node(1, 't1')
        n2 = self.tree_node(2, 't2')
        n3 = self.tree_node(3, 't3')
        n4 = self.tree_node(4, 't4')
        n5 = self.tree_node(5, 't5')
        n6 = self.tree_node(6, 't6')
        n7 = self.tree_node(7, 't7')
        n8 = self.tree_node(8, 't8')
        self.addChild(n1, n2)
        self.addChild(n1, n6)
        self.addChild(n1, n8)
        
        self.addChild(n2, n3)
        self.addChild(n2, n4)
        
        self.addChild(n4, n5)
        
        self.addChild(n6, n7)
        
        self.assertEquals([n1, n2, n3, n4, n5, n6, n7, n8], n1.tree_list)
        
    def test_treenode_many_childs(self):
        n1 = self.tree_node(1, 't1')
        n2 = self.tree_node(2, 't2')
        n3 = self.tree_node(3, 't3')
        n4 = self.tree_node(4, 't4')
        n5 = self.tree_node(5, 't5')
        n6 = self.tree_node(6, 't6')
        n7 = self.tree_node(7, 't7')
        n8 = self.tree_node(8, 't8')
        self.addChild(n1, n2)
        self.addChild(n1, n3)
        self.addChild(n1, n8)
        
        self.addChild(n3, n4)
        self.addChild(n3, n5)
        self.addChild(n3, n7)
        
        self.addChild(n5, n6)
        
        self.assertEquals([n1, n2, n3, n4, n5, n6, n7, n8], n1.tree_list)
        
        
    ### test cloneSelf ###
    def test_clone_one_node(self):
        n1 = self.tree_node(1, 't1')
        n1c = n1.cloneSelf()
        
        self.assertNodeClone(n1, n1c)
        
    def test_clone_two_nodes(self):
        n1 = self.tree_node(1, 't1')
        n2 = self.tree_node(2, 't2')
        self.addChild(n1, n2)
        
        n1c = n1.cloneSelf()
        
        self.assertNodeClone(n1, n1c)
        
    def test_clone_complex(self):
        n1 = self.tree_node(1, 't1')
        n2 = self.tree_node(2, 't2')
        n3 = self.tree_node(3, 't3')
        n4 = self.tree_node(4, 't4')
        n5 = self.tree_node(5, 't5')
        n6 = self.tree_node(6, 't6')
        n7 = self.tree_node(7, 't7')
        n8 = self.tree_node(8, 't8')
        self.addChild(n1, n2)
        self.addChild(n1, n3)
        self.addChild(n1, n8)
        
        self.addChild(n3, n4)
        self.addChild(n3, n5)
        self.addChild(n3, n7)
        
        self.addChild(n5, n6)
        
        n1c = n1.cloneSelf()
        
        self.assertNodeClone(n1, n1c)
        
    # helpers
    
    def tree_node(self, key, term):
        dn = DagNode()
        dn._object_key = key
        
        vt = VocTerm()
        vt.term = term
        
        dn.vocterm = vt
        
        tn = TreeNode(dn)
        return tn
    
    def addChild(self, parent, child):
        parent.children.append(child)
        child.parent = parent
        
    def assertNodeClone(self, node, clone):
        nl = node.tree_list
        cl = clone.tree_list
        
        # turn list of nodes into a string
        tl_string = ','.join([n.term for n in nl])
        tlc_string = ','.join([n.term for n in cl])
        
        # tree list strings should match
        self.assertEquals(tl_string, tlc_string)
        
        # now go through tree list and make sure each node actually is new
        for i in range(0, len(nl)):
            self.assertNotEquals(nl[i], cl[i], "%s is same ref as %s" % (nl[i], cl[i]))
            
        
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(TreeNodeTestCase))
    suite.addTest(unittest.makeSuite(BuildDagTreesTestCase))
    suite.addTest(unittest.makeSuite(BuildADDagTreesTestCase))
    # add future test suites here
    return suite

if __name__ == '__main__':
    unittest.main()
