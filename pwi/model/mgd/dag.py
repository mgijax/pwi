# All models for the mgi_* tables
from pwi import db,app
from pwi.model.core import *
from acc import Accession
from voc import VocTerm

class DagLabel(db.Model,MGIModel):
    __tablename__ = "dag_label"
    _label_key = db.Column(db.Integer,primary_key=True)
    label = db.Column(db.String())
    
class Dag(db.Model,MGIModel):
    __tablename__ = "dag_dag"
    _dag_key = db.Column(db.Integer,primary_key=True)
    _mgitype_key = db.Column(db.Integer)
    name = db.Column(db.String())
    abbreviation = db.Column(db.String())

class DagClosure(db.Model,MGIModel):
    __tablename__ = "dag_closure"
    _dag_key = db.Column(db.Integer,primary_key=True)
    _mgitype_key = db.Column(db.Integer)
    _ancestor_key = db.Column(db.Integer, mgi_fk("dag_node._node_key"), primary_key=True)
    _descendent_key = db.Column(db.Integer, mgi_fk("dag_node._node_key"), primary_key=True)
    _ancestorobject_key = db.Column(db.Integer, mgi_fk("voc_term._term_key"), primary_key=True)
    _descendentobject_key = db.Column(db.Integer, mgi_fk("voc_term._term_key"), primary_key=True)

class DagEdge(db.Model,MGIModel):
    __tablename__ = "dag_edge"
    _edge_key = db.Column(db.Integer,primary_key=True)
    _dag_key = db.Column(db.Integer, mgi_fk("dag_dag._dag_key"))
    _label_key = db.Column(db.Integer)
    _parent_key = db.Column(db.Integer, mgi_fk("dag_node._node_key"))
    _child_key = db.Column(db.Integer, mgi_fk("dag_node._node_key"))   
    sequencenum = db.Column(db.Integer)
    
    dag_name = db.column_property(db.select([Dag.name]).
        where(Dag._dag_key==_dag_key)
    )
    
    label = db.column_property(db.select([DagLabel.label]).
        where(DagLabel._label_key==_label_key)
    )

    
    # relationships
    
class DagNode(db.Model,MGIModel):
    __tablename__ = "dag_node"
    _node_key = db.Column(db.Integer,primary_key=True)
    _object_key = db.Column(db.Integer)
    _dag_key = db.Column(db.Integer, mgi_fk("dag_dag._dag_key"))
    _label_key = db.Column(db.Integer)
    
    
    
    dag_mgitype_key = db.column_property(db.select([Dag._mgitype_key]).
        where(Dag._dag_key==_dag_key)
    )
    
    dag_name = db.column_property(db.select([Dag.name]).
        where(Dag._dag_key==_dag_key)
    )
    
    label = db.column_property(db.select([DagLabel.label]).
        where(DagLabel._label_key==_label_key)
    )

    # relationships
    
    parent_edges = db.relationship("DagEdge",
        primaryjoin="DagNode._node_key==DagEdge._child_key",
        order_by="DagEdge.sequencenum",
        backref=db.backref("child_node",uselist=False)
    )
    
    child_edges = db.relationship("DagEdge",
        primaryjoin="DagNode._node_key==DagEdge._parent_key",
        order_by="DagEdge.sequencenum",
        backref=db.backref("parent_node",uselist=False)
    )
    
    def __repr__(self):
        return "DagNode(key=%s)" % (self._node_key)
    
    
# define ancestor_vocterms here to avoid cyclic import
VocTerm.ancestor_vocterms = db.relationship("VocTerm",
            primaryjoin="and_(DagClosure._descendentobject_key==VocTerm._term_key,"
                        "DagClosure._mgitype_key==%d)" % VocTerm._mgitype_key,
            secondary=DagClosure.__table__,
            secondaryjoin="DagClosure._ancestorobject_key==VocTerm._term_key",
            foreign_keys="[DagClosure._descendentobject_key, VocTerm._term_key]"
            )

