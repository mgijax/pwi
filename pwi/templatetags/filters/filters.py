"""
 define custom filter methods
 Filter methods are used like this in jinja templates:
	{{variable|filter}}
 The first argument (e.g. "variable") is passed to the filter method
 Additional arguments are passed like this:
	{{variable|filter(arg1,arg2)}}
"""
from pwi import app
from flask import url_for
import re
import ImagePaneDisplay
import NotesTagConverter
from datetime import datetime, date


# TODO (kstone):
# Refactor imports of filters.highlight, filters.highlightContains, filters.highlightEMAPA
# to use mgipython directly
from mgipython.parse.highlight import highlight, highlightContains, highlightEMAPA


def actualdb_link(accession_object, preferences=[]):
    """
    Takes accession object and creates link 
    based on actualdb url,
    	
    If preferences are defined, and there are more than one actualdb,
    	it will try to use
    	actualdb links where the name is in preferences.
    	(Starting in order of preferences list)
    """
    url = ""

    logicaldb = accession_object.logicaldb_object
	
    if logicaldb and logicaldb.actualdbs:
    	
    	chosenActualdb = None
    	
    	if len(logicaldb.actualdbs) > 1 and preferences:
    		
    		# use preferences list to select the best actualdb to link
    		for preference in preferences:
    			
    			for actualdb in logicaldb.actualdbs:
    				if actualdb.name.lower() == preference.lower():
    					chosenActualdb = actualdb
    					
    			
    			# exit once we've found a preferred actualdb
    			if chosenActualdb:
    				break;
    			
    	
    	# default to first actualdb in every other situation
    	if not chosenActualdb:
    		chosenActualdb = logicaldb.actualdbs[0]
    					
    		
    	url = chosenActualdb.url
    	url = url.replace('@@@@', accession_object.accid)
    
    
    return url

def ascii_decode(value):
	"""
	decode ascii characters, while ignoring errors
	"""
	if isinstance(value, str):
		return value.decode("ascii", "ignore")
	return value
        
def bold_tail(s, tailLength):
        """
        adds <strong></strong> around the last tailLength
        characters of input string
        """
        if s:
                s = s[:-tailLength] + "<strong>" + s[-tailLength:] + "</strong>"
        return s

def css(value):
	"""
	creates a css friendly version of the passed in value
	special characters become underscores
	"""
	s = "%s" % value
	s = re.sub('[^0-9a-zA-Z]+', '_', s)
	return s

def format_datetime(value, format='medium'):
	if value:
		if format == 'full':
			format = "%Y-%m-%d at %l:%M%p"
		elif format == 'medium':
			format = "%Y-%m-%d at %l:%M%p"
		elif format == 'short':
			format = '%Y-%m-%d'
		return value.strftime(format)
	return ""


def dynamic_format(value):
	"""
	attempt to format value by type
	"""

	if value:
		if isinstance(value, list):
	    		return ", ".join([str(n) for n in value])
		if isinstance(value, (date, datetime)):
	    		return format_datetime(value)
	
	return value


def genotype_display(g, delim='<br/>'):
	"""
	format a genotype object in the typical fashion
	"""
	output = ''
	if g and g.combination1_cache:
		combination = g.combination1_cache.strip()
		combination = superscript(combination)
		
		pairs = []
		for pair in combination.split('\n'):
			
			pairs.append(pair)
		
		output = delim.join(pairs)
	
	return output
	
	

def image_pane_html(imagepane, maxWidth=None, maxHeight=None):
	"""
	Run through ImagePaneDisplay
	"""
	return ImagePaneDisplay.asHtml(imagepane, maxWidth, maxHeight)

def pdfviewer_url(ref):
	"""
	Handles generation of pdf url generation
	"""
	
	jnumid = ref.jnumid
	
	url = "%s%s" % (app.config['PDFVIEWER_URL'], jnumid )         
	
	return url

def marker_url(marker):
	"""
	Generates a link to a marker detail page
		by primary marker ID if possible
		then by _marker_key
	"""
	
	url = ""
	
	if marker:
		
		if marker.mgiid:
			return url_for("detail.markerDetailById", id=marker.mgiid)
		
		else:
			return url_for("detail.markerDetailByKey", key=marker._marker_key)
	
	return url

def notes_tag_converter(s, anchorClass='external'):
	"""
	Runs through notes tag converter
	"""
	return NotesTagConverter.convert(s, anchorClass=anchorClass)

def seconds_to_minutes(value):
	if value:
		value = int(value)
		if value >= 60:
			mins = value / 60
			secs = value % 60
			return "%dmin %ds" % (mins, secs)
		return "%ds" % value
	return value

def superscript(s):
	"""
	render MGIs superscript < > markup
	"""
	if not s:
		return ''
	
	start = '<'
	stop = '>'
	# revert existing <sup></sup> tags;  this is done incase there is
    # a mixture of existing sup tags and others that need conversion
	s = s.replace('<sup>', start)
	s = s.replace('</sup>', stop)

    # find the first instance of 'start' and 'stop' in 's'.
	startPos = s.find(start)
	stopPos = s.find(stop)
	startLen = len(start)
	stopLen = len(stop)
	sectionStart = 0;
	
	# if either start/stop value does not appear, then short-circuit
	if startPos == -1 or stopPos == -1:
	    return s
	
	sb = []
	
	while (startPos != -1) and (stopPos != -1) and (stopPos > startPos):
	    sb.append (s[sectionStart : startPos]);
	    sb.append ('<sup>');
	    sb.append (s[(startPos + startLen) : stopPos])
	    sb.append ('</sup>');
	
	    sectionStart = stopPos + stopLen
	    startPos = s.find(start, sectionStart)
	    stopPos = s.find(stop, sectionStart)
	sb.append (s[sectionStart:]);

	return ''.join(sb)


def to_str(s):
    """
    cast whatever s is to string
    """
    if s:
        return str(s)
