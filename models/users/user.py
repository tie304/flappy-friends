import uuid
from database.database import Database
from models.users.errors import UserError


class User(object):
    def __init__(self, email, display_name, _id=None):
        self.display_name = display_name
        self.email = email
        self._id = uuid.uuid4().hex if _id is None else _id
        self.total_score = 0
        self.total_wins = 0;
        self.total_defeats = 0

    def __repr__(self):
        return "<User {}>".format(self.email)



    @staticmethod
    def register_user(email, display_name):

        check_email = Database.find_one('users', {'email': email})
        check_display_name = Database.find_one('users', {'display_name': display_name})

        if check_email is not None:
            raise UserErrors.UserAlreadyRegisteredError('The email you used to register already exists')

        if check_display_name is not None:
            raise UserErrors.UserAlreadyRegisteredError('The username you entered already exists')

        #if not Utils.email_is_valid(email):
            #raise UserErrors.InvalidEmailError('The email does not have the right format.')

        User(email,display_name).save_to_db()

        return True



    def save_to_db(self):
        Database.insert('users', self.json())

    def json(self):
        return {
        "_id" : self._id,
        "email": self.email,
        "display_name": self.display_name,
        "total_wins": self.total_wins,
        "total_defeats": self.total_defeats,
        "total_score": self.total_score
    }
