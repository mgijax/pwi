"""
Monkey patch flask_restplus 


1) make restplus handle errors better
2) make specs_url be relative


"""

from flask import url_for
import flask_restplus


class Api(flask_restplus.Api):
    """
    Patch Flask-style custom error handling into the Flask_restplus api class.
    """

    def __init__(self, *args, **kwargs):
        super(Api, self).__init__(*args, **kwargs)
        self._errorhandlers = []

    def errorhandler(self, exception_type):
        """
        Defined handlers for exceptions. Example:

        @api.errorhandler(ServerError):
        def handle_server_error(error):
            response = flask.jsonify({'message': error.message})
            response.status_code = error.status_code
            return response
        """
        def wrapper(func):
            self._errorhandlers.append((exception_type, func))
            # Sort error handlers to have sub exceptions first, so that those
            # take preference over base exceptions.
            #self._errorhandlers = sorted(
            #    self._errorhandlers,
            #    key=lambda x: x[0],
            #    cmp=self._inheritance_comparator)
            
            return func
        return wrapper

    def handle_error(self, error, previous_errors=None):
        # Keep track of previous errors in the current chain of exception
        # handling in order to prevent infinite cycles that would occur if two
        # error handler raise the exception handled by the other.
        previous_errors = previous_errors or []
        previous_errors.append(type(error))
        # Try to find the first custom handler for the occured exception.
        for exception_type, handler in self._errorhandlers:
            if not isinstance(error, exception_type):
                continue
            try:
                return handler(error)
            except Exception as new_error:
                if type(new_error) not in previous_errors:
                    return self.handle_error(new_error, previous_errors)
            break
        # If no matching handler was found or an infinite cycle is detected,
        # fall back to Flask-RESTful's error handling.
        return super(Api, self).handle_error(error)

    @staticmethod
    def _inheritance_comparator(lhs, rhs):
        lhs_sub = issubclass(lhs, rhs)
        rhs_sub = issubclass(rhs, lhs)
        if lhs_sub and not rhs_sub:
            return -1
        if rhs_sub and not lhs_sub:
            return 1
        return 0
    
    
    @property
    def specs_url(self):
        return url_for(self.endpoint('specs'))
        
