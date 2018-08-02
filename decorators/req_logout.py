from flask import session, url_for, redirect, request
from functools import wraps

def requires_logout(func):
    @wraps(func)
    def decorated_function(*args,**kwargs):
        if 'email' in session.keys() or session['email'] is not None:
            return redirect(url_for('home', next=request.path))
        return func(*args,**kwargs)
    return decorated_function
