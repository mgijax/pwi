/* Name: VariantValidation.js
 * Purpose: provides functions for validating variant data as entered by a curator, ensuring that data
 * 	are valid before we send them to the API to be saved.
 */

/* validation rules:
 * 1. Allele characters I : Convert any (valid) lowercase characters to uppercase for storage
 * 2. Allele characters II : Strip out any spaces and non-printing characters.
 * 3. Allele characters III: Check that entered alleles have only allowed characters and give error message if not.
 * 	 a. valid nucleotide and transcript characters are: ACGTN-+
 *   b. valid polypeptide characters: ACDEFGHIKLMNPQRSTUVWXY*-+
 * 4. Solo + and - : Nucleotide and polypeptide alleles are allowed to use the + and - characters, but if one
 *    appears, then there can be no other characters in the string. Error message upon finding others.
 * 5. Coords I : If either start or end coordinate is populated, both must be. (all 3 seq types)
 * 6. Coords II : Start coordinate must be <= end coordinate. (all 3 seq types)
 *   a. Both coordinates must be integers.
 * 7. Coords III : If genomic coordinates are provided, genome build must be, too.
 * 8. Coords IV : If transcript or polypeptide coordinates are provided, a sequence ID must be, too.
 */

// establish a namespace for this module to help avoid function name collisions
var vv = {};

// Entry point for the module; runs all validity checks against PWI-format 'variant', and updates a few data
// values for cleanup purposes.  Returns a list of strings, one for each error detected.  An empty list means
// no errors were detected.
vv.runValidationChecks = function(variant, seqIDs) {
	var errors = [];
	vv.cleanSequences(variant);		// First, do textual cleanup on all twelve sequence fields.  (rules 1, 2)
	
	errors = errors.concat(vv.checkCharacters(variant));		// Check for valid character choices.  (rules 3, 4) 
	errors = errors.concat(vv.checkCoordinates(variant, seqIDs));	// Check for valid coordinate data.  (rules 5-8)
	return errors;
}

//-----------------------//
//--- sequence checks ---//
//-----------------------//

// ensure that the sequences entered for the given variant have been:
//	1. stripped of whitespace
//	2. stripped of non-printing characters
//	3. converted to uppercase
//	4. had empty strings converted to be nulls
vv.cleanSequences = function(variant) {
	var seqStatus = [ 'source', 'curated'];
	var seqType = [ 'Genomic', 'Transcript', 'Polypeptide' ];
	
	for (var ss = 0; ss < seqStatus.length; ss++) {
		for (var st = 0; st < seqType.length; st++) {
			var field = seqStatus[ss] + seqType[st];
			if (!vv.isNullOrUndefined(variant[field])) {

				if (!vv.isNullOrUndefined(variant[field].referenceSequence)) {
					variant[field].referenceSequence = vv.emptyStringToNull(vv.cleanAndTrim(variant[field].referenceSequence));
				}

				if (!vv.isNullOrUndefined(variant[field].variantSequence)) {
					variant[field].variantSequence = vv.emptyStringToNull(vv.cleanAndTrim(variant[field].variantSequence));
				}

				if (!vv.isNullOrUndefined(variant[field].startCoordinate)) {
					variant[field].startCoordinate = vv.emptyStringToNull(vv.cleanAndTrim(variant[field].startCoordinate));
				}

				if (!vv.isNullOrUndefined(variant[field].endCoordinate)) {
					variant[field].endCoordinate = vv.emptyStringToNull(vv.cleanAndTrim(variant[field].endCoordinate));
				}

				if (!vv.isNullOrUndefined(variant[field].genomeBuild)) {
					variant[field].genomeBuild = vv.emptyStringToNull(vv.cleanAndTrim(variant[field].genomeBuild));
				}

				if (!vv.isNullOrUndefined(variant[field].accID)) {
					variant[field].accID = vv.emptyStringToNull(vv.cleanAndTrim(variant[field].accID));
				}
			}
		}
	}
}

// If 's' is an empty string, convert it to a null.  Otherwise, just return as-is.
vv.emptyStringToNull = function(s) {
	if ((s == null) || (s == undefined) || (s.trim() == '')) {
		return null;
	} 
	return s;
}

// define some standard lists of allowed characters
vv.validNucleotideCharacters = "ACGTN-+";
vv.validPolypeptideCharacters = "ACDEFGHIKLMNPQRSTUVWXY*-+";

// Ensure that valid characters are used for this variant's sequences.  Return list of errors found or an
// empty list if no errors.  Assumes sequences have been through vv.cleanAndTrim().
vv.checkCharacters = function(variant) {
	var seqStatus = [ 'source', 'curated'];
	var seqType = [ 'Genomic', 'Transcript', 'Polypeptide' ];
	var validCharacters = [ vv.validNucleotideCharacters, vv.validNucleotideCharacters, vv.validPolypeptideCharacters ];
	var errors = [];
	
	for (var ss = 0; ss < seqStatus.length; ss++) {
		for (var st = 0; st < seqType.length; st++) {
			var field = seqStatus[ss] + seqType[st];
			if (!vv.isNullOrUndefined(variant[field])) {

				// reference sequence checks
				
				if (!vv.isNullOrUndefined(variant[field].referenceSequence)) {
					if (!vv.hasValidCharacters(variant[field].referenceSequence, validCharacters[st])) {
						errors.push(vv.capitalize(seqStatus[ss]) + ' ' + seqType[st] + ' Reference Allele has invalid characters.');
					}
					
					if (vv.faultyPlusMinus(variant[field].referenceSequence)) {
						errors.push(vv.capitalize(seqStatus[ss]) + ' ' + seqType[st] + ' Reference Allele has + or - with other characters.');
					}
				}

				// variant sequence checks
				
				if (!vv.isNullOrUndefined(variant[field].variantSequence)) {
					if (!vv.hasValidCharacters(variant[field].variantSequence, validCharacters[st])) {
						errors.push(vv.capitalize(seqStatus[ss]) + ' ' + seqType[st] + ' Variant Allele has invalid characters.');
					}
					
					if (vv.faultyPlusMinus(variant[field].variantSequence)) {
						errors.push(vv.capitalize(seqStatus[ss]) + ' ' + seqType[st] + ' Variant Allele has + or - with other characters.');
					}
				}
			}
		}
	}
	return errors;
}

// convert letters in 's' to be uppercase; also trim out any whitespace and non-printing characters
vv.cleanAndTrim = function(s) {
	return vv.stripWhitespace(vv.stripNonPrintingCharacters(s.toUpperCase()));
}

// returns true if the given PWI-style variant sequence has a sequence ID or false if not.
vv.hasSeqID = function(seq) {
	return !vv.isNullOrUndefined(seq.accID) && (seq.accID.trim().length > 0);
}

// returns true if there is a + or - character in 's' and if 's' also has other characters, false otherwise.
// (If a + or a - appears in 's', then it must be alone.)
// Assumes 's' has been run through vv.cleanAndTrim()
vv.faultyPlusMinus = function(s) {
	if ((s.indexOf('+') >= 0) || (s.indexOf('-') >= 0)) {
		if (s.length > 1) {
			return true;
		}
	}
	return false;
}

// Returns true if string 's' only has characters contained in the 'validCharacters' string or false otherwise.
// Assumes 's' has been run through vv.cleanAndTrim()
vv.hasValidCharacters = function(s, validCharacters) {
	if (!vv.isNullOrUndefined(s)) {
		for (var i = 0; i < s.length; i++) {
			if (validCharacters.indexOf(s[i]) < 0) {
				return false;
			}
		}
	}
	return true;
}

//-------------------------//
//--- coordinate checks ---//
//-------------------------//

// run the various checks on the coordinates for sequences in the given 'variant'.  Return a list of strings to
// describe any errors found (or an empty list if no errors).
vv.checkCoordinates = function(variant, seqIDs) {
	var errors = [];

	var seqStatus = [ 'source', 'curated'];
	var seqType = [ 'Genomic', 'Transcript', 'Polypeptide' ];
	var transcriptLdbs = [ 'RefSeq', 'Ensembl Transcript', 'Sequence DB' ];
	var polypeptideLdbs = [ 'RefSeq', 'Ensembl Protein', 'SWISS-PROT', 'TrEMBL' ];
	
	for (var ss = 0; ss < seqStatus.length; ss++) {
		for (var st = 0; st < seqType.length; st++) {
			var field = seqStatus[ss] + seqType[st];
			if (!vv.isNullOrUndefined(variant[field])) {
				
				// rule 5 : cannot have start coord without end (or vice versa)
				if (vv.hasSoloCoordinates(variant[field])) {
					errors.push(vv.capitalize(seqStatus[ss]) + ' ' + seqType[st] + ' has one coordinate defined without the other.');

				} else if (vv.hasCoordinates(variant[field])){
					if (!vv.isInteger(variant[field].startCoordinate)) {
						errors.push(vv.capitalize(seqStatus[ss]) + ' ' + seqType[st] + ' has non-integer start coordinate.');
					} else if (!vv.isInteger(variant[field].endCoordinate)) {
						errors.push(vv.capitalize(seqStatus[ss]) + ' ' + seqType[st] + ' has non-integer end coordinate.');
					} else {
						// rule 6 : Both coordinates are defined and both are integers.  Compare them.
						var startCoord = parseInt(variant[field].startCoordinate);
						var endCoord = parseInt(variant[field].endCoordinate);
						if (startCoord > endCoord) {
							errors.push(vv.capitalize(seqStatus[ss]) + ' ' + seqType[st] + ' has start coordinate larger than end coordinate.');
						}
					}
					
					// rules 7 and 8 : coordinates require genome build or seq ID, too.
					if (seqType[st] == 'Genomic') {
						if (vv.isNullOrUndefined(variant[field]['genomeBuild']) || (variant[field].genomeBuild.trim().length == 0)) {
							errors.push(vv.capitalize(seqStatus[ss]) + ' ' + seqType[st] + ' has coordinates but no genome build.');
						}
 					} else {
 						if (vv.isNullOrUndefined(variant[field]['accID']) || (variant[field].accID.trim().length == 0)) {
 							errors.push(vv.capitalize(seqStatus[ss]) + ' ' + seqType[st] + ' has coordinates but no sequence ID.');
 						} else {
 							var seqID = variant[field]['accID'].trim();
 							if ((!seqID in seqIDs) || (seqIDs[seqID].logicaldbKey == null)) {
 								errors.push('Could not look up ' + vv.capitalize(seqStatus[ss]) + ' ' + seqType[st] + ' ID: ' + seqID);
 							} else if (seqIDs[seqID].logicaldbKey < 0) {
 								errors.push(vv.capitalize(seqStatus[ss]) + ' ' + seqType[st] + ' ID ' + seqID + ' is not a valid sequence ID.');
 							} else if (seqType[st] == 'Transcript') {
 								if (transcriptLdbs.indexOf(seqIDs[seqID].logicaldb) < 0) {
 									errors.push(vv.capitalize(seqStatus[ss]) + ' ' + seqType[st] + ' ID ' + seqID + ' is not from a provider of transcript IDs: ' + seqIDs[seqID].logicaldb);
 								}
 							} else if (seqType[st] == 'Polypeptide') {
 								if (polypeptideLdbs.indexOf(seqIDs[seqID].logicaldb) < 0) {
 									errors.push(vv.capitalize(seqStatus[ss]) + ' ' + seqType[st] + ' ID ' + seqID + ' is not from a provider of polypeptide IDs: ' + seqIDs[seqID].logicaldb);
 								}
 							}
 						}

					}
				}
			}
		}
	}
	return errors;
}

// Returns true if 'seq' defines one coordinate without the other, or false if 'seq' either defines both or neither.
vv.hasSoloCoordinates = function(seq) {
	if (!vv.isNullOrUndefined(seq.startCoordinate) || !vv.isNullOrUndefined(seq.endCoordinate)) {
		return vv.isNullOrUndefined(seq.startCoordinate) || vv.isNullOrUndefined(seq.endCoordinate);
	}
	return false;
}

// Return true if 'seq' has coordinates defined, or false if not.
vv.hasCoordinates = function(seq) {
	return !vv.isNullOrUndefined(seq.startCoordinate) && !vv.isNullOrUndefined(seq.endCoordinate);
}

//-------------------------------//
//--- miscellaneous utilities ---//
//-------------------------------//

// returns value of 's' with any whitespace (spaces, tabs, newlines) removed
vv.stripWhitespace = function(s) {
	return s.replace(/\s+/g, '');
}

// returns value of 's' with any non-printing characters removed
vv.stripNonPrintingCharacters = function(s) {
	// Printable characters range from a space up to the tilde, so keep anything between them plus
	// standard whitespace characters like newline and tab.
	return s.replace(/[^\s -~]+/g, '');
}

// returns true if the value of 's' is an integer or false if not
vv.isInteger = function(s) {
	if (!vv.isNullOrUndefined(s)) {
		// If anything in the string is a non-digit, then 's' does not contain an integer.
		return s.match(/^[0-9]+$/) != null;
	}
	return false;
}

// returns true if 'obj' is either null or undefined.
vv.isNullOrUndefined = function(obj) {
	return (obj == null) || (obj == undefined);
}

// capitalize the first letter of string 's' and return the new version of 's'
vv.capitalize = function(s) {
	if (vv.isNullOrUndefined(s)) { return s; }
	return s.substr(0,1).toUpperCase() + s.substr(1);
}