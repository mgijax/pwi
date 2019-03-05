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

// update either so.typeChoices or so.effectChoices with the given list of 'terms'.  Boolean
// 'containsEffects' tells us whether the 'terms' are for variant effects (true) or types (false).
so.cacheTerms = function(terms, containsEffects) {
	console.log('in so.cacheTerms');
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
	}
};

