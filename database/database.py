import pymongo
from config import Config


class Database(object):


    DATABASE = None

    @staticmethod
    def initialize(URI,database_name):
        #only way to access it is through database object
        client = pymongo.MongoClient(URI)
        Database.DATABASE = client[database_name]
        print(Database.DATABASE)

    @staticmethod
    def insert(collection, data):
        return Database.DATABASE[collection].insert(data)

    @staticmethod
    def find(collection, query):
        return Database.DATABASE[collection].find(query)

    @staticmethod
    def find_one(collection, query):
        return Database.DATABASE[collection].find_one(query)

    @staticmethod
    def update(collection, query, data):
        return Database.DATABASE[collection].update(query, data, upsert=True)

    @staticmethod
    def remove(collection, query):
        Database.DATABASE[collection].remove(query)
