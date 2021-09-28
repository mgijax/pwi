from flask import render_template
from .blueprint import edit

@edit.route('/celltype/')
def celltypeBrowser():
    return render_template( "edit/celltype/celltype_browser.html")

