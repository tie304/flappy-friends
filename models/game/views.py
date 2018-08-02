from flask import Blueprint, render_template, request, session, url_for, redirect
from flask_socketio import join_room, leave_room, send, emit
from models.game.game import Game

from models.games.games import Games
from decorators.req_login import requires_login



game_blueprint = Blueprint('game', __name__)



@game_blueprint.route('/<string:game_id>')
@requires_login
def game_index(game_id):
    Games().add_game(game_id)

    #TODO append player to each specific game

    return render_template('game/game.html')
