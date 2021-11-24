from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship, backref
from pathlib import Path
from .database import BaseModel

class Conf:
    PRIVATE_PATH = Path(__file__).parent.parent / 'private'


class User(BaseModel):
    __tablename__ = "Users"

    login = Column(String(256), primary_key=True)
    password_hash = Column(String(1024))

    @property
    def personal_folder(self):
        return Conf.PRIVATE_PATH / self.login

    @property
    def personal_image_folder(self):
        return self.personal_folder / 'pictures'

    @property
    def personal_files(self):
        return self.personal_folder.iterdir()

    @property
    def personal_images(self):
        return self.personal_image_folder.iterdir()

    def personal_file_path(self, file_path):
        return self.personal_folder / file_path

    def personal_image_path(self, image_path):
        return self.personal_image_folder / image_path


class FileSharing(BaseModel):
    __tablename__ = "FileSharings"

    owner_login = Column(String(256), ForeignKey("Users.login"), nullable=False)
    owner = relationship(User, backref=backref('file_sharings', lazy=True))
    share_link = Column(String(48), primary_key=True)
    file_path = Column(String(512), unique=True)

    @property
    def file_name(self):
        return Path(self.file_path).name
