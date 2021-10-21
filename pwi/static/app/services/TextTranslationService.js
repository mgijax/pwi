(function() {
	'use strict';
	angular.module('pwi.mgi')
		.factory('TextTranslation', TextTranslationService);

	/*
         * TextTranslationService is provides functions for various MGI text translations.
         * Only function so far:
         *   bracketsToSup(s) : Converts bracket nomenclature for alleles into <sup>...</sup> HTML.
	 */
	function TextTranslationService() {
            //
            function bracketsToSup (s) {
                // Converts things like "Pax6<sey>/Pax6<+>" to "Pax6<sup>sey</sup>/Pax6<sup>+</sup>"
                // Also inserts a line break between allele pairs
                const ss = (s || "").trim().replace(/<([^>]*)>/g, "<sup>$1</sup>").replace(/\n/g, '<br/>')
                return ss
            }
            // Convert occurrences of "\Acc(MGIid||)" to <a> links
            // NOTE this is not a full implementation!
            function noteMarkupToHtml (s) {
                return (s || "").replace(/\\Acc\((MGI:[0-9]*)\|\|\)/g, '<a href="http://www.informatics.jax.org/accession/$1">$1</a>')
            }
            //
            // other functions here
            //

            // Return object with each function you want to make available.
            return {
                bracketsToSup,
                noteMarkupToHtml
            }
	}


})();
