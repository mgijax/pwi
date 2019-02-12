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
 * 	isReviewed : string (0/1),
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
 * 	accID : string
 * }
 */

// establish a namespace for this module to help avoid function name collisions
var vt = {};

// compute (once) and cache the string version of an empty map, so we can use it repeatedly for comparisons
vt.emptyMap = JSON.stringify({});

// return an empty PWI-format variant
vt.getEmptyPwiVariant = function() {
	pwiVariant = {
		variantKey : null,
		createdBy : null,
		modifiedBy : null,
		creationDate : null,
		modificationDate : null,
		isReviewed : null,
		description : null,
		references : null,
		curatorNotes : null,
		publicNotes : null,
		soTypes : null,
		soEffects : null,
		curatedGenomic : {},
		curatedTranscript : {},
		curatedPolypeptide : {},
		sourceGenomic : {},
		sourceTranscript : {},
		sourcePolypeptide : {},
		allele : {
			alleleKey : null,
			symbol : null,
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
	pwiVariant.isReviewed = apiVariant.isReviewed;
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
		pwiVariant.allele.chromosome = apiVariant.allele.chromosome;
		pwiVariant.allele.strand = apiVariant.allele.strand;
		pwiVariant.allele.references = vt.collectRefIDs(apiVariant.allele.refAssocs);
		pwiVariant.allele.accID = vt.getAlleleID(apiVariant.allele.mgiAccessionIds);
	}
	
	// If we have source sequence data, we need to grab it.
	return pwiVariant;
}

// apply data from the PWI-format variant onto the API-format variant
vt.applyPwiVariantToApi = function(pwiVariant, apiVariant) {
	apiVariant.processStatus = "u";		// The current variant has updates.
	
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
		accID : null
	}
	
	if ((seqList != undefined) && (seqList != null)) {
		for (var i = 0; i < seqList.length; i++) {
			if (seqList[i]['sequenceTypeTerm'] == seqType) {
				seq.variantSequenceKey = seqList[i].variantSequenceKey;
				seq.genomeBuild = seqList[i].version;
				seq.startCoordinate = seqList[i].startCoordinate;
				seq.endCoordinate = seqList[i].endCoordinate;
				seq.referenceSequence = seqList[i].referenceSequence;
				seq.variantSequence = seqList[i].variantSequence;
				seq.accID = vt.getSeqID(seqList[i].accessionIds);
			}
		}
	}
	return seq;
}
		
// Get the preferred ID out of the list of allele IDs.  Prefer MGI ID over others, but if there's
// only one ID and it's a non-MGI one, then return that one.
vt.getAlleleID = function(alleleIDs) {
	if ((alleleIDs != null) && (alleleIDs != undefined)) {
		for (var i = 0; i < alleleIDs.length; i++) {
			if ("1" === alleleIDs[i].logicaldbKey) {
				return alleleIDs[i].accID;
			}
		}
		if (alleleIDs.length == 1) {
			return alleleIDs[0].accID;
		}
	}
	return "";
}
		
// get the first ID for the given sequence object
vt.getSeqID = function(seq) {
	if ((seq != null) && (seq.accessionIds != null) && (seq.accessionIds.length > 0)) {
		return seq.accessionIds[0].accID;
	}
	return '';
}