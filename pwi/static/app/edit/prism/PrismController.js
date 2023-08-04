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
			ImageCreateAPI,
			ImageUpdateAPI,
			ImageDeleteAPI,
			ImageUpdateAlleleAssocAPI,
			ImageAlleleAssocAPI,
			ImageTotalCountAPI,
			ValidateJnumImageAPI,
			VocTermSearchAPI
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {};

                vm.jnumid = 'J:47700'
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

                function imageEntryClicked (img) {
                    if (img.imageKey === vm.currImage.imageKey) {
                        vm.hidePaneList = ! vm.hidePaneList
                    } else {
                        selectImage(img)
                        vm.hidePaneList = false
                    }
                }

                function prismInit() {
                    const data = vm.currImage
                    const pdata = vm.prism = {
                        pixid: null,
                        xdim: null,
                        ydim: null,
                        imagePanes: [],
                        overlays: [],
                        scale: 1.0,
                        showOverlays: true,
                        undoStack: [],
                        redoStack: [],
                        imageList: []
                    }
                    pdata.pixid = (data.editAccessionIds && data.editAccessionIds[0]) ? data.editAccessionIds[0].numericPart : null
                    pdata.xdim = data.xdim
                    pdata.ydim = data.ydim
                    pdata.imagePanes = data.imagePanes // shared intentionally
                    pdata.overlays = []
                    const ix = {}
                    // create overlays for panes with defined geometries
                    pdata.imagePanes.forEach(p => {
                        if (!p.width) return;
                        const key = `${p.x}|${p.y}|${p.width}|${p.height}`
                        if (!ix[key]) {
                            const ovl = prismNewOverlay(parseInt(p.x),parseInt(p.y),parseInt(p.width),parseInt(p.height),false, p)
                            ix[key] = ovl
                            pdata.overlays.push(ovl)
                        } else {
                            ix[key].panes.push(p)
                        }
                    })
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

                // Called when user changes the J#
                $scope.prismNewJnum = function () {
                    searchByJnum(vm.jnumid)
                }

                // Key handler - blur focus if user hits ENTER
                $scope.prismKeydown = function (evt) {
                    if (evt.keyCode === 13) evt.target.blur()
                }

                // Returns a new overlay with the specified geometry and selection state.
                // Each overlay points to the panes associated with it.
                function prismNewOverlay(x, y, width, height, selected, imgPane) {
                    const panes = imgPane ? [imgPane] : []
                    return { x, y, width, height, selected, panes }

                }

                // Return the pverlay associated with the given pane, or undefined if none.
                function prismGetAssociatedOverlay (pane) {
                    return vm.prism.overlays.filter(o => o.panes.indexOf(pane) >= 0)[0]
                }

                function prismSyncOverlayToPane (p, ovl) {
                    p.x = ovl.x
                    p.y = ovl.y
                    p.width = ovl.width
                    p.height = ovl.height
                    p.processStatus = 'u'
                }

                function prismSyncOverlayToPanes (ovl) {
                    ovl.panes.forEach(p => prismSyncOverlayToPane(p,ovl))
                }

                function prismNullifyPane (pane) {
                    pane.x = pane.y = pane.width = pane.height = null;
                    pane.processStatus = 'u'
                }

                // dissociate pane for its current overlay, if any
                function prismDissociate (pane) {
                    vm.prism.overlays.forEach(o => {
                        const i = o.panes.indexOf(pane)
                        if (i >= 0) {
                            o.panes.splice(i,1)
                            prismNullifyPane(pane)
                        }
                    })
                }

                // Associates one pane with one overlay. Removes pane from previous association, if any.
                // If overlay if null, dissociates from previous overlay and makes no new association.
                function prismAssociate (pane, ovl) {
                    // dissociate pane for its current overlay, if any
                    prismDissociate(pane)
                    // Associate pane with new overlay
                    if (ovl) {
                        ovl.panes.push(pane)
                        prismSyncOverlayToPane(pane, ovl)
                    }
                }

                // UNDO/REDO functions -------------------------------------

                function prismCopyPane (src, tgt) {
                    tgt.processStatus = src.processStatus
                    tgt.x = src.x
                    tgt.y = src.y
                    tgt.width = src.width
                    tgt.height = src.height
                }

                // Pushes the current edit state onto the undo stack and clears the redo statck.
                // Undo-able actions call this function before changing the edit state.
                function prismPushState () {
                    vm.prism.undoStack.push({
                        overlays: vm.prism.overlays.map(o => Object.assign({},o)),
                        panes: vm.prism.imagePanes.map(p => Object.assign({},p))
                    })
                    vm.prism.redoStack = []
                }

                // Pushes current edit state onto the redo stack,
                // restores current edit state from top of undo stack.
                $scope.prismUndo = function () {
                    if (vm.prism.undoStack.length) {
                        vm.prism.redoStack.push({
                            overlays: vm.prism.overlays,
                            panes: vm.prism.imagePanes
                        })
                        const prevState = vm.prism.undoStack.pop()
                        vm.prism.overlays = prevState.overlays
                        vm.prism.imagePanes = prevState.panes
                    }
                }

                // Pushes current state to the undo stack and resores from redo stack.
                $scope.prismRedo = function () {
                    if (vm.prism.redoStack.length) {
                        vm.prism.undoStack.push({
                            overlays: vm.prism.overlays,
                            panes: vm.prism.imagePanes
                        })
                        const nextState = vm.prism.redoStack.pop()
                        vm.prism.overlays = nextState.overlays
                        vm.prism.imagePanes = nextState.panes
                    }
                }
                // ---------------------------------------------------------

                // Change the image zoom level. Implemented with CSS scale transform.
                $scope.prismZoom = function (amount) {
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
                $scope.prismToggleOverlays = function () {
                    vm.prism.showOverlays = !vm.prism.showOverlays
                }

                // Click handler for overlays. May be a select or a split.
                $scope.prismClickedOverlay = function (evt) {
                    // To find the model data for the overlay that was clicked.
                    // Parse the element's id (e.g. 'ovl-14') to get the
                    // index (14), then get the data element (vm.prism.overlays[14])
                    const ovlElt = evt.target
                    const index = parseInt(ovlElt.id.substr(4))
                    if (evt.altKey) {
                        $scope.prismSplitOverlays(evt)
                    } else {
                        $scope.prismSelectOverlay(index, evt.shiftKey)
                    }
                    evt.stopPropagation()
                }

                // Handler for clicking on pane label
                $scope.prismClickedPane = function (evt, idx) {
                    const pane = vm.currImage.imagePanes[idx]
                    const ovl = prismGetAssociatedOverlay(pane)
                    _prismSelectOverlay (ovl, evt.shiftKey)
                    evt.stopPropagation()
                }

                // Change the selection state.
                // If shiftSelect is false, set the overlay's selection state to true and
                // sets the state of all other coverlays to false. If shiftSelect is true, 
                // toggles the selection state of the specified overlay only (no others are affected).
                $scope.prismSelectOverlay = function (index, shiftSelect) {
                    const ovl = vm.prism.overlays[index]
                    _prismSelectOverlay (ovl, shiftSelect)
                }

                function _prismSelectOverlay (ovl, shiftSelect) {
                    if (shiftSelect) {
                        ovl.selected = !ovl.selected
                    } else {
                        vm.prism.overlays.forEach(o => {
                            o.selected = o === ovl
                        })
                    }
                }

                // Splits all selected overlays along a horizontal or vertical line passing through
                // the point where the mouse was clicked. 
                $scope.prismSplitOverlays = function (evt) {
                    const direction = (evt.shiftKey ? "vertical" : "horizontal")
                    const img = document.getElementById("prism-image")
                    const imgRect = img.getBoundingClientRect()
                    const x = Math.round((evt.clientX - imgRect.x) / vm.prism.scale)
                    const y = Math.round((evt.clientY - imgRect.y) / vm.prism.scale)

                    prismPushState()

                    const newOvls = []
                    vm.prism.overlays.forEach(ovl => {
                        if (!ovl.selected) return
                        if (direction === "horizontal") {
                            if (ovl.y >= y || (ovl.y + ovl.height) <= y) return
                            newOvls.push(prismNewOverlay(ovl.x, y, ovl.width, ovl.height - (y - ovl.y), true))
                            ovl.height = y - ovl.y
                            prismSyncOverlayToPanes(ovl)
                        } else {
                            if (ovl.x >= x || (ovl.x + ovl.width) <= x) return
                            newOvls.push(prismNewOverlay(x, ovl.y, ovl.width - (x - ovl.x), ovl.height, true))
                            ovl.width = x - ovl.x
                            prismSyncOverlayToPanes(ovl)
                        }
                    })
                    vm.prism.overlays  = vm.prism.overlays.concat(newOvls)

                    if (newOvls.length === 0) $scope.prismPopState()
                }

                // Set selection state of all overlays to true
                $scope.prismSelectAllOverlays = function () {
                    vm.prism.overlays.forEach(o => {
                        o.selected = true
                    })
                }

                // Set selection state of all overlays to false
                $scope.prismUnselectAllOverlays = function () {
                    vm.prism.overlays.forEach(o => {
                        o.selected = false
                    })
                }

                // Delete overlays where selected state is true
                $scope.prismDeletedSelectedOverlays = function () {
                    prismPushState()
                    vm.prism.overlays = vm.prism.overlays.filter(o => {
                        if (o.selected) o.panes.forEach(p => prismNullifyPane(p))
                        return !o.selected
                    })
                }

                // Delete all overlays
                $scope.prismDeleteAllOverlays = function () {
                    prismPushState()
                    vm.prism.overlays.forEach(o => {
                        o.panes.forEach(p => prismNullifyPane(p))
                    })
                    vm.prism.overlays = []
                }

                // Create a single overlay that exactly covers the image.
                $scope.prismCreateCoveringOverlay = function () {
                    prismPushState()
                    vm.prism.overlays.push(prismNewOverlay(0,0,vm.prism.xdim,vm.prism.ydim, true))
                }

		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		$scope.selectImage = selectImage;
		$scope.imageEntryClicked = imageEntryClicked;
		
		// global shortcuts
		//$scope.KclearAll = function() { $scope.clear(); $scope.$apply(); }
		//$scope.Ksearch = function() { $scope.search(); $scope.$apply(); }
		//$scope.Kfirst = function() { $scope.firstSummaryObject(); $scope.$apply(); }
		//$scope.Knext = function() { $scope.nextSummaryObject(); $scope.$apply(); }
		//$scope.Kprev = function() { $scope.prevSummaryObject(); $scope.$apply(); }
		//$scope.Klast = function() { $scope.lastSummaryObject(); $scope.$apply(); }
		//$scope.Kadd = function() { $scope.createObject(); $scope.$apply(); }
		//$scope.Kmodify = function() { $scope.modifyObject(); $scope.$apply(); }
		//$scope.Kdelete = function() { $scope.deleteObject(); $scope.$apply(); }

		var globalShortcuts = Mousetrap($document[0].body);
		//globalShortcuts.bind(['ctrl+alt+c'], $scope.KclearAll);
		//globalShortcuts.bind(['ctrl+alt+s'], $scope.Ksearch);
		//globalShortcuts.bind(['ctrl+alt+f'], $scope.Kfirst);
		//globalShortcuts.bind(['ctrl+alt+p'], $scope.Kprev);
		//globalShortcuts.bind(['ctrl+alt+n'], $scope.Knext);
		//globalShortcuts.bind(['ctrl+alt+l'], $scope.Klast);
		//globalShortcuts.bind(['ctrl+alt+a'], $scope.Kadd);
		//globalShortcuts.bind(['ctrl+alt+m'], $scope.Kmodify);
		//globalShortcuts.bind(['ctrl+alt+d'], $scope.Kdelete);

		
		// call to initialize the page, and start the ball rolling...
		init();
	}

})();

