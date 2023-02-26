from flask import render_template
from .blueprint import edit

@edit.route('/emapBrowser/',methods=['GET'])   
@edit.route('/emapaBrowser/',methods=['GET'])
def emapaBrowser():
    
    return render_template( "edit/emapa/emapa_browser.html")

