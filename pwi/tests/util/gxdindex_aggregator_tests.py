"""
Test the gxdindex_aggregator Module
"""

import sys,os.path
# adjust the path for running the tests locally, so that it can find pwi (i.e. 3 dirs up)
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

import unittest
from pwi.util.gxdindex import gxdindex_aggregator
from pwi.model import GxdIndexRecord, GxdIndexStage

class AggregateGenesByAssayAndStageTest(unittest.TestCase):
    """
    Ensure that aggregateGenesByAssayAndStage() correctly creates the 
        countSummary for gxdindex summary for reference
    """
    
    def test_genecounts_empty(self):
        
        summary = gxdindex_aggregator.aggregateGenesByAssayAndStage([])
       
        self.assertEqual({'stages':[], 'assays':[]}, summary)
        
    def test_genecounts_onerecord(self):
        
        rec1 = self.makeIndexRecord(1)
        self.makeIndexStage(rec1, 10, 'Prot-sxn', 100, '13.5')
        
        recs = [rec1]
        summary = gxdindex_aggregator.aggregateGenesByAssayAndStage(recs)
        
        expected = {'stages':['13.5'], 
                    'assays':[{'indexassay':'Prot-sxn', 'stages':[1]}]
                    }
       
        self.assertEqual(expected, summary)
        
    def test_genecounts_manystages_oneassay(self):
        
        rec1 = self.makeIndexRecord(1)
        self.makeIndexStage(rec1, 10, 'Prot-sxn', 100, '13.5')
        self.makeIndexStage(rec1, 10, 'Prot-sxn', 200, '15.5')
        self.makeIndexStage(rec1, 10, 'Prot-sxn', 300, 'A')
        
        recs = [rec1]
        summary = gxdindex_aggregator.aggregateGenesByAssayAndStage(recs)
        
        expected = {'stages':['13.5','15.5','A'], 
                    'assays':[{'indexassay':'Prot-sxn', 'stages':[1,1,1]}]
                    }
       
        self.assertEqual(expected, summary)
        
    def test_genecounts_manyassays_onestage(self):
        
        rec1 = self.makeIndexRecord(1)
        self.makeIndexStage(rec1, 10, 'Prot-sxn', 100, '18.5')
        self.makeIndexStage(rec1, 20, 'RT-PCR', 100, '18.5')
        self.makeIndexStage(rec1, 30, 'RT-PCR2', 100, '18.5')
        
        recs = [rec1]
        summary = gxdindex_aggregator.aggregateGenesByAssayAndStage(recs)
        
        expected = {'stages':['18.5'], 
                    'assays':[{'indexassay':'Prot-sxn', 'stages':[1]},
                              {'indexassay':'RT-PCR', 'stages':[1]},
                              {'indexassay':'RT-PCR2', 'stages':[1]}]
                    }
       
        self.assertEqual(expected, summary)
        
    def test_genecounts_multiple_records_and_stages_no_gaps(self):
        
        rec1 = self.makeIndexRecord(1)
        self.makeIndexStage(rec1, 10, 'Prot-sxn', 100, '18.5')
        self.makeIndexStage(rec1, 10, 'Prot-sxn', 200, 'E')
        self.makeIndexStage(rec1, 20, 'RT-PCR', 100, '18.5')
        self.makeIndexStage(rec1, 20, 'RT-PCR', 200, 'E')
        
        rec2 = self.makeIndexRecord(1)
        self.makeIndexStage(rec2, 20, 'RT-PCR', 100, '18.5')
        self.makeIndexStage(rec2, 20, 'RT-PCR', 200, 'E')
        
        rec3 = self.makeIndexRecord(1)
        self.makeIndexStage(rec3, 10, 'Prot-sxn', 100, '18.5')
        self.makeIndexStage(rec3, 20, 'RT-PCR', 100, '18.5')
        
        recs = [rec1, rec2, rec3]
        summary = gxdindex_aggregator.aggregateGenesByAssayAndStage(recs)
        
        expected = {'stages':['18.5','E'], 
                    'assays':[{'indexassay':'Prot-sxn', 'stages':[2,1]},
                              {'indexassay':'RT-PCR', 'stages':[3,2]}]
                    }
       
        self.assertEqual(expected, summary)
        
    def test_genecounts_multiple_records_and_stages_with_gaps(self):
        
        rec1 = self.makeIndexRecord(1)
        self.makeIndexStage(rec1, 10, 'Prot-sxn', 100, '18.5')
        self.makeIndexStage(rec1, 10, 'Prot-sxn', 200, 'E')
        self.makeIndexStage(rec1, 20, 'RT-PCR', 200, 'E')
        
        rec2 = self.makeIndexRecord(1)
        self.makeIndexStage(rec2, 20, 'RT-PCR', 200, 'E')
        
        rec3 = self.makeIndexRecord(1)
        self.makeIndexStage(rec3, 10, 'Prot-sxn', 300, 'A')
        
        recs = [rec1, rec2, rec3]
        summary = gxdindex_aggregator.aggregateGenesByAssayAndStage(recs)
        
        expected = {'stages':['18.5','E','A'], 
                    'assays':[{'indexassay':'Prot-sxn', 'stages':[1,1,1]},
                              {'indexassay':'RT-PCR', 'stages':[0,2,0]}]
                    }
       
        self.assertEqual(expected, summary)
            
            
    # helpers
    def makeIndexRecord(self, _index_key):
        rec = GxdIndexRecord()
        rec._index_key = _index_key
        return rec
    
    def makeIndexStage(self, indexRecord, _indexassay_key, indexassay,
                        _stageid_key, stageid):
        stage = GxdIndexStage()
        stage._indexassay_key = _indexassay_key
        stage.indexassay = indexassay
        stage._stageid_key = _stageid_key
        stage.stageid = stageid
        
        stage._index_key = indexRecord._index_key
        indexRecord.indexstages.append(stage)
        
        return stage
          
        
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(AggregateGenesByAssayAndStageTest))
    # add future test suites here
    return suite

if __name__ == '__main__':
    unittest.main()
