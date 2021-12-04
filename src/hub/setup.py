from hub.database import engine, LocalSession, BaseModel
from hub.model import Conf
from hub import users
from sys import argv

import os


def add_user(login, password):
    user = users.create(login, password)
    os.mkdir(user.personal_folder)
    os.mkdir(user.personal_image_folder)
    db = LocalSession()
    BaseModel.metadata.create_all(bind=engine)
    db.add(user)
    db.commit()
    db.close()

if len(argv) < 2:
    print("list of available options: adduser")
    exit(0)

option = argv[1]
print(argv)
if option == "init":
    os.mkdir(Conf.PRIVATE_PATH)
elif option == "adduser":
    if len(argv) < 4:
        print("you need to provide arguments for login and password")
        exit(0)
    else:
        add_user(argv[2], argv[3])
else:
    print("list of available options: adduser")
    exit(0)