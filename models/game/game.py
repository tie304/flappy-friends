from flask import url_for, redirect, Blueprint, render_template, request, session, url_for, redirect
from flask_socketio import join_room, leave_room, send, emit
from operator import attrgetter
import uuid
import math
import random

from database.database import Database
from models.player.player import Player




class Game(object):

    def __init__(self,game_id,socketio):
        self.game_id = game_id
        self.players = []
        self.pipes = []
        self.socketio = socketio
        self.run_game_sockets(self.socketio)


    def __repr__(self):
        return f"<Game with {len(self.players)} players>"

    def start_game(self):
        print(f'starting the game with {self.players}')
        self.render_pipes()

    def check_players(self):
        if len(self.players) == 2:
            self.start_game()
            return True
        return False

    def render_pipes(self):
        for i in range(100):
            fly_area = 420 #TODO dynamic fly area
            padding = 80
            pipeheight = 90
            constraint = fly_area - pipeheight - (padding * 2)
            top_height = int(math.floor((random.random()) * constraint) + padding)
            bottom_height = (fly_area - pipeheight) - top_height
            string = f"<div class='pipe animated'><div class='pipe_upper' style='height: {top_height}px;'> </div> <div class='pipe_lower' style='height: {bottom_height}px'</div></div>"
            self.pipes.append(string)

    def check_players_alive(self):
        dead = 0
        for player in self.players:
            if player.alive == False:
                dead += 1
        if dead == len(self.players):
            return self.players
        else:
            return False


    def play_again(self,sid):
        play_again = 0
        for player in self.players:
            if player.sid == sid:
                player.play_again = True
            if player.play_again == True:
                play_again += 1
        if play_again == len(self.players):
            return True
        else:
            return False

    def reset(self):
        for player in self.players:
            player.score = 0
            player.alive = True
            player.play_again = False
            self.pipes = []
        return True

    def remove_player(self,sid):
        for player in self.players:
            if sid == player.sid:
                player_index_position = self.players.index(player)
                del self.players[player_index_position]


    def run_game_sockets(self,socketio):
        print('running sockets for ' + self.game_id)
        @socketio.on('connect', namespace=f"/{self.game_id}")
        def connect():
            print("CONNECTING INGAME")
            username = session['username']
            self.players.append(Player(session['username'],session['email'], request.sid))
            emit('message', {'user': session['username'], 'message': username + ' has entered the game.'}, broadcast=True)

        @socketio.on('disconnect', namespace=f"/{self.game_id}")
        def disconnect():
            print('DISCONNECTING INGAME')
            username = session['username']
            self.remove_player(request.sid)
            emit('message',{'user': session['username'], 'message': username + ' has left the game.'})


        @socketio.on('start_game', namespace=f"/{self.game_id}")
        def start_game():
            if self.check_players():
                emit('initalize_game', {'pipes': self.pipes, 'start':3000 }, broadcast=True)

        @socketio.on('player_position', namespace=f"/{self.game_id}")
        def player_position(data):
            for player in self.players:
                if player.name != session['username']:
                    emit('update_player_position', data, room=player.sid)
                    break
        """

        updates player score

        """

        @socketio.on('update_score', namespace=f"/{self.game_id}")
        def update_score(score):
            for player in self.players:
                if player.sid == request.sid:
                    player.score = score

        @socketio.on('player_dead', namespace=f"/{self.game_id}")
        def player_dead():
            for player in self.players:
                if player.sid == request.sid:
                    player.alive = False
                    player_status = self.check_players_alive()
                    if player_status:
                        #get player object with highest score
                        winner = max(player_status, key=attrgetter('score'))

                        emit('game_ended', [{'name': p.name, 'score': p.score} for p in player_status] , broadcast=True)

                        for player in player_status:
                            if player == winner:
                                player.update_score()
                                player.update_wins()
                            else:
                                player.update_score()
                                player.update_defeats()
                    else:
                        emit('player_dead', {'message': f'player {player.name} is dead', 'username': player.name}, broadcast=True)
                    break


        @socketio.on('play_again', namespace=f"/{self.game_id}")
        def play_again():
            for player in self.players:
                if player.sid != request.sid:
                    emit('play_again', {'message': f'Other player wants to play again!'}, room=player.sid)
            status = self.play_again(request.sid)
            emit('play_again', {})
            if status:
                self.reset()
                start_game()
