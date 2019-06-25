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
			VocabSearchAPI,
			JnumValidationAPI
	) {
		// Set page scope from parent scope, and expose the vm mapping
		var pageScope = $scope.$parent;
		var vm = $scope.vm = {};

		// mapping of object data 
		vm.objectData = {};

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
		}


		/////////////////////////////////////////////////////////////////////
		// Functions bound to UI buttons or mouse clicks
		/////////////////////////////////////////////////////////////////////

        // mapped to 'Clear' button; called from init();  resets page
		function eiClear() {		
			vm.oldRequest = null;
			resetData();
			setFocus();
		}		

		// mapped to query 'Search' button
		function eiSearch() {				
		
			vm.hideLoadingHeader = false;
			vm.queryMode = false;
			
			// save off old request
			vm.oldRequest = vm.objectData;
	
			// call API to search; pass query params (vm.selected)
			ImageSearchAPI.search(vm.objectData, function(data) {
				
				vm.results = data;
				vm.hideLoadingHeader = true;
				vm.selectedIndex = 0;
				loadObject();

			}, function(err) { // server exception
				handleError("Error while searching");
			});
		}		

		// mapped to 'Reset Search' button
		function resetSearch() {		
			resetData();
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
			}
		}		


 	// Deselect current item from the searchResults.
 	// Create a deep copy of the current vm.objectData
 	// to separate it from the searchResults
 		function deselectObject() {
			var newObject = angular.copy(vm.objectData);

                        vm.objectData = newObject;

			// reset certain data
			resetDataDeselect();

			var input = document.getElementById ("figureLabelID");
			input.focus ();
		}
	
	// clear the results selection
		function clearResultsSelection() {
			vm.selectedIndex = -1;
		}

        // mapped to 'Create' button
		function createObject() {
			console.log("Submitting to object creation endpoint");
			
			var allowCommit = true;
			
			if (vm.isGxd){ // GXD pre-creation status checks
				if (vm.objectData.imageClassKey != "6481781") {
					alert("GXD can only create expression images.");
					allowCommit = false;
				}
			}
			if (vm.isMgd){ // MGD pre-creation status checks
				// for MGD, imageClass "Expression" is not allowed
				// all other instances are allowed (null, Phenotypes, Molecular
				if (vm.objectData.imageClassKey == "6481781") {
					alert("MGD can only create phenotype or molecular images.")
					allowCommit = false;
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

			if (allowCommit){
				// call API for creation
				ImageCreateAPI.create(vm.objectData, function(data) {
					// check for API returned error
					if (data.error != null) {
						alert("ERROR: " + data.error + " - " + data.message);
					}
					else {
						vm.objectData = data.items[0];
						postObjectLoad();
	
						// will execute search by jnum
						resetDataPostCreate();
						eiSearch();
						
						// update summary section
						//var result={
						//	markerKey:vm.objectData.markerKey, 
						//	symbol:vm.objectData.symbol};
						//vm.results[0] = result;
					
					}
				}, function(err) {
					handleError("Error creating image.");
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
			
			if (allowCommit){
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
						//alert(summaryDisplay);
						vm.results[vm.selectedIndex].imageDisplay = summaryDisplay;
						
					}
				}, function(err) {
					handleError("Error updating image.");
				});
			}

		}		
		
        // mapped to 'Delete' button
		function deleteObject() {
			console.log("Into deleteObject()");

			if ($window.confirm("Are you sure you want to delete this image stub?")) {
				
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
					}
				}, function(err) {
					handleError("Error deleting image.");
				});
			}
		}		
		
        // update pane label process status when changed 
		function paneLabelChanged(index) {		
			console.log("Into paneLabelChanged()");
			if (vm.objectData.imagePanes[index].processStatus != "c") {
				vm.objectData.imagePanes[index].processStatus = "u";
			}
		}
		
        // verifing jnum & citation
		function jnumOnBlur() {		
			console.log("Into jnumOnBlur()");

			// ensure we want to send the validation request
			var validate = true;
			if (vm.objectData.jnumid == ""){validate = false;}
			if (vm.objectData.jnumid.includes("%")){validate = false;}
			
			// create local JSON package for validation submission
			var jsonPackage = {"jnumid":"", "copyright":""}; 
			jsonPackage.jnumid    = vm.objectData.jnumid;
		    if (vm.objectData.copyrightNote != null) {
		    	jsonPackage.copyright = vm.objectData.copyrightNote.noteChunk;
		    }else {
		          jsonPackage.copyright = "";
		    }
			// validate against DB
			if (validate) {
				JnumValidationAPI.validate(jsonPackage, function(data) {
					if (data.length == 0) {
						alert("Ref jnum could not be validated: " + vm.newRefRow.jnumid);
					} else {
						console.log("jnum validated");
						vm.objectData.refsKey = data[0].refsKey;
						vm.objectData.jnumid = data[0].jnumid;
						if (data[0].short_citation != null) {
							vm.objectData.short_citation = data[0].short_citation;
						}
						if (data[0].copyright != null) {
							vm.objectData.copyrightNote.noteChunk = data[0].copyright;
						}
						vm.needsDXDOIid = data[0].needsDXDOIid;
						vm.displayCreativeCommonsWarning = data[0].isCreativeCommons;
					}
					vm.hideErrorContents = true;

				}, function(err) {
					handleError("Error validating ref J:#.");
				});
			}
		
		}		
		
		function addAlleleTag() {

			// inserted text
			var alleleText = " \\AlleleSymbol(|0) ";

			// gather caption field, and where mouse was at the time
			var captionField = document.getElementById('captionID');
			var captionTest = captionField.value; 
			var start = captionField.selectionStart
			var end = captionField.selectionEnd
			var before = captionTest.substring(0, start)
			var after  = captionTest.substring(end, captionTest.length)

			// add the text, and set focus
			captionField.value = (before + alleleText + after); 
			captionField.selectionStart = captionField.selectionEnd = start + alleleText.length
			captionField.focus();
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

		// will add a new pane label to end of list
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
		
		
				
		
		/////////////////////////////////////////////////////////////////////
		// SUMMARY NAVIGATION
		/////////////////////////////////////////////////////////////////////

		// move to previous object in summary
		function prevSummaryObject() {
			console.log("Previous summary object");

			// ensure we have data
			if(vm.results.length == 0) return;

			// ensure we're not at the first reference
			if(vm.selectedIndex == 0) return;

			// we're safe -- increment & load reference
			vm.selectedIndex--;
			loadObject();
			scrollToObject();
		}
		
		// move to next object in summary
		function nextSummaryObject() {
			console.log("Next summary object");

			// ensure we have data
			if(vm.results.length == 0) return;

			// ensure we're not past the end of the data
			if(vm.selectedIndex + 1 >= vm.results.length) return;

			// we're safe -- increment & load reference
			vm.selectedIndex++;
			loadObject();
			scrollToObject();
		}		

	    function firstSummaryObject() {
			console.log("First summary object");
	        if(vm.results.length == 0) return;
	        vm.selectedIndex = 0;
			loadObject();
			scrollToObject();
	      }

	    function lastSummaryObject() {
			console.log("Last summary object");
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
		}
		
		
		/////////////////////////////////////////////////////////////////////
		// Utility methods
		/////////////////////////////////////////////////////////////////////
		
		// reset image panes
		function resetImagePanes() {
			console.log("into resetImagePanes");

			vm.objectData.imagePanes = [];
			vm.objectData.imagePanes[0] = {"processStatus":"c", "paneLabel":""};			
			vm.objectData.imagePanes[1] = {"processStatus":"c", "paneLabel":""};			
			vm.objectData.imagePanes[2] = {"processStatus":"c", "paneLabel":""};			
			vm.objectData.imagePanes[3] = {"processStatus":"c", "paneLabel":""};			
			vm.objectData.imagePanes[4] = {"processStatus":"c", "paneLabel":""};			
			vm.objectData.imagePanes[5] = {"processStatus":"c", "paneLabel":""};			
			vm.objectData.imagePanes[6] = {"processStatus":"c", "paneLabel":""};			
			vm.objectData.imagePanes[7] = {"processStatus":"c", "paneLabel":""};			
			vm.objectData.imagePanes[8] = {"processStatus":"c", "paneLabel":""};			
			vm.objectData.imagePanes[9] = {"processStatus":"c", "paneLabel":""};			
			vm.objectData.imagePanes[10] = {"processStatus":"c", "paneLabel":""};			
			vm.objectData.imagePanes[11] = {"processStatus":"c", "paneLabel":""};			
			vm.objectData.imagePanes[12] = {"processStatus":"c", "paneLabel":""};			
			vm.objectData.imagePanes[13] = {"processStatus":"c", "paneLabel":""};			
			vm.objectData.imagePanes[14] = {"processStatus":"c", "paneLabel":""};			
			vm.objectData.imagePanes[15] = {"processStatus":"c", "paneLabel":""};			
			vm.objectData.imagePanes[16] = {"processStatus":"c", "paneLabel":""};			
			vm.objectData.imagePanes[17] = {"processStatus":"c", "paneLabel":""};			
			vm.objectData.imagePanes[18] = {"processStatus":"c", "paneLabel":""};			
			vm.objectData.imagePanes[19] = {"processStatus":"c", "paneLabel":""};			
			vm.objectData.imagePanes[20] = {"processStatus":"c", "paneLabel":""};			
			vm.objectData.imagePanes[21] = {"processStatus":"c", "paneLabel":""};			
			vm.objectData.imagePanes[22] = {"processStatus":"c", "paneLabel":""};			
			vm.objectData.imagePanes[23] = {"processStatus":"c", "paneLabel":""};			
			vm.objectData.imagePanes[24] = {"processStatus":"c", "paneLabel":""};			
			vm.objectData.imagePanes[25] = {"processStatus":"c", "paneLabel":""};			
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
			vm.resultCount = 0;

			// rebuild empty objectData submission object, else bindings fail
			vm.objectData = {};
			vm.objectData.imageKey = "";	
			vm.objectData.refsKey = "";	
			vm.objectData.jnumid = "";	
			vm.objectData.figureLabel = "";	
			vm.objectData.mgiAccessionIds = [];
			vm.objectData.mgiAccessionIds[0] = {"accID":""};			
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

			resetImagePanes()
			resetOther()
		}

		// resets page data deselect
		function resetDataDeselect() {
			console.log("into resetDataDeselect");

			// do not reset results
			// do not reset refsKey, jnumid, short_citation
			
			// copyright stuff
			vm.objectData.copyrightNote.noteKey = "";
			vm.objectData.copyrightNote.objectKey = "";

			vm.objectData.figureLabel = "";	
			vm.objectData.mgiAccessionIds = [];
			vm.objectData.mgiAccessionIds[0] = {"accID":""};			
			vm.objectData.thumbnailImage = {};
			vm.objectData.thumbnailImage.mgiAccessionIds = [];
			vm.objectData.thumbnailImage.mgiAccessionIds[0] = {"accID":""};			
			vm.objectData.captionNote = {};	
			vm.objectData.captionNote.noteChunk = "";	
			vm.objectData.privateCuratorialNote = {};	
			vm.objectData.privateCuratorialNote.noteChunk = "";	
			vm.objectData.externalLinkNote = {};	
			vm.objectData.externalLinkNote.noteChunk = "";	
			vm.objectData.xdim = "";	
			vm.objectData.ydim = "";	

			resetImagePanes()
		}

		// resets page data for post create/add by jnum
		function resetDataPostCreate() {
			console.log("into resetDataPostCreate");

			// do not reset the refsKey or jnumid

			vm.objectData.imageKey = "";	
			vm.objectData.imageTypeKey = "";	
			vm.objectData.figureLabel = "";	
			vm.objectData.mgiAccessionIds = [];
			vm.objectData.mgiAccessionIds[0] = {"accID":""};			
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
			vm.objectData.createdByKey = "";
			vm.objectData.createdBy = "";
			vm.objectData.modifiedByKey = "";
			vm.objectData.modifiedBy = "";
			vm.objectData.creation_date = "";
			vm.objectData.modification_date = "";

			resetImagePanes()
		}

		// load a selected object from summary 
		function loadObject() {

			console.log("into loadObject");

			// derive the key of the selected result summary object
			vm.summaryObjectKey = vm.results[vm.selectedIndex].imageKey;
			
			// call API to gather object for given key
			ImageGatherByKeyAPI.get({ key: vm.summaryObjectKey }, function(data) {
				vm.objectData = data;
				postObjectLoad();
			}, function(err) {
				handleError("Error retrieving data object.");
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
		
	
		// error handling
		function handleError(msg) {
			vm.errorMsg = msg;
			vm.hideErrorContents = false;
			vm.hideLoadingHeader = true;
		}

		// returns value of 's' with any non-printing characters removed
		function stripNonPrintingCharacters(s) {
			// Printable characters range from a space up to the tilde, so keep anything between them plus
			// standard whitespace characters like newline and tab.
			return s.replace(/[^\x00-\x7F]/g, "");
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

		// Nav Buttons
		$scope.prevSummaryObject = prevSummaryObject;
		$scope.nextSummaryObject = nextSummaryObject;
		$scope.firstSummaryObject = firstSummaryObject;
		$scope.lastSummaryObject = lastSummaryObject;

		// other functions: buttons, onBlurs and onChanges
		$scope.setObject = setObject;
		$scope.addAlleleTag = addAlleleTag;
		$scope.addPaneLabel = addPaneLabel;
		$scope.jnumOnBlur = jnumOnBlur;
		$scope.paneLabelChanged = paneLabelChanged;	
		$scope.deletePaneLabelRow = deletePaneLabelRow;
		
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

















