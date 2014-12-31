"""
Test the genotype_mp_hunter Module
"""

import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 3 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

import unittest
from pwi.hunter.genotype import genotype_mp_hunter
from pwi.model import Genotype, VocAnnot

class OrganizeTermsTestCase(unittest.TestCase):
    """
    Ensure that _organizeTerms() correctly creates the mp_headers objects
    attached to each genotype, using the passed in association data.
    """
    
    def test_organizeterms_empty(self):
        headerMap = {}
        sortedHeadersMap = {}
        genotypes = []
        genotype_mp_hunter._organizeTerms(genotypes, headerMap, sortedHeadersMap)
        self.assertMpHeaders([], genotypes)
        
    def test_organizeterms_noheaders(self):
        headerMap = {}
        sortedHeadersMap = {}
        g1 = self.createGeno(1)
        genotypes = [g1]
        genotype_mp_hunter._organizeTerms(genotypes, headerMap, sortedHeadersMap)
        # nothing should happen to g1
        self.assertMpHeaders([self.createGeno(1)], genotypes)
        
    def test_organizeterms_simple_oneheader(self):
        annot1 = self.createAnnot(10, 'term10')
        header1 = 'Test Header'
        
        headerMap = {1: {10: [header1]}}
        sortedHeadersMap = {1: [header1]}
        
        g1 = self.createGeno(1)
        g1.mp_annots = [annot1]
        genotypes = [g1]
        genotype_mp_hunter._organizeTerms(genotypes, headerMap, sortedHeadersMap)
        
        # single header should be created with annot1
        expected1 = self.createGeno(1)
        expected1.mp_headers = [{'term': header1, 'annots':[annot1]}]
        
        self.assertMpHeaders([expected1], genotypes)
        
    def test_organizeterms_simple_manyheaders(self):
        annot1 = self.createAnnot(10, 'term10')
        header1 = 'Test Header1'
        header2 = 'Test Header2'
        header3 = 'Test Header3'
        
        headerMap = {1: {10: [header1, header2, header3]}}
        sortedHeadersMap = {1: [header2, header3, header1]}
        
        g1 = self.createGeno(1)
        g1.mp_annots = [annot1]
        genotypes = [g1]
        genotype_mp_hunter._organizeTerms(genotypes, headerMap, sortedHeadersMap)
        
        # three headers should be created, all with annot1
        # in order of 2, 3, 1
        expected1 = self.createGeno(1)
        expected1.mp_headers = [{'term': header2, 'annots':[annot1]},
                                {'term': header3, 'annots':[annot1]},
                                {'term': header1, 'annots':[annot1]}]
        self.assertMpHeaders([expected1], genotypes)
        
    def test_organizeterms_manyannots_and_headers(self):
        annot1 = self.createAnnot(10, 'term10')
        annot2 = self.createAnnot(20, 'term20')
        header1 = 'Test Header1'
        header2 = 'Test Header2'
        
        headerMap = {1: {10: [header1], 20: [header2]}}
        sortedHeadersMap = {1: [header1, header2]}
        
        g1 = self.createGeno(1)
        g1.mp_annots = [annot1, annot2]
        genotypes = [g1]
        genotype_mp_hunter._organizeTerms(genotypes, headerMap, sortedHeadersMap)
        
        # three headers should be created, all with annot1
        # in order of 2, 3, 1
        expected1 = self.createGeno(1)
        expected1.mp_headers = [{'term': header1, 'annots':[annot1]},
                                {'term': header2, 'annots':[annot2]}]
        self.assertMpHeaders([expected1], genotypes)
        
    def test_organizeterms_headerannot(self):
        header1 = 'Test Header1'
        annot1 = self.createAnnot(10, header1)
        
        headerMap = {}
        sortedHeadersMap = {1: [header1]}
        
        g1 = self.createGeno(1)
        g1.mp_annots = [annot1]
        genotypes = [g1]
        genotype_mp_hunter._organizeTerms(genotypes, headerMap, sortedHeadersMap)
        
        # three headers should be created, all with annot1
        # in order of 2, 3, 1
        expected1 = self.createGeno(1)
        expected1.mp_headers = [{'term': header1, 'annots':[annot1]}]
        self.assertMpHeaders([expected1], genotypes)
        
    # helpers
    
    def createGeno(self, key):
        geno = Genotype()
        geno._genotype_key = key
        geno.mp_annots = []
        return geno
    
    def createAnnot(self, key, term):
        annot = VocAnnot()
        annot._term_key = key
        annot.term = term
        return annot
    
    def assertMpHeaders(self, expectedGenotypes, actualGenotypes):
        expectedLength = len(expectedGenotypes)
        actualLength = len(actualGenotypes)
        self.assertEquals(expectedLength, actualLength, 
            "incorrect genotype lengths, expected %d, found %d" % (expectedLength, actualLength))
        
        for i in range(0, expectedLength):
            expected = expectedGenotypes[i]
            actual = actualGenotypes[i]
            
            self.assertEquals(expected.mp_headers, actual.mp_headers)
            
    
       
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(OrganizeTermsTestCase))
    # add future test suites here
    return suite

if __name__ == '__main__':
    unittest.main()
