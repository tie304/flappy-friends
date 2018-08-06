from flask import session, redirect
from decorators.singleton import Singleton
from models.lobby.lobby import Lobby


class Matchmaking(object, metaclass=Singleton):
    def __init__(self,socketio):
        self.socketio = socketio
        self.lobbies = []



    def __repr__(self):
        f"<Matchmaker with {len(self.lobbies)} waiting for games>"


    def create_lobby(self):
        print(self.lobbies)
        for lobby in self.lobbies:
            print(lobby)
            #if 1 player already in lobby add other player to it
            if len(lobby.players) == 1:
                self.add_player_to_lobby(lobby)
                self.delete_lobby()
                return lobby.lobby_id
        lobby = Lobby(self.socketio)
        lobby.add_to_room(session['username'])
        self.lobbies.append(lobby)

        #check if any lobbies need to be removed
        self.delete_lobby()
        return lobby.lobby_id


    def delete_lobby(self):
        for lobby in self.lobbies:
            if lobby.game_started:
                lobby_index_position = self.lobbies.index(lobby)
                del self.lobbies[lobby_index_position]


    def add_player_to_lobby(self,lobby):
        lobby.add_to_room(session['username'])
