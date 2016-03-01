# Define the query form objects
from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from widgets import *
from base import *

from flask.ext.login import current_user
from pwi.edit import emapa_clipboard

class EMAPAClipboardForm(Form, MGIForm):
    """
    Edit EMAPA clipboard data
    """
    
    # clipboard stage input
    stagesToAdd = TextField('Stage(s) to add')
    
    emapaId = TextField('EMAPA ID')
    
    # clipboard delete items
    keysToDelete = TextField('_setmember_key(s) to delete')
    
    
    def editClipboard(self):
        """
        Perform actual add / delete to clipboard
        """
        
        # check login
        if current_user.is_authenticated:
            
            _user_key = current_user._user_key
            
            # perform add
            if self.stagesToAdd.data and self.emapaId.data:
                
                emapa_clipboard.addItems(_user_key, 
                                        self.emapaId.data,
                                        self.stagesToAdd.data
                )
            
            if self.keysToDelete.data:
                
                emapa_clipboard.deleteItems(_user_key,
                                            self.keysToDelete.data
                )
                