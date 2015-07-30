"""
Test the genotype_mp_hunter Module
"""

import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 3 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

import unittest
from pwi.hunter.genotype import genotype_mp_hunter
from mgipython.model import Genotype, VocAnnot, VocEvidence

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
            
            # convert to string for simpler comparison, since objects refs might differ
            expectedHeaders = [(h['term'], [a.term for a in h['annots']]) for h in expected.mp_headers]
            actualHeaders = [(h['term'], [a.term for a in h['annots']]) for h in actual.mp_headers]
            
            self.assertEquals(expectedHeaders, actualHeaders)
            
            
class SortAnnotationsByLongestPathTestCase(unittest.TestCase):
    """
    Test that we can sort a list of annotations
         by the longest annotated path,
             given a map of its edges for the annotated terms
    """
    
    def test_sortlongest_noedges(self):
        annot1 = self.createAnnot(10, 'term10')
        
        g1 = self.createGeno(1)
        g1.mp_headers[0]['annots'].append(annot1)
        genotypes = [g1]
        
        edgeMap = {}
        genotype_mp_hunter._sortAnnotationsByLongestPath(genotypes, edgeMap)
        
        # expected annotations and depths
        expectedGeno1 = self.createGeno(1)
        expectedAnnot1 = self.createAnnot(10, 'term10')
        expectedAnnot1.calc_depth = 0
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot1)
        
        self.assertAnnotSort([expectedGeno1], genotypes)
        
    def test_sortlongest_one_edge(self):
        annot1 = self.createAnnot(10, 'term10')
        annot2 = self.createAnnot(20, 'term20')
        
        g1 = self.createGeno(1)
        g1.mp_headers[0]['annots'].append(annot1)
        g1.mp_headers[0]['annots'].append(annot2)
        genotypes = [g1]
        
        # map 10 -> 20
        edgeMap = {1: {10: [20]}}
        genotype_mp_hunter._sortAnnotationsByLongestPath(genotypes, edgeMap)
        
        # expected annotations and depths
        expectedGeno1 = self.createGeno(1)
        expectedAnnot1 = self.createAnnot(10, 'term10')
        expectedAnnot2 = self.createAnnot(20, 'term20')
        expectedAnnot1.calc_depth = 0
        expectedAnnot2.calc_depth = 1
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot1)
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot2)
        
        self.assertAnnotSort([expectedGeno1], genotypes)
        
    def test_sortlongest_two_edges_one_longer(self):
        annot1 = self.createAnnot(10, 'term10')
        annot2 = self.createAnnot(20, 'term20')
        annot3 = self.createAnnot(30, 'term30')
        
        g1 = self.createGeno(1)
        g1.mp_headers[0]['annots'].append(annot1)
        g1.mp_headers[0]['annots'].append(annot2)
        g1.mp_headers[0]['annots'].append(annot3)
        genotypes = [g1]
        
        edgeMap = {1: {10: [20, 30], 20: [30]}}
        genotype_mp_hunter._sortAnnotationsByLongestPath(genotypes, edgeMap)
        
        # expected annotations and depths
        expectedGeno1 = self.createGeno(1)
        expectedAnnot1 = self.createAnnot(10, 'term10')
        expectedAnnot2 = self.createAnnot(20, 'term20')
        expectedAnnot3 = self.createAnnot(30, 'term30')
        expectedAnnot1.calc_depth = 0
        expectedAnnot2.calc_depth = 1
        expectedAnnot3.calc_depth = 2
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot1)
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot2)
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot3)
        
        self.assertAnnotSort([expectedGeno1], genotypes)
        
    def test_sortlongest_maintain_original_order_for_level(self):
        annot1 = self.createAnnot(10, 'term10')
        annot2 = self.createAnnot(20, 'term20')
        annot3 = self.createAnnot(30, 'term30')
        annot4 = self.createAnnot(40, 'term40')
        
        g1 = self.createGeno(1)
        g1.mp_headers[0]['annots'].append(annot1)
        g1.mp_headers[0]['annots'].append(annot4)
        g1.mp_headers[0]['annots'].append(annot2)
        g1.mp_headers[0]['annots'].append(annot3)
        genotypes = [g1]
        
        # map 10 -> 20, 10 -> 30, 10 -> 40
        edgeMap = {1: {10: [20, 30, 40]}}
        genotype_mp_hunter._sortAnnotationsByLongestPath(genotypes, edgeMap)
        
        # expected annotations and depths
        expectedGeno1 = self.createGeno(1)
        expectedAnnot1 = self.createAnnot(10, 'term10')
        expectedAnnot2 = self.createAnnot(20, 'term20')
        expectedAnnot3 = self.createAnnot(30, 'term30')
        expectedAnnot4 = self.createAnnot(40, 'term40')
        expectedAnnot1.calc_depth = 0
        expectedAnnot2.calc_depth = 1
        expectedAnnot3.calc_depth = 1
        expectedAnnot4.calc_depth = 1
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot1)
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot4)
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot2)
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot3)
        
        self.assertAnnotSort([expectedGeno1], genotypes)
        
    def test_sortlongest_two_top_parents(self):
        annot1 = self.createAnnot(10, 'term10')
        annot2 = self.createAnnot(20, 'term20')
        annot3 = self.createAnnot(30, 'term30')
        annot4 = self.createAnnot(40, 'term40')
        
        g1 = self.createGeno(1)
        g1.mp_headers[0]['annots'].append(annot1)
        g1.mp_headers[0]['annots'].append(annot2)
        g1.mp_headers[0]['annots'].append(annot3)
        g1.mp_headers[0]['annots'].append(annot4)
        genotypes = [g1]
        
        # map 10 -> 40, 30-> 20
        edgeMap = {1: {10: [40], 30: [20]}}
        genotype_mp_hunter._sortAnnotationsByLongestPath(genotypes, edgeMap)
        
        # expected annotations and depths
        expectedGeno1 = self.createGeno(1)
        expectedAnnot1 = self.createAnnot(10, 'term10')
        expectedAnnot2 = self.createAnnot(20, 'term20')
        expectedAnnot3 = self.createAnnot(30, 'term30')
        expectedAnnot4 = self.createAnnot(40, 'term40')
        expectedAnnot1.calc_depth = 0
        expectedAnnot2.calc_depth = 1
        expectedAnnot3.calc_depth = 0
        expectedAnnot4.calc_depth = 1
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot1)
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot4)
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot3)
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot2)
        
        self.assertAnnotSort([expectedGeno1], genotypes)
        
    def test_sortlongest_multiple_headers_different_paths(self):
        """
        In one header you have 10->20->30
            In the second you only have 40->30
        """
        annot1 = self.createAnnot(10, 'term10')
        annot2 = self.createAnnot(20, 'term20')
        annot3 = self.createAnnot(30, 'term30')
        
        g1 = self.createGeno(1)
        g1.mp_headers[0]['annots'].append(annot1)
        g1.mp_headers[0]['annots'].append(annot2)
        g1.mp_headers[0]['annots'].append(annot3)
        
        # add second header with different paths
        g1.mp_headers.append({'term': 'h2', 'annots':[]})
        annot3_2 = self.createAnnot(30, 'term30')
        annot4 = self.createAnnot(40, 'term40')
        g1.mp_headers[1]['annots'].append(annot3_2)
        g1.mp_headers[1]['annots'].append(annot4)
        genotypes = [g1]
        
        # 10->20->30, 40->30
        edgeMap = {1: {10: [20], 20:[30], 40:[30]}}
        genotype_mp_hunter._sortAnnotationsByLongestPath(genotypes, edgeMap)
        
        # expected annotations and depths
        expectedGeno1 = self.createGeno(1)
        expectedAnnot1 = self.createAnnot(10, 'term10')
        expectedAnnot2 = self.createAnnot(20, 'term20')
        expectedAnnot3 = self.createAnnot(30, 'term30')
        expectedAnnot1.calc_depth = 0
        expectedAnnot2.calc_depth = 1
        expectedAnnot3.calc_depth = 2
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot1)
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot2)
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot3)
        
        expectedAnnot3_2 = self.createAnnot(30, 'term30')
        expectedAnnot4 = self.createAnnot(40, 'term40')
        expectedAnnot4.calc_depth = 0
        expectedAnnot3_2.calc_depth = 1
        expectedGeno1.mp_headers.append({'term': 'h2', 'annots':[]})
        expectedGeno1.mp_headers[1]['annots'].append(expectedAnnot4)
        expectedGeno1.mp_headers[1]['annots'].append(expectedAnnot3_2)
        
        
        self.assertAnnotSort([expectedGeno1], genotypes)
        
    def test_sortlongest_complex_case(self):
        annot1 = self.createAnnot(10, 'term10')
        annot2 = self.createAnnot(20, 'term20')
        annot3 = self.createAnnot(30, 'term30')
        annot4 = self.createAnnot(40, 'term40')
        annot12 = self.createAnnot(120, 'term120')
        
        g1 = self.createGeno(1)
        g1.mp_headers[0]['annots'].append(annot1)
        g1.mp_headers[0]['annots'].append(annot2)
        g1.mp_headers[0]['annots'].append(annot3)
        g1.mp_headers[0]['annots'].append(annot4)
        g1.mp_headers[0]['annots'].append(annot12)
        genotypes = [g1]
        
        edgeMap = {1: {10: [20, 40], 40: [30]}}
        genotype_mp_hunter._sortAnnotationsByLongestPath(genotypes, edgeMap)
        
        # expected annotations and depths
        expectedGeno1 = self.createGeno(1)
        expectedAnnot1 = self.createAnnot(10, 'term10')
        expectedAnnot2 = self.createAnnot(20, 'term20')
        expectedAnnot3 = self.createAnnot(30, 'term30')
        expectedAnnot4 = self.createAnnot(40, 'term40')
        expectedAnnot12 = self.createAnnot(120, 'term120')
        expectedAnnot1.calc_depth = 0
        expectedAnnot2.calc_depth = 1
        expectedAnnot4.calc_depth = 1
        expectedAnnot3.calc_depth = 2
        expectedAnnot12.calc_depth = 0
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot1)
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot2)
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot4)
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot3)
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot12)
        
        self.assertAnnotSort([expectedGeno1], genotypes)
        
        
    def test_sortlongest_complex_case2(self):
        annot1 = self.createAnnot(10, 'term10')
        annot2 = self.createAnnot(20, 'term20')
        annot3 = self.createAnnot(30, 'term30')
        annot4 = self.createAnnot(40, 'term40')
        annot12 = self.createAnnot(120, 'term120')
        
        g1 = self.createGeno(1)
        g1.mp_headers[0]['annots'].append(annot12)
        g1.mp_headers[0]['annots'].append(annot1)
        g1.mp_headers[0]['annots'].append(annot2)
        g1.mp_headers[0]['annots'].append(annot3)
        g1.mp_headers[0]['annots'].append(annot4)
        genotypes = [g1]
        
        edgeMap = {1: {30: [40, 20, 10]}}
        genotype_mp_hunter._sortAnnotationsByLongestPath(genotypes, edgeMap)
        
        # expected annotations and depths
        expectedGeno1 = self.createGeno(1)
        expectedAnnot1 = self.createAnnot(10, 'term10')
        expectedAnnot2 = self.createAnnot(20, 'term20')
        expectedAnnot3 = self.createAnnot(30, 'term30')
        expectedAnnot4 = self.createAnnot(40, 'term40')
        expectedAnnot12 = self.createAnnot(120, 'term120')
        expectedAnnot12.calc_depth = 0
        expectedAnnot3.calc_depth = 0
        expectedAnnot1.calc_depth = 1
        expectedAnnot2.calc_depth = 1
        expectedAnnot4.calc_depth = 1
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot12)
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot3)
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot1)
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot2)
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot4)
        
        self.assertAnnotSort([expectedGeno1], genotypes)
        
    def test_sortlongest_complex_case3(self):
        annot1 = self.createAnnot(10, 'term10')
        annot2 = self.createAnnot(20, 'term20')
        annot3 = self.createAnnot(30, 'term30')
        
        g1 = self.createGeno(1)
        g1.mp_headers[0]['annots'].append(annot1)
        g1.mp_headers[0]['annots'].append(annot2)
        g1.mp_headers[0]['annots'].append(annot3)
        genotypes = [g1]
        
        edgeMap = {1: {10: [20], 30:[10]}}
        genotype_mp_hunter._sortAnnotationsByLongestPath(genotypes, edgeMap)
        
        # expected annotations and depths
        expectedGeno1 = self.createGeno(1)
        expectedAnnot1 = self.createAnnot(10, 'term10')
        expectedAnnot2 = self.createAnnot(20, 'term20')
        expectedAnnot3 = self.createAnnot(30, 'term30')
        expectedAnnot3.calc_depth = 0
        expectedAnnot1.calc_depth = 1
        expectedAnnot2.calc_depth = 2
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot3)
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot1)
        expectedGeno1.mp_headers[0]['annots'].append(expectedAnnot2)
        
        self.assertAnnotSort([expectedGeno1], genotypes)
        
    # helpers
    def createGeno(self, key):
        geno = Genotype()
        geno._genotype_key = key
        geno.mp_headers = [{'term': 'h1', 'annots':[]}]
        return geno
    
    def createAnnot(self, key, term):
        annot = VocAnnot()
        annot._term_key = key
        annot.term = term
        return annot
    
    def assertAnnotSort(self, expectedGenotypes, actualGenotypes):
        expectedLength = len(expectedGenotypes)
        actualLength = len(actualGenotypes)
        self.assertEquals(expectedLength, actualLength, 
            "incorrect genotype lengths, expected %d, found %d" % (expectedLength, actualLength))
        
        for i in range(0, expectedLength):
            expected = expectedGenotypes[i]
            actual = actualGenotypes[i]
            
            for h in range(0, len(expected.mp_headers)):
                expectedAnnots = expected.mp_headers[h]['annots']
                actualAnnots = actual.mp_headers[h]['annots']
                
                # turn annot values and depths into a string to compare
                expectedString = ["%s - %s" % (a.term, a.calc_depth) for a in expectedAnnots]
                actualString = ["%s - %s" % (a.term, a.calc_depth) for a in actualAnnots]
                
                #print "exp = %s\n" % expectedString
                #print "act = %s\n" % actualString
                
                self.assertEquals(expectedString, actualString)
            
class CollapseDuplicateAnnotationsTestCase(unittest.TestCase):
    """
    Test the helper function for collapsing duplicate MP annotations
    """
    
    def test_duplicateannotations_no_dups(self):
        geno1 = self.createGeno(1)
        annot1 = self.createAnnot(10, "term10")
        annot2 = self.createAnnot(20, "term20")
        ev1 = self.createEvidence(100)
        ev2 = self.createEvidence(200)
        
        geno1.mp_headers[0]['annots'].append(annot1)
        geno1.mp_headers[0]['annots'].append(annot2)
        
        annot1.evidences.append(ev1)
        annot2.evidences.append(ev2)
        
        genotype_mp_hunter._collapseDuplicateAnnotations([geno1])
        
        self.assertEquals([ev1], annot1.evidences)
        self.assertEquals([ev2], annot2.evidences)
        self.assertEquals(2, len(geno1.mp_headers[0]['annots']))
        
    def test_duplicateannotations_only_dups(self):
        geno1 = self.createGeno(1)
        annot1 = self.createAnnot(10, "term10")
        annot1_1 = self.createAnnot(10, "term10")
        ev1 = self.createEvidence(100)
        ev2 = self.createEvidence(200)
        
        geno1.mp_headers[0]['annots'].append(annot1)
        geno1.mp_headers[0]['annots'].append(annot1_1)
        
        annot1.evidences.append(ev1)
        annot1_1.evidences.append(ev2)
        
        genotype_mp_hunter._collapseDuplicateAnnotations([geno1])
        
        self.assertEquals([ev1,ev2], annot1.evidences)
        self.assertEquals(1, len(geno1.mp_headers[0]['annots']))
        
    def test_duplicateannotations_mixed_dups(self):
        geno1 = self.createGeno(1)
        annot1 = self.createAnnot(10, "term10")
        annot2 = self.createAnnot(20, "term20")
        annot2_2 = self.createAnnot(20, "term20")
        annot3 = self.createAnnot(30, "term30")
        ev1 = self.createEvidence(100)
        ev2 = self.createEvidence(200)
        ev3 = self.createEvidence(300)
        ev4 = self.createEvidence(400)
        ev5 = self.createEvidence(500)
        
        geno1.mp_headers[0]['annots'].append(annot1)
        geno1.mp_headers[0]['annots'].append(annot2)
        geno1.mp_headers[0]['annots'].append(annot2_2)
        geno1.mp_headers[0]['annots'].append(annot3)
        
        annot1.evidences.append(ev1)
        annot2.evidences.append(ev2)
        annot2_2.evidences.append(ev3)
        annot2_2.evidences.append(ev4)
        annot3.evidences.append(ev5)
        
        genotype_mp_hunter._collapseDuplicateAnnotations([geno1])
        
        self.assertEquals([ev1], annot1.evidences)
        self.assertEquals([ev2,ev3,ev4], annot2.evidences)
        self.assertEquals([ev5], annot3.evidences)
        self.assertEquals(3, len(geno1.mp_headers[0]['annots']))
        
        
    # helpers
    def createGeno(self, key):
        geno = Genotype()
        geno._genotype_key = key
        geno.mp_headers = [{'term': 'h1', 'annots':[]}]
        return geno
    
    def createAnnot(self, key, term):
        annot = VocAnnot()
        annot._term_key = key
        annot.term = term
        return annot
    
    def createEvidence(self, key):
        ev = VocEvidence()
        ev._annotevidence_key = key
        return ev
            
class LongestPathEdgeMapTestCase(unittest.TestCase):
    """
    Test the helper function for reducing an edgeMap to
        its longest paths
    """
    
    def test_longestpath_empty(self):
        edgeMap = {}
        newEdgeMap = genotype_mp_hunter._longestPathEdgeMap(edgeMap)
        self.assertEquals(edgeMap, newEdgeMap)
        
    def test_longestpath_one_edge(self):
        edgeMap = { 1: set([2])}
        newEdgeMap = genotype_mp_hunter._longestPathEdgeMap(edgeMap)
        self.assertEquals(edgeMap, newEdgeMap)
        
    def test_longestpath_two_edges_one_child(self):
        edgeMap = { 1: [2, 3], 2: [3]}
        newEdgeMap = genotype_mp_hunter._longestPathEdgeMap(edgeMap)
        # path from 1 -> 3 is redundant and shorter than 1 -> 2, 2 -> 3
        self.assertEquals({ 1: set([2]), 2: set([3])}, newEdgeMap)
        
    def test_longestpath_three_edges_all_longest(self):
        edgeMap = { 1: [2], 3: [4], 5: [6]}
        newEdgeMap = genotype_mp_hunter._longestPathEdgeMap(edgeMap)
        self.assertEquals({ 1: set([2]), 3: set([4]), 5: set([6])}, newEdgeMap)
        
        
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(OrganizeTermsTestCase))
    suite.addTest(unittest.makeSuite(LongestPathEdgeMapTestCase))
    suite.addTest(unittest.makeSuite(CollapseDuplicateAnnotationsTestCase))
    suite.addTest(unittest.makeSuite(SortAnnotationsByLongestPathTestCase))
    # add future test suites here
    return suite

if __name__ == '__main__':
    unittest.main()
