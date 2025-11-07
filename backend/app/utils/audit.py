from datetime import datetime
from app.models.database import get_audit_logs_collection
from app.models.schemas import AuditLogSchema
from flask import request

def log_action(user_id, action, resource_type, resource_id=None, details=None):
    """
    Log user action for audit trail
    """
    try:
        audit_logs_collection = get_audit_logs_collection()
        if audit_logs_collection is None:
            print("Warning: Could not log action - database not connected")
            return None
        
        # Get IP address from request
        ip_address = request.remote_addr if request else None
        
        # Create audit log document
        log_entry = AuditLogSchema.create(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            details=details
        )
        
        # Insert into database
        result = audit_logs_collection.insert_one(log_entry)
        
        return result.inserted_id
    
    except Exception as e:
        print(f"Audit logging error: {e}")
        return None

def get_user_activity(user_id, limit=50):
    """Get recent activity for a specific user"""
    try:
        audit_logs_collection = get_audit_logs_collection()
        if audit_logs_collection is None:
            return []
        
        logs = audit_logs_collection.find(
            {'user_id': user_id}
        ).sort('timestamp', -1).limit(limit)
        
        return list(logs)
    
    except Exception as e:
        print(f"Error fetching user activity: {e}")
        return []
