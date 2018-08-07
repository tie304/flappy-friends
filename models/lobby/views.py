from flask import Blueprint, render_template, request, session, url_for, redirect
from models.lobby.lobby import Lobby
from models.lobby.errors import DuplicateUsername
from flask_socketio import join_room, leave_room, send, emit
from models.users.user import User
from decorators.req_logout import requires_logout






lobby_blueprint = Blueprint('lobby', __name__)

@lobby_blueprint.route('/', methods=['GET','POST'])

#TODO requies logout decorator seems to break server
#@requires_logout
def index():
    if request.method == "POST":
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        #TODO need to handle errors
        User.register_user(email,username, password)

        session['username'] = username
        session['email'] = email

        return redirect(f'/dashboard/{username}')
    return render_template('lobby/lobby.html')

@lobby_blueprint.route('/<string:lobby_id>', methods=['GET','POST'])
def lobby(lobby_id):
    return render_template('./lobby/room.html', lobby=lobby_id)
