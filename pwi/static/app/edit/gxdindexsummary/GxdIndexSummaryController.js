(function() {
	'use strict';
	angular.module('pwi.gxdindexsummary').controller('GxdIndexSummaryController', GxdIndexSummaryController);

	function GxdIndexSummaryController(
			// angular tools
			$document,
			$filter,
			$http,  
			$q,
			$scope, 
			$timeout,
			$window, 
			// utilities
                        NoteTagConverter,
                        FileWriter,
                        UrlParser,
			// resource APIs
                        GxdIndexGetByJnumAPI,
                        GxdIndexGetByMarkerAPI,
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

                // default booleans for page functionality
		vm.hideApiDomain = true;       // JSON package
		vm.hideVmData = true;          // JSON package + other vm objects
                vm.hideErrorContents = true;	// display error message

                vm.loading = false;

		// api/json input/output
		vm.apiDomain = {};
                $scope.vmd = vm.apiDomain

		// Initializes the needed page values 
                this.$onInit = function () { 
                        vm.args = UrlParser.parseSearchString()
                        if (vm.args.refs_id) {
                            doSummaryForReference(vm.args.refs_id)
                        } else if (vm.args.marker_id) {
                            doSummaryForMarker(vm.args.marker_id)
                        } else {
                            throw "No argument. Please specify marker_id or refs_id."
                        }
                };

                function doSummaryForMarker (marker) {
                    vm.loading=true
                    vm.summaryBy = "Marker"
                    vm.marker = {}
                    GxdIndexGetByMarkerAPI.search(marker, function (records) {
                        vm.apiDomain.indexRecs = records
                        vm.pageTitle = `${records[0].markerSymbol} GXD Index Summary`
                        vm.pageH1 = 'GXD Index Summary by Marker'
                        vm.countsTitle = "Counts of Indexed References By Age and Assay"
                        Object.assign(vm.marker, records[0])
                        vm.counts = freqCounts(vm.apiDomain.indexRecs, 'plain')
                        generateFreqTables(records, 'jnumID', 'shortCitation')
                        vm.loading=false
			$scope.restoreScrollPosition(1)
                    }, function (err) {
                        pageScope.handleError(vm, "API ERROR: GxdIndexGetByMarkerAPIResource.search: " + err);
                    })
                }

                function doSummaryForReference (jnum) {
                    vm.loading=true
                    vm.summaryBy = "Reference"
                    // There are two variants of summary by Reference:
                    // 1. If only the J# is specified, produces the full summary for that ref
                    // 2. If J#, assay type, and age are all specified, produces a summary for just that age and assay type
                    //    for that reference (basically it just lists the genes).
                    // These two variants are distinguished in the model by the absence/presence of a markers list.
                    vm.reference = {}
                    GxdIndexGetByJnumAPI.search(jnum, function (records) {
                        vm.apiDomain.indexRecs = records
                        vm.pageTitle = 'GXD Index Summary'
                        vm.pageH1 = 'GXD Index Summary'
                        vm.countsTitle = "Counts of Indexed Genes By Age and Assay"
                        Object.assign(vm.reference, records[0])
                        if (vm.args.age && vm.args.assaytype) {
                            vm.pageH1 = 'GXD Index By Age Assay Type Summary'
                            // variant #2, Compute the list of markers assayed in this reference with the specified 
                            // assay type and at the specified age 
                            const filtered = records.filter(r => r.age === vm.args.age && r.indexAssay === vm.args.assaytype)
                            const markers = []
                            const seen = new Set()
                            filtered.forEach(r => {
                                if (!seen.has(r.markerID)) {
                                   seen.add(r.markerID)
                                   markers.push(r)
                                }
                            })
                            markers.sort((m1,m2) => {
                                const m1s = m1.markerSymbol.toLowerCase()
                                const m2s = m2.markerSymbol.toLowerCase()
                                if (m1s < m2s) return -1
                                if (m1s > m2s) return 1
                                return 0
                            })
                            // the presence of vm.markers signals that we want variant #2 display
                            vm.markers = markers
                        }
                        vm.counts = freqCounts(vm.apiDomain.indexRecs, 'link')
                        generateFreqTables(records, 'markerID', 'markerSymbol')
                        vm.loading=false
			$scope.restoreScrollPosition(1)
                    }, function (err) {
                        pageScope.handleError(vm, "API ERROR: GxdIndexGetByJnumAPIResource.search: " + err);
                    })
                }

                // Generates the frequency tables in the lower section of the page.
                function generateFreqTables (records, idField, sortField) {
                    // generate list of unique items
                    const id2recs = {}
                    const items = []
                    records.forEach(r => {
                        if (!id2recs[r[idField]]) {
                            id2recs[r[idField]] = []
                            items.push(r)
                        }
                        id2recs[r[idField]].push(r)
                    })
                    // sort items by sortField
                    items.sort((r1,r2) => {
                        const k1 = r1[sortField]
                        const k2 = r2[sortField]
                        if (k1 < k2) return -1
                        if (k1 > k2) return 1
                        return 0
                    })
                    // Compute frequency count table for each item
                    const itemCounts = items.map(r => {
                        const recs = id2recs[r[idField]]
                        return freqCounts(recs, 'X')
                    })
                    //
                    vm.items = items
                    vm.itemCounts = itemCounts
                }

                // Generates a frequency count table for the given list of gxd index records.
                // A frequency count table counts the number of records by assay type and age.
                //
                function freqCounts (indexRecs, format) {
                    // create 2-level mapping
                    //   assaytype -> age -> count
                    // also, create sets of distinct ages and assay types
                    const keyFields = ['age','indexAssay']
                    const counts = {}
                    const assayTypes = new Set()
                    const assayType2Key = {}
                    const ages = new Set()
                    indexRecs.forEach(r => {
                        assayTypes.add(r.indexAssay)
                        assayType2Key[r.indexAssay] = r.indexAssayKey
                        ages.add(r.age)
                        if (!counts[r.indexAssay]) counts[r.indexAssay] = {}
                        const ca = counts[r.indexAssay]
                        if (!ca[r.age]) ca[r.age] = 0
                        ca[r.age] += 1
                    })

                    // sort assay types (case insensitive)
                    const assayTypesSorted = Array.from(assayTypes).sort((a,b) => {
                        const akey = assayType2Key[a]
                        const bkey = assayType2Key[b]
                        return akey - bkey
                    })
                    // sort ages numerically, 'E' and 'A' go to the end.
                    const agesSorted = Array.from(ages).sort((a1,a2) => {
                        const f1 = a1 === 'E' ? 1000 : a1 === 'A' ? 1001 : parseFloat(a1)
                        const f2 = a2 === 'E' ? 1000 : a2 === 'A' ? 1001 : parseFloat(a2)
                        return f1-f2
                    })
                    // frequency table. First, list of column labels,
                    // then list of data rows. 
                    // Each data row is a list with assay type as the first
                    // value followed by one count per age.
                    // 
                    const colLabels = ["Age"].concat(agesSorted)
                    const rowData = []
                    assayTypesSorted.forEach(atype => {
                        const row = [atype]
                        agesSorted.forEach(age => {
                            const v = counts[atype][age] || 0;
                            row.push(countToDisplay(v, atype, age, format))
                        })
                        rowData.push(row)
                    })
                    // return col labels and data rows
                    return {
                       colLabels,
                       rowData
                    }
                }

                // The display of a frequency table count takes one of a few forms.
                // In the upper (overall) table, we show the counts, unless the count is 0,
                // in which case we show an empty cell. Additionally, in the summary by J# page,
                // the counts are links to the summary by J#/assayType/age (variant #2 - see comment
                // in doSummaryForReference(), above)
                function countToDisplay (count, assayType, age, format) {
                    if (count === 0) return ''
                    if (format === 'X') return 'X'
                    if (format === 'plain') return count
                    if (format === 'link') 
                        return `<a href="${document.location.search}&assaytype=${assayType}&age=${age}">${count}</a>`
                    return count
                }


        }
})();

