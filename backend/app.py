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
import base64
from werkzeug.security import generate_password_hash, check_password_hash


app = Flask(__name__)

#JWT CONFIGURATION
app.config["JWT_SECRET_KEY"] = "super-secret-key"
app.config["JWT_TOKEN_LOCATION"] = ["headers"]
app.config["JWT_HEADER_NAME"] = "Authorization"
app.config["JWT_HEADER_TYPE"] = "Bearer"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False

jwt=JWTManager(app)

#CORS SETUP
CORS(app,
    resources={r"/api/*": {"origins": "http://localhost:3000"}},
    supports_credentials=False
)

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

    # Create access token with full user info so get_jwt_identity() returns a dict
    access_token = create_access_token(identity={
        "id": str(user["_id"]),
        "name": user.get("username") or user.get("name"),
        "email": user.get("email")
    })
    return jsonify({"access_token": access_token}), 200

@app.route("/api/create-post", methods=["POST"])
@jwt_required()
def create_post():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    user = get_jwt_identity()

    if isinstance(user, str):
        user_record = Config.DB.users.find_one({"email": user})
        if not user_record:
            return jsonify({"error": "User not found"}), 401
        user = {
            "id": str(user_record.get("_id")),
            "name": user_record.get("username") or user_record.get("name"),
            "email": user_record.get("email")
        }
    
    if not isinstance(user, dict):
        return jsonify({"error": "Invalid user identity"}), 401

    title = data.get("title")
    content = data.get("content")
    category = data.get("category")
    cover_image = data.get("coverImage")

    if not title or not title.strip():
        return jsonify({"error": "Title is required"}), 400

    if not content or not content.strip():
        return jsonify({"error": "Content is required"}), 400

    if not category or not category.strip():
        return jsonify({"error": "Category is required"}), 400

    # if cover_image and isinstance(cover_image, str):
    #     image_bytes = base64.b64decode(
    #         cover_image.split(",")[1] if "," in cover_image else cover_image
    #     )
    #     if len(image_bytes) > 5 * 1024 * 1024:
    #         return jsonify({"error": "Image file is too large. Max size is 5MB"}), 400
    
    if cover_image:
        try:
            if "," in cover_image:
                cover_image = cover_image.split(",")[1]
            image_bytes = base64.b64decode(cover_image)
            if len(image_bytes) > 5 * 1024 * 1024:
                return jsonify({"error": "Image too large (max 5MB)"}), 400
        except Exception:
            return jsonify({"error": "Invalid image format"}), 400

    post_data = {
        
        "title": title.strip(),
        "category": category.strip(),
        "status": data.get("status", "draft"),
        "content": content.strip(),
        "coverImage": cover_image,
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
        print("Error creating post:", e)
        return jsonify({"error": "Failed to create post"}), 500

@app.route("/api/posts", methods=["GET"])
def get_posts():
    try:
        posts = list(Config.DB.posts.find().sort("_id", -1))
        for post in posts:
            post["_id"] = str(post["_id"])

        return jsonify(posts), 200
    except Exception as e:
        print("Error fetching posts:", e)
        return jsonify({"error": "Failed to fetch posts"}), 500


if __name__ == '__main__':
    app.run(debug=True)