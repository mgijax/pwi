"""
	Defines the app specific model objects
"""

from pwi import db,app
from sqlalchemy.ext.hybrid import hybrid_property, hybrid_method
from core import *
# import the toCss function for making safe file names
from pwi.templatetags.filters import css

class Report(db.Model):
	__tablename__ = "pwi_report"
	__bind_key__ = "app"

	id = db.Column(db.Integer,primary_key=True)
	name = db.Column(db.String(), index=True, nullable=False)
	description = db.Column(db.String())
	sql_text = db.Column(db.String(), nullable=False)
	report_author = db.Column(db.String(), index=True, nullable=False)
	requested_by = db.Column(db.String(), index=True, nullable=False)
	type = db.Column(db.String())
	created = db.Column(db.DateTime(), index=True, nullable=False)
	last_run = db.Column(db.DateTime())
	last_run_duration = db.Column(db.String())
	report_views = db.Column(db.String())

	labels = db.relationship("ReportLabel",
				order_by="ReportLabel.label",			
				backref=db.backref("report"))

	@property
	def tagString(self):
		return ", ".join(["%s"%l for l in self.labels])

	@property
	def safeFileName(self):
		return "%s_%s.rpt"%(css(self.name),self.id)

	def __repr__(self):
		return "<Report id:%s,name:%s,author:%s>"%(self.id,self.name,self.report_author)

class ReportLabel(db.Model):
	__tablename__ = "pwi_report_label"
	__bind_key__ = "app"

	id = db.Column(db.Integer,primary_key=True)
	report_id = db.Column(db.Integer,db.ForeignKey("pwi_report.id"),index=True)
	label = db.Column(db.String(),index=True)

	def __repr__(self):
		return self.label
