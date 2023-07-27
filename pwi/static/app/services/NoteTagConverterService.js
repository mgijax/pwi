/*
 * NoteTagConverterService.js
 *
 * An implementation of a service to translate "note tags" into links and such.
 * Also converts allele superscript notation into HTML.
 *
 * Note tag conversion is needed in both the PWI and the FEWI.
 * This is the Javascript implementation used in the PWI.
 *
 * See also the Java implementation used in the FEWI:
 * (https://github.com/mgijax/fewi/blob/master/src/org/jax/mgi/fewi/util/NotesTagConverter.java)
 *
 * THE JAVA AND JAVASCRIPT IMPLEMENTATIONS SHOULD BE KEPT IN SYNC!
 * (We're sorry. Truly we are. But that's the way it is.)
 */

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
         * All exported converter functions (superscript, convert, and escapeHtml) accept null/undefined arguments and
         * will return an empty string.
         *
         * USAGE WARNING: it is recommended that the convert() function be called from inside your controller,
         * rather than from the html template, unless you know for sure that the notes being converted do not
         * include \AlleleSymbol or \Elsevier tags (or any tag requiring asynchronous processing).
         * For example, don't do this:
         *      <span ng-bind-html="convert(vm.apiDomain.someNoteField)"/>
         * Instead, do this:
         *      <span ng-bind-html="vm.apiDomain.someNoteField_converted"/>
         * and in your controller:
         *      vm.apiDomain.someNoteField_converted = NoteTagConverter.convert(vm.apiDomain.someNoteField)
         */

	function NoteTagConverterService(ValidateAlleleAPI, ValidateJnumAPI, ValidatePubmedidAPI) {
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
            const PTHR_URL = "http://www.pantherdb.org/panther/family.do?clsAccession=%s"
            const GENERIC_URL = "%s"

            //
            // Each item has a regex, a primary link template, and an optional secondary link template.
            // 
            const NOTES_TAG_CONVERSIONS = [
                // Fewi links
                [ /\\Acc\(([^)]+)\)/g,      `${FEWI_URL}/accession/%s`, `${PWI_URL}/edit/accessionsummary?ids=%s` ],
                [ /\\Marker\(([^)]+)\)/g,   `${FEWI_URL}/marker/%s`, `${PWI_URL}/edit/markerdetail?id=%s` ],
                [ /\\Sequence\(([^)]+)\)/g, `${FEWI_URL}/sequence/%s` ],
                [ /\\Allele\(([^)]+)\)/g,   `${FEWI_URL}/allele/%s`, `${PWI_URL}/edit/alleledetail?id=%s` ],
                [ /\\AMA\(([^)]+)\)/g,      `${FEWI_URL}/vocab/gxd/ma_ontology/%s` ],
                [ /\\EMAPA\(([^)]+)\)/g,    `${FEWI_URL}/vocab/gxd/anatomy/%s` ],
                [ /\\GO\(([^)]+)\)/g,       `${FEWI_URL}/searches/GO.cgi?id=%s` ],
                [ /\\Ref\(([^)]+)\)/g,      `${FEWI_URL}/reference/%s`, `${PWI_URL}/edit/referencesummary?accids=%s` ],
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
                [ /\\DXDOI\(([^|]+[|][^)]+)\)/g,        DXDOI_URL ],
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
                            if (id === "") return match
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
                            /*
                            } else if (match.startsWith('\\JBiolChem') || match.startsWith('\\JLipidRes')) {
                                // Special case: \JBiolChem and \JLipidRes both use pubmedids, but the (new) link 
                                // uses doi ids.
                                ValidatePubmedidAPI.search({ pubmedid: id }, function (data) {
                                        if (data.length) {
                                            const url = DXDOI_URL.replace("%s", data[0].doiid)
                                            const link = `<a href="${url}">${id}</a>`
                                            replacePending(id, link)
                                        } else {
                                            replacePending(id, `Reference not found: pmid=${id}`)
                                        }
                                }, function (err) {
                                        replacePending(id, `Error getting data for reference pmid=${id}`)
                                })
                                return `<span class="ntc-pending">${id}</span>`
                            */
                            } else {
                                return match
                            }
                        }
                        return newNote.replace(regex, replacer)
                    }, note)
                return nn
            }
            //
            function escapeHtml (s) {
                const tagsToReplace = {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;'
                }
                function replaceTag(tag) {
                    return tagsToReplace[tag] || tag;
                }
                return (s || '').replace(/[&<>]/g, replaceTag);
            }
            //
            return {
                escapeHtml,
                convert,
                superscript
            }
	}


})();
/*
TEST CASE:

Copy/paste the following text into a specimen note (on a test db instance, of course!)
Then go to the experiment's detail page to view it.
For my testing, I've been using assay MGI:5422462, specimen label = MH1718; Specimen C1827

# Fewi links
\Acc(MGI:97490|Pax6|)
\Acc(|MGI:97490|) (syntax error == no link made)
\Marker(MGI:97490||)
\Sequence(ENSMUST00000111088||)
\Allele(MGI:2156812||)
\AMA(MA:0000005||)
\EMAPA(EMAPA:16910||)
\GO(GO:0046872||)
\Ref(J:310420||)

# These are obsolete. Not converted.
\GoCurators(||)
\GoRefGenome(||)
\GoEmail(||)
\EMBL(||)

# External resources
\InterPro(IPR017441||)
\EC(2.7.10.1||)
\SwissProt(Q3ULJ6||)
\NCBIQuery(Pax6|Pax6 general search|)
\NCBIProteinQuery(Pax6|Pax6 protein search|)
\NCBINucleotideQuery(Pax6|Pax6 nucleotide search|)
\JBiolChem(33428938||)
\JLipidRes(33524375||)
\DXDOI(10.1073/pnas.1037763100||)
\PANTHER(PTHR12896||) 

# Generic link tag
\Link(http://www.informatics.jax.org||)

# Special tags
\AlleleSymbol(MGI:1856157||)
\AlleleSymbol(MGI:1856157777777||)
\Elsevier(J:204473||)
\Elsevier(J:204000473||)

# In a specimen note, should superscript
# In an assay note, should show verbatim:
Pax6<Sey>
*/
