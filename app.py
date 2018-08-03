from flask import Flask, render_template
from flask_socketio import SocketIO
from database.database import Database

from config import Config
from models.games.games import Games
from models.matchmaking.matchmaking import Matchmaking


config = Config('production')


app = Flask(__name__)
socketio = SocketIO(app)
app.secret_key = config.secret_key

print('app running')
@app.before_first_request
def init_db():
    Database.initialize(config.database_URI,config.database_name)
    print(config.database_URI)

@app.route('/')
def home():
    return render_template('./landing/home.html')


Games(socketio)
Matchmaking(socketio)

from models.dashboard.views import dashboard_blueprint
from models.lobby.views import lobby_blueprint
from models.game.views import game_blueprint
from models.leaderboard.views import leaderboard_blueprint

app.register_blueprint(lobby_blueprint, url_prefix='/lobby')
app.register_blueprint(game_blueprint, url_prefix='/game')
app.register_blueprint(dashboard_blueprint, url_prefix='/dashboard')
app.register_blueprint(leaderboard_blueprint, url_prefix='/leaderboard')

if __name__ == "__main__":
    socketio.run(app)
