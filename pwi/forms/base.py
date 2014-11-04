from widgets import *

class MGIForm():
    """
    A base class for all MIG forms with some shared functions
    """
    def argString(self, showInvisibles=False):
        pairs = []
        for key, value in self.data.items():
            field = self._fields[key]
            if value and (showInvisibles or not isinstance(field, InvisibleField)):
                pairs.append('%s=%s' % (key, value))
        return '&'.join(pairs)
        
    def fullArgString(self):
        return self.argString(showInvisibles=True)