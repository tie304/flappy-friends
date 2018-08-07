from passlib.hash import pbkdf2_sha256
import re

class Utils(object):
    @staticmethod
    def hash_password(password):
        #hashes apassword using pbkdf2_sha512
        return pbkdf2_sha256.hash(password)


    @staticmethod
    def check_hashed_password(password, hashed_password):
        #checks that the password user sent matches the database
        return pbkdf2_sha256.verify(password, hashed_password)


    @staticmethod
    def email_is_valid(email):
        email_address_matcher = re.compile('^[\w-]+@([\w-]+\.)+[\w]+$')
        return True if email_address_matcher.match(email) else False
