from flask import render_template

# util
def error_template(message):
    return render_template('error.html', message = message)