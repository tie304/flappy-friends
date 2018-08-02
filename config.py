
class Config:
    def __init__(self,state):
        self.secret_key = '\x93\x85\xe04\xa1\x8fLw\x16\xaaQR\x03\xb7\x87_<\x1c\xfe|Cw\x819'
        if state == "production":
            self.database_URI = "mongodb://tyler:1youngsavage@ds127443.mlab.com:27443/flappy_friends_dev"
        else:
            self.database_URI = 'mongodb://127.0.0.1:27017'
        self.database_name = 'flappy_friends'
