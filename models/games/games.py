#from app import socketio
from models.player.player import Player
from models.game.game import Game
from decorators.singleton import Singleton


"""
Single class instance responsible for managing all game instances

"""


class Games(object, metaclass=Singleton):
    def __init__(self, socketio):
        self.games = []
        self.socketio = socketio

    def add_game(self, game_id, players):
        for game in self.games:
            if game.game_id == game_id:
                return None
        return self.games.append(Game(game_id, players, self.socketio))

    def remove_game(self):
        for game in self.games:
            if len(game.players) == 0:
                game_index_position = self.games.index(game)
                del self.games[game_index_position]
