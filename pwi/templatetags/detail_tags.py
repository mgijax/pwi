from jinja2 import contextfunction,Environment,PackageLoader
env = Environment(loader=PackageLoader('pwi','templates'))
import flask

# need to globally track the count of ajax load templatetags so we can assign unique css ids
AJAX_LOAD_COUNT=0

# a widget for defining ajax loaded content.
# can optionally define it to hide behind a turnstile so content is only loaded if a user wants to open it.
def do_ajax_widget(url,turnstile=False):
	global AJAX_LOAD_COUNT
	# we don't want the ids to increment forever, and who would ever make more than 10,000 ajax calls on one page?
	if AJAX_LOAD_COUNT > 10000:
		AJAX_LOAD_COUNT=0
	AJAX_LOAD_COUNT += 1
	templateFragment = env.get_template('pwi/fragments/ajax_widget.html')
	return templateFragment.render(url=url,turnstile=turnstile,content_id="ajax_content_%s"%AJAX_LOAD_COUNT)

# define any functions our template fragments need to use
env.filters["url_for"] = flask.url_for

