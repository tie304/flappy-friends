from flask import Blueprint, render_template, request, session, url_for, redirect, jsonify
import json
from models.matchmaking.matchmaking import Matchmaking

from decorators.req_login import requires_login
from models.dashboard.dashboard import Dashboard

dashboard_blueprint = Blueprint('dashboard', __name__)


@dashboard_blueprint.route('/player_stats', methods=['GET'])
@requires_login
def get_player_stats():
    print('getting stats')
    stats = Dashboard().get_player_stats()
    return jsonify(stats)


@dashboard_blueprint.route('/<string:username>', methods=['GET', 'POST'])
@requires_login
def dashboard(username):
    if request.method == "POST":
        lobby = Matchmaking().create_lobby()
        return redirect(f'/lobby/{lobby}')
    return render_template('dashboard/dashboard.html')
