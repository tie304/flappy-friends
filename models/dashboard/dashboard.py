from flask import session
from database.database import Database


class Dashboard(object):
    def __init__(self):
        self.email = session['email']



    def get_player_stats(self):
        data = Database.find_one('users', {'email': self.email})
        stats = {
         "stats": {
            "total_score": data['total_score'],
            "total_wins": data['total_wins'],
            "total_defeats": data['total_defeats']
            }           
        }
        return stats
