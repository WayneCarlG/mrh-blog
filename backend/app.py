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
    # resources={r"/*": {"origins": "http://localhost:3000"}},
    supports_credentials=False
)


# --- JWT error callbacks (better logging for debugging) -----------------
@jwt.invalid_token_loader
def custom_invalid_token_callback(error_string):
    print(f"[JWT] Invalid token: {error_string}")
    return jsonify({"error": error_string}), 422


@jwt.unauthorized_loader
def custom_missing_token_callback(error_string):
    print(f"[JWT] Missing token / unauthorized: {error_string}")
    return jsonify({"error": error_string}), 401


# Simple request logger for debugging Authorization header on create-post
@app.before_request
def log_auth_header():
    if request.path == "/api/create-post":
        auth = request.headers.get("Authorization")
        masked = None
        if auth:
            # only log prefix and last 8 chars to avoid full token in logs
            masked = f"{auth[:7]}...{auth[-8:]}"
        print(f"[DEBUG] {request.method} {request.path} Authorization: {masked}")

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

    # Use a string identity (subject) to satisfy JWT requirements
    # We'll look up the user record from the DB inside protected endpoints.
    access_token = create_access_token(identity=str(user["_id"]))
    return jsonify({"access_token": access_token}), 200

# @app.route("/create-post", methods=["POST"])
# @jwt_required()
# def create_post():
#     data = request.get_json(silent=True)

#     if not data:
#         return jsonify({"error": "Request body must be valid JSON"}), 400

#     user_identity = get_jwt_identity()

#     if isinstance(user_identity, str):
#         user_record = Config.DB.users.find_one({"email": user_identity})
#         if not user_record:
#             return jsonify({"error": "User not found"}), 401
        
#         user = {
#             "id": str(user_record["_id"]),
#             "name": user_record.get("username") or user_record.get("name", "Unknown"),
#             "email": user_record["email"]
#         }
#     else:
#         # already a dict? trust it or validate
#         user = user_identity

#         title = data.get("title")
#         content = data.get("content")
#         category = data.get("category")
#         cover_image = data.get("coverImage")

#         if not title or not title.strip():
#             return jsonify({"error": "Title is required"}), 400

#         if not content or not content.strip():
#             return jsonify({"error": "Content is required"}), 400

#         if not category or not category.strip():
#             return jsonify({"error": "Category is required"}), 400

#         # if cover_image and isinstance(cover_image, str):
#         #     image_bytes = base64.b64decode(
#         #         cover_image.split(",")[1] if "," in cover_image else cover_image
#         #     )
#         #     if len(image_bytes) > 5 * 1024 * 1024:
#         #         return jsonify({"error": "Image file is too large. Max size is 5MB"}), 400
        
#         if cover_image:
#             try:
#                 if "," in cover_image:
#                     cover_image = cover_image.split(",")[1]
#                 image_bytes = base64.b64decode(cover_image)
#                 if len(image_bytes) > 5 * 1024 * 1024:
#                     return jsonify({"error": "Image too large (max 5MB)"}), 400
#             except Exception:
#                 return jsonify({"error": "Invalid image format"}), 400

#         post_data = {
            
#             "title": title.strip(),
#             "category": category.strip(),
#             "status": data.get("status", "draft"),
#             "content": content.strip(),
#             "coverImage": cover_image,
#             "author": {
#                 "id": user.get("id"),
#                 "name": user.get("name"),
#                 "email": user.get("email")
#             },
#             "createdAt": datetime.utcnow(),
#             "updatedAt": datetime.utcnow()
#             }

#         try:
#             result = Config.DB.posts.insert_one(post_data)
#             return jsonify({
#                 "message": "Post created successfully",
#                 "postId": str(result.inserted_id)
#             }), 201
#         except Exception as e:
#             print("Error creating post:", e)
#             return jsonify({"error": "Failed to create post"}), 500

@app.route('/api/create-post', methods=["POST"])
@jwt_required()
def create_post():
    """
    Create a new blog post.
    Expects JSON payload with: title, category, status?, content, coverImage (base64 optional)
    """
    current_user = get_jwt_identity()

    # If the identity is a string (user id), fetch the user record from DB
    if isinstance(current_user, str):
        try:
            user_record = Config.DB.users.find_one({"_id": ObjectId(current_user)})
        except Exception:
            user_record = None

        if not user_record:
            return jsonify({"error": "User not found"}), 401

        current_user = {
            "id": str(user_record["_id"]),
            "name": user_record.get("username") or user_record.get("name", "Unknown"),
            "email": user_record.get("email")
        }

    # ── 1. Basic payload validation ────────────────────────────────────────
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    title       = data.get("title", "").strip()
    category    = data.get("category", "").strip()
    content     = data.get("content", "").strip()
    status      = data.get("status", "draft")
    cover_image = data.get("coverImage")  # base64 string or null

    if not title:
        return jsonify({"error": "Title is required"}), 400

    if not category:
        return jsonify({"error": "Category is required"}), 400

    if not content:
        return jsonify({"error": "Content is required"}), 400

    if status not in ("draft", "published"):
        return jsonify({"error": "Invalid status value"}), 400

    # ── 2. Optional: Validate & decode cover image ─────────────────────────
    cover_image_bytes = None
    if cover_image:
        try:
            # Handle data URI prefix if present (data:image/...;base64,)
            if "," in cover_image:
                cover_image = cover_image.split(",", 1)[1]

            cover_image_bytes = base64.b64decode(cover_image)
            if len(cover_image_bytes) > 5 * 1024 * 1024:  # 5 MB limit
                return jsonify({"error": "Cover image too large (max 5MB)"}), 413

        except Exception as e:
            return jsonify({"error": f"Invalid cover image format: {str(e)}"}), 400

    # ── 3. Prepare post document ───────────────────────────────────────────
    post_data = {
        "title": title,
        "category": category,
        "status": status,
        "content": content,
        "coverImage": cover_image,       # keep original base64 (or store bytes elsewhere)
        # "coverImageBinary": cover_image_bytes,  # ← optional if you want to store binary
        "author": {
            "id": current_user["id"],
            "name": current_user.get("name", "Unknown"),
            "email": current_user["email"]
        },
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        # Optional fields you might add later:
        # "tags": [],
        # "views": 0,
        # "likes": 0,
    }

    try:
        result = Config.DB.posts.insert_one(post_data)
        post_id = str(result.inserted_id)

        return jsonify({
            "message": "Post created successfully",
            "postId": post_id,
            "status": status
        }), 201

    except Exception as e:
        # In production → use proper logging (logging module or sentry)
        print(f"Error inserting post: {str(e)}")
        return jsonify({"error": "Failed to save post in database"}), 500

@app.route("/api/posts", methods=["GET"])
def get_posts():
    try:
        posts = list(Config.DB.posts.find().sort("_id", -1))
        for post in posts:
            if post["status"] == "published":
                post["_id"] = str(post["_id"])

        return jsonify(posts), 200
    except Exception as e:
        print("Error fetching posts:", e)
        return jsonify({"error": "Failed to fetch posts"}), 500

@app.route("/api/posts/<post_id>", methods=["GET", "PUT", "DELETE"])
@jwt_required(optional=True)
def delete_post(post_id):
    if request.method == "GET":
        try:
            post = Config.DB.posts.find_one({"_id": ObjectId(post_id)})
            if not post:
                return jsonify({"error": "Post not found"}), 404

            post["_id"] = str(post["_id"])
            return jsonify(post), 200
        except Exception as e:
            print("Error fetching post:", e)
            return jsonify({"error": "Failed to fetch post"}), 500

    elif request.method == "DELETE":
        current_user = get_jwt_identity()
        if not current_user:
            return jsonify({"error": "Authorization required"}), 401

        try:
            post = Config.DB.posts.find_one({"_id": ObjectId(post_id)})
            if not post:
                return jsonify({"error": "Post not found"}), 404

            if post["author"]["id"] != current_user:
                return jsonify({"error": "Permission denied"}), 403

            Config.DB.posts.delete_one({"_id": ObjectId(post_id)})
            return jsonify({"message": "Post deleted successfully"}), 200
        except Exception as e:
            print("Error deleting post:", e)
            return jsonify({"error": "Failed to delete post"}), 500

if __name__ == '__main__':
    app.run(debug=True)