from flask import Blueprint, render_template, request, session, url_for, redirect
from models.lobby.lobby import Lobby
from models.lobby.errors import DuplicateUsername
from flask_socketio import join_room, leave_room, send, emit
from models.users.user import User
from decorators.req_logout import requires_logout
import models.users.errors as UserErrors






users_blueprint = Blueprint('users', __name__)

@users_blueprint.route('/register', methods=['GET','POST'])

#TODO requies logout decorator seems to break server
#@requires_logout
def index():
    if request.method == "POST":
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']

        #TODO need to handle errors
        try:
            User.register_user(email,username, password)
            session['email'] = email
            session['username'] = username


            return redirect(f'/dashboard/{username}')
        except UserErrors.UserError as e:
            return render_template('users/register.html', error_message=e.message)
    return render_template('users/register.html')



@users_blueprint.route('/login', methods=['GET','POST'])
def login():
    if request.method == "POST":
        email = request.form['email']
        password = request.form['password']

        try:
            check_login = User.is_login_valid(email, password)
            #makes a session with email
            print(check_login)
            if check_login:
                session['email'] = email
                session['username'] = check_login['display_name']

            #gets current file and change address to profile
                return redirect(f"/dashboard/{session['username']}")
        except UserErrors.UserError as e:
            return render_template('users/login.html', error_message=e.message)

        return redirect(f'/dashboard/{username}')
    return render_template('users/login.html')



@users_blueprint.route('/logout', methods=['GET','POST'])
def logout():
    session['username'] = None
    session['email'] = None
    return redirect('/')
