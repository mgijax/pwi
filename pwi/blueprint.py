import os
from flask import Blueprint, request, render_template
from pwi import app, log
import json

######################################################################################################
# Set up a dictionary (called endpoints) that maps endpoint names to the parameters needed to render their pages. 
#
# The dictionary has the following structure.
#  endpoint -> {        - key = name of endpoint, e.g. "markerdetail"
#    directory,         - name of directory under /pwi/static/app/edit, e.g. "markerdetail"
#    controller,        - name of controller file, e.g. "MarkerDetailController.js"
#    service,           - name of service file, e.g. "MarkerDetailService.js"
#    content,           - name of html content file, e.g. "markerdetail_content.html"
#    css,               - name of css file, e.g. "markerdetail.css"
#
#    controllerUrl,     - URL for controller file, e.g. "/pwi/edit/markerdetail/MarkerDetailController.js"
#    serviceUrl,        - URL for service file, e.g. "/pwi/edit/markerdetail/MarkerDetailService.js"
#    contentUrl,        - URL for content file, e.g. "/pwi/edit/markerdetail/markerdetail_content.html"
#    cssUrl,            - URL for css file, e.g. "/pwi/edit/markerdetail/markerdetail.css"
#    controllerClass,   - name of the controller class, e.g., "MarkerDetail"
#
#    mainTemplate,      - name of the main body type. One of: "standard", "gxdht", ""
#    extra_script_contents, - extra Javascript to run in the head script section, e.g. "var myFlag = "fooBar";"
#    endpointName,	- same as the key for this entry
#  }
#
# Individual parameters may be referenced in the page template with the "{{ }}" syntax. 
# E.g., 
#       <script src="{{ controllerUrl }}"></script>
#
# Most (but not all!) endpoints follow the same naming conventions for the files that implement them.
# For an endpoint named foobar:
#       - (directory) The directory containing the files is named the same as the endpoint. E.g. "foobar"
#         It is located under /pwi/static/app/edit. It contains all the files in the following.
#       - (nameRoot) The name "root" for the individual files is "foobar". Names of files for this endpoint 
#         all begin with the name root. CASE MAY DIFFER. If the name root is "foobar", the actual file
#         names may start with "FooBar", "Foobar", "FoObAR", ...
#       - (controller) The controller is the file beginning with the name root and ending with "Controller.js", 
#         e.g. "FooBarController.js" (in the suffix part, case must match: "Controller.js", not "controller.js"
#       - (controllerClass) The name of the controller class is the same as the file name minus the ".js" extension.
#         E.g., for "FooBarController.js", the controller class name is "FooBarController" (case matters).
#       - (service) Services are in the file beginning with the root and ending with "Service.js", e.g. "FooBarService.js"
#       - (content) The name of the page's template file begins with the root and ends with "_content.html", e.g.,
#	  "foobar_content.html"
#       - (css) The name of the page's css file begins with the root and ends with ".css", e.g., "foobar.css"
#
# For endpoints that follow these naming convention, we can (and do) derive all the needed parameter values automatically.
# For endpoints that depart of the the convention, any/all of these parameters can be explicitly set/overridden.
# (Such endpoints are always candidates for refactoring so they follow the conventions. But, one thing at a time...)
#
# The following dictionary maps each defined endpoint name to a config object. For endpoints following the conventions,
# the config is empty. Others specify things as needed. In all cases, missing parameters will be filled in with names 
# derived according the the conventions.
#
endpoints = {
    "accessionsummary": {},
    "actlogdb": {},
    "allele": {},
    "allelederivation": {},
    "alleledetail": {},
    "allelefear": {},
    "allelesummary": {},
    "antibody": {},
    "antibodydetail": {},
    "antibodysummary": {},
    "antigen": {},
    "assay": {},
    "assaydetail": {},
    "assaysummary": {},
    "celltypeBrowser": {
        "directory" : "celltype",
        "controller": "CellTypeClipboardController.js",
        "service": "CellTypeClipboardService.js",
        "content" : "celltype_browser_content.html",
        "css" : "celltypeBrowser.css",
    },
    "clonelib": {},
    "doalleleannot": {},
    "doannot": {},
    "emapaBrowser": {
        "directory" : "emapa",
        "controller": "EmapaClipboardController.js",
        "service": "EmapaClipboardService.js",
        "content" : "emapa_browser_content.html",
        "css" : "emapBrowser.css",
    },
    "emapBrowser": "emapaBrowser", # pure alias. Not sure if it's still needed, but just in case...
    "genotype": {},
    "genotypedetail": "alleledetail", # uses same code, which is sensistive to the endpoint name
    "genotypesummary": {},
    "goannot": {},
    "gxdHTEval": {
        "directory" : "gxd",
        "controller": "EvaluationController.js",
        "service": "EvaluationService.js",
        "content" : "gxd_ht_results_content.html",
        "css" : "gxd-ht.css",
        "mainTemplate" : "gxdht",
    },
    "gxdindex": {
        "directory" : "gxd",
    },
    "gxdindexsummary": {},
    "imagedetail": {},
    "imageGxd":  {
        "directory": "image",
        "nameRoot" : "image",
        "extra_script_contents" : "var isGxd = true; var isMgd = false;",
    },
    "imageMgd":  {
        "directory" : "image",
        "nameRoot" : "image",
        "extra_script_contents" : "var isGxd = false; var isMgd = true;",
    },
    "imageSubmission": {
        "directory" : "image",
        "nameRoot" : "imagesubmission",
        "extra_script_contents" : "var isGxd = true; var isMgd = false;",
    },
    "imagepanesummary": {},
    "imagesummary": {},
    "mappingdetail": {},
    "mapping": {},
    "mappingsummary": {},
    "markerdetail": {},
    "marker": {},
    "markersummary": {},
    "mpannot": {},
    "mutantcellline": {},
    "nonmutantcellline": {},
    "organism": {},
    "probedetail": {},
    "prism": {},
    "probe": {},
    "probesummary": {},
    "referencesummary": {},
    "resultsummary": {},
    "sequencesummary": {},
    "simplevocab": {},
    "specimensummary": {},
    "strain": {},
    "triageShort":  {
        "directory" : "triage",
        "extra_script_contents":"var isFullSearch = false;",
        "controller": "LitTriageController.js",
        "service": "LitTriageService.js",
        "css": "lit_triage.css",
        "content": "lit_triage_content.html",
    },
    "triageFull": {
        "directory" : "triage",
        "extra_script_contents":"var isFullSearch = true;",
        "controller": "LitTriageController.js",
        "service": "LitTriageService.js",
        "css": "lit_triage.css",
        "content": "lit_triage_content.html",
    },
    "variant":  {
        "extra_script_contents":"var inputVariantID  = ''; var inputVariantKey = '';"
    },
    "voctermdetail": {},
}

# Returns four filenames under path that match our rules for controller, service, content, and css.
# If a given filename cannot be found, or if there were multiple matches, that name is set to None 
# and must be explicitly set. 
def fillFileNames (epCfg, path, nameRoot) :
    #
    def testFileName(fname, nameRoot, suffix):
        return fname.lower().startswith(nameRoot) and fname[len(nameRoot):] == suffix
    #
    def filterFiles(files, nameRoot, suffix):
        lst = list(filter(lambda fn: testFileName(fn, nameRoot,suffix), files))
        return lst[0] if len(lst) == 1 else None
    #
    files = os.listdir(path)
    epCfg.setdefault("controller" , filterFiles(files, nameRoot, "Controller.js"))
    epCfg.setdefault("service"    , filterFiles(files, nameRoot, "Service.js"))
    epCfg.setdefault("content"    , filterFiles(files, nameRoot, "_content.html"))
    epCfg.setdefault("css"        , filterFiles(files, nameRoot, ".css"))

def fillParameters (endpointName, epCfg) :
    epCfg.setdefault("endpointName", endpointName)
    directory = epCfg.setdefault("directory", endpointName)
    fullPath = os.path.join(app.config["PWI"], "pwi/static/app/edit", directory)
    nameRoot = epCfg.setdefault("nameRoot", endpointName.lower())
    #
    fillFileNames(epCfg, fullPath, nameRoot)
    epCfg.setdefault("mainTemplate", "standard")
    epCfg.setdefault("controllerClass", epCfg["controller"][:-3])

    epCfg.setdefault("contentUrl" , f'/pwi/static/app/edit/{epCfg["directory"]}/{epCfg["content"]}')
    epCfg.setdefault("cssUrl" , f'/pwi/static/app/edit/{epCfg["directory"]}/{epCfg["css"]}')
    epCfg.setdefault("controllerUrl" , f'/pwi/static/app/edit/{epCfg["directory"]}/{epCfg["controller"]}')
    epCfg.setdefault("serviceUrl" , f'/pwi/static/app/edit/{epCfg["directory"]}/{epCfg["service"]}')

def fillEndpointCfg (epName):
    epCfg = endpoints[epName] 
    if type(epCfg) is type(""):
        # handle simple aliases (eg "genotypedetail" for "alleledetail")
        target = epCfg
        endpoints[epName] = endpoints[target]
    else:
        fillParameters(epName, epCfg)
        log(epCfg)

###

def packageArgs (mdict) :
    d = {}
    for (key,vals) in mdict.lists():
        if len(vals) == 1:
            d[key] = vals[0]
        else:
            d[key] = vals
    return json.dumps(d)
        

###
# All defined endpoints route to this handler function.
def genericEndpointHandler () :
    # get the endpoint name
    epName = request.base_url.replace("/"," ").strip().split()[-1]
    # get the config for the page
    params = endpoints[epName]
    # add the access token
    params['access_token'] = app.config['ACCESS_TOKEN']
    # log(epName+':\n'+ str(params))

    args = request.args.copy()
    args.update(request.form)
    params['request_args'] = packageArgs(args)

    # render the template
    return render_template("pageLayout.html", **params)

###

# Create the blueprint object
edit = Blueprint('edit', __name__, url_prefix='/edit')

# Attach  route for each defined endpoint (we do it this way instead of using @app.route
# so we only have to list the endpoints once.)
for epName in endpoints.keys():
        edit.add_url_rule("/" + epName + "/", view_func=genericEndpointHandler, methods=['GET', 'POST'])
        fillEndpointCfg(epName)
