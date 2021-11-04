(function() {
	'use strict';
	angular.module('pwi.mgi')
		.factory('NoteTagConverter', NoteTagConverterService);

	/*
         * TextTranslationService provides functions for various MGI text translations.
         * Only function so far:
         *   bracketsToSup(s) : Converts bracket nomenclature for alleles into <sup>...</sup> HTML.
	 */
	function NoteTagConverterService() {
            //
            const FEWI_URL = "http://www.informatics.jax.org"
            const PWI_URL = "/pwi"
            const MGIHOME_URL = "http://www.informatics.jax.org/mgihome/"
            //
            const INTERPRO_URL = "http://www.ebi.ac.uk/interpro/entry/InterPro/%s/"
            const EC_URL = "https://enzyme.expasy.org/EC/%s"
            const EMBL_URL = "http://www.ebi.ac.uk/htbin/emblfetch?%s"
            const SWISSPROT_URL = "https://www.uniprot.org/uniprot/%s"
            const NCBI_QUERY_URL = "http://www.ncbi.nlm.nih.gov/gquery/gquery.fcgi?term=%s"
            const NCBI_PROTEIN_QUERY_URL = "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=protein&cmd=search&term=%s"
            const NCBI_NUCLEOTIDE_QUERY_URL = "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=Nucleotide&cmd=search&term=%s"
            const JBIOLCHEM_URL = "http://www.jbc.org/cgi/pmidlookup?view=long&pmid=%s"
            const JLIPIDRES_URL = "http://www.jlr.org/cgi/pmidlookup?view=long&pmid=%s"
            const DXDOI_URL = "http://dx.doi.org/%s"
            const PTHR_URL = "http://pantree.org/node/annotationNode.jsp?id=%s"
            const GENERIC_URL = "%s"

            //
            // Each item has a regex, a primary link template, and an optional secondary link template.
            // 
            const NOTES_TAG_CONVERSIONS = [
                // Fewi links
                [ /\\Acc\(([^)]+)\)/g,      `${FEWI_URL}/accession/%s`, `${PWI_URL}/accession/query?ids=%s` ],
                [ /\\Marker\(([^)]+)\)/g,   `${FEWI_URL}/marker/%s`, `${PWI_URL}/detail/marker/%s` ],
                [ /\\Sequence\(([^)]+)\)/g, `${FEWI_URL}/sequence/%s` ],
                [ /\\Allele\(([^)]+)\)/g,   `${FEWI_URL}/allele/%s`, `${PWI_URL}/detail/allele/%s` ],
                [ /\\AMA\(([^)]+)\)/g,      `${FEWI_URL}/vocab/gxd/ma_ontology/%s` ],
                [ /\\EMAPA\(([^)]+)\)/g,    `${FEWI_URL}/vocab/gxd/anatomy/%s` ],
                [ /\\GO\(([^)]+)\)/g,       `${FEWI_URL}/searches/GO.cgi?id=%s` ],
                [ /\\Ref\(([^)]+)\)/g,      `${FEWI_URL}/reference/%s`, `${PWI_URL}/summary/reference?accids=%s` ],
                // GO links
                [ /\\GoCurators\(([^)]+)\)/g,  `${MGIHOME_URL}/GO/go_curators.shtml%s` ],
                [ /\\GoRefGenome\(([^)]+)\)/g, `${MGIHOME_URL}/GO/reference_genome_project.shtml%s` ],
                [ /\\GoEmail\(([^)]+)\)/g,     `mailto:mgi-go@informatics.jax.org%s` ],
                // External links
                [ /\\InterPro\(([^)]+)\)/g,            INTERPRO_URL ],
                [ /\\EC\(([^)]+)\)/g,                  EC_URL ],
                [ /\\EMBL\(([^)]+)\)/g,                EMBL_URL ],
                [ /\\SwissProt\(([^)]+)\)/g,           SWISSPROT_URL ],
                [ /\\NCBIQuery\(([^)]+)\)/g,           NCBI_QUERY_URL ],
                [ /\\NCBIProteinQuery\(([^)]+)\)/g,    NCBI_PROTEIN_QUERY_URL ],
                [ /\\NCBINucleotideQuery\(([^)]+)\)/g, NCBI_NUCLEOTIDE_QUERY_URL ],
                [ /\\JBiolChem\(([^)]+)\)/g,           JBIOLCHEM_URL ],
                [ /\\JLipidRes\(([^)]+)\)/g,           JLIPIDRES_URL ],
                [ /\\DXDOI\(([^)]+)\)/g,               DXDOI_URL ],
                [ /\\PANTHER\(([^)]+)\)/g,             PTHR_URL ],
                // Generic link
                [ /\\Link\(([^)]+)\)/g,                GENERIC_URL ]
            ]
            //
            function convert (note, anchorClass) {
                if (!note) return ''
                const nn = NOTES_TAG_CONVERSIONS.reduce((newNote, conv) => {
                        const regex = conv[0]
                        const urltmp = conv[1]
                        const urltmp2 = conv[2] // optional, might be null
                        //
                        function replacer (match, p1, offset, note) {
                            const parts = p1.split("|")
                            const id = parts[0].trim()
                            if (parts.length !== 3 || id === "") return match
                            const linktext = parts[1] || parts[0]
                            const url = urltmp.replace("%s", id)
                            const link = `<a class="${anchorClass||''}" href="${url}">${linktext}</a>`
                            if (urltmp2) {
                                const url2 = urltmp2.replace("%s", id)
                                const link2 = ` <a class="${anchorClass||''}" href="${url2}">[P]</a>`
                                return link + link2
                            } else {
                                return link
                            }
                        }
                        return newNote.replace(regex, replacer)
                    }, note)
                return nn
            }
            //
            function superscript (s) {
                // Converts things like "Pax6<sey>/Pax6<+>" to "Pax6<sup>sey</sup>/Pax6<sup>+</sup>"
                // Also inserts a line break between allele pairs
                const ss = (s || "").trim().replace(/<([^>]*)>/g, "<sup>$1</sup>").replace(/\n/g, '<br/>')
                return ss
            }

            return {
                convert,
                superscript
            }
	}


})();
