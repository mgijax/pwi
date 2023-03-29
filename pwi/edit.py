from flask import Blueprint, request, render_template
from pwi import app

# Define the blueprint for all the views in this directory

edit = Blueprint('edit', __name__, url_prefix='/edit')

@edit.route('/accessionsummary/')
@edit.route('/actlogdb/')
@edit.route('/allele/')
@edit.route('/alleledetail/')
@edit.route('/allelesummary/')
@edit.route('/allelederivation/')
@edit.route('/allelefear/')
@edit.route('/antibody/')
@edit.route('/antigen/')
@edit.route('/assay/')
@edit.route('/assaydetail/')
@edit.route('/antibodydetail/')
@edit.route('/antibodysummary/')
@edit.route('/assaysummary/')
@edit.route('/clonelib/')
@edit.route('/celltypeBrowser/')
@edit.route('/doalleleannot/')
@edit.route('/doannot/')
@edit.route('/emapaBrowser/')
@edit.route('/genotype/')
@edit.route('/genotypedetail/')
@edit.route('/genotypesummary/')
@edit.route('/goannot/')
@edit.route('/gxdHTEval/')
@edit.route('/gxdindex/')
@edit.route('/gxdindexsummary/')
@edit.route('/imagedetail/')
@edit.route('/imageGxd/')
@edit.route('/imageMgd/')
@edit.route('/imagepanesummary/')
@edit.route('/imageSubmission/')
@edit.route('/imagesummary/')
@edit.route('/mapping/')
@edit.route('/mappingdetail/')
@edit.route('/mappingsummary/')
@edit.route('/marker/')
@edit.route('/markerdetail/')
@edit.route('/markersummary/')
@edit.route('/mpannot/')
@edit.route('/mutantcellline/')
@edit.route('/nonmutantcellline/')
@edit.route('/organism/')
@edit.route('/probe/')
@edit.route('/probedetail/')
@edit.route('/probesummary/')
@edit.route('/referencesummary/')
@edit.route('/resultsummary/')
@edit.route('/sequencesummary/')
@edit.route('/simplevocab/')
@edit.route('/specimensummary/')
@edit.route('/strain/')
@edit.route('/triageFull/')
@edit.route('/triageShort/')
@edit.route('/variant/')
@edit.route('/voctermdetail/')
def genericEndpointHandler () :
    # get the page name
    ep = request.base_url.replace("/"," ").strip().split()[-1]
    # get the config for the page
    args = endpointParams.get(ep,{})
    # add the access token
    args['access_token'] = app.config['ACCESS_TOKEN']
    includes = STD_INCLUDES % args
    if args.get("isVocabBrowser",False):
	# the browsers have extra includes
        includes = VOCAB_BROWSER_INCLUDES + includes
    if not ep.endswith("detail") and not ep.endswith("summary"):
	# the edit moduels use bootstrap
        includes = BOOTSTRAP + includes
    # the main body uses one of several templated (below)
    # args["main"] specifies which one.
    main = MAIN_TEMPLATES[args["main"]] % args
    # plug the includes and main sections into the generic page template.
    return render_template("pageLayout.html", includes=includes, main=main)

###
controllerClassNames = [
    ("AccessionSummary", {}),
    ("ActLogDb", {}),
    ("Allele", {}),
    ("AlleleDerivation", {}),
    ("AlleleDetail", {}),
    ("AlleleFear", {}),
    ("AlleleSummary", {}),
    ("Antibody", {}),
    ("AntibodyDetail", {}),
    ("AntibodySummary", {}),
    ("Antigen", {}),
    ("Assay", {}),
    ("AssayDetail", {}),
    ("AssaySummary", {}),
    ("CellTypeClipboard", {
        "directory" : "celltype",
        "endpoint" : "celltypeBrowser",
        "content" : "celltype_browser_content.html",
        "css" : "celltypeBrowser.css",
        "isVocabBrowser" : True
    }),
    ("CloneLib", {}),
    ("DOAlleleAnnot", {}),
    ("DOAnnot", {}),
    ("EmapaClipboard",{
        "directory" : "emapa",
        "endpoint" : "emapaBrowser",
        "content" : "emapa_browser_content.html",
        "css" : "emapBrowser.css",
        "isVocabBrowser" : True
    }),
    ("Genotype", {}),
    ("GenotypeSummary", {}),
    ("GOAnnot", {}),
    ("Evaluation",{
        "directory" : "gxd",
        "endpoint" : "gxdHTEval",
        "content" : "gxd_ht_results_content.html",
        "css" : "gxd-ht.css",
        "main" : "GXDHT",
    }),
    ("GxdIndex",{
        "directory" : "gxd",
    }),
    ("GxdIndexSummary", {}),
    ("ImageDetail", {}),
    ("Image", {
        "endpoint" : "imageGxd",
        "extra_script_contents" : "var isGxd = true; var isMgd = false;",
    }),
    ("Image", {
        "endpoint" : "imageMgd",
        "extra_script_contents" : "var isGxd = false; var isMgd = true;",
    }),
    ("ImageSubmission",{
        "directory" : "image",
        "endpoint" : "imageSubmission",
        "css" : "imageSubmission.css",
        "content" : "imageSubmission_content.html",
        "extra_script_contents" : "var isGxd = true; var isMgd = false;",
    }),
    ("ImagePaneSummary", {}),
    ("ImageSummary", {}),
    ("MappingDetail", {}),
    ("Mapping", {}),
    ("MappingSummary", {}),
    ("MarkerDetail", {}),
    ("Marker", {}),
    ("MarkerSummary", {}),
    ("MPAnnot", {}),
    ("MutantCellLine", {}),
    ("NonMutantCellLine", {}),
    ("Organism", {}),
    ("ProbeDetail", {}),
    ("Probe", {}),
    ("ProbeSummary", {}),
    ("ReferenceSummary", {}),
    ("ResultSummary", {}),
    ("SequenceSummary", {}),
    ("SimpleVocab", {}),
    ("SpecimenSummary", {}),
    ("Strain", {}),
    ("LitTriage",{
        "directory" : "triage",
        "endpoint" : "triageShort",
        "extra_script_contents":"var isFullSearch = false;",
        "css": "lit_triage.css",
        "content": "lit_triage_content.html",
    }),
    ("LitTriage",{
        "directory" : "triage",
        "endpoint" : "triageFull",
        "extra_script_contents":"var isFullSearch = true;",
        "css": "lit_triage.css",
        "content": "lit_triage_content.html",
    }),
    ("Variant", {}),
    ("VocTermDetail", {}),
    ]

def controller2params (controllerName) :
    overrides = None
    if type(controllerName) is tuple:
        controllerName, overrides = controllerName
    cnLower = controllerName.lower()
    params = {
        "endpoint" : cnLower,
        "directory" : cnLower,
        "controllerClass" : controllerName + "Controller",
        "controller" : controllerName + "Controller.js",
        "service" : controllerName + "Service.js",
        "content" : cnLower + "_content.html",
        "css" : cnLower + ".css",
        "main" : "STANDARD",
        "extra_script_contents": "",
    }
    if overrides:
        params.update(overrides)
    return params

def addParamUrls (params) :
    params.update({
        "contentUrl" : f'/pwi/static/app/edit/{params["directory"]}/{params["content"]}',
        "cssUrl" : f'/pwi/static/app/edit/{params["directory"]}/{params["css"]}',
        "controllerUrl" : f'/pwi/static/app/edit/{params["directory"]}/{params["controller"]}',
        "serviceUrl" : f'/pwi/static/app/edit/{params["directory"]}/{params["service"]}',
        "controllerClassName" : params['controllerClass'],
    })
    return params

def setupEndpointParams ():
    global endpointParams
    endpointParams = {}
    for cn in controllerClassNames:
         params = controller2params(cn)
         addParamUrls(params)
         endpointParams[params['endpoint']] = params

    #
    # All the above is simply a convenient way of initializing the following dict:
    # Mapping from endpoint name (the last segment of the url's path part) to URLs for loading the necessary bits.
    #
    #  endpoint -> { 
    #    contentUrl,
    #    cssUrl,
    #    controllerUrl,
    #    serviceUrl,
    #    controllerClass,
    #
    #    directory,
    #    controller,
    #    service,
    #    content,
    #    css,
    #
    #    main,
    #    isVocabBrowser,
    #    extra_script_contents,
    #  }
    #
    endpointParams['genotypedetail'] = endpointParams['alleledetail']
    endpointParams['emapBrowser'] = endpointParams['emapaBrowser']

    print(str(endpointParams))

###
STD_INCLUDES = '''
	<link rel="stylesheet" type="text/css" href="%(cssUrl)s">
	
	<script src="%(serviceUrl)s"></script>
	<script src="%(controllerUrl)s"></script>
	
	<script>
	var access_token = '%(access_token)s';
	%(extra_script_contents)s
	</script>

        '''     

VOCAB_BROWSER_INCLUDES = '''
        <link rel="stylesheet" href="/pwi/static/mgijs/widgets/styles/mgitreeview.css" type="text/css" />
        <script src="/pwi/static/mgijs/bower_components/d3/d3.min.js"></script>
        <script src="/pwi/static/mgijs/widgets/mgitreeview.js"></script>
        '''

BOOTSTRAP = '''
        <link rel="stylesheet" type="text/css" href="/pwi/static/mgijs/bower_components/bootstrap/dist/css/bootstrap.min.css">
        '''

MAIN_TEMPLATES = {
    "STANDARD" :  '''
        <div id="wrapper" ng-controller="%(controllerClassName)s">
                <div ng-include="'%(contentUrl)s'"></div>
        </div>
        ''',

    "GXDHT" : '''
        <script src="'/pwi/static/app/edit/gxd/directives/StResetDirective.js'"></script>
        <title>GXD HT Eval</title>
        <br>
        <form class="form-horizontal">
                <div id="wrapper" ng-controller="EvaluationController">
                        <div ng-include="'/pwi/static/app/edit/gxd/gxd_ht_results_content.html'"></div>
                        <div ng-show="showhelp" ng-include src="'/pwi/static/app/edit/gxd/gxd_ht_debug_links.html'"></div>
                </div>

                <div class="container-fluid">
                        <a href="" ng-click="showhelp = !showhelp">Show Help</a>
                        <div ng-show="showhelp">
                            <ng-include src="STATIC_APP_URL + '/edit/gxd/ht_eval_help.html'" />
                        </div>
                </div>
        </form>
        ''',
}
###
setupEndpointParams ()
