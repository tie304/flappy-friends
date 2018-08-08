from flask import Blueprint, render_template, request, session, url_for, redirect
lobby_blueprint = Blueprint('lobby', __name__)


@lobby_blueprint.route('/<string:lobby_id>', methods=['GET','POST'])
def lobby(lobby_id):
    return render_template('./lobby/room.html', lobby=lobby_id)
