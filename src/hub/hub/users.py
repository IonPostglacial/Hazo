from .model import User
from werkzeug.security import generate_password_hash, check_password_hash
from . import database


def create(login: str, password: str):
    return User(login=login, password_hash=generate_password_hash(password))


def check_credentials(login: str, password: str):
    user = database.session.query(User).filter_by(login=login).first()
    if user is not None:
        return check_password_hash(user.password_hash, password)
    else:
        return False