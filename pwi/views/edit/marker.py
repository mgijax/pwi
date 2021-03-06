from flask import render_template
from .blueprint import edit

@edit.route('/marker/')
def markerQF():
    return render_template( "edit/marker/marker.html")


@edit.route('/marker/<string:id>')
def markerById(id):
    return render_template( "edit/marker/marker.html", 
                            markerID = id)

@edit.route('/marker/key/<int:key>')
def markerByKey(key):
    return render_template( "edit/marker/marker.html", 
                            markerKey = key)
