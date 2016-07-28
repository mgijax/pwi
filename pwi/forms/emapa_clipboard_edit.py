# Define the query form objects
from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from widgets import *
from pwi import app, db
from base import *

from flask_login import current_user
from mgipython.service.emapa_clipboard_service import EMAPAClipboardService

class EMAPAClipboardForm(Form, MGIForm):
    """
    Edit EMAPA clipboard data
    """
    
    clipboard_service = EMAPAClipboardService()
    
    
    # clipboard stage input
    stagesToAdd = TextField('Stage(s) to add')
    
    emapaId = TextField('EMAPA ID')
    
    # clipboard delete items
    keysToDelete = TextField('_setmember_key(s) to delete')
    
                
    def sortClipboard(self):
        """
        Perform sort of user's clipboard
        """
        
        # check login
        if current_user.is_authenticated:
            _user_key = current_user._user_key
            self.clipboard_service.sort_clipboard(_user_key)
                