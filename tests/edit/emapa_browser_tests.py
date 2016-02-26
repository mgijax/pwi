"""
Test the readonly functionality of the EMAPA clipboard & browser.

See tests under runEditorTests script for data modification tests.
"""

import sys
import os
# adjust the path for running the tests locally, so that it can find pwi (i.e. 2 dirs up)
sys.path.insert(1, os.path.join(os.path.dirname(__file__), '../..'))

from tests import test_config

import unittest

from pwi import app

DBO_USER = app.config['PG_USER']
DBO_PASS = app.config['PG_PASS']

tc = app.test_client()


### NOTE: PLEASE MOVE THISE CODE TO ANOTHER MODULE ###

from exceptions import SyntaxError, ValueError
class InvalidStageInputError(SyntaxError):
    """
    Raised on invalid theiler stage input
    """

def stageParser(input):
    """
    parse input into list of theiler stages
    
    Valid inputs are:
        1) single stage "1" or "10"
        2) list "1,2,3" or "10, 11, 20"
        3) range "1-20"
        4) all stages "*"
    """
    stages = []
    
    if input:
        
        input = input.lower()
        
        # check for wildcard
        if "*" in input \
            or "all" in input:
            
            return range(1, 29)
        
        # split on comma, then parse each token
        commaSplit = input.split(",")
        
        tokens = []
        
        for token in commaSplit:
            
            token = token.strip()
            if token:
                
                # resolve range input
                if "-" in token:
                    dashSplit = token.split("-")
                    
                    # cannot have more than two operands
                    if len(dashSplit) != 2:
                        msg = "invalid range input: %s" % (token)
                        raise InvalidStageInputError(msg)
                    
                    left = dashSplit[0].strip()
                    right = dashSplit[1].strip()
                    
                    # left and right must not be whitespace
                    if not left and right:
                        msg = "invalid range input: %s" % (token)
                        raise InvalidStageInputError(msg)
                    
                    # left and right must be integers
                    try:
                        leftStage = int(left)
                        rightStage = int(right)
                    except ValueError, ve:
                        raise InvalidStageInputError(ve.message)
                    
                    # left must not be greater than right
                    if leftStage > rightStage:
                        msg = "invalid range input %d > %d: %s" % (leftStage, rightStage, token)
                        raise InvalidStageInputError(msg)
                    
                    # IFF range input is valid, we add the range of values
                    for stage in range(leftStage, rightStage + 1):
                        tokens.append(stage)
               
                else:
                    tokens.append(token)
        
        
        seen = set([])
        for stage in tokens:
        
            try:
                stage = int(stage)
            except ValueError, ve:
                raise InvalidStageInputError(ve.message)
            
            # only add distinct list of stages
            if stage in seen:
                continue
            seen.add(stage)
            
            stages.append(stage)
    
    return stages

#####################################################



class TheilerStageParserTestCase(unittest.TestCase):
    """
    Test parsing of theiler stage input
    """
    
    
    def test_empty_input(self):
        stages = stageParser("")
        expected = []
        self.assertEqual(expected, stages)

    def test_single_stage(self):
        stages = stageParser("10")
        expected = [10]
        self.assertEqual(expected, stages)
        
    def test_invalid_integer(self):
        """
        non-integer should throw custom exception
        """
        
        with self.assertRaises(InvalidStageInputError):
            stageParser("b")
            
    def test_list_input(self):
       stages = stageParser("1, 11, 10")
       expected = [1, 11, 10]
       self.assertEqual(expected, stages)
       
    def test_list_input_unique(self):
       stages = stageParser("1, 10, 10, 10, 20")
       expected = [1, 10, 20]
       self.assertEqual(expected, stages)
       
    def test_range_input(self):
       stages = stageParser("7-10")
       expected = [7, 8, 9, 10]
       self.assertEqual(expected, stages)
       
    def test_range_input_same_stage(self):
       stages = stageParser("10-10")
       expected = [10]
       self.assertEqual(expected, stages)
       
    def test_invalid_range_multiple_ranges(self):
        
        with self.assertRaises(InvalidStageInputError):
            stageParser("1-10-4")
            
        with self.assertRaises(InvalidStageInputError):
            stageParser("1--4")
            
    def test_invalid_range_non_integer(self):
        
        with self.assertRaises(InvalidStageInputError):
            stageParser("1-b")
            
        with self.assertRaises(InvalidStageInputError):
            stageParser("b-10")
            
        with self.assertRaises(InvalidStageInputError):
            stageParser("x-z")
            
    def test_invalid_range_empty_range(self):
        
        with self.assertRaises(InvalidStageInputError):
            stageParser(" -4")
            
        with self.assertRaises(InvalidStageInputError):
            stageParser("10 - ")
            
        with self.assertRaises(InvalidStageInputError):
            stageParser(" - ")
            
            
    def test_invalid_range_left_greater_than_right(self):
        
        with self.assertRaises(InvalidStageInputError):
            stageParser("10 - 2")
            
            
    def test_range_and_list(self):
       stages = stageParser("1, 5-7, 20, 22-24")
       expected = [1, 5,6,7, 20, 22,23,24]
       self.assertEqual(expected, stages)
       
       
    def test_wildcard_asterisk(self):
       stages = stageParser("*")
       expected = range(1,29)
       self.assertEqual(expected, stages)
       
    def test_wildcard_all(self):
       stages = stageParser("all")
       expected = range(1,29)
       self.assertEqual(expected, stages)
       
       stages = stageParser("ALL")
       self.assertEqual(expected, stages)
       
       
    def test_wildcard_in_list (self):
       stages = stageParser("1, *, 20")
       expected = range(1,29)
       self.assertEqual(expected, stages)


class EMAPASearchTestCase(unittest.TestCase):
    """
    Test EMAPA term searches
    """
    
    ### Helpers ###
    
    # NOTE: no logins needed for searching
            
    ### Tests ###
            
    def test_emapa_basic_term_search(self):
        # query for single structure
        r = tc.get('/edit/emapTermResults', 
                   query_string={
                         'termSearch':'brain'
                    }
        )    
        
        assert 'brain' in r.data, "Check term returned"
        assert '17' in r.data, "Check start stage"
        assert '28' in r.data, "Check end stage"
        
        
    def test_emapa_synonym_search(self):
        # query for single structure synonym
        r = tc.get('/edit/emapTermResults', 
                   query_string={
                         'termSearch':'kidney'
                    }
        )    
        
        assert 'metanephros' in r.data, "Check term returned"
        
    def test_emapa_wildcard_search(self):
        # query for structure with wildcards
        r = tc.get('/edit/emapTermResults', 
                   query_string={
                         'termSearch':'%ear%'
                    }
        )    
        
        assert 'h<mark>ear</mark>t' in r.data, "Check highlighted term returned"
        
    def test_emapa_id_search(self):
        # query for single emapa ID
        r = tc.get('/edit/emapTermResults', 
                   query_string={
                         'termSearch':'EMAPA:16894'
                    }
        )    
        
        assert 'brain' in r.data, "Check term returned"
        
        
    def test_emapa_search_multiples(self):
        # query for multiple structures
        r = tc.get('/edit/emapTermResults', 
                   query_string={
                         'termSearch':'nervous system; heart'
                    }
        )    
        
        assert 'heart' in r.data, "Check term returned"
        assert 'nervous system' in r.data, "Check term returned"
        
        
class EMAPATermDetailTestCase(unittest.TestCase):
    """
    Test EMAPA term detail
    """
    
    ### Helpers ###
    
    # NOTE: no logins needed for searching
            
    ### Tests ###
            
    def test_emapa_basic_term_detail(self):
        # detail for metanephros
        r = tc.get('/edit/emapTermDetail/EMAPA:17373')    
        
        assert 'metanephros' in r.data, "Check term returned"
        assert '18-28' in r.data, "Check TS range"
        assert 'EMAPA:17373' in r.data, "Check ID"
        assert 'kidney' in r.data, "Check synonym"
        assert 'is-a' in r.data, "Check parent label"
        assert 'urinary system' in r.data, "Check parent term"
    
    
class EMAPAClipboardTestCase(unittest.TestCase):
    """
    Test user interaction with clipboard
    """
    
    ### Helpers ###

    def login(self, user):
        return tc.post('/login', data=dict(
            user=user,
            password='' # no password for tests
        ), follow_redirects=True)

    def logout(self):
           return tc.get('/logout', follow_redirects=True)

    ### setUp / tearDown ###

    def setUp(self):
         self.login(DBO_USER)
            
    def tearDown(self):
        # ensure that any created reports are deleted
        self.login(DBO_USER)
        
            
    ### Tests ###
            
    def test_do_clipboard_stuff(self):
        # TODO (kstone): Implement tests when we build the clipboard functionality
        pass
        

        
        
def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(EMAPASearchTestCase))
    suite.addTest(unittest.makeSuite(EMAPATermDetailTestCase))
    suite.addTest(unittest.makeSuite(EMAPAClipboardTestCase))
    suite.addTest(unittest.makeSuite(TheilerStageParserTestCase))
    return suite

if __name__ == '__main__':
    unittest.main()
    
