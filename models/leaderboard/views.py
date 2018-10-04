from flask import Blueprint, render_template, request, session, url_for, redirect,  jsonify
import json


from models.leaderboard.leaderboard import Leaderboard
from decorators.req_login import requires_login


leaderboard_blueprint = Blueprint('leaderboard', __name__)


@leaderboard_blueprint.route('/', methods=['GET'])
@requires_login
def leaderboard():
    leaders = Leaderboard().fetch_leaders()
    return render_template('./leaderboard/leaderboard.html', leaders=leaders)


@leaderboard_blueprint.route('/search', methods=['POST'])
@requires_login
def search_user():
    search = request.get_json()
    return jsonify(Leaderboard().search_user(search))
