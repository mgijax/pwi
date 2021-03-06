"""
All test suites for functions in the filters
module (our jinja filter extensions) belong here
"""

import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 1 dir up)
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

import unittest
from pwi.templatetags import filters

        
# test the notes_tag_converter filter function
class NotesTagConverterTestCase(unittest.TestCase):
    
    def setUp(self):
        self.ACC_URL = "http://www.informatics.jax.org/accession/%s"
        self.DXDOI_URL = "http://dx.doi.org/%s"
        
    def convert(self, note):
        # tests are simpler without adding anchor class
        return filters.notes_tag_converter(note, anchorClass='')
    
    def test_notes_tag_empty(self):
        self.assertEquals('', self.convert(''))        

    def test_notes_tag_no_match(self):
        self.assertEquals('note with no tags', self.convert('note with no tags'))
        
    def test_notes_tag_one_match(self):
        accurl = self.ACC_URL % "MGI:TEST"
        self.assertEquals('test <a class="" href="%s">MGI:TEST</a>' % accurl, 
                          self.convert('test \\Acc(MGI:TEST||)'))
        
    def test_notes_tag_one_external_match(self):
        dxdoiurl = self.DXDOI_URL % "DOITEST"
        self.assertEquals('test <a class="" href="%s" target="_blank">DOITEST</a>' % dxdoiurl, 
                          self.convert('test \\DXDOI(DOITEST||)'))
        
    def test_notes_tag_multiple_match_of_same(self):
        accurl1 = self.ACC_URL % "MGI:TEST"
        accurl2 = self.ACC_URL % "MGI:TEST2"
        self.assertEquals('test <a class="" href="%s">MGI:TEST</a> stuff '
                          '<a class="" href="%s">MGI:TEST2</a> end' % (accurl1, accurl2), 
                          self.convert('test \\Acc(MGI:TEST||) stuff \\Acc(MGI:TEST2||) end'))
        
    def test_notes_tag_mixed_internal_external_match(self):
        accurl = self.ACC_URL % "MGI:TEST"
        dxdoiurl = self.DXDOI_URL % "DOITEST"
        self.assertEquals('test <a class="" href="%s">MGI:TEST</a> stuff '
                          '<a class="" href="%s" target="_blank">DOITEST</a> end' % (accurl, dxdoiurl), 
                          self.convert('test \\Acc(MGI:TEST||) stuff \\DXDOI(DOITEST||) end'))
        
    def test_notes_tag_link_text(self):
        accurl = self.ACC_URL % "MGI:TEST"
        self.assertEquals('test <a class="" href="%s">Accession</a>' % accurl, 
                          self.convert('test \\Acc(MGI:TEST|Accession|)'))
    
    def test_notes_tag_elsevier_text(self):
        self.assertEquals('test Dev Biol 152: 75-88, Yamaguchi TP; Conlon RA; Rossant J, Expression of the fibroblast growth factor receptor FGFR-1/flg during gastrulation and segmentation in the mouse embryo. Copyright 1992', 
                          self.convert('test \\Elsevier(J:1520||)'))

    def test_notes_tag_allelesymbol_text(self):
        self.assertEquals('test a', 
                          self.convert('test \\AlleleSymbol(MGI:1855937|)'))

    def test_notes_tag_generic_link(self):
        link = "http://www.google.com"
        self.assertEquals('test <a class="" href="%s" target="_blank">Google</a>' % link, 
                          self.convert('test \\Link(%s|Google|)' % link))
    
    def test_notes_tag_types(self):
        """
        Simply test that all the various types are allowed.
        We don't need to test that they are converted correctly, 
            just that they are converted to something.
        """
        originalNote = "some notes with a tag: %s."
        
        # insert the various tag types into original note for each test
        tagTypes = ['Marker', 'Sequence', 'Acc', 
                 'Allele', 'AMA', 'GO', 'Ref',
                 'GoCurators', 'GoRefGenome',
                 'GoEmail', 'InterPro', 'EC',
                 'EMBL', 'SwissProt', 'NCBIQuery',
                 'NCBIProteinQuery', 'NCBINucleotideQuery',
                 'JBiolChem', 'JLipidRes', 'DXDOI',
                 'PANTHER', 'Link']
        
        for tagType in tagTypes:
            # build a test tag for each type e.g. \Marker(test||)
            tag = '\\%s(test||)' % tagType
            note = originalNote % (tag)
            convertedNote = self.convert(note)
            
            self.assertNotEquals(note, convertedNote, 
                            'Failed to convert note tag of type \\%s' % tagType)
            self.assertTrue(convertedNote, 
                            'Converted note is empty for tag of type \\%s' % tagType)
        
        
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(NotesTagConverterTestCase))
    # add future test suites here
    return suite

if __name__ == '__main__':
    unittest.main()
