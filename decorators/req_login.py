from flask import session, url_for, redirect, request
from functools import wraps

def requires_login(func):
    @wraps(func)
    def decorated_function(*args,**kwargs):
        if 'email' not in session.keys() or session['email'] is None:
            return redirect(url_for('lobby.index', next=request.path))
        return func(*args,**kwargs)
    return decorated_function
