from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Database:
    """MongoDB Database Connection Manager"""
    
    _client = None
    _db = None
    
    @classmethod
    def get_client(cls):
        """Get MongoDB client instance (singleton pattern)"""
        if cls._client is None:
            try:
                mongo_uri = os.getenv('MONGO_URI')
                print(f"Attempting MongoDB connection with URI: {mongo_uri}")
                cls._client = MongoClient(
                    mongo_uri,
                    serverSelectionTimeoutMS=10000,
                    connectTimeoutMS=10000
                )
                # Test the connection
                cls._client.admin.command('ping')
                print("✓ Successfully connected to MongoDB")
            except Exception as e:
                print(f"✗ Failed to connect to MongoDB: {e}")
                cls._client = None
        return cls._client
    
    @classmethod
    def get_db(cls):
        """Get database instance"""
        if cls._db is None:
            client = cls.get_client()
            if client is not None:
                cls._db = client.bharathmedicare
                print("✓ Database instance created: bharathmedicare")
        return cls._db
    
    @classmethod
    def get_collection(cls, collection_name):
        """Get a collection by name"""
        db = cls.get_db()
        if db is not None:
            return db[collection_name]
        print(f"✗ Failed to get collection '{collection_name}' - database is None")
        return None
    
    @classmethod
    def close_connection(cls):
        """Close database connection"""
        if cls._client is not None:
            cls._client.close()
            cls._client = None
            cls._db = None
            print("✓ MongoDB connection closed")

# Initialize database connection on module load
def init_db():
    """Initialize database connection"""
    db = Database.get_db()
    if db is not None:
        print("✓ Database initialized successfully")
        return True
    else:
        print("✗ Database initialization failed")
        return False

# Getter functions for collections
def get_users_collection():
    """Get users collection"""
    collection = Database.get_collection('users')
    if collection is None:
        print("ERROR: users_collection is None!")
    return collection

def get_records_collection():
    """Get records collection"""
    collection = Database.get_collection('records')
    if collection is None:
        print("ERROR: records_collection is None!")
    return collection

def get_audit_logs_collection():
    """Get audit logs collection"""
    collection = Database.get_collection('audit_logs')
    if collection is None:
        print("ERROR: audit_logs_collection is None!")
    return collection

def get_access_permissions_collection():
    """Get access permissions collection"""
    collection = Database.get_collection('access_permissions')
    if collection is None:
        print("ERROR: access_permissions_collection is None!")
    return collection

# Try to initialize on import
init_db()
