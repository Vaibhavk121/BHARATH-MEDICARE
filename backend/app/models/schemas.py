from datetime import datetime
from bson import ObjectId
import re

class UserSchema:
    @staticmethod
    def create(email, password_hash, role, full_name, phone=None, nmc_uid=None, is_diabetic=False):
        """Create a new user document"""
        
        # Determine chronic conditions based on role and is_diabetic flag
        conditions = []
        if role == 'patient' and is_diabetic:
            conditions.append('Diabetes')
        
        return {
            'email': email,
            'password_hash': password_hash,
            'role': role,
            'full_name': full_name,
            'phone': phone,
            'nmc_uid': nmc_uid,
            'profile_photo': None,
            'gender': None,
            'date_of_birth': None,
            'blood_group': None,
            'height': None,
            'weight': None,
            'address': None,
            'emergency_contact': None,
            'emergency_contact_name': None,
            'emergency_contact_relation': None,  # Ensure this field exists
            'allergies': [],  # Initialize as empty list, not None
            'chronic_conditions': conditions,  # Initialize with diabetes if applicable
            'current_medications': [],  # Initialize as empty list, not None
            'is_verified': True,
            'is_active': True,
            'is_profile_complete': False if role == 'patient' else True,  # Critical: False for new patients
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
    
    @staticmethod
    def validate_role(role):
        """Validate user role"""
        valid_roles = ['patient', 'doctor', 'admin']
        return role in valid_roles
    
    @staticmethod
    def validate_nmc_uid(nmc_uid):
        """Validate NMC UID format (7 digits)"""
        if not nmc_uid:
            return False
        # NMC UID is typically 7 digits
        return bool(re.match(r'^\d{7}$', str(nmc_uid)))

class RecordSchema:
    """Medical record document schema"""
    
    @staticmethod
    def create(patient_id, uploaded_by, file_name, file_type, encrypted_data, 
               encryption_metadata, description=''):
        """Create a new record document"""
        return {
            'patient_id': ObjectId(patient_id),
            'uploaded_by': ObjectId(uploaded_by),
            'file_name': file_name,
            'file_type': file_type,
            'encrypted_data': encrypted_data,
            'encryption_metadata': encryption_metadata,
            'description': description,
            'uploaded_at': datetime.utcnow(),
            'is_deleted': False
        }

class AccessPermissionSchema:
    """Access permission document schema"""
    
    @staticmethod
    def create(patient_id, doctor_id, permission_level='read'):
        """Create a new access permission document"""
        return {
            'patient_id': ObjectId(patient_id),
            'doctor_id': ObjectId(doctor_id),
            'permission_level': permission_level,
            'granted_at': datetime.utcnow()
        }

class AuditLogSchema:
    """Audit log document schema"""
    
    @staticmethod
    def create(user_id, action, resource_type, resource_id=None, ip_address=None, details=None):
        """Create a new audit log document"""
        return {
            'user_id': user_id,
            'action': action,
            'resource_type': resource_type,
            'resource_id': resource_id,
            'ip_address': ip_address,
            'details': details,
            'timestamp': datetime.utcnow()
        }