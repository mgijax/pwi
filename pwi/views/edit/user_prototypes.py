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
        "user_api_base_url": url_for('api.users-resource'),
        "status_list_url": url_for('api.user-status-resource'),
        "type_list_url": url_for('api.user-type-resource')
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
    
@edit.route('/user_angular_prototype',methods=['GET'])
def user_angular_prototype():
    """
    User module client built with Angular
    """
    
    return render_template( "edit/user/angular_prototype.html",
                             title="Angular Prototype User Module",
                             urls=getUrls())
    
    
@edit.route('/user_stub_prototype',methods=['GET'])
def user_stub_prototype():
    """
    Template for new prototype clients
    """
    
    return render_template( "edit/user/stub_prototype.html",
                             title="Stub Prototype User Module",
                             urls=getUrls())
    
