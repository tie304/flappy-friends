import uuid
from database.database import Database
import models.users.errors as UserErrors
from common.utils import Utils


class User(object):
    def __init__(self, email, display_name, password, _id=None):
        self.display_name = display_name
        self.email = email
        self.password = password
        self._id = uuid.uuid4().hex if _id is None else _id
        self.total_score = 0
        self.total_wins = 0
        self.total_defeats = 0

    def __repr__(self):
        return "<User {}>".format(self.email)

    @staticmethod
    def is_login_valid(email, password):

        # this metod vervies that email and password combo is valid or not
        # sha512 passeword

        user_data = Database.find_one('users', {'email': email})

        if user_data is None:
            raise UserErrors.UserNotExistsError("Username doesn't exist")
        if not Utils.check_hashed_password(password, user_data['password']):
            raise UserErrors.IncorrectPasswordError(
                "Your Password Was Incorrect")

        return user_data

    @staticmethod
    def register_user(email, display_name, password):

        check_email = Database.find_one('users', {'email': email})
        check_display_name = Database.find_one(
            'users', {'display_name': display_name})

        if check_email is not None:
            raise UserErrors.UserAlreadyRegisteredError(
                'The email you used to register already exists')

        if check_display_name is not None:
            raise UserErrors.UserAlreadyRegisteredError(
                'The username you entered already exists')

        if not Utils.email_is_valid(email):
            raise UserErrors.InvalidEmailError(
                'The email does not have the right format.')

        User(email, display_name, Utils.hash_password(password)).save_to_db()

        return True

    def save_to_db(self):
        Database.insert('users', self.json())

    def json(self):
        return {
            "_id": self._id,
            "email": self.email,
            "display_name": self.display_name,
            "password": self.password,
            "total_wins": self.total_wins,
            "total_defeats": self.total_defeats,
            "total_score": self.total_score
        }
