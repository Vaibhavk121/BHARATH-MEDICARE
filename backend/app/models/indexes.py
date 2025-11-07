from .database import users_collection, records_collection, access_permissions_collection

def create_indexes():
    """Create database indexes for better performance"""
    
    # Users collection indexes
    users_collection.create_index("email", unique=True)
    users_collection.create_index("role")
    
    # Records collection indexes
    records_collection.create_index("patient_id")
    records_collection.create_index("uploaded_by")
    records_collection.create_index("uploaded_at")
    
    # Access permissions collection indexes
    access_permissions_collection.create_index([("patient_id", 1), ("doctor_id", 1)])
    access_permissions_collection.create_index("is_active")
    
    print("✓ Database indexes created successfully")

if __name__ == "__main__":
    create_indexes()
