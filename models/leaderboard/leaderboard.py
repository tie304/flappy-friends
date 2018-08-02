from database.database import Database


class Leaderboard(object):

    def __init__(self):
        pass


    def fetch_leaders(self):
         data = Database.find('users',{}).sort('total_wins',- 1).limit(25)
         return [leader for leader in data]

    @staticmethod
    def search_user(search):
        print(search)
        return [user for user in Database.find('users', {"$or": [{'email':search['name']}, {'display_name': search['name']}]})]
