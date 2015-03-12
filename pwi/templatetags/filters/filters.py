"""
 define custom filter methods
 Filter methods are used like this in jinja templates:
	{{variable|filter}}
 The first argument (e.g. "variable") is passed to the filter method
 Additional arguments are passed like this:
	{{variable|filter(arg1,arg2)}}
"""
import re
import ImagePaneDisplay
import NotesTagConverter

# decode ascii characters, while ignoring errors
def ascii_decode(value):
	if isinstance(value, str):
		return value.decode("ascii", "ignore")
	return value

# creates a css friendly version of the passed in value
# special characters become underscores
def css(value):
	s = "%s" % value
	s = re.sub('[^0-9a-zA-Z]+', '_', s)
	return s

def format_datetime(value, format='medium'):
	if value:
		if format == 'full':
			format = "%Y-%m-%d at %l:%M%p"
		elif format == 'medium':
			format = "%Y-%m-%d at %l:%M%p"
		return value.strftime(format)
	return ""


def dynamic_format(value):
	"""
	attempt to format value by type
	"""
	if isinstance(value, list):
		return ", ".join([str(n) for n in value])
	
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
	
def highlight(s, token,
			wildcard='%',
			begin='<mark>',
			end='</mark>',
			delim=None):
	"""
	wrap all occurrences of token in
	s with <mark> tags for highlighting
	
	wildcard character is treated as a wildcard operator
	e.g. 'test%' would match 'testing'
	
	Performs a case-insensitive match
	"""
	if token:
		if wildcard:
			token = token.replace(wildcard, '.*')
			
		# make regex
		rgx = '^%s$' % token
		rc = re.compile(rgx, re.IGNORECASE)
		
		if not delim:
			if rc.match(s):
				s = '%s%s%s' % (begin, s, end)
		else:
			pieces = []
			
			for p in s.split(delim):
				if rc.match(p):
					pieces.append('%s%s%s' % (begin, p, end))
				else:
					pieces.append(p)
				
			s = delim.join(pieces)
			
	return s

def highlightContains(s, token,
			begin='<mark>',
			end='</mark>'):
	"""
	highlight wherever the token appears
	in s
	"""
	if s and token:
		s = s.replace(token, "%s%s%s" % (begin, token, end))
	return s
	

def image_pane_html(imagepane, maxWidth=None, maxHeight=None):
	"""
	Run through ImagePaneDisplay
	"""
	return ImagePaneDisplay.asHtml(imagepane, maxWidth, maxHeight)

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
