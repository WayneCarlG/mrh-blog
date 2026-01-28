from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()  # Load from .env file if it exists

class Config:
    db_username = os.getenv('db_username')
    db_password = os.getenv('db_password')
    db_name = os.getenv('db_name')
    
    # Validate required environment variables
    if not all([db_username, db_password, db_name]):
        raise ValueError("Missing required environment variables: db_username, db_password, or db_name")
    
    URI = f"mongodb+srv://{db_username}:{db_password}@cluster0.kmuygxr.mongodb.net/{db_name}?retryWrites=true&w=majority"
    DEBUG = True

    try:
        MONGO_CLIENT = MongoClient(URI)
        DB = MONGO_CLIENT[db_name]
        print("Connected to MongoDB successfully!")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")

