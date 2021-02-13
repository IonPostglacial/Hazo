from flask import abort, render_template, session, request, redirect, url_for, jsonify, send_file
from werkzeug.utils import secure_filename
from pathlib import Path
from .app import app
from .model import User, FileSharing
from .database import session as db
from . import users

import functools
import os
import random
import string
import urllib


def connected_only(f):
    @functools.wraps(f)
    def connected_only_fn(*args, **kwargs):
        if 'login' in session:
            url_for('static', filename='style.css')
            return f(*args, **kwargs)
        else:
            return redirect(url_for('login_page'))
    return connected_only_fn


@app.route("/login", methods=['GET', 'POST'])
def login_page():
    url_for('static', filename='style.css')
    if request.method == 'POST':
        login = request.form['username']
        password = request.form['password']
        if users.check_credentials(login, password):
            session['login'] = login
            return redirect(url_for('home_page'))
        else:
            return redirect(url_for('login_page'))
    else:
        return render_template('login.html')


@app.route('/', methods=['GET', 'POST'])
@connected_only
def home_page():
    current_user = db.query(User).filter_by(login=session['login']).first()
    return render_template('index.html', user=current_user)


def is_valid_dataset_file(file):
    name, extension = os.path.splitext(file.filename)
    return extension == ".json"


def post_dataset(current_user):
    if 'db-file-upload' not in request.files:
        return {"status": "ko", "message": "no file provided"}
    else:
        file = request.files['db-file-upload']
        if not is_valid_dataset_file(file):
            return {"status": "ko", "message": "The provided file is invalid. Only Hazo dataset files are allowed."}
        else:
            file_name = secure_filename(file.filename)
            file_path = current_user.personal_file_path(file_name)
            file.save(str(file_path))
            return {"status": "ok"}


@app.route('/api/datasets', methods=['POST'])
@connected_only
def api_datasets_post():
    current_user = db.query(User).filter_by(login=session['login']).first()
    return jsonify(post_dataset(current_user))


@app.route('/api/datasets/<string:file_name>', methods=['DELETE'])
@connected_only
def api_dataset_delete(file_name: str):
    current_user = db.query(User).filter_by(login=session['login']).first()
    file_path = current_user.personal_file_path(file_name)
    if file_path.exists():
        file_path.unlink()
        return jsonify({"status": "ok"})
    else:
        return jsonify({"status": "ko", "message": f"file {file_name} does not exist"})


@app.route('/api/upload-img', methods=['POST'])
@connected_only
def api_upload_image():
    current_user = db.query(User).filter_by(login=session['login']).first()
    if 'file-url' in request.form:
        file_url = request.form['file-url']
        url = urllib.parse.urlparse(file_url)
        file_name = secure_filename(Path(url.path).name)
        file_path = current_user.personal_image_path(file_url)
        # TODO: check file size and mime type
        urllib.request.urlretrieve(file_url, file_path)
        return jsonify({"status": "ok", "url": str(Path('private') / current_user.login / 'pictures' / file_name)})
    elif 'file' in request.files:
        file = request.files['file']
        if not file:
            return jsonify({"status": "ko", "message": "The provided file is invalid."})
        else:
            file_name = secure_filename(file.filename)
            file_path = current_user.personal_file_path(file_name)
            file.save(str(file_path))
            return jsonify({"status": "ok", "url": str(Path('private') / current_user.login / 'pictures' / file_name)})
    else:
        return jsonify({"status": "ko", "message": "no file provided"})


@app.route('/api/share-file', methods=['POST', 'DELETE'])
@connected_only
def api_share_file():
    if 'file' not in request.form:
        return jsonify({"status": "ko", "message": "file argument is mandatory"})
    else:
        file_name = request.form['file']
        current_user = db.query(User).filter_by(login=session['login']).first()
        file_full_path = current_user.personal_file_path(file_name)
        if not file_full_path.exists():
            return jsonify({"status": "ko", "message": f"file '{file_name}' doesn't exist"})
        else:
            if request.method == 'POST':
                share_link = ''.join(random.SystemRandom().choice(string.ascii_letters + string.digits) for _ in range(48))
                file_sharing = FileSharing(owner=current_user, share_link=share_link, file_path=str(file_full_path))
                db.add(file_sharing)
                db.commit()
                return jsonify({"status": "ok", "linkid": file_sharing.share_link});
            elif request.method == 'DELETE':
                file_sharing = db.query(FileSharing).filter_by(file_path=str(file_full_path)).first()
                db.delete(file_sharing)
                db.commit()
                return jsonify({"status": "ok"})
            else:
                return jsonify({"status": "ko", "message": f"method '{request.method}' doesn't exist"})


@app.route("/private/<string:file_name>")
@connected_only
def private_files(file_name: str):
    current_user = db.query(User).filter_by(login=session['login']).first()
    file_path = current_user.personal_folder / file_name
    if file_path.exists():
        return send_file(file_path, mimetype="application/json", attachment_filename=file_name)
    else:
        return abort(404)


@app.route("/shared/<string:share_link>")
def shared_files(share_link: str):
    file_sharing = db.query(FileSharing).filter_by(share_link=share_link).first()
    if file_sharing == None:
        return abort(404)
    else:
        return send_file(file_sharing.file_path, mimetype="application/json", attachment_filename=file_sharing.file_name)


@app.route('/databases', methods=['GET', 'POST'])
@connected_only
def list_databases():
    current_user = db.query(User).filter_by(login=session['login']).first()
    error_msg = ""
    if request.method == 'POST':
        res = post_dataset(current_user)
        if res['status'] == 'ko':
            error_msg = res['message']
    current_user_sharings = db.query(FileSharing).filter_by(owner=current_user).all()
    return render_template('databases.html',
        error_msg=error_msg,
        personal_file_names=(file.name for file in current_user.personal_files),
        sharings_by_file_path={ sharing.file_name: sharing.share_link for sharing in current_user_sharings })


@app.route('/pictures', methods=['GET'])
@app.route('/pictures/', methods=['GET'])
@connected_only
def image_galery():
    current_user = db.query(User).filter_by(login=session['login']).first()
    return  render_template('image-gallery.html', user=current_user, images=current_user.personal_images)


@app.route('/pictures/<path:path>', methods=['GET'])
@connected_only
def image_galery_path(path: str):
    current_user = db.query(User).filter_by(login=session['login']).first()
    dir_path = current_user.personal_folder / 'pictures' / path
    return  render_template('image-gallery.html', base_path=path, user=current_user, images=dir_path.iterdir())


@app.route('/picture/<string:user_login>/<path:picture_path>', methods=['GET'])
def serve_picture(user_login: str, picture_path: str):
    user = db.query(User).filter_by(login=user_login).first()
    if user is None:
        return abort(404)
    else:
        path = user.personal_image_path(picture_path)
        if not path.exists():
            return abort(404)
        else:
            return send_file(str(path), attachment_filename=path.name)