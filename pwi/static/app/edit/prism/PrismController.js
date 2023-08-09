(function() {
	'use strict';
	angular.module('pwi.prism').controller('PrismController', PrismController);

	function PrismController(
			// angular tools
			$document,
			$filter,
			$http,  
			$q,
			$scope, 
			$timeout,
			$window, 
			// general purpose utilities
			ErrorMessage,
			FindElement,
			Focus,
			// resource APIs
			ImageSearchAPI,
			ImageGatherByKeyAPI,
			ImageUpdateAPI
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {};

                vm.jnumid = null
                vm.imageList = []
                vm.hidePaneList = false;

		// mapping of object data 
		vm.currImage = {};

		// default booleans for page functionality 
		vm.hideApiDomain = true;       // JSON package
		vm.hideVmData = true;          // JSON package + other vm objects
		vm.hideLoadingHeader = true;   // display loading header
		vm.hideErrorContents = true;   // display error message
		
		// error message
		vm.errorMsg = '';
		
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
                function init () {
                    const jnum = document.location.search.split("?jnum=")[1]
                    if (jnum) searchByJnum(jnum)
                }

                function searchByJnum (jnumid) {
                    vm.jnumid = jnumid
                    if (!jnumid) return
                    pageScope.loadingStart();
                    ImageSearchAPI.search( { jnumid } , function(data) {
                            if (data.length === 0) {
                                vm.imageList = []
                                vm.currImage = {}
                                vm.prism = {}
                                window.setTimeout( () => alert("Jnumber '" + jnumid + "' is not valid or has no images."), 100)
                            }
                            vm.imageList = data.sort((a,b) => {
                                if (a.figureLabel < b.figureLabel) return -1
                                if (a.figureLabel > b.figureLabel) return +1
                                return 0
                            });
                            if (vm.imageList.length) selectImage(vm.imageList[0])
                            pageScope.loadingEnd();
                    }, function(err) { // server exception
                            pageScope.handleError(vm, "Error while searching");
                            pageScope.loadingEnd();
                            setFocus();
                    });
                }

                function selectImage (img) {
                    // call API to gather object for given key
                    ImageGatherByKeyAPI.get({ key: img.imageKey }, function(data) {
                            vm.currImage = data;
                            prismInit();
                    }, function(err) {
                            pageScope.handleError(vm, "Error retrieving data object.");
                    });
                }

                function saveImage () {
                    pageScope.loadingStart();
                    // revove 'selected' field that was added to image panes
                    vm.currImage.imagePanes.forEach(p => { delete p.selected })
                    //
                    ImageUpdateAPI.update(vm.currImage, function(data) {
                        if (data.error != null) {
                            alert("ERROR: " + data.error + " - " + data.message);
                        }
                        else {
                            vm.currImage = data.items[0];
                            prismInit();
                        }
                        pageScope.loadingEnd();
                    }, function(err) {
                        pageScope.handleError(vm, "Error updating image.");
                        pageScope.loadingEnd();
                    });
                }

                function prismInit() {
                    const data = vm.currImage
                    const pdata = vm.prism = {
                        pixid: null,
                        xdim: null,
                        ydim: null,
                        imagePanes: [],
                        selectedPanes: [],
                        overlays: [],
                        scale: 1.0,
                        showOverlays: true,
                        undoStack: [],
                        redoStack: [],
                        imageList: [],
                        clickAssignNextPane: null
                    }
                    pdata.pixid = (data.editAccessionIds && data.editAccessionIds[0]) ? data.editAccessionIds[0].numericPart : null
                    pdata.xdim = data.xdim
                    pdata.ydim = data.ydim
                    pdata.imagePanes = data.imagePanes // shared intentionally
                    pdata.imagePanes.forEach(p => p.selected = false) // add a selected attribute (must remove before updating)
                    pdata.overlays = initOverlays(pdata.imagePanes)
                    // Populate image list. Prism sorts on figureLabel (native sort is by displayLabel)
                    pdata.imageList = vm.imageList.map((r,index) => {
                        r.index = index
                        return r
                    }).sort((a,b) => {
                        if (a.figureLabel < b.figureLabel) return -1
                        if (a.figureLabel > b.figureLabel) return 1
                        return 0
                    })
                }

                // Initializes the list of overlays based on the geometries of the given panes
                function initOverlays (panes) {
                    const overlays = []
                    const ix = {}
                    // create overlays for panes with defined geometries
                    panes.forEach(p => {
                        if (!p.width) return;
                        const key = `${p.x}|${p.y}|${p.width}|${p.height}`
                        if (!ix[key]) {
                            const ovl = newOverlay(parseInt(p.x),parseInt(p.y),parseInt(p.width),parseInt(p.height), p.selected, p)
                            ix[key] = ovl
                            overlays.push(ovl)
                        } else {
                            p.selected = ix[key].panes.selected
                            ix[key].panes.push(p)
                        }
                    })
                    return overlays
                }

                function clickAssign () {
                    if (vm.prism.clickAssignNextPane === null) {
                        // find the first selected pane
                        for (let i = 0; i < vm.prism.imagePanes.length; i++) {
                            const pane = vm.prism.imagePanes[i]
                            if (pane.selected) {
                                vm.prism.clickAssignNextPane = i
                                break
                            }
                        }
                        if (vm.prism.clickAssignNextPane === null) {
                            vm.prism.clickAssignNextPane = 0
                            vm.prism.imagePanes[0].selected = true
                        }
                    } else {
                        vm.prism.clickAssignNextPane = null
                    }
                }

                function clickAssignClicked (ovl) {
                    const pane = vm.prism.imagePanes[vm.prism.clickAssignNextPane]
                    pushState()
                    associate(pane, ovl)
                    vm.prism.clickAssignNextPane = (vm.prism.clickAssignNextPane + 1) % vm.prism.imagePanes.length
                    vm.prism.imagePanes.forEach(p => p.selected = false)
                    vm.prism.imagePanes[vm.prism.clickAssignNextPane].selected = true
                }

                function gridAssign () {
                    const ovls = [].concat(vm.prism.overlays).sort((a,b) => {
                        if (a.y < b.y) return -1
                        if (a.y > b.y) return 1
                        if (a.x < b.x) return -1
                        if (a.y > b.y) return 1
                        return 0
                    })
                    pushState()
                    for (let i = 0; i < Math.min(vm.prism.overlays.length, vm.prism.imagePanes.length); i++) {
                        associate(vm.prism.imagePanes[i], vm.prism.overlays[i])
                    }
                }

                function onePane () {
                    pushState()
                    _deleteAllOverlays()
                    _createCoveringOverlay()
                    vm.prism.imagePanes.forEach(p => associate(p, vm.prism.overlays[0]))
                }


                // Called when user changes the J#
                function changedJnum () {
                    searchByJnum(vm.jnumid)
                }

                // Key handler - blur focus if user hits ENTER
                function keydown (evt) {
                    if (evt.keyCode === 13) evt.target.blur()
                }

                // Returns a new overlay with the specified geometry and selection state.
                // Each overlay points to the panes associated with it.
                function newOverlay(x, y, width, height, selected, imgPane) {
                    const panes = imgPane ? [imgPane] : []
                    return { x, y, width, height, selected, panes }

                }

                // ---------------------------------------------------------------
                // PANE-TO-OVERLAY asociation logic
                //
                // Associates one pane with one overlay. Removes pane from previous association, if any.
                // If overlay if null, dissociates from previous overlay and makes no new association.
                function associate (pane, ovl) {
                    // dissociate pane for its current overlay, if any
                    dissociate(pane)
                    // Associate pane with new overlay
                    if (ovl) {
                        ovl.panes.push(pane)
                        syncOverlayToPane(pane, ovl)
                    }
                }

                // dissociates pane from its current overlay, if any
                function dissociate (pane) {
                    vm.prism.overlays.forEach(o => {
                        const i = o.panes.indexOf(pane)
                        if (i >= 0) {
                            o.panes.splice(i,1)
                            nullifyPane(pane)
                        }
                    })
                }

                // Return the overlay associated with the given pane, or undefined if none.
                function getAssociatedOverlay (pane) {
                    return vm.prism.overlays.filter(o => o.panes.indexOf(pane) >= 0)[0]
                }

                // Copies geometry from overlay object to a given pane object, and 
                // sets the updated status of the pane
                function syncOverlayToPane (p, ovl) {
                    p.x = ovl.x
                    p.y = ovl.y
                    p.width = ovl.width
                    p.height = ovl.height
                    p.processStatus = 'u'
                }

                // Copies geometry of an overlay to all its associated panes objects,
                // and sets their updated statuses.
                function syncOverlayToPanes (ovl) {
                    ovl.panes.forEach(p => syncOverlayToPane(p,ovl))
                }

                // Sets pane geometry to null and sets its update status.
                function nullifyPane (pane) {
                    pane.x = pane.y = pane.width = pane.height = null;
                    pane.processStatus = 'u'
                }

                // UNDO/REDO functions -------------------------------------

                // Copies geometry and processStatus from src to tgt, and returns tgt
                function copyPane (src, tgt) {
                    tgt.processStatus = src.processStatus
                    tgt.selected = src.selected
                    tgt.x = src.x
                    tgt.y = src.y
                    tgt.width = src.width
                    tgt.height = src.height
                    return tgt
                }

                // Get the current pane geometries and processStatuses 
                // Also get the geometries of "orphan" overlays
                function getCurrentState () {
                    const orphans = vm.prism.overlays.filter(o => o.panes.length === 0).map(o => copyPane(o,{}))
                    return vm.prism.imagePanes.map(p => copyPane(p, {})).concat(orphans)
                }

                // Set current pane geometries and process statuses
                // Reinitializes current set of overlays
                function setCurrentState (panes) {
                    // Restore pane geometries and process statuses
                    panes.forEach((p,i) => {
                        if (p.processStatus) copyPane(p, vm.prism.imagePanes[i])
                    })
                    // Reconstitute overlays from panes
                    vm.prism.overlays = initOverlays(vm.prism.imagePanes)
                    // Append orphan overlays
                    panes.forEach((p,i) => {
                        if (!p.processStatus) vm.prism.overlays.push(newOverlay(p.x, p.y, p.width, p.height, p.selected))
                    })
                }

                // Pushes the current edit state onto the undo stack and clears the redo statck.
                // Undo-able actions call this function before changing the edit state.
                function pushState () {
                    vm.prism.undoStack.push(getCurrentState())
                    vm.prism.redoStack = []
                }

                // Pushes current edit state onto the redo stack,
                // restores current edit state from top of undo stack.
                function undo () {
                    if (vm.prism.undoStack.length) {
                        vm.prism.redoStack.push(getCurrentState())
                        setCurrentState(vm.prism.undoStack.pop())
                    }
                }

                // Pushes current state to the undo stack and resores from redo stack.
                function redo () {
                    if (vm.prism.redoStack.length) {
                        vm.prism.undoStack.push(getCurrentState())
                        setCurrentState(vm.prism.redoStack.pop())
                    }
                }
                // ---------------------------------------------------------

                // Change the image zoom level. Implemented with CSS scale transform.
                function zoom (amount) {
                    const p = vm.prism
                    if (amount > 0) {
                        p.scale *= 1.1
                    } else if (amount < 0) {
                        p.scale *= 0.90
                    } else {
                        p.scale = 1.0
                    }

                    // Scale the image by setting a scaling transform style.
                    // Also, transform-origin is set to upper left corner (see image.css)
                    p.transform = 'scale(' + vm.prism.scale + ')'
                }

                // Shows/hides the overlays
                function toggleOverlays () {
                    vm.prism.showOverlays = !vm.prism.showOverlays
                }

                // Click handler for overlays. May be a select or a split.
                function clickedOverlay (evt) {
                    // To find the model data for the overlay that was clicked.
                    // Parse the element's id (e.g. 'ovl-14') to get the
                    // index (14), then get the data element (vm.prism.overlays[14])
                    const ovlElt = evt.target
                    const index = parseInt(ovlElt.id.substr(4))
                    const ovl = vm.prism.overlays[index]
                    if (vm.prism.clickAssignNextPane !== null) {
                        clickAssignClicked(ovl)
                    } else if (evt.altKey) {
                        splitOverlays(evt)
                    } else {
                        selectOverlay(ovl, evt.shiftKey)
                    }
                    evt.stopPropagation()
                }

                function saveNeeded () {
                    if (!vm.prism) return false
                    for (let p of vm.prism.imagePanes) {
                        if (p.processStatus === 'u') return true
                    }
                    return false
                }

                // Clicked image entry label
                function imageEntryClicked (img) {
                    if (img.imageKey === vm.currImage.imageKey) {
                        vm.hidePaneList = ! vm.hidePaneList
                    } else {
                        if (saveNeeded() && !window.confirm("Unsaved changes exist! Click Cancel and then Save. " +
                            "Or to proceed, click OK (changes will be lost).")) {
                            return
                        }
                        selectImage(img)
                        vm.hidePaneList = false
                    }
                }


                // Handler for clicking on pane label
                function paneEntryClicked (evt, idx) {
                    const pane = vm.currImage.imagePanes[idx]
                    const ovl = getAssociatedOverlay(pane)
                    if (evt.shiftKey && vm.prism.clickAssignNextPane === null) {
                        pane.selected = !pane.selected
                        ovl.selected = pane.selected
                    } else {
                        vm.prism.overlays.forEach(o => o.selected = false)
                        vm.prism.imagePanes.forEach(p => p.selected = false)
                        pane.selected = true
                        if (vm.prism.clickAssignNextPane !== null) {
                            vm.prism.clickAssignNextPane = idx
                        } else {
                            ovl.selected = true
                        }
                    }
                    evt.stopPropagation()
                }

                // Change the selection state.
                // If shiftSelect is false, set the overlay's selection state to true and
                // sets the state of all other coverlays to false. If shiftSelect is true, 
                // toggles the selection state of the specified overlay only (no others are affected).
                function selectOverlay (ovl, shiftSelect) {
                    if (shiftSelect) {
                        ovl.selected = !ovl.selected
                        ovl.panes.forEach(p => p.selected = ovl.selected)
                    } else {
                        vm.prism.imagePanes.forEach(p => p.selected = false)
                        vm.prism.overlays.forEach(o => {
                            o.selected = o === ovl
                            o.panes.forEach(p => p.selected = o.selected)
                        })
                    }
                }

                // Set selection state of all overlays to true
                function selectAllOverlays () {
                    vm.prism.imagePanes.forEach(p => p.selected = false)
                    vm.prism.overlays.forEach(o => {
                        o.selected = true
                        o.panes.forEach(p => p.selected = o.selected)
                    })
                }

                // Set selection state of all overlays to false
                function unselectAllOverlays () {
                    vm.prism.imagePanes.forEach(p => p.selected = false)
                    vm.prism.overlays.forEach(o => {
                        o.selected = false
                    })
                }

                // Splits all selected overlays along a horizontal or vertical line passing through
                // the point where the mouse was clicked. 
                function splitOverlays (evt) {
                    const direction = (evt.shiftKey ? "vertical" : "horizontal")
                    const img = document.getElementById("prism-image")
                    const imgRect = img.getBoundingClientRect()
                    const x = Math.round((evt.clientX - imgRect.x) / vm.prism.scale)
                    const y = Math.round((evt.clientY - imgRect.y) / vm.prism.scale)

                    pushState()

                    const newOvls = []
                    vm.prism.overlays.forEach(ovl => {
                        if (!ovl.selected) return
                        if (direction === "horizontal") {
                            if (ovl.y >= y || (ovl.y + ovl.height) <= y) return
                            newOvls.push(newOverlay(ovl.x, y, ovl.width, ovl.height - (y - ovl.y), true))
                            ovl.height = y - ovl.y
                            syncOverlayToPanes(ovl)
                        } else {
                            if (ovl.x >= x || (ovl.x + ovl.width) <= x) return
                            newOvls.push(newOverlay(x, ovl.y, ovl.width - (x - ovl.x), ovl.height, true))
                            ovl.width = x - ovl.x
                            syncOverlayToPanes(ovl)
                        }
                    })
                    vm.prism.overlays  = vm.prism.overlays.concat(newOvls)

                    if (newOvls.length === 0) $scope.popState()
                }

                // Delete overlays where selected state is true
                function deleteSelectedOverlays () {
                    pushState()
                    _deleteSelectedOverlays()
                }
                //
                function _deleteSelectedOverlays () {
                    pushState()
                    vm.prism.overlays = vm.prism.overlays.filter(o => {
                        if (o.selected) o.panes.forEach(p => nullifyPane(p))
                        return !o.selected
                    })
                }

                // Delete all overlays
                function deleteAllOverlays () {
                    pushState()
                    _deleteAllOverlays()
                }
                function _deleteAllOverlays () {
                    vm.prism.overlays.forEach(o => {
                        o.panes.forEach(p => nullifyPane(p))
                    })
                    vm.prism.overlays = []
                }

                // Create a single overlay that exactly covers the image.
                function createCoveringOverlay () {
                    pushState()
                    _createCoveringOverlay()
                }
                function _createCoveringOverlay () {
                    vm.prism.overlays.push(newOverlay(0,0,vm.prism.xdim,vm.prism.ydim, true))
                }

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		$scope.imageEntryClicked = imageEntryClicked
                $scope.paneEntryClicked = paneEntryClicked
                $scope.deleteSelectedOverlays = deleteSelectedOverlays
                $scope.deleteAllOverlays = deleteAllOverlays
                $scope.selectAllOverlays = selectAllOverlays
                $scope.toggleOverlays = toggleOverlays
                $scope.changedJnum = changedJnum
                $scope.zoom = zoom
                $scope.keydown = keydown
                $scope.createCoveringOverlay = createCoveringOverlay
                $scope.clickedOverlay = clickedOverlay
                $scope.unselectAllOverlays = unselectAllOverlays
                $scope.saveImage = saveImage
                $scope.undo = undo
                $scope.redo = redo

                $scope.splitOverlays = splitOverlays
                $scope.gridAssign = gridAssign
                $scope.clickAssign = clickAssign
                $scope.onePane = onePane

                $scope.saveNeeded = saveNeeded

		var globalShortcuts = Mousetrap($document[0].body);
		globalShortcuts.bind(['alt+z'], () => { undo(); $scope.$apply() });
		globalShortcuts.bind(['alt+r'], () => { redo(); $scope.$apply() });
		globalShortcuts.bind(['backspace'], () => { deleteSelectedOverlays(); $scope.$apply() });
		globalShortcuts.bind(['alt+x'], () => { deleteSelectedOverlays(); $scope.$apply() });
		globalShortcuts.bind(['shift+alt+x'], () => { deleteAllOverlays(); $scope.$apply() });
		globalShortcuts.bind(['alt+c'], () => { createCoveringOverlay(); $scope.$apply() });
		globalShortcuts.bind(['alt+s'], () => { save(); $scope.$apply() });
		globalShortcuts.bind(['alt+g'], () => { gridAssign(); $scope.$apply() });
		globalShortcuts.bind(['alt+o'], () => { onePane(); $scope.$apply() });
		//globalShortcuts.bind(['alt+up'], () => { zoom(+1); $scope.$apply() });
		//globalShortcuts.bind(['alt+down'], () => { zoom(-1); $scope.$apply() });
		//globalShortcuts.bind(['alt+0'], () => { zoom(0); $scope.$apply() });
		
		// call to initialize the page, and start the ball rolling...
		init();
	}

})();

