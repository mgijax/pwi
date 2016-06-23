from flask import render_template
from flask_restful import Resource, Api
from blueprint import api
from mgipython.util import error_template

# API Classes

class UserResource(Resource):
    def get(self, key):
        return {'get': key}
    
    def put(self, key):
        return {'update': key}
    
    def delete(self, key):
        return {'delete': key}
    
    def post(self):
        return {'not':'implemented'}


api.add_resource(UserResource, '/user', '/user/<int:key>')
    

# Helpers

