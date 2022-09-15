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
			PRISM_URL,
			WEBSHARE_URL
	) {
		$scope.usSpinnerService = usSpinnerService;
		$scope.current_user = null;
		$scope.errors = {};
		$scope.loading = false;
		$scope.starttime = 0;
		$scope.endtime = 0;
		$scope.PWI_BASE_URL = PWI_BASE_URL;
		$scope.PDFVIEWER_URL = PDFVIEWER_URL;
		$scope.PIXDB_URL = PIXDB_URL;
		$scope.PRISM_URL = PRISM_URL;
		$scope.WEBSHARE_URL = WEBSHARE_URL;

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
                    'pwi.actlogdb' :          $scope.PWI_BASE_URL + 'edit/actlogdb',
                    'pwi.allele' :            $scope.PWI_BASE_URL + 'edit/allele',
                    'pwi.alleledetail' :      $scope.PWI_BASE_URL + 'edit/alleledetail',
                    'pwi.allelederivation' :  $scope.PWI_BASE_URL + 'edit/allelederivation',
                    'pwi.allelefear' :        $scope.PWI_BASE_URL + 'edit/allelefear',
                    'pwi.allelesummary' :     $scope.PWI_BASE_URL + 'summary/allele',
                    'pwi.antibody' :          $scope.PWI_BASE_URL + 'edit/antibody',
                    'pwi.antibodydetail' :    $scope.PWI_BASE_URL + 'edit/antibodydetail',
                    'pwi.antibodysummary' :   $scope.PWI_BASE_URL + 'summary/antibody',
                    'pwi.antigen' :           $scope.PWI_BASE_URL + 'edit/antigen',
                    'pwi.assay' :             $scope.PWI_BASE_URL + 'edit/assay',
                    'pwi.assaydetail' :       $scope.PWI_BASE_URL + 'edit/assaydetail',
                    'pwi.assaysummary' :      $scope.PWI_BASE_URL + 'summary/assay',
                    'pwi.celltype' :          $scope.PWI_BASE_URL + 'edit/celltype',
                    'pwi.clonelib' :          $scope.PWI_BASE_URL + 'edit/clonelib',
                    'pwi.doalleleannot' :     $scope.PWI_BASE_URL + 'edit/doalleleannot',
                    'pwi.doannot' :           $scope.PWI_BASE_URL + 'edit/doannot',
                    'pwi.experimentsummary' : $scope.PWI_BASE_URL + 'summary/experiment',
                    'pwi.genotype' :          $scope.PWI_BASE_URL + 'edit/genotype',
                    'pwi.goannot' :           $scope.PWI_BASE_URL + 'edit/goannot',
                    'pwi.gxd' :               $scope.PWI_BASE_URL + 'edit/gxd',
                    'pwi.gxdassaysummary' :   $scope.PWI_BASE_URL + 'summary/assay',
                    'pwi.gxdindexsummary' :   $scope.PWI_BASE_URL + 'summary/gxdindex',
                    'pwi.image' :             $scope.PWI_BASE_URL + 'edit/image',
                    'pwi.imagedetail' :       $scope.PWI_BASE_URL + 'edit/imagedetail',
                    'pwi.imagesummary' :      $scope.PWI_BASE_URL + 'summary/image',
                    'pwi.mapping' :           $scope.PWI_BASE_URL + 'edit/mapping',
                    'pwi.marker' :            $scope.PWI_BASE_URL + 'edit/marker',
                    'pwi.markerdetail' :      $scope.PWI_BASE_URL + 'edit/markerdetail',
                    'pwi.mgi' :               $scope.PWI_BASE_URL + 'edit/mgi',
                    'pwi.mpannot' :           $scope.PWI_BASE_URL + 'edit/mpannot',
                    'pwi.mutantcellline' :    $scope.PWI_BASE_URL + 'edit/mutantcellline',
                    'pwi.nonmutantcellline' : $scope.PWI_BASE_URL + 'edit/nonmutantcellline',
                    'pwi.organism' :          $scope.PWI_BASE_URL + 'edit/organism',
                    'pwi.pdfviewer' :         $scope.PDFVIEWER_URL,
                    'pwi.pixeldb' :           $scope.PIXDB_URL,
                    'pwi.prism' :             $scope.PRISM_URL,
                    'pwi.probe' :             $scope.PWI_BASE_URL + 'edit/probe',
                    'pwi.probedetail' :       $scope.PWI_BASE_URL + 'edit/probedetail',
                    'pwi.probesummary' :      $scope.PWI_BASE_URL + 'summary/probe',
                    'pwi.referencesummary' :  $scope.PWI_BASE_URL + 'summary/reference',
                    'pwi.resultsummary' :     $scope.PWI_BASE_URL + 'summary/result',
                    'pwi.sequencesummary' :   $scope.PWI_BASE_URL + 'summary/sequence',
                    'pwi.simplevocab' :       $scope.PWI_BASE_URL + 'edit/simplevocab',
                    'pwi.strain' :            $scope.PWI_BASE_URL + 'edit/strain',
                    'pwi.triage' :            $scope.PWI_BASE_URL + 'edit/triage',
                    'pwi.variant' :           $scope.PWI_BASE_URL + 'edit/variant',
                    'pwi.validate' :          $scope.PWI_BASE_URL + 'edit/validate',
                    'pwi.voc' :               $scope.PWI_BASE_URL + 'edit/voc',
                    'pwi.voctermdetail' :     $scope.PWI_BASE_URL + 'edit/voctermdetail',

                    'ext.NCBI Gene Model':    'https://www.ncbi.nlm.nih.gov/gene?cmd=Retrieve&dopt=Graphics&list_uids=',
                    'ext.Ensembl Gene Model': 'http://useast.ensembl.org/Mus_musculus/Gene/Summary?g='
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
                    if (typeof(args) === "string") {
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

	}

})();
