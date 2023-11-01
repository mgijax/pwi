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
                        // services
                        DragifyService,
			// resource APIs
			ImageSearchAPI,
			ImageGatherByKeyAPI,
			ImageUpdateAPI,
                        USERNAME
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {};

                window.vm = vm

                vm.loggedIn = USERNAME

                vm.jnumid = null
                vm.imageList = []
                vm.hidePaneList = false;
                vm.noCurrentImage = true

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
                    if (!jnumid) return
                    let jn = jnumid.trim().toUpperCase()
                    if (jn.match('^[0-9]')) jn = 'J:' + jn
                    if (!jn.match('^J:[0-9]+')) {
                        alert('Invalid or malformed J number: ' + jnumid)
                    }
                    vm.jnumid = jn
                    pageScope.loadingStart();
                    ImageSearchAPI.search( { jnumid } , function(data) {
                            if (data.length === 0) {
                                vm.imageList = []
                                vm.currImage = {}
                                clearPrismData()
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

                function saveImage (callback) {
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
                        if (callback) callback()
                    }, function(err) {
                        pageScope.handleError(vm, "Error updating image.");
                        pageScope.loadingEnd();
                    });
                }

                function clearPrismData () {
                    vm.prism = {
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
                    return vm.prism
                }

                function prismInit() {
                    const data = vm.currImage
                    const pdata = clearPrismData()
                    pdata.pixid = (data.editAccessionIds && data.editAccessionIds[0]) ? data.editAccessionIds[0].numericPart : null
                    vm.noCurrentImage = !pdata.pixid
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

                    if (!vm.dndInitialized) {
                        initDragNDraw()
                        initDragNDrop()
                        vm.dndInitialized = true
                    }
                }

                function reload () {
                    checkSaveProceed(() => searchByJnum(vm.jnumid))
                }

                function showPdf () {
                    //const url = 'http://bhmgiapp01.jax.org/usrlocalmgi/live/pdfviewer/pdfviewer.cgi?id=' + vm.jnumid
                    const url =  $scope.PDFVIEWER_URL + vm.jnumid
                    window.open(url, '_blank')
                }

                // Initializes handlers for drawing overlays by dragging.
                // Draws an outlined box as the user drags within the image.
                // At drag end, creates a new overlay and selects it.
                function initDragNDraw () {
                    const wrapper = document.getElementById("prism-wrapper")
                    const img = document.getElementById("prism-image")

                    function getRect (d) {
                        const rect = {
                            x: (d.startX - d.rootRect.x) / vm.prism.scale,
                            y: (d.startY - d.rootRect.y) / vm.prism.scale,
                            width: d.deltaX / vm.prism.scale,
                            height: d.deltaY / vm.prism.scale
                        }
                        if (rect.width < 0) {
                            rect.x += rect.width
                            rect.width *= -1
                        } 
                        if (rect.height < 0) {
                            rect.y += rect.height
                            rect.height *= -1
                        } 
                        return rect
                    }

                    function setGeom (elt, rect) {
                        elt.style.left = rect.x + 'px'
                        elt.style.top = rect.y + 'px'
                        elt.style.width = rect.width + 'px'
                        elt.style.height = rect.height + 'px'
                    }

                    DragifyService.dragify(wrapper, {
                        dragstart: (e,d) => {
                            d.rubberband = document.getElementById("prism-rubberband")
                            d.rubberband.style.display = 'block'
                            setGeom(d.rubberband, getRect (d))
                        },
                        drag: (e,d) => {
                            setGeom(d.rubberband, getRect (d))
                        },
                        dragend: (e,d) => {
                            const r = getRect(d)
                            d.rubberband.style.display = 'none'
                            const ovl = newOverlay(Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height), true)
                            pushState()
                            vm.prism.overlays.push(ovl)
                            window.setTimeout(function () {selectOverlay(ovl); $scope.$apply()}, 1)
                        },
                        dragcancel: (d) => {
                            d.rubberband.style.display = 'none'
                        }
                    }, wrapper, this)
                }

                // Initializes handlers for making associations by dragging panes onto overlays.
                // All currently selected panes at the start of the drag are associated to the pane that is the target at drag end.
                //
                function initDragNDrop () {
                    const prism = document.getElementById("prism")
                    const imageList = document.getElementById("prism-image-list")
                    function getXY (e,d) {
                        return {
                            x: (e.clientX - d.rootRect.x) / vm.prism.scale,
                            y: (e.clientY - d.rootRect.y) / vm.prism.scale
                        }
                    }
                    function setXY (elt, xy, dxy) {
                        dxy = dxy || {}
                        elt.style.left = (xy.x + (dxy.dx || 0)) + 'px'
                        elt.style.top  = (xy.y + (dxy.dy || 0)) + 'px'
                    }
                    DragifyService.dragify(imageList, {
                        dragstart: (e,d) => {
                            const pdiv = e.target.closest(".prism-pane-entry")
                            if (!pdiv) {
                                d.cancel()
                                return
                            }
                            const pi = parseInt(pdiv.id.replace("pane-entry-",""))
                            d.panes = vm.prism.imagePanes.filter((p,i) => p.selected || i === pi)
                            if (d.panes.length === 0) return false
                            const string = d.panes.map(p => p.paneLabel).join('; ') + ';'
                            d.dragAvatar = document.getElementById("prism-pane-drag")
                            d.dragAvatar.innerText = string
                            d.dragAvatar.dxy = { dx: -2, dy: -16 }
                            setXY(d.dragAvatar, getXY(e,d), d.dragAvatar.dxy)
                        },
                        drag: (e,d) => {
                            setXY(d.dragAvatar, getXY(e,d), d.dragAvatar.dxy)
                            d.dragAvatar.style.display = 'block'
                        },
                        dragend: (e,d) => {
                            d.dragAvatar.style.display = 'none'
                            const xy = getXY(e,d)
                            const ovlElt = document.querySelector(".prism-overlay:hover")
                            if (ovlElt) {
                                pushState()
                                const index = parseInt(ovlElt.id.substr(4))
                                const ovl = vm.prism.overlays[index]
                                d.panes.forEach(p => associate(p, ovl))
                                window.setTimeout(function () {selectOverlay(ovl); $scope.$apply()}, 1)
                            }
                        },
                        dragcancel: (d) => {
                            if (d.dragAvatar) d.dragAvatar.style.display = 'none'
                        }
                    }, prism, this)
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
                        if (a.x > b.x) return 1
                        return 0
                    })
                    pushState()
                    for (let i = 0; i < Math.min(vm.prism.overlays.length, vm.prism.imagePanes.length); i++) {
                        associate(vm.prism.imagePanes[i], ovls[i])
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
                    checkSaveProceed(() => {
                        window.location.search = '?jnum=' + vm.jnumid
                    })
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
                function zoom (amount, extra) {
                    const p = vm.prism
                    if (amount > 0) {
                        p.scale *= extra ? 2 : 1.1
                    } else if (amount < 0) {
                        p.scale *= extra ? 0.5 : 0.90
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

                //
                function clickedBackground (e) {
                    unselectAllOverlays()
                }

                //
                function saveNeeded () {
                    if (!vm.prism || !vm.prism.imagePanes) return false
                    if (USERNAME === 'None' || USERNAME === '') return false
                    for (let p of vm.prism.imagePanes) {
                        if (p.processStatus === 'u') return true
                    }
                    return false
                }

                // Checks if save is needed before proceeding with an action (a function call).
                function checkSaveProceed(action) {
                    if (!saveNeeded()) {
                        action()
                        return
                    }
                    $scope.saveAndProceed = () => dialogChoice('saveAndProceed', action),
                    $scope.proceed = () => dialogChoice('proceed', action),
                    $scope.cancelAction = () => dialogChoice('cancel', action)

                    document.getElementById("prism-save-dialog").showModal()
                }

                function dialogChoice (choice, action) {
                    document.getElementById("prism-save-dialog").close()
                    if (choice === "saveAndProceed") {
                        console.log("Saving")
                        saveImage(action)
                    } else if (choice === "proceed") {
                        console.log("Proceeding")
                        action()
                    } else {
                        console.log("Cancelling")
                    }


                }

                // Clicked image entry label
                function imageEntryClicked (img) {
                    if (img.imageKey === vm.currImage.imageKey) {
                        vm.hidePaneList = ! vm.hidePaneList
                    } else {
                        checkSaveProceed(() => {
                            selectImage(img)
                            vm.hidePaneList = false
                        })
                    }
                }

                // Handler for clicking on pane label
                function paneEntryClicked (evt, idx) {
                    const pane = vm.currImage.imagePanes[idx]
                    const ovl = getAssociatedOverlay(pane)
                    if (evt.metaKey && vm.prism.clickAssignNextPane === null) {
                        // toggle selection state of target (only)
                        pane.selected = !pane.selected
                        if (ovl) ovl.selected = pane.selected
                    } else if (evt.shiftKey && vm.prism.clickAssignNextPane === null) {
                        // select range from (target to nearest selected above or below)
                        let idx2 = null
                        for (let i = idx+1; i < vm.currImage.imagePanes.length; i++) {
                            if (vm.currImage.imagePanes[i].selected) {
                                idx2 = i
                                break
                            }
                        }
                        if (idx2 === null) {
                            for (let i = idx-1; i >= 0; i--) {
                                if (vm.currImage.imagePanes[i].selected) {
                                    idx2 = i
                                    break
                                }
                            }
                            if (idx2 === null) idx2 = idx
                        }
                        vm.prism.overlays.forEach(o => o.selected = false)
                        vm.prism.imagePanes.forEach(p => p.selected = false)
                        for (let i = Math.min(idx, idx2); i <= Math.max(idx,idx2); i++) {
                            const pane = vm.prism.imagePanes[i]
                            const ovl = getAssociatedOverlay(pane)
                            pane.selected = true
                            if (ovl) ovl.selected = true
                        }
                    } else {
                        vm.prism.overlays.forEach(o => o.selected = false)
                        vm.prism.imagePanes.forEach(p => p.selected = false)
                        pane.selected = true
                        if (vm.prism.clickAssignNextPane !== null) {
                            vm.prism.clickAssignNextPane = idx
                        } else {
                            if (ovl) ovl.selected = true
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

                // Move selected overlays
                function moveSelectedOverlays (dx, dy) {
                    const selected = vm.prism.overlays.filter(o => o.selected)
                    if (selected.length === 0) return
                    pushState()
                    selected.forEach(o => {
                        o.x += dx
                        o.y += dy
                        syncOverlayToPanes(o)
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

                function showHelp () {
                    document.getElementById('prism-help').scrollIntoView()
                }

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

                $scope.reload = reload
                $scope.showPdf = showPdf
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
                $scope.clickedBackground = clickedBackground
                $scope.unselectAllOverlays = unselectAllOverlays
                $scope.saveImage = saveImage
                $scope.undo = undo
                $scope.redo = redo
                $scope.showHelp = showHelp

                $scope.splitOverlays = splitOverlays
                $scope.gridAssign = gridAssign
                $scope.clickAssign = clickAssign
                $scope.onePane = onePane

                $scope.saveNeeded = saveNeeded
                $scope.dialogChoice = dialogChoice

		var globalShortcuts = Mousetrap($document[0].body);
		globalShortcuts.bind(['alt+z'], () => { undo(); $scope.$apply() });
		globalShortcuts.bind(['alt+r'], () => { redo(); $scope.$apply() });
		globalShortcuts.bind(['backspace','del','ctrl+h'], () => { deleteSelectedOverlays(); $scope.$apply() });
		globalShortcuts.bind(['alt+x'], () => { deleteSelectedOverlays(); $scope.$apply() });
		globalShortcuts.bind(['shift+alt+x'], () => { deleteAllOverlays(); $scope.$apply() });
		globalShortcuts.bind(['alt+c'], () => { createCoveringOverlay(); $scope.$apply() });
		globalShortcuts.bind(['alt+s'], () => { saveImage(); $scope.$apply() });
		globalShortcuts.bind(['alt+g'], () => { gridAssign(); $scope.$apply() });
		globalShortcuts.bind(['alt+o'], () => { onePane(); $scope.$apply() });
                // 
		globalShortcuts.bind(['+'], () => { zoom(1); $scope.$apply() });
		globalShortcuts.bind(['-'], () => { zoom(-1); $scope.$apply() });
		globalShortcuts.bind(['0'], () => { zoom(0); $scope.$apply() });
                //
                function moveSelected (e,dir) {
                    const dist = e.shiftKey ? 10 : 1
                    e.preventDefault()
                    switch (dir) {
                    case 'up'    : moveSelectedOverlays(0,-dist); break;
                    case 'down'  : moveSelectedOverlays(0,dist); break;
                    case 'left'  : moveSelectedOverlays(-dist,0); break;
                    case 'right' : moveSelectedOverlays(dist,0); break;
                    }
                    $scope.$apply()
                }
                globalShortcuts.bind(['up','shift+up'],    (e) => moveSelected(e, 'up'));
                globalShortcuts.bind(['down','shift+down'],  (e) => moveSelected(e, 'down'));
                globalShortcuts.bind(['left', 'shift+left'],  (e) => moveSelected(e, 'left'));
                globalShortcuts.bind(['right', 'shift+right'], (e) => moveSelected(e, 'right'));
		
		// call to initialize the page, and start the ball rolling...
		init();
	}

})();

