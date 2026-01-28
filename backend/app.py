from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash


app = Flask(__name__)

#JWT CONFIGURATION
app.config["JWT_SECRET_KEY"] = "super-secret-key"
app.config["JWT_TOKEN_LOCATION"] = ["headers"]
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False

#CORS SETUP
CORS(app, supports_credentials=True)
jwt=JWTManager(app)


#Routes
@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "You have hit the API endpoint!"})

@app.route('/dashboard', methods=['GET'])
def dashboard():
    return jsonify({"message": "Welcome to the dashboard!"})

if __name__ == '__main__':
    app.run(debug=True)