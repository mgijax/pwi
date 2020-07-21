"""
Notes tag converter module
for converting MGI notes tags
"""
import re
from pwi import app
from pwi.hunter import allele_hunter
from mgipython.service.reference_service import ReferenceService

reference_service = ReferenceService()

### Constants ###

# URL Constants

# For all intents and purposes, these should attempt 
# to reflect urls appearing on public
FEWI_URL = "http://www.informatics.jax.org/"
WI_URL = "http://www.informatics.jax.org/"
MGIHOME_URL = "http://www.informatics.jax.org/mgihome/"

# URLs of external resources
INTERPRO_URL = "http://www.ebi.ac.uk/interpro/entry/%s"
EC_URL = "http://www.expasy.org/enzyme/%s"
EMBL_URL = "http://www.ebi.ac.uk/htbin/emblfetch?%s"
SWISSPROT_URL = "http://www.uniprot.org/entry/%s"
NCBI_QUERY_URL = "http://www.ncbi.nlm.nih.gov/gquery/gquery.fcgi?term=%s"
NCBI_PROTEIN_QUERY_URL = "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=protein&cmd=search&term=%s"
NCBI_NUCLEOTIDE_QUERY_URL = "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=Nucleotide&cmd=search&term=%s"
JBIOLCHEM_URL = "http://www.jbc.org/cgi/pmidlookup?view=long&pmid=%s"
JLIPIDRES_URL = "http://www.jlr.org/cgi/pmidlookup?view=long&pmid=%s"
DXDOI_URL = "http://dx.doi.org/%s"
PTHR_URL = "http://pantree.org/node/annotationNode.jsp?id=%s"

# Note Tag Regular Expressions

EXTERNAL_URL_TEMPLATE = "<a class=\"%s\" href=\"%s\" target=\"_blank\">%s</a>"

# Special handling for non-standard tags (possibly w/ DB connection)
alleleSymbolRegex = re.compile("\\\\AlleleSymbol\\((.*?[|].*?)\\)")
elsevierRegex = re.compile("\\\\Elsevier\\((.*?[|].*?[|].*?)\\)")

# Pairs of compiled regex and link template
NOTES_TAG_CONVERSIONS = [
            # Marker
            (re.compile("\\\\Marker\\((.*?[|].*?[|].*?)\\)"),
                "<a class=\"%s\" href=\"%smarker/%s\">%s</a>" %
                            ("%s", FEWI_URL, "%s", "%s")),

            # Sequence
            (re.compile("\\\\Sequence\\((.*?[|].*?[|].*?)\\)"),
                "<a class=\"%s\" href=\"%ssequence/%s\">%s</a>" %
                ("%s", FEWI_URL, "%s", "%s")),

            #///////////////
            #// python wi //
            #///////////////

            # Accession
            (re.compile("\\\\Acc\\((.*?[|].*?[|].*?)\\)"),
                "<a class=\"%s\" href=\"%saccession/%s\">%s</a>" %
                ("%s", FEWI_URL, "%s", "%s")),

            # Allele
            (re.compile("\\\\Allele\\((.*?[|].*?[|].*?)\\)"),
                "<a style='white-space: normal; 'class=\"%s\" href=\"%sallele/%s\">%s</a>" %
                ("%s", FEWI_URL, "%s", "%s")),

            # AMA
            (re.compile("\\\\AMA\\((.*?[|].*?[|].*?)\\)"),
                "<a class=\"%s\" href=\"%sama/%s\">%s</a>" %
                ("%s", FEWI_URL, "%s", "%s")),

            # EMAPA
            (re.compile("\\\\EMAPA\\((.*?[|].*?[|].*?)\\)"),
                "<a class=\"%s\" href=\"%svocab/gxd/anatomy/%s\">%s</a>" %
                ("%s", FEWI_URL, "%s", "%s")),
                         
            # GO
            (re.compile("\\\\GO\\((.*?[|].*?[|].*?)\\)"),
                "<a class=\"%s\" href=\"%ssearches/GO.cgi?id=%s\">%s</a>" %
                ("%s", WI_URL, "%s", "%s")),

            # Reference
            (re.compile("\\\\Ref\\((.*?[|].*?[|].*?)\\)"),
                "<a class=\"%s\" href=\"%sreference/%s\">%s</a>" %
                ("%s", FEWI_URL, "%s", "%s")),


            # Elsevier (might be a temp solution...python wi renders this tag differently)
            #(re.compile("\\\\Elsevier\\((.*?[|].*?[|].*?)\\)"),
            #    " in <a class=\"%s\" href=\"%saccession/%s\">%s</a>" %
            #    ("%s", FEWI_URL, "%s", "%s")),

            #/////////////
            #// mgihome //
            #/////////////

            # GoCurators
            (re.compile("\\\\GoCurators\\((.*?[|].*?[|].*?)\\)"),
                "<a class=\"%s\" href=\"%sGO/go_curators.shtml%s\">%s</a>" %
                ("%s", MGIHOME_URL, "%s", "%s")),

            # GoRefGenome
            (re.compile("\\\\GoRefGenome\\((.*?[|].*?[|].*?)\\)"),
                "<a class=\"%s\" href=\"%sGO/reference_genome_project.shtml%s\">%s</a>" %
                ("%s", MGIHOME_URL, "%s", "%s")),

            #///////////////////
            #// email aliases //
            #///////////////////

            # GoCurators
            (re.compile("\\\\GoEmail\\((.*?[|].*?[|].*?)\\)"),
                "<a class=\"%s\" href=\"mailto:mgi-go@informatics.jax.org%s\">%s</a>"),


            #///////////////
            #// external
            #///////////////

            # These are created in a three step process due to not being able
            # to place two '%s' together.  (e.g. foo%s%s currently errors)

            # InterPro
            (re.compile("\\\\InterPro\\((.*?[|].*?[|].*?)\\)"),
                EXTERNAL_URL_TEMPLATE % 
                ("%s", INTERPRO_URL, "%s")),

            # Enzyme Commission Number
            (re.compile("\\\\EC\\((.*?[|].*?[|].*?)\\)"),
                EXTERNAL_URL_TEMPLATE %
                ("%s", EC_URL, "%s")),

            # EMBL
            (re.compile("\\\\EMBL\\((.*?[|].*?[|].*?)\\)"),
                EXTERNAL_URL_TEMPLATE %
                ("%s", EMBL_URL, "%s")),

            # SwissProt
            (re.compile("\\\\SwissProt\\((.*?[|].*?[|].*?)\\)"),
                EXTERNAL_URL_TEMPLATE %
                ("%s", SWISSPROT_URL, "%s")),

            # NCBI Query
            (re.compile("\\\\NCBIQuery\\((.*?[|].*?[|].*?)\\)"),
                EXTERNAL_URL_TEMPLATE %
                ("%s", NCBI_QUERY_URL, "%s")),

            # NCBI Protein Query
            (re.compile("\\\\NCBIProteinQuery\\((.*?[|].*?[|].*?)\\)"),
                EXTERNAL_URL_TEMPLATE %
                ("%s", NCBI_PROTEIN_QUERY_URL, "%s")),

            # NCBI Nucleotide Query
            (re.compile("\\\\NCBINucleotideQuery\\((.*?[|].*?[|].*?)\\)"),
                EXTERNAL_URL_TEMPLATE %
                ("%s", NCBI_NUCLEOTIDE_QUERY_URL, "%s")),

            # Journal of Biological Chemistry
            (re.compile("\\\\JBiolChem\\((.*?[|].*?[|].*?)\\)"),
                EXTERNAL_URL_TEMPLATE %
                ("%s", JBIOLCHEM_URL, "%s")),

            # Journal of Lipid Research
            (re.compile("\\\\JLipidRes\\((.*?[|].*?[|].*?)\\)"),
                EXTERNAL_URL_TEMPLATE %
                ("%s", JLIPIDRES_URL, "%s")),

            # DXDOI
            (re.compile("\\\\DXDOI\\((.*?[|].*?[|].*?)\\)"),
                EXTERNAL_URL_TEMPLATE %
                ("%s", DXDOI_URL, "%s")),

            # Panther Classification System
            (re.compile("\\\\PANTHER\\((.*?[|].*?[|].*?)\\)"),
                EXTERNAL_URL_TEMPLATE %
                ("%s", PTHR_URL, "%s")),


            # Generic Link
            (re.compile("\\\\Link\\((.*?[|].*?[|].*?)\\)"),
                EXTERNAL_URL_TEMPLATE),
            ]


def convert(note, anchorClass=''):
    """
    Takes a string and runs various regular
    expressions against it, to convert any special
    MGI notes tags into links
    """
    if not note:
        return ''
    
    for regex, template in NOTES_TAG_CONVERSIONS:
        match = regex.search(note)
        while match:
            args = match.groups()[0].split('|')
            start = match.start()
            end = match.end()
            
            if not args[1]:
                # default to ID field, if link text blank
                args[1] = args[0]
            
            # convert the note tag
            # This shouldn't match unless we have 3 args in the first place
            converted = template % (anchorClass, args[0], args[1])
            
            # insert converted tag
            note = note[:start] + converted + note[end:]
            
            match = regex.search(note)   

    # special handling for non-standard \AlleleSymbol tag
    match = alleleSymbolRegex.search(note)
    while match:

        args = match.groups()[0].split('|')
        start = match.start()
        end = match.end()

        allele = allele_hunter.getAlleleByMGIID(args[0])
        if allele is None:
            note = note[:start] + "<span style='color: red;'>Allele ID Error</span> " + note[end:]
        else:
            # insert converted tag
            note = note[:start] + superscript(allele.symbol) + note[end:]

        match = alleleSymbolRegex.search(note)   

    # special handling for non-standard \Elsevier tag
    match = elsevierRegex.search(note)
    while match:

        args = match.groups()[0].split('|')
        start = match.start()
        end = match.end()
        app.logger.warn('match! %s' % args[0])

        ref = reference_service.get_by_jnum_id(args[0])

        # generate replacement text
        journal = ref.journal or ''
        vol = ref.vol or ''
        pgs = ref.pgs or ''
        title = ref.title or ''
        authors = ref.authors or ''
        year = ref.year or ''
        replacementText = "%s %s: %s, %s, %s Copyright %s" % \
                (journal, vol, pgs, authors, title, year)

        # insert converted tag
        note = note[:start] + replacementText + note[end:]

        match = elsevierRegex.search(note)   

    return note


# some superscripting of certain tags must happen within the converter
def superscript(s):
        # handles multiple superscript indicators (angle brackets) in 's',
        # assuming that they are not nested.
        #	eg: 'A<b><c>' is okay, but 'A<b<c>>' is not

        inSuperScript = False
        t = ''

        for c in s:
                if (c == '<'):
                        if not inSuperScript:
                                inSuperScript = True
                                c = '<sup>'
                        else:
                                # escape a redundant open bracket
                                c = '&lt;'

                elif (c == '>'):
                        if inSuperScript:
                                inSuperScript = False
                                c = '</sup>'
                        else:
                                # escape a redundant close bracket
                                c = '&gt;'
                t = t + c
        
        # just to be friendly...  if we have an unclosed open bracket, then
        # add a close bracket so the rest of the page isn't superscripted

        if inSuperScript:
                t = t + '</sup>'
        return t
