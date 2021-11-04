(function() {
	'use strict';
	angular.module('pwi.mgi')
		.factory('NoteTagConverter', NoteTagConverterService);

        /* 
         * Implementation notes. Most note tag conversions are straightforward regular expression search and replace.
         * Two special tags, \AlleleSymbol and \Elsevier, require database access in order to produce the replacement
         * string. We use existing services (ValidateAlleleAPI, ValidateJnumAPI) to do these accesses.
         * However, the (BIG) compliction is that this is Javascript, and db accesses is non-blocking.
         * The regular expression search/replace loop cannot stop and wait for the allele symbol (say) to be returned.
         * So insead of inserting the allele symbol (or citation for the \Elsevier tag), the search/replace
         * loop inserts a placeholder. When the database query returns, the callback effectively does a second 
         * search/replace, inserting the symbol/citation at the placeholder.
         *
         * Usage warning: it is recommended that the convert() function be called from inside your controller,
         * rather than from the html template, unless you know for sure that the notes being converted do not
         * include \AlleleSymbol or \Elsevier tags.
         * For example, don't do this:
         *      <span ng-bind-html="convert(vm.apiDomain.someNoteField)"/>
         * Instead, do this:
         *      <span ng-bind-html="vm.apiDomain.someNoteField_converted"/>
         * and in your controller:
         *      vm.apiDomain.someNoteField_converted = NoteTagConverter.convert(vm.apiDomain.someNoteField)
         */

	function NoteTagConverterService(ValidateAlleleAPI, ValidateJnumAPI) {
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
                [ /\\Link\(([^)]+)\)/g,                GENERIC_URL ],
                // Special case links (require database access)
                [ /\\AlleleSymbol\(([^)]+)\)/g        ],
                [ /\\Elsevier\(([^)]+)\)/g            ]
            ]
            //
            function superscript (s) {
                // Converts things like "Pax6<sey>/Pax6<+>" to "Pax6<sup>sey</sup>/Pax6<sup>+</sup>"
                // Also inserts a line break between allele pairs
                const ss = (s || "").trim().replace(/<([^>]*)>/g, "<sup>$1</sup>").replace(/\n/g, '<br/>')
                return ss
            }
            // Converts note tags in the given note into (usually) HTML links. 
            function convert (note, anchorClass) {
                if (!note) return ''
                const nn = NOTES_TAG_CONVERSIONS.reduce((newNote, conv) => {
                        const regex = conv[0]  // regular expression
                        const urltmp = conv[1] // URL template string
                        const urltmp2 = conv[2] // optional second URL
                        // 
                        function replacePending (id, txt) {
                            document.querySelectorAll(`span.ntc-pending`).forEach(elt => {
                                if (elt.innerText === id) {
                                    elt.innerHTML = txt
                                    elt.classList.remove('ntc-pending')
                                }
                            })
                        }
                        //
                        function replacer (match, p1, offset, note) {
                            const parts = p1.split("|")
                            const id = parts[0].trim()
                            if (parts.length !== 3 || id === "") return match
                            if (urltmp) {
                                // Usual case: create/return a link
                                const linktext = parts[1] || parts[0]
                                const url = urltmp.replace("%s", id)
                                const link = `<a class="${anchorClass||''}" href="${url}">${linktext}</a>`
                                if (urltmp2) {
                                    // create additional link to PWI page 
                                    const url2 = urltmp2.replace("%s", id)
                                    const link2 = ` <a class="${anchorClass||''}" href="${url2}">[P]</a>`
                                    return link + link2
                                } else {
                                    return link
                                }
                            } else if (match.startsWith('\\AlleleSymbol')) {
                                // Special case: AlleleSymbol (requires db access)
                                ValidateAlleleAPI.search({ accID: id }, function(data) {
                                        const symbol = data.length ? superscript(data[0].symbol) : `Allele not found: ${id}`
                                        replacePending(id, symbol)
                                    }, function (err) {
                                        replacePending(id, `Error getting data for allele ${id}`)
                                    })
                                return `<span class="ntc-pending">${id}</span>`
                            } else if (match.startsWith('\\Elsevier')) {
                                // Special case: Elsevier (requires db access)
                                ValidateJnumAPI.query({ jnum: id }, function(data) {
                                        const txt = data.length ? data[0].short_citation : `Reference not found: ${id}`
                                        replacePending(id, txt)
                                    }, function (err) {
                                        replacePending(id, `Error getting data for reference ${id}`)
                                    })
                                return `<span class="ntc-pending">${id}</span>`
                            } else {
                                return match
                            }
                        }
                        return newNote.replace(regex, replacer)
                    }, note)
                return nn
            }
            //

            return {
                convert,
                superscript
            }
	}


})();
