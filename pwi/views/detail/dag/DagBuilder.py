"""
Utility module for the vocterm view
which takes dag nodes and builds a view
of TreeNode objects for the template to render
"""
from pwi.model.query import batchLoadAttribute

def buildDagTrees(dagnodes, batchloadOn=True):
    """
    Builds a list of DAG tree views.
    one for every path of every dag node passed in
    """
    dagtrees = []
    for dagnode in dagnodes:
        root = TreeNode(dagnode)
        dagtree = {"name": dagnode.dag_name,
                   "root":root}
        dagtrees.append(dagtree)
        
        # track all the found dag nodes for batch loading 
        # vocterms later on
        foundNodes = set()
        
        # get immediate children
        # batch load nodes of each fetched edge
        loadFirstChildren(root, foundNodes, batchloadOn)
            
        # recurse parents
        stack = [dagtree]
        while stack:
            dtree = stack.pop()
            tree_node = dtree['root']
            
            # if node is first parent
            if len(tree_node.children) == 1 and \
                dagnode._object_key in [t._term_key for t in tree_node.children]:
                original = tree_node.children[0]
                # load siblings for the original node
                loadSiblings(original, tree_node, foundNodes, batchloadOn)
            
            if tree_node.dagnode.parent_edges:
                # batch load nodes of each fetched edge
                if batchloadOn:
                    batchLoadAttribute(tree_node.dagnode.parent_edges, "parent_node", uselist=False)
                
                if len(tree_node.dagnode.parent_edges) > 1:
                    # create new trees anytime there is more than 1 parent
                    for edge in tree_node.dagnode.parent_edges[1:]:
                        # take current tree and clone a new one
                        # reset the root of new tree as the current parent edge
                        new_tree = splitTree(dagtree, edge, foundNodes, batchloadOn)
                        stack.append(new_tree)
                        dagtrees.append(new_tree)
                        
                parent_edge = tree_node.dagnode.parent_edges[0]
                parent_node = parent_edge.parent_node
                
                ptree_node = TreeNode(parent_node)
                
                # move root down a notch
                tree_node.parent = ptree_node
                tree_node.edge_label = parent_edge.label
                ptree_node.children.append(tree_node)
                dtree['root'] = ptree_node
                stack.append(dtree)
                
        
        # batch load all the term objects for every found node
        if batchloadOn:
            batchLoadAttribute(list(foundNodes), "vocterm", uselist=False)
            
    # sort all term children
    for tree in dagtrees:
        tree['root'].sort()
    
    return dagtrees

def loadFirstChildren(root, foundNodes, batchloadOn):
    # get immediate children
    # batch load nodes of each fetched edge
    if batchloadOn:
        batchLoadAttribute(root.dagnode.child_edges, "child_node", uselist=False)
    for edge in root.dagnode.child_edges:
        child_node = edge.child_node
        ctree_node = TreeNode(child_node)
        ctree_node.parent = root
        ctree_node.edge_label = edge.label
        root.children.append(ctree_node)
        foundNodes.add(child_node)
        
def loadSiblings(originalNode, currentNode, foundNodes, batchloadOn):
    # expand first parent to load siblings
    if batchloadOn:
        batchLoadAttribute(currentNode.dagnode.child_edges, "child_node", uselist=False)
    currentNode.children = []
    for edge in currentNode.dagnode.child_edges:
        child_node = edge.child_node
        ctree_node = TreeNode(child_node)
        
        # preserve original node structure in order
        if ctree_node._term_key == originalNode._term_key:
            ctree_node = originalNode
        
        ctree_node.parent = currentNode
        ctree_node.edge_label = edge.label
        currentNode.children.append(ctree_node)
        foundNodes.add(child_node)
            
def splitTree(dagtree, edge, foundNodes, batchloadOn):
    #j=9+k999
    parent_node2 = edge.parent_node
    ptree_node2 = TreeNode(parent_node2)
    
    # make copy of current tree
    new_tree = cloneDagTree(dagtree)
    
    new_tree['root'].parent = ptree_node2
    new_tree['root'].edge_label = edge.label
    ptree_node2.children.append(new_tree['root'])
    new_tree['root'] = ptree_node2
    foundNodes.add(parent_node2)

    return new_tree

def cloneDagTree(dagTree):
    # make copy of current node
    tree_node = dagTree['root']
    new_tnode = tree_node.cloneSelf()
    
    new_tree = {"name": dagTree['name'],
                "root": new_tnode}
    return new_tree

class TreeNode():
    
    def __init__(self, dagnode):
        self.dagnode=dagnode
        self.edge_label=''
        self._term_key=dagnode._object_key
        self.children=[]
        self.parent=None
    
    @property
    def term(self):
        return self.dagnode.vocterm.term
    
    @property
    def depth(self):
        depth = 0
        stack = [self]
        while stack:
            node = stack.pop()
            if node.parent:
                depth += 1
                stack.append(node.parent)
        return depth

    @property
    def tree_list(self):
        """
        print this node down to its last child as 
        single ordered list
        """
        l = []
        for node, parent in self._edge_generator():
            l.append(node)
            
        return l
    
    def cloneSelf(self):
        """
        return a new tree node created from this one
        all children are also clones with adjusted 
        parent/children references
        """
        curNode = None
        parentMap = {}
        for node, parent in self._edge_generator():
            newNode = TreeNode(node.dagnode)
            newNode.edge_label = node.edge_label
            parentMap[newNode._term_key] = newNode
            if not curNode:
                curNode = newNode
            else:
                if parent._term_key in parentMap:
                    # reassign the clone relationships
                    newParent = parentMap[parent._term_key]
                    newParent.children.append(newNode)
                    newNode.parent = newParent
                
        return curNode
    
    def sort(self):
        """
        sort all children by alpha term.lower()
        """
        for n in self.tree_list:
            if n.children:
                n.children.sort(lambda a, b: cmp(a.term.lower(), b.term.lower()))
    
    def _edge_generator(self):
        """
        Go down tree depth first
        and yield each edge as node + parent
        """
        l = []
        seen = set()
        node = self
        parentMap = {}

        while node:
          yield [node, node.parent]
          seen.add(node._term_key)
          
          if node.children:
              child = node.children[0]
              parentMap[child] = node
              node = child
          #leaf
          else:
              #find the parent level
              foundSibling = False
              # traverse upward until we find a sibling we haven't seen
              while node and not foundSibling:
                  node = node in parentMap and parentMap[node] or None
                  if node:
                      # search for a sibling
                      for child in node.children:
                          if child._term_key not in seen:
                              parentMap[child] = node
                              node = child
                              foundSibling = True
                              break
        
        
    def __repr__(self):
        return "%s(%s)" % (self.term, self.depth) 