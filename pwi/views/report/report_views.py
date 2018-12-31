from flask import render_template, request, Response, redirect, url_for, session
from blueprint import report
from mgipython.util import error_template, printableTimeStamp
from mgipython.model.core import getColumnNames
from mgipython.model.query import performQuery, QueryError, batchLoadAttribute
from pwi import app
from pwi.forms.report_entry import ReportEntryForm, TAG_REGEX
import re
from mgipython.model.appmodel import Report, ReportLabel
from mgipython.modelconfig import db

# constants
varRe = re.compile('###[\w\d\s]+###')
SQL_TYPE = 'sql'
CODE_TYPE = 'code'

# Routes   

@report.route('/index',methods=['GET'])
def reportIndex():
    
    reports = Report.query.order_by(Report.name).all()
    batchLoadAttribute( reports, 'labels' )
    
    return render_template("report/index.html",
                           reports=reports)
    
@report.route('/summary',methods=['GET'])
def reportSummary():
    
    query = Report.query
    
    tagsToQuery = []
    if 'tags' in request.args:
        tags = request.args['tags']
        tags = TAG_REGEX.split(tags)
        for tag in tags:
            tag = tag.strip()
            if tag:
                tag = tag.lower()
                tagsToQuery.append(tag)
        
        query = query.filter(Report.labels.any(ReportLabel.label.in_(tagsToQuery)))
        
    requested_by = ''
    if 'requested_by' in request.args:
        requested_by = request.args['requested_by']
        requested_by = requested_by.strip().lower()
        if requested_by:
            query = query.filter(db.func.lower(Report.requested_by)==requested_by)
            
    report_author = ''
    if 'report_author' in request.args:
        report_author = request.args['report_author']
        report_author = report_author.strip()
        if report_author:
            query = query.filter(Report.report_author==report_author)
    
    query = query.order_by(Report.created.desc()) \
    
    reports = query.all()
    batchLoadAttribute( reports, 'labels' )
    
    return render_template("report/report_query_summary.html",
                           reports=reports,
                           tags=tagsToQuery,
                           requested_by=requested_by,
                           report_author=report_author)
     
    
@report.route('/newreport',methods=['GET'])
def newReportForm():
    
    form = ReportEntryForm()
    
    return render_template("report/report_entry.html",
                           form=form)
    
@report.route('/editreport/<int:id>',methods=['GET'])
def editReport(id):
    
    form = ReportEntryForm()
    
    report = Report.query.filter_by(id=id).first()
    
    form.rpt_report_id.data = report.id
    form.rpt_sql_text.data = report.sql_text
    form.rpt_description.data = report.description
    form.rpt_name.data = report.name
    form.rpt_report_author.data = report.report_author
    form.rpt_requested_by.data = report.requested_by
    form.rpt_tags.data = report.tagString
    
    return render_template("report/report_edit.html",
                           form=form)
    

@report.route('/savereport',methods=['POST'])
def saveReport():
    
    form = ReportEntryForm(request.form)
    
    form.rpt_report_author.data = session['user']
    
    template = 'report/report_entry.html'
    if form.rpt_report_id.data:
        template = 'report/report_edit.html'
    
    if 'testReport' in request.form and request.form['testReport']:
        results, columns = processReportScript(form.rpt_sql_text.data)
        return render_template(template,
                           form=form,
                           results=results,
                           columns=columns)
    else:
        
        report = form.saveReport()
        
        return redirect( url_for('report.reportDetail', id=report.id) )
    
@report.route('/deletereport/<int:id>')
def deleteReport(id):
    # we need to create this user's database session
    dbSession = db.session
    
    report = dbSession.query(Report).filter_by(id=id).first()
    reportName = report.name
    
                
    [dbSession.delete(l) for l in report.labels]
    dbSession.delete(report)
    dbSession.commit()
    
    message = 'deleted report "%s" with id %d' % (reportName, id)
        
    return render_template('report/report_message.html', 
                           message = message)
    

@report.route('/detail/<int:id>')
def reportDetail(id):
    report = Report.query.filter_by(id=id).first()
    
    results = []
    columns = []
    data_count = 0
    
    variables = readVariables(report.sql_text)
    
    if variables:
        return render_template('report/report_template.html',
                               report=report,
                               variables=variables)
    else:
        results, columns = processReportScript(report.sql_text)
        data_count = len(results)
    
    return render_template('report/report_detail.html',
                           report=report,
                           results=results,
                           columns=columns,
                           data_count=data_count)
    
@report.route('/download/<int:id>')
def reportDownload(id):
    report = Report.query.filter_by(id=id).first()
    
    results, columns = processReportScript(report.sql_text)
    
    return renderReportDownload(report, results, columns)
    
    
@report.route('/runtemplate/<int:id>', methods=['GET'])
def runTemplate(id):
    
    report = Report.query.filter_by(id=id).first()
    
    args = request.args
    variables = readVariables(report.sql_text)
    
    kwargs = {}
    # map args to variables
    argList = [arg for arg in args.keys() if 'var' in arg]
    def keyFunc(a):
        return int(a[3:])
    argList.sort(key=keyFunc)
    for i in range(0, len(argList)):
        arg = argList[i]
        value = args[arg]
        variable = variables[i]
        kwargs[variable] = value
        
    
    
    results, columns = processReportScript(report.sql_text, kwargs)
    data_count = len(results)
    
        
    # Handle clicking the alternate submit button to
    #    trigger immediate file download
    #
    #    'Download' should appear in the submit value
    if 'submit' in args \
        and 'download' in args['submit'].lower():
        return renderReportDownload(report, results, columns)
    
    
    # Else render the normal HTML summary
    
    values = []
    for variable in variables:
        if variable in kwargs:
            values.append( kwargs[variable] )
        else:
            values.append('')
    
    return render_template('report/report_template.html',
                           report=report,
                           results=results,
                           columns=columns,
                           data_count=data_count,
                           variables=variables,
                           values=values,
                           ranTemplate=True)
    
    
@report.route('/downloadTemplate/<int:id>', methods=['GET'])
def reportTemplateDownload(id):
    report = Report.query.filter_by(id=id).first()
    
    args = request.args
    variables = readVariables(report.sql_text)
    
    kwargs = {}
    # map args to variables
    argList = [arg for arg in args.keys() if 'var' in arg]
    def keyFunc(a):
        return int(a[3:])
    argList.sort(key=keyFunc)
    for i in range(0, len(argList)):
        arg = argList[i]
        value = args[arg]
        variable = variables[i]
        kwargs[variable] = value
        
    results, columns = processReportScript(report.sql_text, kwargs)
    
    return renderReportDownload(report, results, columns)

# Helpers

def renderReportDownload(report, results, columns):
    """
    Create the download file for 
        results and columns
    """
    # list of data rows
    fileData = []

    # add header
    fileData.append(columns)
    fileData.extend(results)
    
    
    def convert(val):
        if type(val) not in (str, unicode):
            return str(val)
        return val
            

    # create a generator for the table cells
    generator = ("%s\r\n"%("\t".join([convert(col).replace('\n',' ').replace('\r',' ') for col in row])) for row in fileData)
    
    filename = "report_%d_%s.txt" % (report.id, printableTimeStamp())

    return Response(generator,
                mimetype="text/plain",
                headers={"Content-Disposition":
                            "attachment;filename=%s" % filename})

def processReportScript(text, kwargs={}):
    """
    Takes a text with sql statements
    and <code></code> tags.
    Processes them and returns any 
        results, columns
    """
    results = []
    columns = []
    
    text = _replaceArgs(text, kwargs)
    
    commands = _getSqlAndCodeCommands(text)
    
    for command in commands:
        
        cmdScript = command['command']
        
        #app.logger.debug("processing %s script: \n%s\n" % (command['type'], cmdScript))
        
        if command['type'] == SQL_TYPE:
            
            #try:
            results, columns = performQuery(cmdScript)
            results = [r.values() for r in results]
            #except QueryError, e:
            #    print cmdScript
            #    raise QueryError
            
        elif command['type'] == CODE_TYPE:
            
            exec cmdScript
    
    
    return results, columns


def readVariables(text):
    """
    return all the variable names (in order)
    from the text
    """
    seen = set([])
    variables = _getVariables(text)
    cleanVariables = []
    for variable in variables:
        if variable in seen:
            continue
        seen.add(variable)
        cleanVariables.append(variable[3:-3])
    
    return cleanVariables


def _getSqlAndCodeCommands(text):
    """
    Get list of sql statements
    and <code></code> scripts
    return as list of {'type', 'command'} objects
        type is either 'sql' or 'code'
    """
    commands = []
    
    codeStart = '<code>'
    codeEnd = '</code>'
    
    curIdx = 0
    
    codeIdx = text.find(codeStart, curIdx)
    while codeIdx >= 0:
        
        codeEndIdx = text.find(codeEnd, codeIdx)
        
        if codeEndIdx >= codeIdx:
            
            # check for any sql before <code> block
            sqlBlock = text[curIdx:codeIdx].strip()
            if sqlBlock:
                commands.append(_commandObject(SQL_TYPE, sqlBlock))
            
            codeBlock = text[(codeIdx + len(codeStart)) : codeEndIdx].strip()
            if codeBlock:
                commands.append(_commandObject(CODE_TYPE, codeBlock))
                
            # adjust curIdx
            curIdx = codeEndIdx + len(codeEnd)
            
        
        codeIdx = text.find(codeStart, curIdx)
        
    
    # catch any sql after <code> block (or if there are no <code> blocks
    sqlBlock = text[curIdx:].strip()
    if sqlBlock:
        commands.append(_commandObject(SQL_TYPE, sqlBlock))
    
    return commands
    

def _replaceArgs(text, kwargs):
    """
    replace any variables in the text
    of the format ###var name###
    from provided kwargs dict in format
    { "var name": value }
    """
    
    for key, value in kwargs.items():
        variable = _variableFormat(key)
        value = str(value)
        
        # to support a list or batch : variable must contains 'list of' and space seperators
        # i.e. : xxxxx yyyyy zzzzz => ('xxxxx'), ('yyyyy'), ('zzzzz')
        if variable.find('list of') > 0:
            newvalues = []
            values = value.split(' ')
            for v in values:
                newvalues.append("('" + v + "')")
            value = ','.join(newvalues)
        else:
            # escape single quotes
            value = value.replace("'", "''")

        if variable not in text:
            raise ReportParsingException('Variable "%s" cannot be found in source script' % variable)
        
        text = text.replace(variable, value)
    
    leftoverVariables = _getVariables(text)
    
    if leftoverVariables:
        raise ReportParsingException('The following variables did not recieve values: %s' % leftoverVariables)
    
    return text


def _getVariables(text):
    """
    return any variables contained inside text
    of format ###var name###
    """
    variables = [m.group() for m in varRe.finditer(text)]
    
    return variables

    
def _variableFormat(name):
    return "###%s###" % name

def _commandObject(type, command):
    return {'type': type, 'command': command}
    
    
class ReportParsingException(Exception):
    """
    Raised when parsing report script
    """
    
    
    
    
    

    
