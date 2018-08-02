import uuid
from flask import session, redirect, request
import time
from flask_socketio import join_room, leave_room, send, emit
import re
from models.lobby.errors import DuplicateUsername


class Lobby(object):
    def __init__(self,socketio):
        self.socketio = socketio
        self.players = []
        self.lobby_id = uuid.uuid4().hex
        self.players_ready = 0
        self.run_lobby_sockets(self.socketio)
        self.game_started = False


    def __repr__(self):
        return f"f<Lobby with {len(self.players)} players>"


    def add_to_room(self,player):
        self.players.append({
            'player': player,
            'room_id': self.lobby_id,
            'ready': False
        })

        return self.lobby_id
        """

        sets player ready status to true

        """
    def update_player_ready_status(self,user):
        print('updating player statuses')

        for idx, player in enumerate(self.players):
            if player['player'] == user:
                self.players[idx]['ready'] = True
        if self.check_player_statuses():
            return self.initalize_game(user)
        else:
            return {'user': user, 'message': user + ' is ready to play!'}




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
            if player['ready'] == True:
                self.players_ready += 1
        print(self.players_ready,len(self.players))
        if self.players_ready == len(self.players) and len(self.players) == 2:
            self.game_started = True
            return True
        else:
            return False

    def initalize_game(self,user):
        return {'starting': True , 'message': ' All players Ready, game will start soon!'}

    def check_username(self,username):
        if username in self.players:
            raise ValueError('Sorry username already taken')

    def run_lobby_sockets(self,socketio):
        @socketio.on('connect',namespace=f'/{self.lobby_id}')
        def connect():
            print("CONNECTING")
            username = session['username']
            #room = session['room']
            #join_room(room)

            emit('message_board', {'user': session['username'], 'message': username + ' has entered the room.'})

        @socketio.on('ready_to_play',namespace=f'/{self.lobby_id}')
        def message(data):
            status = self.update_player_ready_status(session['username'])
            emit('message_board', status ,broadcast=True)

        @socketio.on('disconnect',namespace=f'/{self.lobby_id}')
        def disconnect():
            print('DISCONNECTING')
            email = session['email']
            #room = session['room']
            self.remove_player(email)
            #leave_room(room)
            emit('message_board',{'user': session['username'], 'message': username + ' has left the room.'})

        @socketio.on('chat',namespace=f'/{self.lobby_id}')
        def message(data):
            #strip tags for sercurity
            chat = re.sub('<[^<]+?>', '', data['message'])
            data['message'] = chat
            emit('chat_broadcast', data , broadcast=True)
