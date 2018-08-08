import uuid
from flask import session, redirect, request
import time
from flask_socketio import join_room, leave_room, send, emit
import re
from models.lobby.errors import DuplicateUsername
from models.games.games import Games
from models.player.player import Player


class Lobby(object):

    def __init__(self,socketio):
        self.socketio = socketio
        self.players = []
        self.lobby_id = uuid.uuid4().hex
        self.players_ready = 0
        self.run_lobby_sockets(self.socketio)
        self.game_started = False
        self.available_birds = ['redbird','yellowbird']


    def __repr__(self):
        return f"f<Lobby with {len(self.players)} players>"


    def add_to_room(self,player):
        return self.lobby_id
        """

        sets player ready status to true

        """

    def update_player_ready_status(self,user):
        print('updating player statuses')
        for idx, player in enumerate(self.players):
            if player.name == user:
                self.players[idx].lobby_ready = True
        if self.check_player_statuses():
            return self.initalize_game(user)
        else:
            return {'user': user, 'message': user + ' is ready to play!'}


    """

    Removes player from players list on disconnect event

    """

    def remove_player(self,email):
        for player in self.players:
            if email == player.email:
                player_index_position = self.players.index(player)
                del self.players[player_index_position]


    """

    checks if all players are ready to play

    """



    def check_player_statuses(self):
        self.players_ready = 0
        for player in self.players:
            if player.lobby_ready == True:
                self.players_ready += 1
        print(self.players_ready,len(self.players))
        if self.players_ready == len(self.players) and len(self.players) == 2:
            self.game_started = True
            return True
        else:
            return False

    def initalize_game(self,user):
        Games().add_game(self.lobby_id, self.players)
        return {'starting': True , 'message': ' All players Ready, game will start soon!'}

    def check_username(self,username):
        if username in self.players:
            raise ValueError('Sorry username already taken')

    def check_bird_availability(self,check_bird):
            if check_bird in self.available_birds:
                return True


    def run_lobby_sockets(self,socketio):
        print('RUNNING LOBBY SOCKETS')
        @socketio.on('connect',namespace=f'/{self.lobby_id}')
        def connect():
            self.players.append(Player(session['username'], session['email']))
            both_connected = False
            if len(self.players) == 2:
                both_connected = True
            emit('message_board', {'user': session['username'], 'message': session['username'] + ' has entered the game.', 'both_connected': both_connected}, broadcast=True)

        @socketio.on('ready_to_play',namespace=f'/{self.lobby_id}')
        def message(data):
            status = self.update_player_ready_status(session['username'])
            emit('message_board', status ,broadcast=True)

        @socketio.on('disconnect',namespace=f'/{self.lobby_id}')
        def disconnect():
            print('DISCONNECTING')
            email = session['email']
            self.remove_player(email)
            emit('message_board',{'user': session['username'], 'message': session['username'] + ' has left the room.'})



        @socketio.on('bird_selection',namespace=f'/{self.lobby_id}')
        def bird_selection(bird):
            for player in self.players:
                if player.name == session['username'] and self.check_bird_availability(bird['bird']) and not player.bird:
                    player.bird = bird['bird']
                    print(self.available_birds)
                    del self.available_birds[self.available_birds.index(bird['bird'])]
                    print(self.available_birds)
                    emit('selected_bird', {'selected_bird': bird['bird'], 'username': session['username']}, broadcast=True)



        @socketio.on('chat',namespace=f'/{self.lobby_id}')
        def message(data):
            #strip tags for security
            chat = re.sub('<[^<]+?>', '', data['message'])
            data['message'] = chat
            emit('chat_broadcast', data , broadcast=True)
