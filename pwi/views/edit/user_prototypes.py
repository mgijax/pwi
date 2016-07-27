from flask import render_template, request, Response, url_for
from blueprint import edit
from pwi import app
import json
from datetime import datetime



def getUrls():
    """
    Build all the API urls we need
    """
    return {
        "user_api_base_url": url_for('api.userlistresource'),
        "status_list_url": url_for('api.userstatusresource'),
        "type_list_url": url_for('api.usertyperesource')
    }

  
@edit.route('/user_vue_prototype',methods=['GET'])
def user_vue_prototype():
    """
    User module client built with Vue.js
    """
    
    return render_template( "edit/user/vue_prototype.html",
                             #title="Vue Prototype User Module",
                             title="Vue Prototype User Module",
                             urls=getUrls())
    
@edit.route('/user_next_prototype',methods=['GET'])
def user_next_prototype():
    """
    User module client built with ?.js
    """
    
    return render_template( "edit/user/next_prototype.html",
                             title="? Prototype User Module",
                             urls=getUrls())
    
    
@edit.route('/user_stub_prototype',methods=['GET'])
def user_stub_prototype():
    """
    Template for new prototype clients
    """
    
    return render_template( "edit/user/stub_prototype.html",
                             title="Stub Prototype User Module",
                             urls=getUrls())
    
