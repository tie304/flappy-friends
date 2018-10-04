from database.database import Database

"""

Responsible for leaderboard actions


"""


class Leaderboard(object):

    @staticmethod
    def fetch_leaders():
        data = Database.find('users', {}).sort('total_wins', - 1).limit(25)
        return [leader for leader in data]

    @staticmethod
    def search_user(search):
        return [user for user in Database.find('users', {"$or": [{'email': search['name']}, {'display_name': search['name']}]})]
