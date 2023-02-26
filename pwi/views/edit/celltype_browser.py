from flask import render_template
from .blueprint import edit

@edit.route('/celltypeBrowser/',methods=['GET'])
def celltypeBrowser():

    return render_template( "edit/celltype/celltype_browser.html")

