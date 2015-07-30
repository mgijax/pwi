from jinja2 import nodes
from jinja2.ext import Extension
from pwi import app


class DetailItemExtension(Extension):
    # a set of names that trigger the extension.
    tags = set(['detail_item'])

    def __init__(self, environment):
        super(DetailItemExtension, self).__init__(environment)

    def parse(self, parser):
        lineno = parser.stream.next().lineno

        # now we parse a single expression that is used as data type
        args = [parser.parse_expression()]
        
        # check if showEmpty boolean was specified
        if parser.stream.skip_if('comma'):
            args.append(parser.parse_expression())
        else:
            args.append(nodes.Const(True))
            
        # get content between detail_item and end_detail_item
        body = parser.parse_statements(['name:end_detail_item'], drop_needle=True)

        # return callback to self._render_item for rendering this tag
        return nodes.CallBlock(self.call_method('_render_item', args),
                               [], [], body).set_lineno(lineno)

    def _render_item(self,dataType, showEmpty, caller):
        """Render a detail item"""
        inner = caller()
        
        # if showEmpty is set to False, and inner data is blank
        # don't render anything
        if not showEmpty and not inner.strip():
            return ''

        return '<div class="detailPageDataRow">' \
                '<span class="detailPageDataType">%s</span>' \
                '<span class="detailPageDataDisplay">%s</span></div>' % \
                (dataType, inner)