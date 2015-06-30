"""
View specific node object
for rendering DAG views


"""

class TreeNode():
    
    def __init__(self, dagnode):
        self.dagnode=dagnode
        self.edge_label=''
        self._term_key=dagnode._object_key
        self.children=[]
        self.parent=None
	self.dagnode.vocterm
    
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
    
class TreeNodeForAD(TreeNode):
    """
    Version of TreeNode compatible with ADStructure
    Terms
    Note: self.dagnode will be the ADStructure object instead
        of an actual DagNode
    
    TODO(kstone): This will be obsolete when AD vocab retires
    """
    
    def __init__(self, adstructure):
        self.dagnode=adstructure
        self.edge_label=''
        self._term_key=adstructure._structure_key
        self.children=[]
        self.parent=None
        # mark these objects as AD terms
        self.isadstructure=True
    
    @property
    def term(self):
        return self.dagnode.printname
