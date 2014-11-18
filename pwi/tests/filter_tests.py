"""
All test suites for functions in the filters
module (our jinja filter extensions) belong here
"""

import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

import unittest
from pwi.templatetags import filters


# test the highlight filter function
class HighlightTestCase(unittest.TestCase):
    
    def setUp(self):
        # define once, what text wraps a highlighted term
        self.begin = "<mark>"
        self.end = "</mark>"
    
    def test_highlight_empty(self):
        self.assertEquals("test", filters.highlight("test",""))
        
    def test_highlight_one_word_match(self):
        hl = filters.highlight("test", "test")
        expected = self.expectedHighlight("test")
        self.assertEquals(expected, hl)
    
    def test_highlight_one_word_in_many(self):
        hl = filters.highlight("test1 test2 test3", "test2", delim=None)
        expected = "test1 test2 test3"
        self.assertEquals(expected, hl)
        
    def test_highlight_many_word_match(self):
        hl = filters.highlight("test1 test2 test3", "test1 test2 test3", delim=None)
        expected = (self.expectedHighlight("test1 test2 test3"))
        self.assertEquals(expected, hl)
        
    def test_highlight_phrase_in_many(self):
        hl = filters.highlight("test1 test2 test3", "test2 test3", delim=None)
        expected = "test1 test2 test3"
        self.assertEquals(expected, hl)
        
    def test_highlight_wildcard(self):
        hl = filters.highlight("testing", "test%", wildcard='%')
        expected = self.expectedHighlight("testing")
        self.assertEquals(expected, hl)
        
    def test_highlight_wildcard_reverse(self):
        hl = filters.highlight("testing", "%ing", wildcard='%')
        expected = self.expectedHighlight("testing")
        self.assertEquals(expected, hl)
        
    def test_highlight_wildcard_in_middle(self):
        hl = filters.highlight("testing", "t%ing", wildcard='%')
        expected = self.expectedHighlight("testing")
        self.assertEquals(expected, hl)
        
    def test_highlight_complex_wildcard(self):
        hl = filters.highlight("testing123456789", "%es%ing123%8%", wildcard='%')
        expected = self.expectedHighlight("testing123456789")
        self.assertEquals(expected, hl)
        
    def test_highlight_match_in_list(self):
        hl = filters.highlight("test1, test2, test3", "test2", delim=', ')
        expected = "test1, %s, test3" % (self.expectedHighlight("test2"))
        self.assertEquals(expected, hl)
        
    def test_highlight_multi_token_wildcard(self):
        hl = filters.highlight("testing1, testing2, nottesting", "test%", wildcard='%', delim=', ')
        expected = "%s, %s, nottesting" % (self.expectedHighlight("testing1"), 
                                           self.expectedHighlight("testing2"))
        self.assertEquals(expected, hl)
        
    # helpers
    def expectedHighlight(self, expected):
        """
        Build expected highlight string
        """
        return "%s%s%s" % (self.begin, expected, self.end)
      
        
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
                 'Elsevier', 'GoCurators', 'GoRefGenome',
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
    suite.addTest(unittest.makeSuite(HighlightTestCase))
    suite.addTest(unittest.makeSuite(NotesTagConverterTestCase))
    # add future test suites here
    return suite

if __name__ == '__main__':
    unittest.main()
