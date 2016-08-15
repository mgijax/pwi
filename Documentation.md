# PWI Architechual Documentation

## Basic Structure

### (API -> Service -> DAO -> Model -> DAO -> Service -> API) Design Pattern
The purpose of this pattern is to facilitate rapid development of frontend and backend programming in the pwi. Allowing multiple programmers to be working in the code at the same time without stepping on each other. There are multiple layers in order to keep responciblies of the code seperate as much as possiable.

### Views/API - pwi/pwi/views/api


### Service - mgipython/mgipython/service
The purpose of the service is to have a single location for business logic. The service does validation of objects before going to the backend. Also there is where any manipulation of objects happen before being sent to the view. Views will be the only caller to the service and the service should only communicate with a DAO, never the database directly. Services also should not do query logic in order to 
### DAO - mgipython/mgipython/dao
The DAO is where all the query logic gets put to retrieve objects from the database. This is also where the query gets put together for searching. Every DAO needs to extend the BaseDAO this gives every DAO the basic CRUD operations to the database. Base functions:
	
	BaseDAO:
	get_by_key(key)
	save(object)
	save_all(object[])
	delete(object)
	
	ModelDAO(BaseDAO):
	search(SearchQuery)
	
### Model - mgipython/mgipython/model
Models are SQLAlchemy models. They are organized by table prefix under a directory by the name of the DB schema. For instance the Marker model can be found in the mgd/mrk.py file, as well as all other models that belong to tables that start with mrk_. Every model needs to extend

	class Marker(db.Model, MGIModel):
	
This gives the model access to a query object and database in order to create queries.


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

### Helpers (Service Helpers) - mgipython/mgipython/service/helpers


### Exceptions - mgipython/mgipython/error
Errors.py is the file for defining customer exceptions. Right now only the following are defined:

	NotFoundError
	InvalidPermissionError
	InvalidStageInputError
	InvalidEMAPAIDError
	
These can be used and the Views are configured to capture these errors, and give the correct error messaging.

## Searching and Querying (SearchQuery / SearchResults Pattern)

### Search Query
When searching the View will create a new SearchQuery Object and load it up with the search args in the params dictionary into the SearchQuery object this is then passed to the Service in order to search for specific objects. The View will also if needed add a Pageination Object, to the SearchQuery if it needs to display the results in paged form. The Service will do any validation, before sending it onto the DAO, or multiple DAO's.

### Search Results
Once a DAO recieves a SearchQuery it will run the correct query and create a SearchResults object to return the payload. It will also attach to the SearchResults any Pagenation Object that came in from the SearchQuery object. Before returning the results object to the service.

## CRUD

### Creating new objects
When creating a new object to be saved to the database. The view should create the new instance of the model object, and place all the params into the object before handing it to the service. The it should call the "create" method on the service to save the object to the database. The Service will verify that all the params that are required are set and then proceed on to call the DAO's "create" method. The DAO will not verify anything other then trying to get the object created in the database and report any errors in doing so.
### Reading objects
The View should call the getObjectByCriteria(criteria) on the Service. The Service will then use the correct DAO to get the data from the database and format it accordingly to how the view would like the data.
### Updating objects
When updating an object to the database. The view should create the new instance of the model object, and place all the params into the object before handing it to the service. The it should call the "save" method on the service to save the object to the database. The Service will verify that all the params that are required are set, then the service will do a lookup in order to get the corrisponding object from the database. It will copy all the fields that the view is allows to modify, then proceed on to call the DAO's "save" method. The DAO will not verify anything other then trying to get the object saved to the database and report any errors in doing so.
### Deleting objects
The view will call the services "delete" function with a key or some other identifier for the object. The server will do a lookup (on the DAO) of the object to make sure it exists and then call the DAO's delete method in order to delete the record from the database.
