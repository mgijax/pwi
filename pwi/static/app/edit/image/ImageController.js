(function() {
	'use strict';
	angular.module('pwi.image').controller('ImageController', ImageController);

	function ImageController(
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

		// mapping of object data 
		vm.apiDomain = {};

		// results list and data
		vm.total_count = 0;
		vm.results = [];
		vm.selectedIndex = 0;
                vm.selectedJournalLicense = "";
                vm.paneCount = 0
		
		// default booleans for page functionality 
		vm.hideApiDomain = true;       // JSON package
		vm.hideVmData = true;          // JSON package + other vm objects
		vm.hideLoadingHeader = true;   // display loading header
		vm.hideErrorContents = true;   // display error message
		
		// error message
		vm.errorMsg = '';
		
		vm.isGxd = isGxd;
		vm.isMgd = isMgd;
		
		
		/////////////////////////////////////////////////////////////////////
		// Page Setup
		/////////////////////////////////////////////////////////////////////		
		
		 // Initializes the needed page values 
		function init() {
			resetData();
			refreshTotalCount();
			loadVocabs();
		}


		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        	// mapped to 'Clear' button; called from init();  resets page
		function clear() {		
			vm.oldRequest = null;
			resetData();
                        refreshTotalCount();
			setFocus();
		}		

		// mapped to query 'Search' button
		// default is to select first result
		// if deselect = true, then see below
		function search(deselect) {				
		
			pageScope.loadingStart();
			vm.hideLoadingHeader = false;
			
			// save off old request
			vm.oldRequest = vm.apiDomain;
	
			// call API to search; pass query params (vm.selected)
			ImageSearchAPI.search(vm.apiDomain, function(data) {
				
				vm.results = data;
				vm.hideLoadingHeader = true;
				vm.selectedIndex = 0;
                                vm.journalLicenses = [];
				vm.needsDXDOIid = false;

				// after add/create, search/by J: is run & results returned
				// then deselect so form is ready for next add
				if (deselect) {
					deselectObject();
				}
				else {
					if (vm.results.length > 0) {
						vm.queryMode = false;
						loadObject();
					}
					else {
						vm.queryMode = true;
					}
				}
				pageScope.loadingEnd();
				setFocusFigureLabel();

			}, function(err) { // server exception
				pageScope.handleError(vm, "Error while searching");
				pageScope.loadingEnd();
				setFocus();
			});
		}		

		// mapped to 'Reset Search' button
		function resetSearch() {		
			resetData();
			refreshTotalCount()
			if (vm.oldRequest != null) {
				vm.apiDomain = vm.oldRequest;
			}
		}		

        	// called when user clicks a row in the summary
		function setObject(index) {
			if (index == vm.selectedIndex) {
				deselectObject();
			}
			else {
				vm.apiDomain = {};
				vm.selectedIndex = index;
				loadObject();
				setFocusFigureLabel();
			}
		}		

 		// Deselect current item from the searchResults.
 		function deselectObject() {
			console.log("deselectObject()");
			var newObject = angular.copy(vm.apiDomain);
                        vm.apiDomain = newObject;
			vm.selectedIndex = -1;
			resetDataDeselect();
			setFocusFigureLabel();
		}
	
		// refresh the total count
                function refreshTotalCount() {
                        ImageTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

        	// mapped to 'Create' button
		function createObject() {
			console.log("createObject() -> ImageCreateAPI()");
			
			if (vm.isGxd){ // GXD pre-creation status checks
				if (vm.apiDomain.imageClassKey != "6481781") {
					alert("GXD can only use expression images.");
					return;
				}
				// if no image class on add, then default = Expression
				if (vm.apiDomain.imageClassKey == null || vm.apiDomain.imageClassKey == "") {
					vm.apiDomain.imageClassKey = "6481781";
				}
			}
			if (vm.isMgd){ // MGD pre-creation status checks
				// for MGD, imageClass "Expression" is not allowed
				// all other instances are allowed (null, Phenotypes, Molecular
				if (vm.apiDomain.imageClassKey == "6481781") {
					alert("MGD can only use phenotype or molecular images.")
					return;
				}
				// if no image class on add, then default = Phenotypes
				if (vm.apiDomain.imageClassKey == null || vm.apiDomain.imageClassKey == "") {
					vm.apiDomain.imageClassKey = "6481782";
				}
			}
			if (vm.apiDomain.refsKey == ''){
				alert("Must have a validated reference")
				return;
			}
			if (vm.apiDomain.figureLabel == ''){
				alert("Required Field Figure Label")
				return;
			}
			// DXDOI warning
			if (vm.needsDXDOIid) {
				alert("Needs DOI ID")
			}

			pageScope.loadingStart();

			ImageCreateAPI.create(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					// after add/create, search/by J: is run & results returned
					// then deselect so form is ready for next add
					resetDataDeselect();
					search(true);
					loadNotes();
					refreshTotalCount();
				}
				pageScope.loadingEnd();
			}, function(err) {
				pageScope.handleError(vm, "Error creating image.");
				pageScope.loadingEnd();
			});
		}		

        	// mapped to 'Update' button
		function modifyObject() {
			console.log("modifyObject() -> ImageUpdateAPI()");

			if (vm.apiDomain.figureLabel == ''){
					alert("Required Field Figure Label")
					return;
			}
			if (vm.isGxd){ // GXD pre-creation status checks
				if (vm.apiDomain.imageClassKey != "6481781") {
					alert("GXD can only use expression images.");
					return;
				}
				// if no image class on add, then default = Expression
				if (vm.apiDomain.imageClassKey == null || vm.apiDomain.imageClassKey == "") {
					vm.apiDomain.imageClassKey = "6481781";
				}
			}
			if (vm.isMgd){ // MGD pre-creation status checks
				// for MGD, imageClass "Expression" is not allowed
				// all other instances are allowed (null, Phenotypes, Molecular
				if (vm.apiDomain.imageClassKey == "6481781") {
					alert("MGD can only use phenotype or molecular images.")
					return;
				}
				// if no image class on add, then default = Phenotypes
				if (vm.apiDomain.imageClassKey == null || vm.apiDomain.imageClassKey == "") {
					vm.apiDomain.imageClassKey = "6481782";
				}
			}

			// must be at least 1 pane label
			var paneLength = vm.apiDomain.imagePanes.length;
			var paneDelete = 0;
			for(var i=0;i<paneLength; i++) {
				if (vm.apiDomain.imagePanes[i].processStatus == 'd'){
					paneDelete += 1;
				}
			}
			if (paneLength == 0 || paneLength == paneDelete){
					alert("There must be at least 1 Pane Label")
					return;
			}
			
			// can process delete, but not create/update
			if (vm.apiDomain.editAccessionIds != null) {
				if (vm.apiDomain.editAccessionIds[0].processStatus != "d") {
					vm.apiDomain.editAccessionIds[0].processStatus = "x";
				}
			}

			// DXDOI warning
			if (vm.needsDXDOIid) {
				alert("Needs DOI ID")
			}

			pageScope.loadingStart();

			ImageUpdateAPI.update(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					vm.apiDomain = data.items[0];
					loadNotes();
					var summaryDisplay = createSummaryDisplay();
					vm.results[vm.selectedIndex].imageDisplay = summaryDisplay;
                                        setPaneCount();
				}
				pageScope.loadingEnd();
			}, function(err) {
				pageScope.handleError(vm, "Error updating image.");
				pageScope.loadingEnd();
			});
		}		
		
        	// mapped to 'Delete' button
		function deleteObject() {
			console.log("deleteObject() -> ImageDeleteAPI()");

			if ($window.confirm("Are you sure you want to delete this record?")) {
				
				pageScope.loadingStart();

				ImageDeleteAPI.delete({ key: vm.apiDomain.imageKey }, function(data) {
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					} else {
						postObjectDelete();
						refreshTotalCount();
					}
					pageScope.loadingEnd();
					setFocus();
				}, function(err) {
					pageScope.handleError(vm, "Error deleting image.");
					pageScope.loadingEnd();
					setFocus();
				});
			}
		}		
		
		function modifyAlleleAssoc() {
			console.log("modifyAlleleAssoc() -> ImageUpdateAlleleAssocAPI()");

			pageScope.loadingStart();

			ImageUpdateAlleleAssocAPI.update(vm.apiDomain, function(data) {
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					loadObject();
					var summaryDisplay = createSummaryDisplay();
					vm.results[vm.selectedIndex].imageDisplay = summaryDisplay;
				}
				pageScope.loadingEnd();
				setFocus();
			}, function(err) {
				pageScope.handleError(vm, "Error updating ImageUpdateAlleleAssocAPI");
				pageScope.loadingEnd();
				setFocus();
			});
		}		

        	// update pane label process status when changed 
		function paneLabelChanged(index) {		
			console.log("paneLabelChanged()");
			if (vm.apiDomain.imagePanes[index].processStatus != "c") {
				vm.apiDomain.imagePanes[index].processStatus = "u";
			}
		}
		
		// attach tag text to specific note chunk
		function addTag(tagText, inputElement, outputElement) {

			// inserted text

			// add tagText based on current focus
			var textField = document.getElementById(inputElement);
			var textTmp = textField.value; 
			var start = textField.selectionStart
			var end = textField.selectionEnd
			var before = textTmp.substring(0, start)
			var after  = textTmp.substring(end, textTmp.length)

			// add the text, and set focus
			textField.value = (before + tagText + after); 
			textField.selectionStart = textField.selectionEnd = start + tagText.length
			textField.focus();

			if (outputElement == null) {
				outputElement = {};	
			}
			outputElement.noteChunk = textField.value;
		}

		// attach allele tag to caption
		function addAlleleTag() {
			addTag(" \\AlleleSymbol(|0) ", "captionID", vm.apiDomain.captionNote);
		}

		// attach superscript tag to caption
		function addSuperscriptTag() {
			addTag(" <sup></sup> ", "captionID", vm.apiDomain.captionNote);
		}
		
		// will add a new pane label to end of list
		function addPaneLabel() {
			console.log("addPaneLabel()");
			if (vm.apiDomain.imagePanes == null){
				vm.apiDomain.imagePanes = [];
			}
			var newPaneLabel = {"processStatus":"c", "paneLabel":""};
			vm.apiDomain.imagePanes.push(newPaneLabel);
		}

		// will attach selected Journal License to Copyright
		function selectJournalLicense() {
			console.log("selectJournalLicense()");

                        if (vm.selectedJournalLicense == null || vm.selectedJournalLicense == "") {
                                return;
                        }

			console.log("selectJournalLicense()/call jNumOnBlur(): " + vm.selectedJournalLicense);
                        vm.apiDomain.copyrightNote.noteChunk = "";
                        jnumOnBlur();
		}

                // duplicate image
		function duplicateImage() {
			console.log("duplicateImage()");

                        var newImage = vm.apiDomain;

                        newImage.imageKey = "";
                        newImage.accID = "";
                        newImage.editAccessionIds = [];
                        newImage.editAccessionIds[0] = {"accID":""};
                        newImage.nonEditAccessionIds = [];
                        newImage.nonEditAccessionIds[0] = {"accID":""};
                        newImage.xdim = "";
                        newImage.ydim = "";
                        newImage.thumbnailImage = {};
                        newImage.thumbnailImage.accID = "";
                        newImage.createdByKey = "";
                        newImage.createdBy = "";
                        newImage.modifiedByKey = "";
                        newImage.modifiedBy = "";
                        newImage.creation_date = "";
                        newImage.modification_date = "";

                        newImage.captionNote.processStatus = "c";
                        newImage.captionNote.noteKey = "";
                        newImage.captionNote.objectKey = "";
                        newImage.copyrightNote.processStatus = "c";
                        newImage.copyrightNote.noteKey = "";
                        newImage.copyrightNote.objectKey = "";
			newImage.privateCuratorialNote = {};	
			newImage.privateCuratorialNote.noteKey = "";
			newImage.privateCuratorialNote.noteTypeKey = "1025";
			newImage.privateCuratorialNote.noteChunk = "";	
			newImage.externalLinkNote = {};	
			newImage.externalLinkNote.noteKey = "";
			newImage.externalLinkNote.noteTypeKey = "1039";
			newImage.externalLinkNote.noteChunk = "";	

                        if (newImage.imagePanes != null) {
                                for(var i=0;i<newImage.imagePanes.length; i++) {
                                        if (newImage.imagePanes[i].processStatus == "x") {
                                                newImage.imagePanes[i].processStatus = "c";
                                                newImage.imagePanes[i].imagePaneKey = "";
                                                newImage.imagePanes[i].imageKey = "";
                                                newImage.imagePanes[i].x = "";
                                                newImage.imagePanes[i].y = "";
                                                newImage.imagePanes[i].width = "";
                                                newImage.imagePanes[i].height = "";
                                                newImage.imagePanes[i].accID = "";
                                                newImage.imagePanes[i].pixID = "";
                                                newImage.imagePanes[i].xdim = "";
                                                newImage.imagePanes[i].ydim = "";
                                        }
                                }
                        }

                        vm.apiDomain = newImage;
                        createObject();
                }

		// linkout to image detail
                function imgDetailLink() {
                FindElement.byId("objectAccId").then(function(element){
                        var imgUrl = pageScope.url_for('pwi.imagedetail', '?id=' + element.value);
                        window.open(imgUrl, '_blank');
                });
                }

		// linkout to image summary
                function imgSummaryLink(value) {
                        var imgUrl = pageScope.url_for('pwi.imagesummary', '?allele_id=' + value);
                        window.open(imgUrl, '_blank');
                }

		// link out to prism
                function prismLink() {
                FindElement.byId("JNumID").then(function(element){
                        var prismUrl = pageScope.url_for('pwi.prism', '#' + element.value);
                        window.open(prismUrl, '_blank');
                });
                }

		/////////////////////////////////////////////////////////////////////
		// SUMMARY NAVIGATION
		/////////////////////////////////////////////////////////////////////

		function prevSummaryObject() {
			console.log("prevSummaryObject()");
			if(vm.results.length == 0) return;
			if(vm.selectedIndex == 0) return;
			vm.selectedIndex--;
			loadObject();
			scrollToObject();
		}
		
		function nextSummaryObject() {
			console.log("nextSummaryObject()");
			if(vm.results.length == 0) return;
			if(vm.selectedIndex + 1 >= vm.results.length) return;
			vm.selectedIndex++;
			loadObject();
			scrollToObject();
		}		

	    	function firstSummaryObject() {
			console.log("firstSummaryObject()");
	        	if(vm.results.length == 0) return;
	        	vm.selectedIndex = 0;
			loadObject();
			scrollToObject();
	      	}

	    	function lastSummaryObject() {
			console.log("lastSummaryObject()");
	        	if(vm.results.length == 0) return;
	        	vm.selectedIndex = vm.results.length - 1;
			loadObject();
			scrollToObject();
	      	}

	    	// ensure we keep the selected row in view
		function scrollToObject() {
			$q.all([
			   FindElement.byId("resultTableWrapper"),
			   FindElement.byQuery("#resultsTable .resultsTableSelectedRow")
			 ]).then(function(elements) {
				 var table = angular.element(elements[0]);
				 var selected = angular.element(elements[1]);
				 var offset = 30;
				 table.scrollToElement(selected, offset, 0);
			 });
			setFocusFigureLabel();
		}
		
		
		/////////////////////////////////////////////////////////////////////
		// Utility methods
		/////////////////////////////////////////////////////////////////////
		
		// reset image panes
		function resetImagePanes() {
			console.log("resetImagePanes()");

			vm.apiDomain.imagePanes = [];
			for(var i=0;i<26; i++) {
				vm.apiDomain.imagePanes[i] = {"processStatus":"c", "paneLabel":""};
			}
		}

		// reset copyright
		function resetCopyright() {
			vm.apiDomain.copyrightNote = {};	
			vm.apiDomain.copyrightNote.noteKey = "";
			vm.apiDomain.copyrightNote.noteTypeKey = "1023";
			vm.apiDomain.copyrightNote.noteChunk = "";	
		}

		// reset notes
		function resetNotes() {
			vm.apiDomain.captionNote = {};	
			vm.apiDomain.captionNote.noteKey = "";
			vm.apiDomain.captionNote.noteTypeKey = "1024";
			vm.apiDomain.captionNote.noteChunk = "";	
			vm.apiDomain.privateCuratorialNote = {};	
			vm.apiDomain.privateCuratorialNote.noteKey = "";
			vm.apiDomain.privateCuratorialNote.noteTypeKey = "1025";
			vm.apiDomain.privateCuratorialNote.noteChunk = "";	
			vm.apiDomain.externalLinkNote = {};	
			vm.apiDomain.externalLinkNote.noteKey = "";
			vm.apiDomain.externalLinkNote.noteTypeKey = "1039";
			vm.apiDomain.externalLinkNote.noteChunk = "";	
		}

		// reset non-editable accession ids
		function resetNonEditableAccessionIds() {
			vm.apiDomain.nonEditAccessionIds = [];
			vm.apiDomain.nonEditAccessionIds[0] = {"accID":""};
		}

		// reset other stuff
		function resetOther() {
			console.log("resetOther()");

			//
			// reset display booleans
			vm.hideErrorContents = true;
			vm.hideLoadingHeader = true;
			vm.queryMode = true;
                        vm.journalLicenses = [];
			vm.needsDXDOIid = false;
			
			// MGD vs GXD handling
			if (isGxd){ vm.apiDomain.imageClassKey = "6481781"; }
			if (isMgd){ vm.apiDomain.imageClassKey = ""; }
		}

		// resets page data
		function resetData() {
			console.log("resetData()");

			// reset submission/summary values
			vm.results = [];
			vm.selectedIndex = 0;
			vm.errorMsg = '';
			vm.total_count = 0;
                        vm.selectedJournalLicense = "";

			// rebuild empty apiDomain submission object, else bindings fail
			vm.apiDomain = {};
			vm.apiDomain.imageKey = "";	
			vm.apiDomain.refsKey = "";	
			vm.apiDomain.jnumid = "";	
			vm.apiDomain.figureLabel = "";	
			vm.apiDomain.accID = "";
			vm.apiDomain.editAccessionIds = [];
			vm.apiDomain.editAccessionIds[0] = {"accID":""};			
			vm.apiDomain.thumbnailImage = {};
			vm.apiDomain.thumbnailImage.accID = "";
			vm.apiDomain.xdim = "";	
			vm.apiDomain.ydim = "";	

			vm.imageClassRequest = {"vocabKey":"83"};
			vm.imageTypeRequest = {"vocabKey":"47"};

                        // allele/image pane assoc
                        vm.alleleAssocs = [];

			resetCopyright()
			resetNotes()
			resetNonEditableAccessionIds()
			resetImagePanes()
			resetOther()
                        setPaneCount()
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("resetDataDeselect()");

			//do not reset
			//vm.apiDomain.imageClassKey = "";	
			//vm.apiDomain.refsKey = "";	
			//vm.apiDomain.jnumid = "";	
			//vm.apiDomain.short_citation = "";
			
			// copyright may be null
		    	if (vm.apiDomain.copyrightNote == null) {
				vm.apiDomain.copyrightNote = {};
				vm.apiDomain.copyrightNote.noteKey = "";
				vm.apiDomain.copyrightNote.noteChunk = "";	
			}
			else {
				vm.apiDomain.copyrightNote.noteKey = "";
			}

			vm.apiDomain.imageKey = "";	
			vm.apiDomain.imageTypeKey = "";	
			vm.apiDomain.figureLabel = "";	
			vm.apiDomain.accID = "";
			vm.apiDomain.editAccessionIds = [];
			vm.apiDomain.editAccessionIds[0] = {"accID":""};			
			vm.apiDomain.nonEditAccessionIds = [];
			vm.apiDomain.nonEditAccessionIds[0] = {"accID":""};			
			vm.apiDomain.xdim = "";	
			vm.apiDomain.ydim = "";	
			vm.apiDomain.thumbnailImage = {};
			vm.apiDomain.thumbnailImage.accID = "";
			vm.apiDomain.createdByKey = "";
			vm.apiDomain.createdBy = "";
			vm.apiDomain.modifiedByKey = "";
			vm.apiDomain.modifiedBy = "";
			vm.apiDomain.creation_date = "";
			vm.apiDomain.modification_date = "";

			resetNotes()
			resetImagePanes()
			vm.queryMode = true;
		}

		// load vocabularies
                function loadVocabs() {

                        console.log("loadVocabs()");

			var loadTerm;

			loadTerm = "Image Class";
                        VocTermSearchAPI.search(vm.imageClassRequest, function(data) {
                                if (data.error != null) {
                                        console.log(data.message);
                                        alert("Error initializing vocabulary : " + loadTerm);
                                } else {
                                        var termsList = data.items;
                                        vm.imageClassTerms = termsList[0].terms;
                                }

                        }, function(err) {
                                pageScope.handleError(vm, "Error loading vocabulary: " + loadTerm);
                        });

                        loadTerm = "Image Type";
                        VocTermSearchAPI.search(vm.imageTypeRequest, function(data) {
                                if (data.error != null) {
                                        console.log(data.message);
                                        alert("Error initializing vocabulary : " + loadTerm);
                                } else {
                                        var termsList = data.items;
                                        vm.imageTypeTerms = termsList[0].terms;
                                }

                        }, function(err) {
                                pageScope.handleError(vm, "Error loading vocabulary: " + loadTerm);
                        });

                }

		// load a selected object from summary 
		function loadObject() {
			console.log("loadObject()");

			if (vm.results.length == 0) {
				return;
			}

			// call API to gather object for given key
			ImageGatherByKeyAPI.get({ key: vm.results[vm.selectedIndex].imageKey }, function(data) {
				vm.apiDomain = data;
				loadAlleleAssoc();
				loadNotes();
                                setPaneCount();
			}, function(err) {
				pageScope.handleError(vm, "Error retrieving data object.");
			});
		}	
		
                function setPaneCount() {
			console.log("setPaneCount()");

                        vm.paneCount = 0;
			for(var i=0;i<vm.apiDomain.imagePanes.length; i++) {
                                if (vm.apiDomain.imagePanes[i].processStatus == "x") {
                                        vm.paneCount += 1;
                                }
                        }
                }

                //
		// an object can be loaded from a search or create or modify - this shared 
                //
                
		// load allele/image pane assoc by image
		function loadAlleleAssoc() {
			console.log("loadAlleleAssoc()");

			var params = {};
			params.imageKey = vm.apiDomain.imageKey;
			ImageAlleleAssocAPI.search(params, function(data) {
			        vm.alleleAssocs = data;
			}, function(err) {
				pageScope.handleError(vm, "API ERROR: ImageAlleleAssocAPI.getAlleleByImage");
			});
		}	

		// load notes
		function loadNotes() {
			console.log("loadNotes()");

			vm.queryMode = false;

			if (vm.apiDomain.imagePanes.length > 0 
				&& vm.apiDomain.imagePanes[0].paneLabel != null) {
				addPaneLabel();
			}

			if (vm.apiDomain.captionNote == null) {
				vm.apiDomain.captionNote = {};	
				vm.apiDomain.captionNote.noteKey = "";
				vm.apiDomain.captionNote.noteTypeKey = "1024";
				vm.apiDomain.captionNote.noteChunk = "";	
			}
			if (vm.apiDomain.copyrightNote == null) {
				vm.apiDomain.copyrightNote = {};	
				vm.apiDomain.copyrightNote.noteKey = "";
				vm.apiDomain.copyrightNote.noteTypeKey = "1023";
				vm.apiDomain.copyrightNote.noteChunk = "";	
			}
			if (vm.apiDomain.privateCuratorialNote == null) {
				vm.apiDomain.privateCuratorialNote = {};	
				vm.apiDomain.privateCuratorialNote.noteKey = "";
				vm.apiDomain.privateCuratorialNote.noteTypeKey = "1025";
				vm.apiDomain.privateCuratorialNote.noteChunk = "";	
			}
			if (vm.apiDomain.externalLinkNote == null) {
				vm.apiDomain.externalLinkNote = {};	
				vm.apiDomain.externalLinkNote.noteKey = "";
				vm.apiDomain.externalLinkNote.noteTypeKey = "1039";
				vm.apiDomain.externalLinkNote.noteChunk = "";	
			}
		}

		// creates a display string to be used in summary (normally supplied by endpoint) 
		function createSummaryDisplay() {
			var displayStr = vm.apiDomain.jnumid + "; " + vm.apiDomain.imageType + "; " + vm.apiDomain.figureLabel;
			return displayStr;
		}

		// when an image is deleted, remove it from the summary
		function postObjectDelete() {
			console.log("postObjectDelete()");

			// remove image (and thumbnail, if it exists)
			removeSearchResultsItem(vm.apiDomain.imageKey);

			if (vm.apiDomain.thumbnailImage != null) {
				removeSearchResultsItem(vm.apiDomain.thumbnailImage.imageKey);
			}

			// clear if now empty; otherwise, load next image
			if (vm.results.length == 0) {
				clear();
			}
			else {
				// adjust selected summary index as needed, and load image
				if (vm.selectedIndex > vm.results.length -1) {
					vm.selectedIndex = vm.results.length -1;
				}
				loadObject();
			}
		}

		// handle removal from summary list
		function removeSearchResultsItem(keyToRemove) {
			
			// first find the item to remove
			var removeIndex = -1;
			for(var i=0;i<vm.results.length; i++) {
				if (vm.results[i].imageKey == keyToRemove) {
					removeIndex = i;
				}
			}
			// if found, remove it
			if (removeIndex >= 0) {
				vm.results.splice(removeIndex, 1);
			}
		}

		// setting of mouse focus
		function setFocus () {
                        console.log("setFocus()");
                        // must pause for a bit...then it works
                        setTimeout(function() {
                                document.getElementById("JNumID").focus();
                        }, (200));
		}
		function setFocusFigureLabel () {
			document.getElementById("figureLabelID").focus();
		}
		
        	// verifing jnum & citation
		function jnumOnBlur() {		
			console.log("jnumOnBlur() : begin");

			// ensure we want to send the validation request
			var validate = true;
			if (vm.apiDomain.jnumid == "")
			{
				validate = false;
			}
			if (vm.apiDomain.jnumid.includes("%"))
			{
				validate = false;
			}

			// create local JSON package for validation submission
			var jsonPackage = {"jnumid":"", "copyright":""}; 
			jsonPackage.jnumid = vm.apiDomain.jnumid;

		    	if (vm.apiDomain.copyrightNote != null) {
		    		jsonPackage.copyright = vm.apiDomain.copyrightNote.noteChunk;
		    	}else {
		          	jsonPackage.copyright = "";
		    	}

		    	if (vm.selectedJournalLicense != null) {
		    		jsonPackage.selectedJournalLicense = vm.selectedJournalLicense;
		    	}else {
		          	jsonPackage.selectedJournalLicense = "";
		    	}
                        console.log(jsonPackage);

			// validate against DB
			if (validate) {
				ValidateJnumImageAPI.validate(jsonPackage, function(data) {
					if (data.length == 0) {
						alert("Invalid Reference: " + vm.apiDomain.jnumid);
                                        	vm.apiDomain.jnumid = ""; 
                                        	setFocus();
					} else {
						console.log("jnum validated");
						vm.apiDomain.refsKey = data[0].refsKey;
						vm.apiDomain.jnumid = data[0].jnumid;
						if (data[0].short_citation != null) {
							vm.apiDomain.short_citation = data[0].short_citation;
						}
						if (data[0].copyright != null) {
							if (vm.apiDomain.copyrightNote == null) {
								vm.apiDomain.copyrightNote = {};
							}
							vm.apiDomain.copyrightNote.noteChunk = data[0].copyright;
						}
						vm.needsDXDOIid = data[0].needsDXDOIid;
                                                if (data[0].journalLicenses != null) {
                                                        if (data[0].journalLicenses.length > 1) {
                                                                vm.journalLicenses = data[0].journalLicenses;
                                                        }
                                                }
					}
					vm.hideErrorContents = true;

				}, function(err) {
					pageScope.handleError(vm, "Invalid Reference");
                                        vm.apiDomain.jnumid = ""; 
                                        setFocus();
				});
			}
		
		}		
		
		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.search = search;
		$scope.clear = clear;
		$scope.resetSearch = resetSearch;
		$scope.createObject = createObject;
		$scope.modifyObject = modifyObject;
		$scope.deleteObject = deleteObject;
		$scope.modifyAlleleAssoc = modifyAlleleAssoc;
		$scope.duplicateImage = duplicateImage;

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

		// other functions: buttons, onBlurs and onChanges
		$scope.setObject = setObject;
		$scope.addAlleleTag = addAlleleTag;
		$scope.addSuperscriptTag = addSuperscriptTag;
		$scope.addPaneLabel = addPaneLabel;
		$scope.paneLabelChanged = paneLabelChanged;	
		$scope.imgDetailLink = imgDetailLink;
		$scope.imgSummaryLink = imgSummaryLink;
		$scope.prismLink = prismLink;
		$scope.jnumOnBlur = jnumOnBlur;
		$scope.selectJournalLicense = selectJournalLicense;
		
		// global shortcuts
		$scope.KclearAll = function() { $scope.clear(); $scope.$apply(); }
		$scope.Ksearch = function() { $scope.search(); $scope.$apply(); }
		$scope.Kfirst = function() { $scope.firstSummaryObject(); $scope.$apply(); }
		$scope.Knext = function() { $scope.nextSummaryObject(); $scope.$apply(); }
		$scope.Kprev = function() { $scope.prevSummaryObject(); $scope.$apply(); }
		$scope.Klast = function() { $scope.lastSummaryObject(); $scope.$apply(); }
		$scope.Kadd = function() { $scope.createObject(); $scope.$apply(); }
		$scope.Kmodify = function() { $scope.modifyObject(); $scope.$apply(); }
		$scope.Kdelete = function() { $scope.deleteObject(); $scope.$apply(); }

		var globalShortcuts = Mousetrap($document[0].body);
		globalShortcuts.bind(['ctrl+alt+c'], $scope.KclearAll);
		globalShortcuts.bind(['ctrl+alt+s'], $scope.Ksearch);
		globalShortcuts.bind(['ctrl+alt+f'], $scope.Kfirst);
		globalShortcuts.bind(['ctrl+alt+p'], $scope.Kprev);
		globalShortcuts.bind(['ctrl+alt+n'], $scope.Knext);
		globalShortcuts.bind(['ctrl+alt+l'], $scope.Klast);
		globalShortcuts.bind(['ctrl+alt+a'], $scope.Kadd);
		globalShortcuts.bind(['ctrl+alt+m'], $scope.Kmodify);
		globalShortcuts.bind(['ctrl+alt+d'], $scope.Kdelete);

		
		// call to initialize the page, and start the ball rolling...
		init();
	}

})();

