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
			ImageAlleleAssocAPI,
			ImageTotalCountAPI,
			ValidateJnumImageAPI,
			VocTermSearchAPI
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {};

		// mapping of object data 
		vm.objectData = {};

		// total record count
		vm.total_count = 0;

		// results list and data
		vm.resultCount = 0;
		vm.results = [];
		vm.selectedIndex = 0;
		
		// default booleans for page functionality 
		vm.hideVmData = true;            // JSON data
		vm.hideObjectData = true;		// Display JSON package of object
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
		function eiClear() {		
			vm.oldRequest = null;
			resetData();
                        refreshTotalCount();
			setFocus();
		}		

		// mapped to query 'Search' button
		// default is to select first result
		// if deselect = true, then see below
		function eiSearch(deselect) {				
		
			pageScope.loadingStart();
			vm.hideLoadingHeader = false;
			
			// save off old request
			vm.oldRequest = vm.objectData;
	
			// call API to search; pass query params (vm.selected)
			ImageSearchAPI.search(vm.objectData, function(data) {
				
				vm.results = data;
				vm.hideLoadingHeader = true;
				vm.selectedIndex = 0;
				vm.needsDXDOIid = false;
				vm.displayCreativeCommonsWarning = false;

				// after add/create, eiSearch/by J: is run & results returned
				// then deselect so form is ready for next add
				if (deselect) {
					clearResultsSelection();
					deselectObject();
					pageScope.loadingFinished();
				}
				else {
					if (vm.results.length > 0) {
						vm.queryMode = false;
						loadObject();
					}
					else {
						vm.queryMode = true;
					}
					pageScope.loadingFinished();
					setFocusFigureLabel();
				}

			}, function(err) { // server exception
				pageScope.handleError(vm, "Error while searching");
				pageScope.loadingFinished();
				setFocus();
			});
		}		

		// mapped to 'Reset Search' button
		function resetSearch() {		
			resetData();
			refreshTotalCount()
			if (vm.oldRequest != null) {
				vm.objectData = vm.oldRequest;
			}
		}		

        	// called when user clicks a row in the summary
		function setObject(index) {
			if(index == vm.selectedIndex) {
				clearResultsSelection();
				deselectObject();
			}
			else {
				vm.objectData = {};
				vm.selectedIndex = index;
				loadObject();
				setFocusFigureLabel();
			}
		}		


 	// Deselect current item from the searchResults.
 	// Create a deep copy of the current vm.objectData
 	// to separate it from the searchResults
 		function deselectObject() {
			console.log("into deselectObject");

			var newObject = angular.copy(vm.objectData);

                        vm.objectData = newObject;

			// reset certain data
			resetDataDeselect();

			setFocusFigureLabel();
		}
	
	// clear the results selection
		function clearResultsSelection() {
			vm.selectedIndex = -1;
		}

		// refresh the total count
                function refreshTotalCount() {
                        ImageTotalCountAPI.get(function(data){
                                vm.total_count = data.total_count;
                        });
                }

        // mapped to 'Create' button
		function createObject() {

			console.log("Submitting to object creation endpoint");
			var allowCommit = true;
			
			if (vm.isGxd){ // GXD pre-creation status checks
				if (vm.objectData.imageClassKey != "6481781") {
					alert("GXD can only use expression images.");
					allowCommit = false;
				}
				// if no image class on add, then default = Expression
				if (vm.objectData.imageClassKey == null || vm.objectData.imageClassKey == "") {
					vm.objectData.imageClassKey = "6481781";
				}
			}
			if (vm.isMgd){ // MGD pre-creation status checks
				// for MGD, imageClass "Expression" is not allowed
				// all other instances are allowed (null, Phenotypes, Molecular
				if (vm.objectData.imageClassKey == "6481781") {
					alert("MGD can only use phenotype or molecular images.")
					allowCommit = false;
				}
				// if no image class on add, then default = Phenotypes
				if (vm.objectData.imageClassKey == null || vm.objectData.imageClassKey == "") {
					vm.objectData.imageClassKey = "6481782";
				}
			}
			if (vm.objectData.refsKey == ''){
				alert("Must have a validated reference")
				allowCommit = false;
			}
			if (vm.objectData.figureLabel == ''){
				alert("Required Field ‘Figure Label’")
				allowCommit = false;
			}

			// DXDOI check
			if (vm.needsDXDOIid) {
				alert("Needs DOI ID")
				//allowCommit = false;
			}

			if (allowCommit){

				pageScope.loadingStart();

				// call API for creation
				ImageCreateAPI.create(vm.objectData, function(data) {
					// check for API returned error
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						// after add/create, eiSearch/by J: is run & results returned
						// then deselect so form is ready for next add
						resetDataDeselect();
						eiSearch(true);
						postObjectLoad();
						refreshTotalCount();
					}
					pageScope.loadingFinished();
				}, function(err) {
					pageScope.handleError(vm, "Error creating image.");
					pageScope.loadingFinished();
				});
			}

		}		

        // mapped to 'Update' button
		function modifyObject() {

			console.log("Submitting to update endpoint");
			var allowCommit = true;

			if (vm.objectData.figureLabel == ''){
					alert("Required Field ‘Figure Label’")
					allowCommit = false;
			}

			if (vm.isGxd){ // GXD pre-creation status checks
				if (vm.objectData.imageClassKey != "6481781") {
					alert("GXD can only use expression images.");
					allowCommit = false;
				}
				// if no image class on add, then default = Expression
				if (vm.objectData.imageClassKey == null || vm.objectData.imageClassKey == "") {
					vm.objectData.imageClassKey = "6481781";
				}
			}
			if (vm.isMgd){ // MGD pre-creation status checks
				// for MGD, imageClass "Expression" is not allowed
				// all other instances are allowed (null, Phenotypes, Molecular
				if (vm.objectData.imageClassKey == "6481781") {
					alert("MGD can only use phenotype or molecular images.")
					allowCommit = false;
				}
				// if no image class on add, then default = Phenotypes
				if (vm.objectData.imageClassKey == null || vm.objectData.imageClassKey == "") {
					vm.objectData.imageClassKey = "6481782";
				}
			}

			// must be at least 1 pane label
			var paneLength = vm.objectData.imagePanes.length;
			var paneDelete = 0;
			for(var i=0;i<paneLength; i++) {
				if (vm.objectData.imagePanes[i].processStatus == 'd'){
					paneDelete += 1;
				}
			}
			if (paneLength == 0 || paneLength == paneDelete){
					alert("There must be at least 1 Pane Label")
					allowCommit = false;
			}
			
			// can process delete, but not create/update
			if (vm.objectData.editAccessionIds != null) {
				if (vm.objectData.editAccessionIds[0].processStatus != "d") {
					vm.objectData.editAccessionIds[0].processStatus = "x";
				}
			}

			// DXDOI check
			if (vm.needsDXDOIid) {
				alert("Needs DOI ID")
				//allowCommit = false;
			}

			if (allowCommit){

				pageScope.loadingStart();

				// call update API
				ImageUpdateAPI.update(vm.objectData, function(data) {
					// check for API returned error
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						// update data
						vm.objectData = data.items[0];
						postObjectLoad();
						var summaryDisplay = createSummaryDisplay();
						vm.results[vm.selectedIndex].imageDisplay = summaryDisplay;
					}
					pageScope.loadingFinished();
				}, function(err) {
					pageScope.handleError(vm, "Error updating image.");
					pageScope.loadingFinished();
				});
			}

		}		
		
        // mapped to 'Delete' button
		function deleteObject() {

			console.log("Into deleteObject()");

			if ($window.confirm("Are you sure you want to delete this image stub?")) {
				
				pageScope.loadingStart();

				// save off keys; we'll need these in postObjectDelete
				vm.deletedImageKey = vm.objectData.imageKey;
				vm.deletedThumbKey = null;
				if (vm.objectData.thumbnailImage != null){
					vm.deletedThumbKey = vm.objectData.thumbnailImage.imageKey;
				}
			
				// call API to delete image
				ImageDeleteAPI.delete({ key: vm.objectData.imageKey }, function(data) {
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					} else {
						postObjectDelete();
						refreshTotalCount();
					}
					pageScope.loadingFinished();
				}, function(err) {
					pageScope.handleError(vm, "Error deleting image.");
					pageScope.loadingFinished();
				});
			}
		}		
		
		function modifyAlleleAssoc() {

			console.log("Submitting to allele assoc endpoint");

			pageScope.loadingStart();

			// call update API
			ImageAlleleAssocAPI.update(vm.objectData, function(data) {
				// check for API returned error
				if (data.error != null) {
					alert("ERROR: " + data.error + " - " + data.message);
				}
				else {
					// update data
					vm.objectData = data.items[0];
					postObjectLoad();
					var summaryDisplay = createSummaryDisplay();
					vm.results[vm.selectedIndex].imageDisplay = summaryDisplay;
				}
				pageScope.loadingFinished();
			}, function(err) {
				pageScope.handleError(vm, "Error updating image.");
				pageScope.loadingFinished();
			});
		}		

        	// update pane label process status when changed 
		function paneLabelChanged(index) {		
			console.log("Into paneLabelChanged()");
			if (vm.objectData.imagePanes[index].processStatus != "c") {
				vm.objectData.imagePanes[index].processStatus = "u";
			}
		}
		
		// attach tag text to specific note chunk
		function addTag(tagText, inputElement, outputElement) {

			// inserted text
			//var alleleText = " \\AlleleSymbol(|0) ";

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
			addTag(" \\AlleleSymbol(|0) ", "captionID", vm.objectData.captionNote);
		}

		// attach superscript tag to caption
		function addSuperscriptTag() {
			addTag(" <sup></sup> ", "captionID", vm.objectData.captionNote);
		}
		
		// will add a new pane label to end of list
		function addPaneLabel() {
			console.log("addPaneLabel");
			if (vm.objectData.imagePanes == null){
				vm.objectData.imagePanes = [];
			}
			var newPaneLabel = {"processStatus":"c", "paneLabel":""};
			vm.objectData.imagePanes.push(newPaneLabel);
		}

		// will delete a pane label
		function deletePaneLabelRow(index) {
			console.log("deletePaneLabelRow");
			if (vm.objectData.imagePanes[index].processStatus == "c") { 
				// remove row if newly added but not yet saved
				vm.objectData.imagePanes.splice(index, 1);
			} 
			else { // flag pre-existing row for deletion
				vm.objectData.imagePanes[index].processStatus = "d";
			}
		}
		
		
		// clear/delete a note/accession id
                function clearNote(note) {
			if (note != null) {
				if (note.accID != null) {
					note.processStatus = "d";
					note.accID = "";
				}
				else {
					note.noteChunk = "";
				}
			}
		}

                function imgDetailLink() {
                FindElement.byId("objectAccId").then(function(element){
                        var imgUrl = pageScope.PWI_BASE_URL + "detail/image/" + element.value;
                        window.open(imgUrl, '_blank');
                });
                }

                function imgSummaryLink(value) {
                        var imgUrl = pageScope.PWI_BASE_URL + "summary/image?allele_id=" + value;
                        window.open(imgUrl, '_blank');
                }

                function prismLink() {
                FindElement.byId("JNumID").then(function(element){
                        var prismUrl = pageScope.PRISM_URL + "#" + element.value;
                        window.open(prismUrl, '_blank');
                });
                }

		/////////////////////////////////////////////////////////////////////
		// SUMMARY NAVIGATION
		/////////////////////////////////////////////////////////////////////

		function prevSummaryObject() {
			console.log("previous summary object");
			if(vm.results.length == 0) return;
			if(vm.selectedIndex == 0) return;
			vm.selectedIndex--;
			loadObject();
			scrollToObject();
		}
		
		function nextSummaryObject() {
			console.log("next summary object");
			if(vm.results.length == 0) return;
			if(vm.selectedIndex + 1 >= vm.results.length) return;
			vm.selectedIndex++;
			loadObject();
			scrollToObject();
		}		

	    	function firstSummaryObject() {
			console.log("first summary object");
	        	if(vm.results.length == 0) return;
	        	vm.selectedIndex = 0;
			loadObject();
			scrollToObject();
	      	}

	    	function lastSummaryObject() {
			console.log("last summary object");
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
			console.log("into resetImagePanes");

			vm.objectData.imagePanes = [];
			for(var i=0;i<26; i++) {
				vm.objectData.imagePanes[i] = {"processStatus":"c", "paneLabel":""};
			}
		}

		// reset non-editable accession ids
		function resetNonEditableAccessionIds() {
			vm.objectData.nonEditAccessionIds = [];
			vm.objectData.nonEditAccessionIds[0] = {"accID":""};
		}

		// reset other stuff
		function resetOther() {
			console.log("into resetOther");

			//
			// reset display booleans
			vm.hideErrorContents = true;
			vm.hideLoadingHeader = true;
			vm.queryMode = true;
			vm.needsDXDOIid = false;
			vm.displayCreativeCommonsWarning = false;
			
			// MGD vs GXD handling
			if (isGxd){ vm.objectData.imageClassKey = "6481781"; }
			if (isMgd){ vm.objectData.imageClassKey = ""; }
		}

		// resets page data
		function resetData() {
			console.log("into resetData");

			// reset submission/summary values
			vm.results = [];
			vm.selectedIndex = 0;
			vm.errorMsg = '';
			vm.total_count = 0;
			vm.resultCount = 0;

			// rebuild empty objectData submission object, else bindings fail
			vm.objectData = {};
			vm.objectData.imageKey = "";	
			vm.objectData.refsKey = "";	
			vm.objectData.jnumid = "";	
			vm.objectData.figureLabel = "";	
			vm.objectData.mgiAccessionIds = [];
			vm.objectData.mgiAccessionIds[0] = {"accID":""};			
			vm.objectData.editAccessionIds = [];
			vm.objectData.editAccessionIds[0] = {"accID":""};			
			vm.objectData.thumbnailImage = {};
			vm.objectData.thumbnailImage.mgiAccessionIds = [];
			vm.objectData.thumbnailImage.mgiAccessionIds[0] = {"accID":""};			
			vm.objectData.captionNote = {};	
			vm.objectData.captionNote.noteChunk = "";	
			vm.objectData.copyrightNote = {};	
			vm.objectData.copyrightNote.noteChunk = "";	
			vm.objectData.privateCuratorialNote = {};	
			vm.objectData.privateCuratorialNote.noteChunk = "";	
			vm.objectData.externalLinkNote = {};	
			vm.objectData.externalLinkNote.noteChunk = "";	
			vm.objectData.xdim = "";	
			vm.objectData.ydim = "";	

			vm.imageClassRequest = {"vocabKey":"83"};
			vm.imageTypeRequest = {"vocabKey":"47"};

			resetNonEditableAccessionIds()
			resetImagePanes()
			resetOther()
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("into resetDataDeselect");

			//do not reset
			//vm.objectData.imageClassKey = "";	
			//vm.objectData.refsKey = "";	
			//vm.objectData.jnumid = "";	
			//vm.objectData.short_citation = "";
			
			// copyright may be null
		    	if (vm.objectData.copyrightNote == null) {
				vm.objectData.copyrightNote = {};
				vm.objectData.copyrightNote.noteKey = "";
				vm.objectData.copyrightNote.noteChunk = "";	
			}
			else {
				vm.objectData.copyrightNote.noteKey = "";
			}

			vm.objectData.imageKey = "";	
			vm.objectData.imageTypeKey = "";	
			vm.objectData.figureLabel = "";	
			vm.objectData.mgiAccessionIds = [];
			vm.objectData.mgiAccessionIds[0] = {"accID":""};			
			vm.objectData.editAccessionIds = [];
			vm.objectData.editAccessionIds[0] = {"accID":""};			
			vm.objectData.nonEditAccessionIds = [];
			vm.objectData.nonEditAccessionIds[0] = {"accID":""};			
			vm.objectData.xdim = "";	
			vm.objectData.ydim = "";	
			vm.objectData.thumbnailImage = {};
			vm.objectData.thumbnailImage.mgiAccessionIds = [];
			vm.objectData.thumbnailImage.mgiAccessionIds[0] = {"accID":""};			
			vm.objectData.captionNote = {};	
			vm.objectData.captionNote.noteChunk = "";	
			vm.objectData.privateCuratorialNote = {};	
			vm.objectData.privateCuratorialNote.noteChunk = "";	
			vm.objectData.externalLinkNote = {};	
			vm.objectData.externalLinkNote.noteChunk = "";	
			vm.objectData.createdByKey = "";
			vm.objectData.createdBy = "";
			vm.objectData.modifiedByKey = "";
			vm.objectData.modifiedBy = "";
			vm.objectData.creation_date = "";
			vm.objectData.modification_date = "";

			resetImagePanes()
			vm.queryMode = true;
		}

		// load vocabularies
                function loadVocabs() {

                        console.log("loadVocabs(): begin");

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

			console.log("loadObject(): begin");

			// derive the key of the selected result summary object
			vm.summaryObjectKey = vm.results[vm.selectedIndex].imageKey;
			
			// call API to gather object for given key
			ImageGatherByKeyAPI.get({ key: vm.summaryObjectKey }, function(data) {
				vm.objectData = data;
				postObjectLoad();
			}, function(err) {
				pageScope.handleError(vm, "Error retrieving data object.");
			});

		}	
		
		// an object can be loaded from a search or create or modify - this shared 
		// processing is called after endpoint data is loaded
		function postObjectLoad() {
			vm.editableField = false;
			vm.queryMode = false;
		}

		// creates a display string to be used in summary (normally supplied by endpoint) 
		function createSummaryDisplay() {
			var displayStr = vm.objectData.jnumid + "; " + vm.objectData.imageType + "; " + vm.objectData.figureLabel;
			return displayStr;
		}

		// when an image is deleted, remove it from the summary
		function postObjectDelete() {

			// remove image (and thumbnail, if it exists)
			removeSearchResultsItem(vm.deletedImageKey);
			if (vm.deletedThumbKey != null) {
				removeSearchResultsItem(vm.deletedThumbKey);
			}

			// clear if now empty; otherwise, load next image
			if(vm.results.length == 0) {
				eiClear();
			}
			else {
				// adjust selected summary index as needed, and load image
				if(vm.selectedIndex > vm.results.length -1) {
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
			var input = document.getElementById ("JNumID");
			input.focus ();
		}

		function setFocusFigureLabel () {
			var input = document.getElementById ("figureLabelID");
			input.focus ();
		}
		
        	// verifing jnum & citation
		function jnumOnBlur() {		
			console.log("jnumOnBlur() : begin");

			// ensure we want to send the validation request
			var validate = true;
			if (vm.objectData.jnumid == "")
			{
				validate = false;
			}
			if (vm.objectData.jnumid.includes("%"))
			{
				validate = false;
			}

			// create local JSON package for validation submission
			var jsonPackage = {"jnumid":"", "copyright":""}; 
			jsonPackage.jnumid = vm.objectData.jnumid;

		    	if (vm.objectData.copyrightNote != null) {
		    		jsonPackage.copyright = vm.objectData.copyrightNote.noteChunk;
		    	}else {
		          	jsonPackage.copyright = "";
		    	}

			// validate against DB
			if (validate) {
				ValidateJnumImageAPI.validate(jsonPackage, function(data) {
					if (data.length == 0) {
						alert("Invalid Reference: " + vm.objectData.jnumid);
                                        	vm.objectData.jnumid = ""; 
                                        	setFocus();
					} else {
						console.log("jnum validated");
						vm.objectData.refsKey = data[0].refsKey;
						vm.objectData.jnumid = data[0].jnumid;
						if (data[0].short_citation != null) {
							vm.objectData.short_citation = data[0].short_citation;
						}
						if (data[0].copyright != null) {
							if (vm.objectData.copyrightNote == null) {
								vm.objectData.copyrightNote = {};
							}
							vm.objectData.copyrightNote.noteChunk = data[0].copyright;
						}
						vm.needsDXDOIid = data[0].needsDXDOIid;
						vm.displayCreativeCommonsWarning = data[0].isCreativeCommons;
					}
					vm.hideErrorContents = true;

				}, function(err) {
					pageScope.handleError(vm, "Invalid Reference");
                                        vm.objectData.jnumid = ""; 
                                        setFocus();
				});
			}
		
		}		
		
		/////////////////////////////////////////////////////////////////////
		// Angular binding of methods 
		/////////////////////////////////////////////////////////////////////		

		// Main Buttons
		$scope.eiSearch = eiSearch;
		$scope.eiClear = eiClear;
		$scope.resetSearch = resetSearch;
		$scope.createObject = createObject;
		$scope.modifyObject = modifyObject;
		$scope.deleteObject = deleteObject;
		$scope.modifyAlleleAssoc = modifyAlleleAssoc;

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
		$scope.deletePaneLabelRow = deletePaneLabelRow;
		$scope.clearNote = clearNote;
		$scope.imgDetailLink = imgDetailLink;
		$scope.imgSummaryLink = imgSummaryLink;
		$scope.prismLink = prismLink;
		$scope.jnumOnBlur = jnumOnBlur;
		
		// global shortcuts
		$scope.KclearAll = function() { $scope.eiClear(); $scope.$apply(); }
		$scope.Ksearch = function() { $scope.eiSearch(); $scope.$apply(); }
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

