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
        
        
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(HighlightTestCase))
    # add future test suites here
    return suite

if __name__ == '__main__':
    unittest.main()
