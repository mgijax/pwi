# Define the query form objects
from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from wtforms.validators import *
from widgets import *
from base import *
from pwi.model.appmodel import Report, ReportLabel
from pwi import db
from pwi.util.cache import users as user_cache


import datetime
import re

### constants ###
TAG_REGEX = re.compile(',|\s')


class ReportEntryForm(Form, MGIForm):
        # possible form parameters
        rpt_name = TextField('Name')
        rpt_description = TextAreaField('Description')
        rpt_sql_text = TextAreaField('SQL/Script')
        
        rpt_tags = TextField('Tags')
        
        rpt_requested_by = AutoCompleteField('Requested By', choices=user_cache.getUsernames())
        
        # invisible form parameters
        rpt_report_id = HiddenField('Report ID')
        rpt_report_author = HiddenField('Author')
        
        def _getParams(self):
            params = {}
            if self.rpt_name.data:
                params['rpt_name'] = self.rpt_name.data
            if self.rpt_description.data:
                params['rpt_description'] = self.rpt_description.data
            if self.rpt_sql_text.data:
                params['rpt_sql_text'] = self.rpt_sql_text.data
            if self.rpt_report_id.data:
                params['rpt_report_id'] = self.rpt_report_id.data
            if self.rpt_report_author.data:
                params['rpt_report_author'] = self.rpt_report_author.data
            if self.rpt_tags.data:
                params['rpt_tags'] = self.rpt_tags.data
            if self.rpt_requested_by.data:
                params['rpt_requested_by'] = self.rpt_requested_by.data
            return params
        
        
        def saveReport(self):
            """
            save or update the custom report represented by this form
            """
            params = self._getParams()
            if params:
                report = None
                
                if 'rpt_report_id' in params:
                    report = Report.query.filter_by(id=params['rpt_report_id']).first()
                else:
                    # create new report
                    report = Report()
                
                report.name = 'rpt_name' in params and params['rpt_name'] or report.name
                report.requested_by = 'rpt_requested_by' in params and params['rpt_requested_by'] or report.requested_by
                report.sql_text = 'rpt_sql_text' in params and params['rpt_sql_text'] or report.sql_text
                
                report.description = 'rpt_description' in params and params['rpt_description'] or ''
                
                if not report.report_author:
                    report.report_author = params['rpt_report_author']
                
                if not report.created:
                    report.created = datetime.datetime.now()
                
                if 'rpt_tags' in params:
                    self.addTags(report, params['rpt_tags'])
                
                db.session.add(report)
                db.session.commit()
                
                self.rpt_report_id.data = report.id
                self.rpt_report_author.data = report.report_author
                
            return report
        
        def addTags(self, report, tagString):
            """
            adds to this report object the tags entered, 
                splitting tagString on comma and whitespace
            """
            if tagString:
                tags = []
                for tag in TAG_REGEX.split(tagString):
                    tag = tag.strip()
                    if tag:
                        tag = tag.lower()
                        tags.append(tag)
                
                tags = list(set(tags))
                tags.sort()
                labels = []
                for tag in tags:
                    label = ReportLabel()
                    label.label = tag
                    labels.append(label)
                report.labels = labels
        
        