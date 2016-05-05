"""
All error types for the pwi
"""


### EMAPA  Browser ###
class InvalidStageInputError(SyntaxError):
    """
    Raised on invalid theiler stage input
    """

class InvalidEMAPAIDError(SyntaxError):
    """
    Raised on invalid EMAPA ID input
    """
