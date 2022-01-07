(function() {
	'use strict';
	angular.module('pwi.imagedetail').controller('ImageDetailController', ImageDetailController);

	function ImageDetailController(
			// angular tools
			$document,
			$filter,
			$http,  
			$q,
			$scope, 
			$timeout,
			$window, 
			// assay purpose utilities
			ErrorMessage,
			FindElement,
			Focus,
                        NoteTagConverter,
			// resource APIs
			ImageSearchAPI,
			ImageGetAPI,
			ImageSearchAssayAPI,
			// config
			USERNAME
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		$scope.USERNAME = USERNAME;

                // make utility functions available in scope
		$scope.ntc = NoteTagConverter

		var vm = $scope.vm = {};

		// api/json input/output
		vm.apiDomain = {};

                // default booleans for page functionality
		vm.hideApiDomain = true;       // JSON package
		vm.hideVmData = true;          // JSON package + other vm objects
                vm.hideErrorContents = true;	// display error message

		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		// Initializes the needed page values 
                this.$onInit = function () { 
                        console.log("onInit")
                        var searchByAccId = document.location.search.split("?id=")
                        search(searchByAccId[1]);
                };

                this.$postLink = function () { 
                        console.log("postLink")
                };

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

		// search by accession id
		function search(accID) {				
			console.log("search():" + accID);
		
			pageScope.loadingStart();
			
                        vm.apiDomain.accID = accID

			ImageSearchAPI.search(vm.apiDomain, function(data) {
			        if (data.length > 0) {
				        loadObject(data[0].imageKey);
			        }
		                pageScope.loadingEnd();
		        }, function(err) {
			        pageScope.handleError(vm, "API ERROR: ImageSearchAPI.search");
		                pageScope.loadingEnd();
		        });
		}		

		// load object by imageKey
		//
		// MGI:6727865 - J Biol Chem not working
		// "This image is from Cho Y, J Biol Chem 2021 May 21;():100825 and is displayed with the permission of the American Society for Biochemistry and Molecular Biology who owns the Copyright. Full text from \\JBiolChem(34029594|JBC|)."
                // <a class="external" href="http://www.jbc.org/cgi/pmidlookup?view=long&pmid=34029594" target="_blank">JBC</a>
		//
		// MGI:5911562 - J Lipid Res not working
		// "This image is from Feng L, J Lipid Res 2017 Jun;58(6):1114-1131 and is displayed with the permission of the American Society for Biochemistry and Molecular Biology who owns the Copyright. Full text is from \\JLipidRes(28442498|JLR|).\n"
		//
		function loadObject(imageKey) {
			console.log("loadObject():" + imageKey);

			ImageGetAPI.get({key: imageKey}, function(data) {
				vm.apiDomain = data;
                                searchAssays(vm.apiDomain.imageKey);

                                vm.apiDomain.copyrightNote.noteChunk = $scope.ntc.convert(vm.apiDomain.copyrightNote.noteChunk);

                                if (vm.apiDomain.copyrightNote.noteChunk.includes("JBiolChem")) {
                                        var newcopyright = vm.apiDomain.copyrightNote.noteChunk.split("JBiolChem");
                                        //console.log(newcopyright);
                                        var jbc = newcopyright[1].split("\(");
                                        jbc = jbc[1].split("|")
                                        //console.log(jbc);
                                        var pmid = jbc[0]
                                        var displayid = jbc[1]
                                        var newdisplay = "<a class=\"external\" href=\"http://www.jbc.org/cgi/pmidlookup?view=long&pmid=" + pmid + "\" target=\"_blank\">JBC</a>.";
                                        vm.apiDomain.copyrightNote.noteChunk = newcopyright[0].replace("\\", newdisplay);
                                }
                                if (vm.apiDomain.copyrightNote.noteChunk.includes("JLipidRes")) {
                                        var newcopyright = vm.apiDomain.copyrightNote.noteChunk.split("JLipidRes");
                                        //console.log(newcopyright);
                                        var jlip = newcopyright[1].split("\(");
                                        jlip = jlip[1].split("|")
                                        //console.log(jlip);
                                        var pmid = jlip[0]
                                        var displayid = jlip[1]
                                        var newdisplay = "<a class=\"external\" href=\"http://www.jlr.org/cgi/pmidlookup?view=long&pmid=" + pmid + "\" target=\"_blank\">JLR</a>.";
                                        vm.apiDomain.copyrightNote.noteChunk = newcopyright[0].replace("\\", newdisplay);
                                }
                                if (vm.apiDomain.externalLinkNote != null) {
                                        vm.apiDomain.externalLinkNote.noteChunk = vm.apiDomain.externalLinkNote.noteChunk.replace('\\Link(', '');
                                        vm.apiDomain.externalLinkNote.noteChunk = vm.apiDomain.externalLinkNote.noteChunk.replace('|Full Image|)', '');
                                }
                                if (vm.apiDomain.nonEditAccessionIds != null) {
                                        if (vm.apiDomain.nonEditAccessionIds[0].logicaldb == "GenePaint") {
                                                vm.apiDomain.nonEditAccessionIds[0].otherHtml = "http://www.genepaint.org/cgi-bin/mgrqcgi94?APPNAME=genepaint&PRGNAME=analysis_viewer&ARGUMENTS=-AQ76649667431800,-ADA,-A82,-Asetstart,-A1";
                                        }
                                        if (vm.apiDomain.nonEditAccessionIds[0].logicaldb == "GUDMAP") {
                                                vm.apiDomain.nonEditAccessionIds[0].otherHtml = "http://www.gudmap.org/gudmap/pages/ish_submission.html?id=" + vm.apiDomain.nonEditAccessionIds[0].accID;
                                        }
                                }
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ImageGetAPI.get");
			});
		}	

		// search assays by image key
		function searchAssays(imageKey) {				
			console.log("searchAssays():" + imageKey);
		
			ImageSearchAssayAPI.search(vm.apiDomain.imageKey, function(data) {
                                vm.apiDomain.assayData = [];
			        if (data.length > 0) {
                                        vm.apiDomain.assayData = data;
			        }
		        }, function(err) {
			        pageScope.handleError(vm, "API ERROR: ImageSearchAssayAPI.searchAssays");
		        });
		}		

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
	}

})();

