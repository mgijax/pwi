"""
Utility module for the adstructure view
which takes ADStructures and builds a view
of TreeNode objects for the template to render

TODO(kstone): This module will be obsolete once AD is retired
    and should be removed
"""
from TreeNode import TreeNodeForAD

def buildDagTrees(adstructures):
    """
    Builds a list of DAG tree views.
    one for every path of every dag node passed in
    (However, there should only ever be one path for an AD term)
    """
    dagtrees = []
    for adstructure in adstructures:
        root = TreeNodeForAD(adstructure)
        dagtree = {"name": 'Anatomical Dictionary',
                   "root":root}
        dagtrees.append(dagtree)
        
        # track all the found dag nodes for batch loading 
        # vocterms later on
        foundNodes = set()
        
        # get immediate children
        # batch load nodes of each fetched edge
        loadFirstChildren(root, foundNodes)
            
        # recurse parents
        stack = [dagtree]
        while stack:
            dtree = stack.pop()
            tree_node = dtree['root']
            
            # if node is first parent
            if len(tree_node.children) == 1 and \
                adstructure._structure_key in [t._term_key for t in tree_node.children]:
                original = tree_node.children[0]
                # load siblings for the original node
                loadSiblings(original, tree_node, foundNodes)
            
            if tree_node.dagnode.parent:
                        
                parent_node = tree_node.dagnode.parent
                
                ptree_node = TreeNodeForAD(parent_node)
                
                # move root down a notch
                tree_node.parent = ptree_node
                ptree_node.children.append(tree_node)
                dtree['root'] = ptree_node
                stack.append(dtree)
            
    # sort all term children
    for tree in dagtrees:
        tree['root'].sort()
    
    return dagtrees

def buildDagTreeFromRoot(rootnode):
    """
    Builds a single DAG tree views.
    with root as rootnode
    """
    root = TreeNodeForAD(rootnode)
    dagtree = {"name": rootnode.dag_name,
               "root":root}
    
    # track all the found dag nodes for batch loading 
    # vocterms later on
    foundNodes = set()
        
    # recurse children
    stack = [root]
    while stack:
        node = stack.pop()
        
        # get immediate children
        # batch load nodes of each fetched edge
        loadFirstChildren(node, foundNodes)
        
        if node.children:
            for child in node.children:
                stack.append(child)
        
    return dagtree


def loadFirstChildren(root, foundNodes):
    # get immediate children
    for child_node in root.dagnode.children:
        ctree_node = TreeNodeForAD(child_node)
        ctree_node.parent = root
        root.children.append(ctree_node)
        foundNodes.add(child_node)
        
def loadSiblings(originalNode, currentNode, foundNodes):
    # expand first parent to load siblings
    currentNode.children = []
    for child_node in currentNode.dagnode.children:
        ctree_node = TreeNodeForAD(child_node)
        
        # preserve original node structure in order
        if ctree_node._term_key == originalNode._term_key:
            ctree_node = originalNode
        
        ctree_node.parent = currentNode
        currentNode.children.append(ctree_node)
        foundNodes.add(child_node)



