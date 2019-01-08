from flask import render_template
from blueprint import edit

@edit.route('/variant/')
def variantQF():
    return render_template( "edit/variant/variant.html")


@edit.route('/variant/<string:id>')
def variantById(id):
    return render_template( "edit/variant/variant.html", variantID = id)

@edit.route('/variant/key/<int:key>')
def variantByKey(key):
    return render_template( "edit/variant/variant.html", variantKey = key)
