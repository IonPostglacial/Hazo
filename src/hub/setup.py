from hub.database import engine, LocalSession, BaseModel
from hub import users

db = LocalSession()

BaseModel.metadata.create_all(bind=engine)

db.add(users.create("pierre", "hello"))

db.commit()
db.close()