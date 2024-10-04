(function() {
	'use strict';
	angular.module('pwi').controller('PageController', PageController);

	function PageController(
			$scope,
			$http, 
			$document, 
			usSpinnerService, 
			UserLoggedInAPI,
			ErrorMessage,
			PWI_BASE_URL,
			PDFVIEWER_URL,
			PIXDB_URL,
			WEBSHARE_URL
	) {
		this.$onInit = function () {
		    // https://stackoverflow.com/questions/17642872/refresh-page-and-keep-scroll-position
		    window.addEventListener("beforeunload", function (e) {
			// Just before leaving any PWI page, record the current URL and the vertical scroll position
			sessionStorage.setItem('lastpage', document.location.href)
			sessionStorage.setItem('scrollTop', document.body.scrollTop)
		    })
		    
		    // Upon initializing any PWI page, see if it's a reload, i.e., if the current URL matched the previous URL. 
		    // If it is, extract the saved scroll position.
		    $scope.savedScrollTop = null
		    if (sessionStorage.getItem('lastpage') === document.location.href) {
		        $scope.savedScrollTop = sessionStorage.getItem('scrollTop')
		    }
		}

		// Function to restore the scroll position from the saved position. Controllers should call this
		// function after they have received the data from the API and have complete all data updates.
		// Set a delay (in sec) to allow Angular and the browser to update the display.
		// A delay of 1 sec seems to work ok.
                $scope.restoreScrollPosition = function (delay) {
		    if (delay === null || delay === undefined) {
		        delay = 1
		    }
		    if ($scope.savedScrollTop !== null) {
		        window.setTimeout( () => {
			    window.scrollTo(0, $scope.savedScrollTop)
			    // subsequent calls have no effect (e.g., due to paging)
			    $scope.savedScrollTop = null
			}, 1000 * delay)
	            }
                };

		$scope.usSpinnerService = usSpinnerService;
		$scope.current_user = null;
		$scope.errors = {};
		$scope.loading = false;
		$scope.starttime = 0;
		$scope.endtime = 0;
		$scope.PWI_BASE_URL = PWI_BASE_URL;
		$scope.PDFVIEWER_URL = PDFVIEWER_URL;
		$scope.PIXDB_URL = PIXDB_URL;
		$scope.WEBSHARE_URL = WEBSHARE_URL;
		$scope.STATIC_APP_URL = PWI_BASE_URL + "static/app"
		$scope.PAGE_HELP_URL = PWI_BASE_URL + document.location.pathname.replace("pwi","static/app") + "/help.html"
                $scope.paginators = [] 

		UserLoggedInAPI.get(function(data) {
			$scope.current_user = data;
		}, function(err) {
			$scope.current_user = null;
		});

                $scope.handleError = function(vm, msg) {
                        vm.errorMsg = msg;
                        vm.hideErrorContents = false;
                        vm.hideLoadingHeader = true;
                }

		$scope.pageModifyDisabled = function() {
			return $scope.current_user == null || !$scope.current_user.login || $scope.loading;
		}

		$scope.loadingStart = function() {
			$scope.loading = true;
			$scope.starttime = Date.now();
			$scope.usSpinnerService.spin('page-spinner');
		}

		$scope.isLoading = function() {
			return $scope.loading;
		}

		$scope.loadingEnd = function() {
			$scope.usSpinnerService.stop('page-spinner');
			$scope.endtime = Date.now();
			$scope.loading = false;
		}
		

                /*
		 * Set error model on errors
		 */

                function setVisibleError(event, errorData) {
                        $scope.errors.api = errorData;
                }
                ErrorMessage.notifyErrorOn($scope, setVisibleError);

		// setting of mouse focus
                $scope.setFocus = function(focusId) {
                        // must pause for a bit...then it works
                        setTimeout(function() {
                                document.getElementById(focusId).focus();
                        }, (200));
		}

		// Note stuff

		// clearNote the note field
                $scope.clearNote = function(note) {

                        if (note != null) {

				// note type = accession id
                                if (note.accID != null) {
                                        note.processStatus = "d";
                                        note.accID = ""; 
					return;
                                }

				// note type = noteChunk
				if (note.noteChunk != null) {
                                        note.noteChunk = ""; 
					return;
                                }

				note = "";
                        }

                }

		// end Note stuff

		// Auto-Complete

		// search text in all places
		$scope.autocompleteAll = function(searchElement, searchList) {
                                searchElement.autocomplete({
                                	source: searchList,
                                	autoFocus: true
                                })
		}

		// search text starting at beginning only
		// found this at api.jqueryui.com/autocomplete
		$scope.autocompleteBeginning = function(searchElement, searchList) {
                                searchElement.autocomplete({
                                	source: function(request, response) { 
                                        	var matcher = new RegExp("^" + $.ui.autocomplete.escapeRegex(request.term), "i");
                                        	response($.grep(searchList, function(item) {
                                                	return matcher.test(item);
                                        	}));
                                	},
                                	autoFocus: true
                                })
		}

                // This map defines the names of pages that the url_for function can link to
                const pwiNameMap = {
                    'pwi.accessionsummary' :            $scope.PWI_BASE_URL + 'edit/accessionsummary',
                    'pwi.actlogdb' :                    $scope.PWI_BASE_URL + 'edit/actlogdb',
                    'pwi.allele' :                      $scope.PWI_BASE_URL + 'edit/allele',
                    'pwi.alleledetail' :                $scope.PWI_BASE_URL + 'edit/alleledetail',
                    'pwi.allelederivation' :            $scope.PWI_BASE_URL + 'edit/allelederivation',
                    'pwi.allelefear' :                  $scope.PWI_BASE_URL + 'edit/allelefear',
                    'pwi.allelesummary' :               $scope.PWI_BASE_URL + 'edit/allelesummary',
                    'pwi.antibody' :                    $scope.PWI_BASE_URL + 'edit/antibody',
                    'pwi.antibodydetail' :              $scope.PWI_BASE_URL + 'edit/antibodydetail',
                    'pwi.antibodysummary' :             $scope.PWI_BASE_URL + 'edit/antibodysummary',
                    'pwi.antigen' :                     $scope.PWI_BASE_URL + 'edit/antigen',
                    'pwi.assay' :                       $scope.PWI_BASE_URL + 'edit/assay',
                    'pwi.assaydetail' :                 $scope.PWI_BASE_URL + 'edit/assaydetail',
                    'pwi.assaysummary' :                $scope.PWI_BASE_URL + 'edit/assaysummary',
                    'pwi.celltype' :                    $scope.PWI_BASE_URL + 'edit/celltype',
                    'pwi.clonelib' :                    $scope.PWI_BASE_URL + 'edit/clonelib',
                    'pwi.doalleleannot' :               $scope.PWI_BASE_URL + 'edit/doalleleannot',
                    'pwi.doannot' :                     $scope.PWI_BASE_URL + 'edit/doannot',
                    'pwi.genotype' :                    $scope.PWI_BASE_URL + 'edit/genotype',
                    'pwi.genotypedetail' :              $scope.PWI_BASE_URL + 'edit/genotypedetail',
                    'pwi.genotypesummary' :             $scope.PWI_BASE_URL + 'edit/genotypesummary',
                    'pwi.goannot' :                     $scope.PWI_BASE_URL + 'edit/goannot',
                    'pwi.gxd' :                         $scope.PWI_BASE_URL + 'edit/gxd',
                    'pwi.gxdassaysummary' :             $scope.PWI_BASE_URL + 'edit/assaysummary',
                    'pwi.gxdindexsummary' :             $scope.PWI_BASE_URL + 'edit/gxdindexsummary',
                    'pwi.image' :                       $scope.PWI_BASE_URL + 'edit/image',
                    'pwi.imagedetail' :                 $scope.PWI_BASE_URL + 'edit/imagedetail',
                    'pwi.imagesummary' :                $scope.PWI_BASE_URL + 'edit/imagesummary',
                    'pwi.imagepanesummary' :            $scope.PWI_BASE_URL + 'edit/imagepanesummary',
                    'pwi.mapping' :                     $scope.PWI_BASE_URL + 'edit/mapping',
                    'pwi.mappingdetail' :               $scope.PWI_BASE_URL + 'edit/mappingdetail',
                    'pwi.mappingsummary' :              $scope.PWI_BASE_URL + 'edit/mappingsummary',
                    'pwi.marker' :                      $scope.PWI_BASE_URL + 'edit/marker',
                    'pwi.markerdetail' :                $scope.PWI_BASE_URL + 'edit/markerdetail',
                    'pwi.markerfear' :                  $scope.PWI_BASE_URL + 'edit/markerfear',
                    'pwi.markersummary' :               $scope.PWI_BASE_URL + 'edit/markersummary',
                    'pwi.mgi' :                         $scope.PWI_BASE_URL + 'edit/mgi',
                    'pwi.mpannot' :                     $scope.PWI_BASE_URL + 'edit/mpannot',
                    'pwi.mutantcellline' :              $scope.PWI_BASE_URL + 'edit/mutantcellline',
                    'pwi.nonmutantcellline' :           $scope.PWI_BASE_URL + 'edit/nonmutantcellline',
                    'pwi.organism' :                    $scope.PWI_BASE_URL + 'edit/organism',
                    'pwi.pdfviewer' :                   $scope.PDFVIEWER_URL,
                    'pwi.pdfviewerhome' :               $scope.PDFVIEWER_URL.replace("?id=",""),
                    'pwi.pixeldb' :                     $scope.PIXDB_URL,
                    'pwi.prism' :                       $scope.PWI_BASE_URL + 'edit/prism',
                    'pwi.probe' :                       $scope.PWI_BASE_URL + 'edit/probe',
                    'pwi.probedetail' :                 $scope.PWI_BASE_URL + 'edit/probedetail',
                    'pwi.probesummary' :                $scope.PWI_BASE_URL + 'edit/probesummary',
                    'pwi.referencesummary' :            $scope.PWI_BASE_URL + 'edit/referencesummary',
                    'pwi.resultsummary' :               $scope.PWI_BASE_URL + 'edit/resultsummary',
                    'pwi.sequencesummary' :             $scope.PWI_BASE_URL + 'edit/sequencesummary',
                    'pwi.specimensummary' :             $scope.PWI_BASE_URL + 'edit/specimensummary',
                    'pwi.simplevocab' :                 $scope.PWI_BASE_URL + 'edit/simplevocab',
                    'pwi.strain' :                      $scope.PWI_BASE_URL + 'edit/strain',
                    'pwi.triageFull' :                  $scope.PWI_BASE_URL + 'edit/triageFull',
                    'pwi.triageShort' :                 $scope.PWI_BASE_URL + 'edit/triageShort',
                    'pwi.variant' :                     $scope.PWI_BASE_URL + 'edit/variant',
                    'pwi.validate' :                    $scope.PWI_BASE_URL + 'edit/validate',
                    'pwi.voc' :                         $scope.PWI_BASE_URL + 'edit/voc',
                    'pwi.voctermdetail' :               $scope.PWI_BASE_URL + 'edit/voctermdetail',

                    'ext.NCBI Gene Model':              'https://www.ncbi.nlm.nih.gov/gene?cmd=Retrieve&dopt=Graphics&list_uids=',
                    'ext.Ensembl Gene Model':           'http://useast.ensembl.org/Mus_musculus/Gene/Summary?g=',
                    'ext.VISTA Enhancer Element':       'https://enhancer.lbl.gov/vista/element?vistaId=',
		    'ext.Pubmed':			'https://pubmed.ncbi.nlm.nih.gov/',
		    'ext.Doi':			        'http://dx.doi.org/',
                    'ext.RGD':                          'https://rgd.mcw.edu/rgdweb/report/gene/main.html?id=',
                    'ext.UniProt':                      'https://www.ebi.ac.uk/QuickGO/annotations?geneProductId='
                }

                // Function for creating links to other pwi pages
                // Args:
                //   pageName (string) the name of the page to link to. Pwi page names just use the 
                //       angular module name, e.g., "pwi.alleledetail" or pwi.assay".
                //   args (object or string) If an object, holds arguments to be encoded in the
                //       URL query string. If a string, will simply be appended to the page's URL
                //       (no "?" will be inserted). Any other type of argument will be turned into
                //       a string.
                $scope.url_for = function (pageName, args) {
                    //
                    let pageUrl
                    if (pwiNameMap[pageName]) {
                        pageUrl = pwiNameMap[pageName]
                    } else {
                        throw 'url_for: Unknown page name: ' + pageName
                    }
                    //
                    let argString
		    if (!args) {
		        argString = ""
		    } else if (typeof(args) === "string") {
                        argString = args
                    } else if (Array.isArray(args)) {
                        argString = args.map(x => ''+x).join("/")
                    } else if (typeof(args) === "object") {
                        // Encode the args
                        const args2 = []
                        for (const name in (args || {})) {
                            const val = encodeURIComponent(args[name])
                            args2.push(`${name}=${val}`)
                        }
                        argString = "?" + args2.join("&")
                    } else {
                        argString = '' + args
                    }
                    return pageUrl + argString
                }

                // Format a list of search args in a standard way.
                // Each arg is a list of two items: a name and a value
                // Returns an HTML string.
                $scope.youSearchedFor = function (args) {
                    const result = [
                        '<div class="youSearchedFor">',
                        '<span>You Searched For</span>',
                        '<dl>']
                    args.forEach(arg => {
                        result.push('<dt>' + arg[0] + '</dt><dd>' + arg[1] + '</dd>')
                    })
                    result.push('</dl>')
                    result.push('</div>')
                    return result.join('')
                }

	}

})();
