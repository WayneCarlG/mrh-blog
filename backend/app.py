from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from datetime import datetime
from bson import ObjectId
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

#Authentication Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"error": "Missing required fields"}), 400

    # Check if user already exists
    existing_user = Config.DB.users.find_one({"email": email})
    if existing_user:
        return jsonify({"error": "User already exists"}), 400

    # Hash the password
    hashed_password = generate_password_hash(password)

    # Insert new user into database
    user_data = {
        "username": username,
        "email": email,
        "password": hashed_password
    }
    
    try:
        Config.DB.users.insert_one(user_data)
        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        print(f"Error registering user: {e}")
        return jsonify({"error": "Failed to register user"}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Missing required fields"}), 400

    # Find user in database
    user = Config.DB.users.find_one({"email": email})
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    # Check password
    if not check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    # Create access token
    access_token = create_access_token(identity=email)
    return jsonify({"access_token": access_token}), 200

@app.route("/api/posts", methods=["POST"])
@jwt_required()
def create_post():
    data = request.get_json()
    user = get_jwt_identity()

    title = data.get("title")
    content = data.get("content")

    if not title or not content:
        return jsonify({"error": "Title and content are required"}), 400

    post_data = {
        "title": title,
        "category": data.get("category", ""),
        "status": data.get("status", "draft"),
        "content": content,
        "coverImage": data.get("coverImage"),  # base64 image
        "author": {
            "id": user.get("id"),
            "name": user.get("name"),
            "email": user.get("email")
        },
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }

    try:
        result = Config.DB.posts.insert_one(post_data)
        return jsonify({
            "message": "Post created successfully",
            "postId": str(result.inserted_id)
        }), 201

    except Exception as e:
        print(f"Error creating post: {e}")
        return jsonify({"error": "Failed to create post"}), 500

@app.route("/api/posts/<post_id>", methods=["GET"])
def get_post(post_id):
    try:
        post = Config.DB.posts.find_one({"_id": ObjectId(post_id)})
        if not post:
            return jsonify({"error": "Post not found"}), 404

        post["_id"] = str(post["_id"])  # Convert ObjectId to string for JSON serialization
        return jsonify(post), 200

    except Exception as e:
        print(f"Error retrieving post: {e}")
        return jsonify({"error": "Failed to retrieve post"}), 500

if __name__ == '__main__':
    app.run(debug=True)