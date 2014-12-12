from flask import render_template
import datetime

# util

def batch_list(iterable, n = 1):
   l = len(iterable)
   for ndx in range(0, l, n):
       yield iterable[ndx:min(ndx+n, l)]
       
def error_template(message):
    return render_template('error.html', message = message)

def createSummaryList(originalResults, columns):
    """
    iterates results and creates lists based
    on attributes or properties defined in columns
    returns list of these lists
    """
    sumList = []
    if originalResults:
        attrMethodName = '__getitem__'
        if attrMethodName not in dir(originalResults[0]):
            attrMethodName = '__getattribute__'
        for result in originalResults:
            row = []
            for col in columns:
                attrMethod = getattr(result, attrMethodName)
                try:
                    row.append(attrMethod(col))
                except Exception:
                    row.append('')
            sumList.append(row)
    
    return sumList

def printableTimeStamp():
    """
    returns current timestamp as a string
    """
    return str(datetime.datetime.now()).split('.')[0]
    