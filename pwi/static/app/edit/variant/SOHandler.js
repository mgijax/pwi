/* Name: SOHandler.js
 * Purpose: provides functions for dealing with SO terms for variant type and variant effects.
 * 	This includes translating from lists of terms from the API to internal PWI caches, from 
 *  variant data display to selectable popup entries, from popup entries back to the variant
 *  data display, and from variant data display to API updates.
 */

/* For internal caches, we need a limited set of data from the API.  These include all the data needed
 * when submitting annotations to the API:
 * {
 * 	annotTypeKey : "1026" (variant types) or "1027" (variant effects),
 * 	termKey : string key,
 * 	term : string term,
 *  alleleVariantSOIds : {
 *  	accessionKey : string key,
 *  	logicaldbKey : string logical db key,
 *  	objectKey : string term key,
 *  	mgiTypeKey : "13",
 *  	accID : string SO ID,
 *  	prefixPart : string prefix of ID,
 *  	numericPart : string numeric part of ID
 *  } 
 * }
 * Additional fields are added as needed:  processStatus and annotKey.
 */

// establish a namespace for this module to help avoid function name collisions
var so = {};

so.typeChoices = [];	// list of SO term data valid for variant types
so.effectChoices = [];	// list of SO term data valid for variant effects
so.termCache = {};		// maps from SO ID to its term data

so.log = function(s) {
// disabled until we need to trace execution:
//	console.log(s);
}

// update either so.typeChoices or so.effectChoices with the given list of 'terms'.  Boolean
// 'containsEffects' tells us whether the 'terms' are for variant effects (true) or types (false).
so.cacheTerms = function(terms, containsEffects) {
	so.log('in so.cacheTerms');
	var annotTypeKey = "1026";	// assume variant type annotations

	if (containsEffects) {
		so.effectChoices = [];
		annotTypeKey = "1027";	// variant effect annotations
	} else {
		so.typeChoices = [];
	}
	
	for (var i = 0; i < terms.length; i++) {
		var term = {
			annotTypeKey : annotTypeKey,
			termKey : terms[i].termKey,
			term : terms[i].term,
			alleleVariantSOIds : [
				{
					accessionKey : terms[i].accessionIds[0].accessionKey,
					logicaldbKey : terms[i].accessionIds[0].logicaldbKey,
					objectKey : terms[i].accessionIds[0].objectKey,
					mgiTypeKey : terms[i].accessionIds[0].mgiTypeKey,
					accID : terms[i].accessionIds[0].accID,
					prefixPart : terms[i].accessionIds[0].prefixPart,
					numericPart : terms[i].accessionIds[0].numericPart
				}
			]
		};
		if (containsEffects) {
			so.effectChoices.push(term); 
		} else {
			so.typeChoices.push(term); 
		}
		so.termCache[terms[i].accessionIds[0].accID] = term;
	}
};

// examine the given 'text' string (from the Types or Effects textboxes), find the SO IDs included,
// and return them as a list of strings
so.getSelectedIDs = function(text) {
	so.log('getSelectedIDs(' + text + ')');

	if ((text == undefined) || (text == null)) {
		return [];
	}

	// list of potential SO IDs (strip parenthesized terms, normalize spaces, split on spaces)
	var potential = text.replace(/\([^\)]*\)/g, '').replace(/\s+/g, ' ').trim().toUpperCase().split(' ');
	var soIDs = [];

	for (var i = 0; i < potential.length; i++) {
		if (potential[i].match(/^SO:[0-9]+$/) != null) {
			soIDs.push(potential[i]);
		}
	}
	return soIDs;
};

so.showSoPopup = function(terms, name, currentValues, closeFn) {
	so.log('showSoPopup(' + terms.length + ' terms, ' + name + ', ' + currentValues.length + ' values');

	// if the popup is already open for the other field, close it without saving changes
	if ($('#soPopup').is(':visible')) {
		so.closeWithoutSaving();
	}
	
	if (terms.length > 0) {
		var selectedIDs = so.getSelectedIDs(currentValues);
		var table = [
			'<table class="table table-bordered scrollable-menu" id="soTable" style="">',
			'<tbody>',
			'<tr>',
				'<th id="column1"></th>',
				'<th>Term</th>',
				'<th>ID</th>',
			'</tr>'
			];
	
		var classes = [ '', ' class="oddResultRow"'];
	
		for (var i = 0; i < terms.length; i++) {
			var myID = terms[i].alleleVariantSOIds[0].accID;
			var checked = '';
			if (selectedIDs.indexOf(myID) >= 0) {
				checked = ' CHECKED';
			}
			table.push('<tr' + classes[i % 2] + '>');
			table.push('<td class="cm" style="vertical-align: middle">');
			table.push('<input type="checkbox" name="soIDs" value="'
				+ myID + '"' + checked + ' term="' + terms[i].term + '" style="margin: 0px"/>');
			table.push('</td>');
			table.push('<td>' + terms[i].term + '</td>');
			table.push('<td>' + terms[i].alleleVariantSOIds[0].accID + '</td>');
			table.push('</tr>');
		}
		$('#soTableWrapper').html(table.join('\n'));
	} else {
		$('#soTableWrapper').html("SO Terms are still being cached.  Please close this popup and try again in a few seconds.");
	}

	$('#soPopup').dialog( { close: so.hidePopup } );
	$('[aria-describedby="soPopup"] .ui-dialog-title').html('Variant ' + name);
	$('#soPopupType').html(name.toLowerCase());
	$('[aria-describedby="soPopup"]').css({border : "2px solid black", width: "700px" });
	$('.ui-dialog-titlebar-close')[0].innerHTML = 'X';
	$('.ui-dialog-titlebar-close').css({ 'line-height' : '0.5em' });
	$('.ui-dialog-titlebar-close')[0].title = "Discard Changes and Close";
	$('#soSave').on('click', null).off('click');	// remove previous handler
	$('#soSave').on('click', closeFn);				// add new handler
}

so.composeString = function() {
	so.log('composeString()');
	
	var s = '';
	var checked = $('[name=soIDs]:checked');
	
	for (var i = 0; i < checked.length; i++) {
		if (s != '') { s = s + '\n'; }
		s = s + checked[i].value + ' (' + $(checked[i]).attr('term') + ')';
	}
	return s;
}

so.applyCheckboxes = function(newString, dataType) {
	so.log('applyCheckboxes(' + newString + ',' + dataType + ')');
	
    // Compose the Javascript command to be executed, execute it, and tell Angular to look for an object model update.
    if (dataType == 'types') {
    	angular.element(document.getElementById('wrapper')).scope().vm.variant.soTypes = newString;
    } else {
    	angular.element(document.getElementById('wrapper')).scope().vm.variant.soEffects = newString;
    }
    angular.element(document.getElementById('wrapper')).scope().$apply();
}

so.hidePopup = function() {
	so.log('hidePopup()');
}

// close either SO popup without saving changes (so save them first if needed)
so.closeWithoutSaving = function() {
	so.log('closeWithoutSaving()');
	$('.ui-dialog-titlebar-close').click();
}

so.closeTypePopup = function() {
	so.log('closeTypePopup()');
	so.applyCheckboxes(so.composeString(), 'types');
	so.closeWithoutSaving();
}

so.closeEffectPopup = function() {
	so.log('closeEffectPopup()');
	so.applyCheckboxes(so.composeString(), 'effects');
	so.closeWithoutSaving();
}

so.showTypePopup = function() {
	so.log('showTypePopup()');
	so.showSoPopup(so.typeChoices, "Types", getAngularScope().vm.variant.soTypes, so.closeTypePopup);
}

so.showEffectPopup = function() {
	so.log('showEffectPopup()');
	so.showSoPopup(so.effectChoices, "Effects", getAngularScope().vm.variant.soEffects, so.closeEffectPopup);
}

// get a new annotation record for the given soID
so.getNewAnnotation = function(soID) {
	so.log('getNewAnnotation(' + soID + ')');
	var soList = null;
	if (soID in so.termCache) {
		// duplicate the cached data element for this annotation, then add a couple more fields
		var item = JSON.parse(JSON.stringify(so.termCache[soID]));
		item.processStatus = "c";
		item.annotKey = null;
		return item;
	}
	return null;
}