# PWI Architechual Documentation

## Basic Structure

### (API - Service - DAO) Design Pattern
The purpose of this pattern is to facilitate rapid development of frontend and backend programming in the pwi. Allowing multiple programmers to be working in the code at the same time without stepping on each other.

### API
### Service
### DAO

## API

### Swagger
### 

## Searching and Querying

### SearchQuery / SearchResults Pattern

### Search Query

### Search Results

## Locations

### Views - pwi/pwi/views
In order to create a new directory for view. A blueprint file needs to be created in that directory and added to the view/\_\_init\_\_.py. Also when creating a new view in an existing view directory the file needs to be imported by the blueprint.py that is in that directory. Views define the routes for the application and should only communicate with a service, never directly with a DAO or the database.
### Templates - pwi/pwi/templates
At the beginning of every template it needs to "extend" a base template. Generally speaking for our application that is pageLayout.html via

	{% extends "pageLayout.html" %}
	
Once extended the template will need to define a block called "content" and if the template needs to import any custom imports it will need to define a "imports" block. Each template can also set the "title" for each page from inside the template.
### Forms - pwi/pwi/forms
These forms use a module called WTForms. This helps faciliate the creation of HTML forms on the webpage. These forms also help with dealing with form input data.
### Tags (Template Tags) - pwi/pwi/templatetags
Template tags are used to generate small bits of html that can be reused across the whole site via different templates. Template except certain variables to be setup a head of time in order for them to work correctly.
### Filters - pwi/pwi/templatetags/filters
Filters are functions that have to be defined in the pwi/\_\_init__.py file. These help when displaying lists of info and generating HTML. They can be used by "piping" them together.

	{{marker.name | super}}
	
This will automatically superscript the variable that comes before it.
 
### Static HTML - pwi/pwi/static
This is the location where any static HTML, Javascript, css, images, etc, will be served from. If there is no view defined the server will look in this directory structure in order to find the request from the browser.
### Service - mgipython/mgipython/service
The purpose of the service is to have a single location for business logic. The service does validation of objects before going to the backend. Also there is where any manipulation of objects happen before being sent to the view. Views will be the only caller to the service and the service should only communicate with a DAO, never the database directly. Services also should not do query logic in order to 
### DAO - mgipython/mgipython/dao

### Model - mgipython/mgipython/model
### Exceptions - mgipython/mgipython/error


## CRUD

### Creating new objects
### Reading objects
### Updating objects
### Deleting objects

## Blueprints

### Registering

