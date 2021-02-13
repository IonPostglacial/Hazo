from flask import Flask
from .database import LocalSession

UPLOAD_FOLDER = '/tmp/hazo-hub'

app = Flask(__name__)
app.secret_key = b'_5#y2L"F4Q8z\n\xec]/'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER