"""
 define custom filter methods
 Filter methods are used like this in jinja templates:
	{{variable|filter}}
 The first argument (e.g. "variable") is passed to the filter method
 Additional arguments are passed like this:
	{{variable|filter(arg1,arg2)}}
"""

# decode ascii characters, while ignoring errors
def ascii_decode(value):
	if isinstance(value,str):
		return value.decode("ascii","ignore")
	return value

# creates a css friendly version of the passed in value
# special characters become underscores
import re
def css(value):
	s = "%s"%value
	s = re.sub('[^0-9a-zA-Z]+','_',s)
	return s

def format_datetime(value, format='medium'):
	if value:
		if format == 'full':
			format="%Y-%m-%d at %l:%M%p"
		elif format == 'medium':
			format="%Y-%m-%d at %l:%M%p"
		return value.strftime(format)
	return ""

def seconds_to_minutes(value):
	if value:
		value = int(value)
		if value >= 60:
			mins = value/60
			secs = value%60
			return "%dmin %ds"%(mins,secs)
		return "%ds"%value
	return value
