
function ImagePaneSummaryController () {}


(function() {
	'use strict';
	angular.module('pwi.imagepanesummary').controller('ImagePaneSummaryController', ImagePaneSummaryController);

	function ImagePaneSummaryController(
			// angular tools
			$document,
			$filter,
			$http,  
			$q,
			$scope, 
			$timeout,
			$window, 
			// utilities
			ErrorMessage,
			FindElement,
			Focus,
                        NoteTagConverter,
                        SmartAlphaSort,
			// resource APIs
			ImagePaneSummaryAPI,
                        ValidateJnumAPI,
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
		vm.apiDomain = {jnum:null, rows:null};

                // default booleans for page functionality
		vm.hideApiDomain = true;       // JSON package
		vm.hideVmData = true;          // JSON package + other vm objects
                vm.hideErrorContents = true;	// display error message
                //
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		// Initializes the needed page values 
                this.$onInit = function () { 
                        console.log("onInit")
                        var jnum = document.location.search.split("?refs_id=")[1]
                        search(jnum)
                };

                function search (jnum) {
                    ValidateJnumAPI.query({jnum:jnum}, function (data) {
                        const ref = data[0];
                        const refs_key = ref.refsKey;
                        vm.apiDomain.jnum = jnum
                        ImagePaneSummaryAPI.search(refs_key, function (rows) {
                            vm.apiDomain.rows = prepareForDisplay(rows)
                        }, function (err) {
                            console.log(err)
                        })

                    }, function (err) {
                        console.log(err)
                    })
                }

                function prepareForDisplay (rows) {
                    // When the same imagepane is associated with multiple assays, the query
                    // returns multiple rows. In the display, we need to combine these rows
                    // so the display has one row per image pane.
                    const rows2 = []
                    let prevKey = null
                    // group rows by key "imageid|figureLabel|paneLabel"
                    rows.forEach(r => {
                        const rKey = r.imageid + '|' + r.figureLabel + '|' + r.paneLabel
                        if (prevKey && rKey === prevKey) {
                            rows2[rows2.length - 1].push(r)
                        } else {
                            rows2.push([r])
                        }
                        prevKey = rKey
                        if (r.x === null) {
                            r.x = "0"
                            r.y = "0"
                            r.width = r.xdim
                            r.height = r.ydim
                        }
                        r.x = parseInt(r.x)
                        r.y = parseInt(r.y)
                        r.width = parseInt(r.width)
                        r.height = parseInt(r.height)
                        r.xdim = parseInt(r.xdim)
                        r.ydim = parseInt(r.ydim)
                        r.scale = r.height > 150 ? 150 / r.height : 1
                        r.scaled = {
                            x : Math.round(r.x * r.scale),
                            y : Math.round(r.y * r.scale),
                            xdim : Math.round(r.xdim * r.scale),
                            ydim : Math.round(r.ydim * r.scale),
                            width: Math.round(r.width * r.scale),
                            height : Math.round(r.height * r.scale)
                        }
                    })
                    // set the rowspan attribute of the first row of each group
                    // also set classes. row1/row2 for striping. 
                    const rows3 = []
                    rows2.forEach((lst,i) => {
                        // rows within a group by assayid
                        lst.sort((r1, r2) => {
                            const k1 = r1.assayid ? parseInt(r1.assayid.substr(4)) : 0
                            const k2 = r2.assayid ? parseInt(r2.assayid.substr(4)) : 0
                            return k1 - k2
                        })
                        const llen = lst.length
                        lst[0].rowspan = llen
                        lst.forEach((r,j) => {
                            // every row in the group gets same striping class
                            r.cls = "row" + (i%2 + 1)
                            // rows after the 1st in a group do not have borders
                            if (j > 0) r.cls += " noBorder"
                            // only display specimen note when there is >1 assay for the imagepane
                            if (llen === 1) r.specimenNote = ""
                            //
                            rows3.push(r)
                        })
                    })
                    return rows3
                }
	}

})();

