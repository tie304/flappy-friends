from database.database import Database


class Player:
    def __init__(self, name, email):
        self.name = name
        self.email = email
        self.sid = None
        self.bird = None
        self.lobby_ready = False
        self.in_game = False
        self.alive = True
        self.play_again = False
        self.score = 0

    def __repr__(self):
        return f"<Player {self.name}>"

    def update_score(self):
        return Database.update('users', {'email': self.email}, {'$inc': {'total_score': self.score}})

    def update_wins(self):
        return Database.update('users', {'email': self.email}, {'$inc': {'total_wins': 1}})

    def update_defeats(self):
        return Database.update('users', {'email': self.email}, {'$inc': {'total_defeats': 1}})
