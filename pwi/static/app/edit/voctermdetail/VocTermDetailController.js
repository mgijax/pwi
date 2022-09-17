(function() {
	'use strict';
	angular.module('pwi.voctermdetail').controller('VocTermDetailController', VocTermDetailController);

	function VocTermDetailController(
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
			// resource APIs
			VocTermSearchAPI,
			VocTermGetAPI,
                        AccessionSearchAPI,
                        VocTermFamilyAPI,
                        VocTermFamilyEdgesAPI,
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
                //
                // For counting/rendering all paths to the root, need to build in-memory
                // representation of the ontology graph segment containing the term, its 
                // ancestors, siblings and immediate children. Do NOT put this in the vm
                // because the on-page display of this structure would cause infinite recursion
                // (graph nodes point to their parents and to their children).
                var graph = null;

		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		// Initializes the needed page values 
                this.$onInit = function () { 
                        console.log("onInit")
                        var accID = document.location.search.split("?id=")[1]
                        if (accID) {
                            search(accID);
                        } else {
                            var key = document.location.search.split("?key=")[1]
                            loadObject(key)
                        }
                };

		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

		// search by accession id
		function search(accID) {				
			console.log("search():" + accID);
		
                        vm.apiDomain.accID = accID

			AccessionSearchAPI.search(vm.apiDomain, function(data) {
			        if (data.length > 0) {
				        loadObject(data[0].objectKey);
			        }
		        }, function(err) {
			        pageScope.handleError(vm, "API ERROR: VocTermSearchAPI.search: " + err);
		        });
		}		

		// load object by voctermKey
		function loadObject(voctermKey) {
			console.log("loadObject():" + voctermKey);

			VocTermGetAPI.get({key: voctermKey}, function(data) {
                                var accidObj = data.accessionIds.filter(i => i.preferred === "1")[0]
                                data.accID = accidObj.accID
				vm.apiDomain = data;
                                if (!data.hasDAG || data.isObsolete === "1") {
                                    data.showDAG = false
                                } else {
                                    data.showDAG = true
                                    loadDagSubset(data.accID, data.termKey)
                                }
                                prepareForDisplay(data)
                                // for shorter refs
                                $scope.vmd = vm.apiDomain
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: VocTermGetAPI.get: " + err);
			});
		}	

                // load the subset of the ontology DAG needed to display all the paths to the root
                function loadDagSubset (accID, termKey) {
                        // nodes
                        VocTermFamilyAPI.search(accID, function(nodes) {
                            vm.apiDomain.nodes = nodes
                            // edges
                            VocTermFamilyEdgesAPI.search(accID, function(edges) {
                                vm.apiDomain.edges = edges
                                var graph = buildGraph()
                                var paths = enumeratePaths(graph, termKey)
                                vm.apiDomain.pathDisplay = paths2displayLines(paths, graph)
                            }, function(err) {
                                pageScope.handleError(vm, "API ERROR: VocTermFamilyEdgesAPI.search: " + err);
                            })
                        }, function(err) {
                            pageScope.handleError(vm, "API ERROR: VocTermFamilyAPI.search: " + err);
                        });
                }

                // Turns the node and edge records into an in-memory graph representation
                // Each node has a termKey, a term, and a list of parents and a list of children.
                function buildGraph () {
                    // create an index from the termFamily nodes, from termKey to a stripped-down
                    // version of the node having just the termKey and term.
                    // Initialize empty list of parents for each node
                    var graph = vm.apiDomain.nodes.reduce((a,n) => {
                        a[n.termKey] = {
                            term: n.term,
                            termKey: n.termKey,
                            termID: n.accid,
                            parents: [],
                            children: []
                        }
                        return a
                    }, {})
                    // add parent nodes (with relationships) by going through the edges
                    vm.apiDomain.edges.forEach(e => {
                        const p = graph[e.parentKey]
                        const c = graph[e.childKey]
                        c.parents.push([e.label, p])
                        p.children.push([e.label, c])
                    })
                    return graph
                }

                // Enumerate/return all paths from the term of interest to the root.
                // Each path is a list of (edgeLabel, term), ordered from root to the 
                // term of interest. 
                function enumeratePaths (graph, termKey) {
                    var n = graph[termKey]
                    var paths = []
                    //
                    function _reach (m, path, label) {
                        // add this node to the path
                        path.push([label, m.termKey, m.term, m.termID])
                        if (m.parents.length === 0) {
                            // This is the root. Record the path.
                            path.reverse() // so it's ordered root first
                            paths.push(path)
                        } else {
                            // recurse to parents
                            m.parents.forEach(p => {
                                // be sure to pass a COPY of the path 
                                _reach(p[1], [].concat(path), p[0])
                            })
                        }
                    }
                    _reach(n,[],'')
                    return paths
                }

                // The paths produced by enumeratePaths are not exactly what we need for the display:
                // - they don't include the term's siblings or children
                // - they don't include the indent amounts
                // - the edge labels are displayed with the line following the node they're paired with
                // This function fixes these issues.
                function paths2displayLines (paths, graph) {
                    // comparator for sorting lists of nodes by term
                    const byTerm = (a,b) => {
                        const aterm = a[1].term.toLowerCase()
                        const bterm = b[1].term.toLowerCase()
                        if (aterm < bterm) return -1
                        if (aterm > bterm) return 1
                        return 0
                    }
                    //
                    var pathDisplayLines = paths.map(path => {
                        var pdata = [] // the display line data for this path
                        var prevLabel = ''
                        for (var i = 0; i < path.length; i++) {
                            var pathEl = path[i]
                            var label = pathEl[0]
                            var termKey = pathEl[1]
                            var term = pathEl[2]
                            var termID = pathEl[3]
                            var nodeData = {
                                indent: i,
                                term: term,
                                termKey: termKey,
                                termID: termID,
                                label: prevLabel
                            }
                            prevLabel = label
                            if (i < path.length - 1) {
                                pdata.push(nodeData)
                            } else {
                                // Last pathEl is the term of interest.
                                // Need to add its siblings and children
                                // Siblings == my parent's children. Limit to parent on the current path.
                                // (Need to handle edge case where term of interest is the root.)
                                var siblings = i === 0 ? [path[0]] : graph[path[i-1][1]].children
                                siblings.sort(byTerm)
                                siblings.forEach(sib => {
                                    var d = {
                                        indent: i,
                                        term: sib[1].term,
                                        termKey: sib[1].termKey,
                                        termID: sib[1].termID,
                                        label: sib[0]
                                    }
                                    pdata.push(d)
                                    if (sib[1].termKey === termKey) {
                                        d.highlight = true
                                        // guaranteed to include the node of interest
                                        //
                                        // Children of term of interest.
                                        var children = graph[termKey].children
                                        children.sort(byTerm)
                                        children.forEach(c => {
                                            pdata.push({
                                                indent: i+1,
                                                term: c[1].term,
                                                termKey: c[1].termKey,
                                                termID: c[1].termID,
                                                label: c[0]
                                            })
                                            
                                        })
                                    }
                                })

                            }
                        }
                        return pdata
                    })
                    return pathDisplayLines
                }

                //
                function prepareForDisplay (vmd) {
                }

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
	}

})();

