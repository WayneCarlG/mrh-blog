from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

class Config:
    URI = "mongodb+srv://<db_username>:<db_password>@cluster0.kmuygxr.mongodb.net/?appName=Cluster0"
    SECRET_KEY = "your_secret_key_here"
    DEBUG = True
    MONGO_CLIENT = MongoClient(URI, server_api=ServerApi('1'))
    DB_NAME = "mrh_blog_db"

    try:
        MONGO_CLIENT.admin.command('ping')
        print("Connected to MongoDB successfully!")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")

