/* Name: VariantTranslator.js
 * Purpose: provides functions for bidirectional translation between variant JSON objects coming
 * 	from the API, and a more convenient format for use by the PWI's variant page.
 */

/* One variant's data, as needed for the PWI:
 * {
 * 	variantKey : string key,
 * 	createdBy : string username,
 * 	modifiedBy : string username,
 * 	creationDate : string date,
 * 	modificationDate : string date,
 * 	isReviewed : boolean (true/false),
 * 	description : string (HGVS text),
 * 	references : string (containing space-delimited J#),
 * 	publicNotes : string,
 * 	curatorNotes : string,
 * 	soTypes : string,
 * 	soEffects : string,
 * 	allele : {
 * 		alleleKey : string key,
 * 		symbol : string symbol,
 * 		chromosome : string,
 * 		strand : string,
 * 		references : string (containing space delimited-J#),
 * 		accID : string
 * 		},
 * 	sourceGenomic : sequence (see below),
 * 	curatedGenomic : sequence,
 * 	sourceTranscript : sequence,
 * 	curatedTranscript : sequence,
 * 	sourcePolypeptide : sequence,
 * 	curatedPolypeptide : sequence
 * }
 * 
 * Each of the six sequence fields above has the same structure:
 * {
 * 	variantSequenceKey : string,
 * 	genomeBuild : string,
 * 	startCoordinate : string,
 * 	endCoordinate : string,
 * 	referenceSequence : string,
 * 	variantSequence : string,
 * 	accID : string,
 *  sequenceType : string,
 *  sequenceTypeKey : string,
 *  apiSeq : {}					// the API sequence from which this one was built
 * }
 */

// establish a namespace for this module to help avoid function name collisions
var vt = {};

// compute (once) and cache the string version of an empty map, so we can use it repeatedly for comparisons
vt.emptyMap = JSON.stringify({});

// compute (once) and cache the string version of null, so we can use it repeatedly for comparisons
vt.nullString = JSON.stringify(null);

// return an empty PWI-format variant
vt.getEmptyPwiVariant = function() {
	pwiVariant = {
		variantKey : null,
		createdBy : null,
		modifiedBy : null,
		creationDate : null,
		modificationDate : null,
		isReviewed : false,
		description : null,
		references : null,
		curatorNotes : null,
		publicNotes : null,
		soTypes : null,
		soEffects : null,
		curatedGenomic : {
			sequenceType : "DNA",
			sequenceTypeKey : vt.typeKey("DNA"),
                        startCoordinate : null,
                        referenceSequence : null,
                        variantSequence : null
		},
		curatedTranscript : {
			sequenceType : "RNA",
			sequenceTypeKey : vt.typeKey("RNA")
		},
		curatedPolypeptide : {
			sequenceType : "Polypeptide",
			sequenceTypeKey : vt.typeKey("Polypeptide")
		},
		sourceGenomic : {
			sequenceType : "DNA",
			sequenceTypeKey : vt.typeKey("DNA")
		},
		sourceTranscript : {
			sequenceType : "RNA",
			sequenceTypeKey : vt.typeKey("RNA")
		},
		sourcePolypeptide : {
			sequenceType : "Polypeptide",
			sequenceTypeKey : vt.typeKey("Polypeptide")
		},
		allele : {
			alleleKey : null,
			symbol : null,
			alleleStatus : null,
			alleleStatusKey : null,
			chromosome : null,
			strand : null,
			references : null,
			accID : null
		}
	};
	return pwiVariant;
}
// convert an API-format variant to a PWI-format variant
vt.apiToPwiVariant = function(apiVariant) {
	pwiVariant = vt.getEmptyPwiVariant();
	
	// directly copied fields
	pwiVariant.variantKey = apiVariant.variantKey;
	pwiVariant.createdBy = apiVariant.createdBy;
	pwiVariant.modifiedBy = apiVariant.modifiedBy;
	pwiVariant.creationDate = apiVariant.creation_date;
	pwiVariant.modificationDate = apiVariant.modification_date;
	pwiVariant.isReviewed = (apiVariant.isReviewed == '1');
	pwiVariant.description = apiVariant.description;
	
	// consolidate references for the allele
	pwiVariant.references = vt.collectRefIDs(apiVariant.refAssocs);

	// notes, if not null
	if ((apiVariant.curatorNote != undefined) && (apiVariant.curatorNote != null)) {
		pwiVariant.curatorNotes = apiVariant.curatorNote.noteChunk;
	}
	if ((apiVariant.publicNote != undefined) && (apiVariant.publicNote != null)) {
		pwiVariant.publicNotes = apiVariant.publicNote.noteChunk;
	}
	
	// consolidate associated SO terms
	pwiVariant.soTypes = vt.getTerms(apiVariant.variantTypes);
	pwiVariant.soEffects = vt.getTerms(apiVariant.variantEffects);
	
	// pull out curated sequence data
	pwiVariant.curatedGenomic = vt.getSequence(apiVariant.variantSequences, "DNA");
	pwiVariant.curatedTranscript = vt.getSequence(apiVariant.variantSequences, "RNA");
	pwiVariant.curatedPolypeptide = vt.getSequence(apiVariant.variantSequences, "Polypeptide");
	
	// pull out source sequence data
	if ((apiVariant.sourceVariant != null) && (apiVariant.sourceVariant != undefined)) {
		if (apiVariant.sourceVariant.variantSequences != null) {
			pwiVariant.sourceGenomic = vt.getSequence(apiVariant.sourceVariant.variantSequences, "DNA");
			pwiVariant.sourceTranscript = vt.getSequence(apiVariant.sourceVariant.variantSequences, "RNA");
			pwiVariant.sourcePolypeptide = vt.getSequence(apiVariant.sourceVariant.variantSequences, "Polypeptide");
		}
	}

	// pull out allele data, if any
	if ((apiVariant.allele != undefined) && (apiVariant.allele != null)) {
		pwiVariant.allele.alleleKey = apiVariant.allele.alleleKey;
		pwiVariant.allele.symbol = apiVariant.allele.symbol;
		pwiVariant.allele.alleleStatus = apiVariant.allele.alleleStatus;
		pwiVariant.allele.alleleStatusKey = apiVariant.allele.alleleStatusKey;
		pwiVariant.allele.chromosome = apiVariant.allele.chromosome;
		pwiVariant.allele.strand = apiVariant.allele.strand;
		pwiVariant.allele.references = vt.collectRefIDs(apiVariant.allele.refAssocs);
		pwiVariant.allele.accID = apiVariant.allele.accID;

		//pwiVariant.allele.symbolWithStatus = apiVariant.allele.symbol + " [" + apiVariant.allele.alleleStatus + "]";

	}
	
	// If we have source sequence data, we need to grab it.
	return pwiVariant;
}

// apply data from the PWI-format variant onto the API-format variant.  refsKeyCache maps from
// J# to reference keys.
vt.applyPwiVariantToApi = function(pwiVariant, apiVariant, refsKeyCache, seqIDs) {
	// No change possible to variant key, created-by or modified-by dates, so skip them.
	// Also cannot change allele data on this form, so skip them.
	// Note: seqIDs is { seqID : { logicaldbKey : x, logicaldb : y } }
	
	apiVariant.isReviewed = '0';
	if (pwiVariant.isReviewed) {
		apiVariant.isReviewed = '1';
	}
	apiVariant.description = pwiVariant.description;
	
	// handle allele changes
	apiVariant = vt.applyAlleleChanges(pwiVariant, apiVariant);
	
	// create/delete reference associations
	apiVariant = vt.applyReferenceChanges(pwiVariant, apiVariant, refsKeyCache);

	// notes
	apiVariant = vt.applyNoteChanges(pwiVariant, apiVariant);
	
	// sequences
	apiVariant = vt.applySequenceChanges(pwiVariant, apiVariant, seqIDs);
	
	// SO types and effects
	apiVariant = vt.applySOChanges(pwiVariant, apiVariant);
	
	return apiVariant;
}

// ensure that the allele fields in 'pwiVariant' get copied to the 'apiVariant'
vt.applyAlleleChanges = function(pwiVariant, apiVariant) {
	if (!('allele' in apiVariant)) {
		apiVariant.allele = {};
	}
	apiVariant.allele.accID = pwiVariant.allele.accID;
	apiVariant.allele.symbol = pwiVariant.allele.symbol;
	apiVariant.allele.alleleKey = pwiVariant.allele.alleleKey;
	apiVariant.allele.alleleStatus = pwiVariant.allele.alleleStatus;
	apiVariant.allele.alleleStatusKey = pwiVariant.allele.alleleStatusKey;
	apiVariant.allele.chromosome = pwiVariant.allele.chromosome;
	apiVariant.allele.strand = pwiVariant.allele.strand;
	
	apiVariant.strain = {
		strainKey : 38048,
		strain : "C57BL/6J"
	};

	if (!('sourceVariant' in apiVariant)) {
		apiVariant.sourceVariant = {};
	}
	apiVariant.sourceVariant.allele = apiVariant.allele;
	apiVariant.sourceVariant.strain = apiVariant.strain;
	apiVariant.sourceVariant.isReviewed = "0";

	return apiVariant;
}

// iterate through a list of J# associations and return a space-separated string of J#
vt.collectRefIDs = function(refIDs) {
	var jnumIDs = "";
	if ((refIDs != null) && (refIDs != undefined)) {
		var vSeen = {};
		for (var i = 0; i < refIDs.length; i++) {
			var jnum = refIDs[i].jnumid;
			if (!(jnum in vSeen)) {
				if (jnumIDs != "") {
					jnumIDs = jnumIDs + " ";
				}
				jnumIDs = jnumIDs + jnum;
				vSeen[jnum] = 1;
			}
		}
	}
	return jnumIDs;
}

// iterate through the SO annotations given and return a string containing
// "ID (term)" for each annotation on a separate line
vt.getTerms = function(annotations) {
	var s = "";
	if (annotations != null) {
		for (var i = 0; i < annotations.length; i++) {
			if (s != "") { s = s + "\n"; }
			s = s + annotations[i].alleleVariantSOIds[0].accID + " (" + annotations[i].term + ")";
		}
	}
	return s;
}
		
// iterate through seqList and look for a sequence with the given seqType,
// returning the first one found (if any) or {} (if none of that type)
vt.getSequence = function(seqList, seqType) {
	var seq = {
		variantSequenceKey : null,
		genomeBuild : null,
		startCoordinate : null,
		endCoordinate : null,
		referenceSequence : null,
		variantSequence : null,
		accID : null,
		sequenceType : seqType,		// type of sequence, cached in the object
		sequenceTypeKey : vt.typeKey(seqType),
		apiSeq : null				// reference to API-style sequence for this
	}
	
	var rawSeq = vt.getSequenceRaw(seqList, seqType);
	if (rawSeq != null) {
		seq.variantSequenceKey = rawSeq.variantSequenceKey;
		seq.genomeBuild = rawSeq.version;
		seq.startCoordinate = rawSeq.startCoordinate;
		seq.endCoordinate = rawSeq.endCoordinate;
		seq.referenceSequence = rawSeq.referenceSequence;
		seq.variantSequence = rawSeq.variantSequence;
		seq.accID = vt.getSeqID(rawSeq);
		seq.apiSeq = rawSeq;
	}
	return seq;
}
		
// iterate through seqList and look for a sequence of the given seqType,
// returning that sequence as-is (API format) or null if none is found
vt.getSequenceRaw = function(seqList, seqType) {
	if ((seqList != undefined) && (seqList != null)) {
		for (var i = 0; i < seqList.length; i++) {
			if (seqList[i]['sequenceTypeTerm'] == seqType) {
				return seqList[i];
			}
		}
	}
	return null;
}

// get the first ID for the given sequence object
vt.getSeqID = function(seq) {
	if ((seq != null) && (seq.accessionIds != null) && (seq.accessionIds.length > 0)) {
		return seq.accessionIds[0].accID;
	}
	return '';
}

// ensure that the sequences in the apiVariant reflect the sequence data from the pwiVariant, which
// may have been edited via the UI.
vt.applySequenceChanges = function(pwiVariant, apiVariant, seqIDs) {
	vt.processSequence(pwiVariant.sourceGenomic, apiVariant, true, seqIDs);
	vt.processSequence(pwiVariant.sourceTranscript, apiVariant, true, seqIDs);
	vt.processSequence(pwiVariant.sourcePolypeptide, apiVariant, true, seqIDs);
	vt.processSequence(pwiVariant.curatedGenomic, apiVariant, false, seqIDs);
	vt.processSequence(pwiVariant.curatedTranscript, apiVariant, false, seqIDs);
	vt.processSequence(pwiVariant.curatedPolypeptide, apiVariant, false, seqIDs);
	
	return apiVariant;
}

// returns true if the data fields of 'pwiSeq' are all empty, false if some are filled in
vt.isEmptySeq = function(pwiSeq) {
	if ((pwiSeq.genomeBuild != null) && (pwiSeq.genomeBuild.trim() != '')) {
		return false;
	}
	if ((pwiSeq.startCoordinate != null) && (pwiSeq.startCoordinate.trim() != '')) {
		return false;
	}
	if ((pwiSeq.endCoordinate != null) && (pwiSeq.endCoordinate.trim() != '')) {
		return false;
	}
	if ((pwiSeq.referenceSequence != null) && (pwiSeq.referenceSequence.trim() != '')) {
		return false;
	}
	if ((pwiSeq.variantSequence != null) && (pwiSeq.variantSequence.trim() != '')) {
		return false;
	}
	if ((pwiSeq.accID != null) && (pwiSeq.accID.trim() != '')) {
		return false;
	}
	return true;
}

// return a minimalistic string for 's' (empty string if null, trimmed string if non-null)
vt.minString = function(s) {
	if ((s == null) || (s == undefined)) {
		return '';
	}
	return s.trim();
}

// returns true if any of the pwiSeq data fields have changed from the corresponding API sequence fields,
// or false if they are all the same
vt.hasChanged = function(pwiSeq) {
	var pgb = vt.minString(pwiSeq.genomeBuild);
	var psc = vt.minString(pwiSeq.startCoordinate);
	var pec = vt.minString(pwiSeq.endCoordinate);
	var prs = vt.minString(pwiSeq.referenceSequence);
	var pvs = vt.minString(pwiSeq.variantSequence);
	var pid = vt.minString(pwiSeq.accID);
	
	// If the corresponding API sequence is null and any of the pwiSeq fields are non-empty, we have a change.
	// If it's null and all of the pwiSeq fields are empty, we have no change.
	if (pwiSeq.apiSeq == null) {
		return (pgb != '') || (psc != '') || (pec != '') || (prs != '') || (pvs != '') || (pid != '');
	}
	
	var apiSeqPid;
	if (pwiSeq.apiSeq.accessionIds != null && pwiSeq.apiSeq.accessionIds.length > 0) {
		apiSeqPid = vt.minString(pwiSeq.apiSeq.accessionIds[0].accID);
	}
	else {
		apiSeqPid = '';
	}

	// Now we can assume that the API sequence is non-null, so we can do field comparisons.
	return (pgb != vt.minString(pwiSeq.apiSeq.version))
		|| (psc != vt.minString(pwiSeq.apiSeq.startCoordinate))
		|| (pec != vt.minString(pwiSeq.apiSeq.endCoordinate))
		|| (prs != vt.minString(pwiSeq.apiSeq.referenceSequence))
		|| (pvs != vt.minString(pwiSeq.apiSeq.variantSequence)
		|| (pid != apiSeqPid));
}


// get the key (as a string) corresponding to the given sequence type
vt.typeKey = function (seqType) {
	if ((seqType == 'DNA') || (seqType == 'Genomic')) { return '316347'; }
	if ((seqType == 'RNA') || (seqType == 'Transcript')) { return '316346'; }
	if ((seqType == 'Polypeptide') || (seqType == 'Protein')) { return '316348'; }
	return '316349';
}

// build an API-formatted sequence ID map for the given parameters
vt.getSeqIDList = function(pwiSeq, statusCode, seqIDs) {
	if (vt.minString(pwiSeq.accID) == '') {
		return null;
	}
	var vsKey = null;		// for the case where we're adding a seq and an ID at the same time
	if (pwiSeq.apiSeq != null) {
		vsKey = pwiSeq.apiSeq.variantSequenceKey;
	}
	var accID = {
		processStatus : statusCode,
		accessionKey : null,
		logicaldbKey : seqIDs[pwiSeq.accID].logicaldbKey,
		objectKey : vsKey,
		mgiTypeKey : 46,		// variant sequence
		accID : pwiSeq.accID,
		prefixPart : null,
		numericPart : null
		};
	return [ accID ];
}

// ensure that any changes to pwiSeq made by the user are updated for the corresponding API-style
// sequence object in apiVariant.  isSource (true/false) indicates whether the sequence is a 
// sequence for the variant itself or for its source variant.
vt.processSequence = function(pwiSeq, apiVariant, isSource, seqIDs) {
	// If no changes, short-circuit this function.
	if (!vt.hasChanged(pwiSeq)) { return apiVariant; }
	
	// If we get here, we know there are changes, so we need to process them:
	// 1. If API seq is null and PWI seq is populated, create & add API version.
	// 2. If API seq is non-null and PWI seq is empty, flag API version for deletion.
	// 3. If both are non-null, apply PWI version to API version and flag for update.
	
	if (pwiSeq.apiSeq == null) {
		var seq = {
			processStatus : "c",
			variantSequenceKey : null,
			variantKey : apiVariant.variantKey,
			version : pwiSeq.genomeBuild,
			startCoordinate : pwiSeq.startCoordinate,
			endCoordinate : pwiSeq.endCoordinate,
			referenceSequence : pwiSeq.referenceSequence,
			variantSequence : pwiSeq.variantSequence,
			accessionIds : vt.getSeqIDList(pwiSeq, "c", seqIDs),
			sequenceTypeTerm : pwiSeq.sequenceType,
			sequenceTypeKey : vt.typeKey(pwiSeq.sequenceType)
		};
		
		if (isSource) {
			seq.variantKey = apiVariant.sourceVariant.variantKey;
			if (apiVariant.sourceVariant.variantSequences == null) {
				apiVariant.sourceVariant.variantSequences = [ seq ];
			} else {
				// prevent creation of duplicates in case of error & re-click of Create button
				var seqStr = JSON.stringify(seq);
				var found = false;
				for (var i = 0; i < apiVariant.sourceVariant.variantSequences.length; i++) {
					found = found || (seqStr == JSON.stringify(apiVariant.sourceVariant.variantSequences));
				}
				if (!found) {
					apiVariant.sourceVariant.variantSequences.push(seq); 
				}
			}
		} else if (apiVariant.variantSequences == null) {
			apiVariant.variantSequences = [ seq ];
		} else {
			// prevent creation of duplicates in case of error & re-click of Create button
			var seqStr = JSON.stringify(seq);
			var found = false;
			for (var i = 0; i < apiVariant.variantSequences.length; i++) {
				found = found || (seqStr == JSON.stringify(apiVariant.variantSequences));
			}
			if (!found) {
				apiVariant.variantSequences.push(seq); 
			}
		}
		
	} else if (vt.isEmptySeq(pwiSeq)) {
		// 2. API seq is non-null and PWI seq is empty, so flag API version for deletion.
		pwiSeq.apiSeq.processStatus = "d";
		
	} else if (vt.hasChanged(pwiSeq)) {
		// 3. Both versions are non-null, apply PWI version to API version and flag for update.
		pwiSeq.apiSeq.processStatus = "u";
		pwiSeq.apiSeq.version = pwiSeq.genomeBuild;
		pwiSeq.apiSeq.startCoordinate = pwiSeq.startCoordinate;
		pwiSeq.apiSeq.endCoordinate = pwiSeq.endCoordinate;
		pwiSeq.apiSeq.referenceSequence = pwiSeq.referenceSequence;
		pwiSeq.apiSeq.variantSequence = pwiSeq.variantSequence;
		
		// if no ID previously then add one
		if (pwiSeq.apiSeq.accessionIds == null) {
			pwiSeq.apiSeq.accessionIds = vt.getSeqIDList(pwiSeq, "c", seqIDs);
			
		// if there was a previous ID, but we have a new one then delete the old and add the new
		} else if (pwiSeq.accID != vt.getSeqID(pwiSeq.apiSeq)) {
			pwiSeq.apiSeq.accessionIds[0].processStatus = "d";
			var newIDs = vt.getSeqIDList(pwiSeq, "c", seqIDs);
			if (newIDs != null) {
				pwiSeq.apiSeq.accessionIds = pwiSeq.apiSeq.accessionIds.concat(newIDs);
			}
		}
	}
	return apiVariant;
}

// ensure that the references in the apiVariant reflect the reference data from the pwiVariant, which
// may have been edited via the UI.  refsKeyCache maps from J# to reference keys.
vt.applyReferenceChanges = function(pwiVariant, apiVariant, refsKeyCache) {
	// build map of J# from the API's data
	var inData = {};
	var jnumInData = vt.collectRefIDs(apiVariant.refAssocs);
	jnumInData = jnumInData.replace(/,/g, ' ').replace(/[ \t\n]+/g, ' ').toUpperCase().split(' ');
	for (var i = 0; i < jnumInData.length; i++) {
		inData[jnumInData[i]] = 1;
	}
			
	// flag for removal any references that do not appear in pwiVariant data
	
	if (apiVariant.refAssocs != null) {
		for (var i = 0; i < apiVariant.refAssocs.length; i++) {
			var assoc = apiVariant.refAssocs[i];
			if (!(assoc.jnumid in refsKeyCache)) {
				assoc.processStatus = 'd';			// delete this one
			}
		}
	}
			
	// flag for creation any references in pwiVariant that are not in apiVariant
			
	if ((pwiVariant.references != null) && (pwiVariant.references != undefined) && (pwiVariant.references.trim() != '')) {
		var jnumInForm = pwiVariant.references.replace(/,/g, ' ').replace(/[ \t\n]+/g, ' ').toUpperCase().split(' ');
		for (var i = 0; i < jnumInForm.length; i++) {
			var jnum = jnumInForm[i];
			if (!(jnum in inData)) {
				var refsKey = refsKeyCache[jnum];
				if (refsKey != null) {
					var newRef = {
						processStatus : 'c',			// create an association with this reference
						jnumid : jnum,
						refAssocTypeKey : 1030,			// General reference for variants
						refAssocType : 'General',
						mgiTypeKey : 45,				// variants
						refsKey : refsKey
					}
					if (apiVariant.refAssocs == null) {
						apiVariant.refAssocs = [];
					}
					apiVariant.refAssocs.push(newRef);
				}
			}
		}
	}
	return apiVariant;
}
		
// apply any public and/or curator note changes from pwiVariant into the apiVariant
vt.applyNoteChanges = function(pwiVariant, apiVariant) {
	var curatorOp = "x";
	var publicOp = "x";

	// need to create a new note, if there wasn't one previously
	if (apiVariant.curatorNote == null) {
		if (vt.minString(pwiVariant.curatorNotes) != '') {
			apiVariant.curatorNote = {
				noteKey : null,
				objectKey : pwiVariant.variantKey,
				mgiTypeKey : 45,
				mgiType : "Allele Variant",
				noteTypeKey : 1050,
				noteType : "Curator",
				noteChunk : pwiVariant.curatorNotes 
			}; 
		}
	} else if (JSON.stringify(apiVariant.curatorNote.noteChunk) != JSON.stringify(pwiVariant.curatorNotes)) {
		// or just update the existing note if there was a change
		apiVariant.curatorNote.noteChunk = pwiVariant.curatorNotes;
	}

	// need to create a new note, if there wasn't one previously
	if (apiVariant.publicNote == null) {
		if (vt.minString(pwiVariant.publicNotes) != '') {
			apiVariant.publicNote = {
				noteKey : null,
				objectKey : pwiVariant.variantKey,
				mgiTypeKey : 45,
				mgiType : "Allele Variant",
				noteTypeKey : 1051,
				noteType : "Public",
				noteChunk : pwiVariant.publicNotes 
			}; 
		}
	} else if (JSON.stringify(apiVariant.publicNote.noteChunk) != JSON.stringify(pwiVariant.publicNotes)) {
		// or just update the existing note if there was a change
		apiVariant.publicNote.noteChunk = pwiVariant.publicNotes;
	}

	return apiVariant;
}

// Update the list of PWI-format SO annotations to the API-format list of SO annotations, so the API can
// bring the database up to date.
vt.applySODiff = function(pwiFieldValue, apiList) {
	var pwiIDs = so.getSelectedIDs(pwiFieldValue);	// list of SO IDs entered in the PWI's field
	var apiCache = {};								// SO ID : true for IDs in apiList that are also in pwiFieldValue
	
	if ((apiList != undefined) && (apiList != null) && (apiList.length > 0)) {
		for (var i = 0; i < apiList.length; i++) {
			// If this ID does not appear in the list of pwiIDs, flag the record for deletion.
			// Otherwise, we know it appears, so we can just leave the record as-is.
			var soID = apiList[i].alleleVariantSOIds[0].accID;
			if (pwiIDs.indexOf(soID) < 0) {
				apiList[i].processStatus = "d";
			}
			apiCache[soID] = true;
		}
	}
	
	// add records for any IDs that appear in pwiIDs and are not already in the apiCache
	for (var j = 0; j < pwiIDs.length; j++) {
		var soID = pwiIDs[j];
		if (!(soID in apiCache)) {
			apiList.push(so.getNewAnnotation(soID));
		}
	}
	return apiList;
}

// Apply any changes in the SO fields (variant types and effects) from the 'pwiVariant' to the 'apiVariant'.
vt.applySOChanges = function(pwiVariant, apiVariant) {
	if ((apiVariant.variantTypes == undefined) || (apiVariant.variantTypes == null)) {
		apiVariant.variantTypes = [];
	}
	if ((apiVariant.variantEffects == undefined) || (apiVariant.variantEffects == null)) {
		apiVariant.variantEffects = [];
	}
	vt.applySODiff(pwiVariant.soTypes, apiVariant.variantTypes);
	vt.applySODiff(pwiVariant.soEffects, apiVariant.variantEffects);
	return apiVariant;
}
