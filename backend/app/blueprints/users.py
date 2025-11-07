from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
import base64
from app.models.database import get_users_collection
from app.utils.auth import require_auth, require_role
from app.utils.audit import log_action

bp = Blueprint('users', __name__, url_prefix='/api/users')

def check_profile_completion(user_data):
    """
    Check if patient profile is complete with all required fields.
    Returns True if complete, False otherwise.
    """
    if user_data.get('role') != 'patient':
        return True  # Only validate for patients
    
    required_fields = [
        'full_name',
        'phone',
        'gender',
        'date_of_birth',
        'address',
        'blood_group',
        'emergency_contact_name',
        'emergency_contact',
        'emergency_contact_relation',
        'allergies',
        'chronic_conditions'
    ]
    
    for field in required_fields:
        value = user_data.get(field)
        
        # For list fields (allergies, chronic_conditions), they must exist (can be empty list)
        if field in ['allergies', 'chronic_conditions']:
            if value is None:
                return False
        else:
            # For other fields, must have non-empty value
            if value is None or value == '':
                return False
    
    return True

@bp.route('/me', methods=['GET'])
@require_auth
def get_current_user():
    """Get current user's profile"""
    try:
        users_collection = get_users_collection()
        if users_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        user_id = request.user['user_id']
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check profile completion status
        is_complete = check_profile_completion(user)
        
        # Update if changed
        if user.get('is_profile_complete') != is_complete:
            users_collection.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': {'is_profile_complete': is_complete}}
            )
            user['is_profile_complete'] = is_complete
        
        # Remove sensitive data
        user.pop('password_hash', None)
        user['_id'] = str(user['_id'])
        
        return jsonify({'user': user}), 200
    
    except Exception as e:
        print(f"Get user error: {e}")
        return jsonify({'error': 'Failed to fetch user'}), 500

@bp.route('/<user_id>', methods=['GET'])
@require_auth
def get_user(user_id):
    """Get user by ID"""
    try:
        users_collection = get_users_collection()
        if users_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Remove sensitive data
        user.pop('password_hash', None)
        user['_id'] = str(user['_id'])
        
        return jsonify({'user': user}), 200
    
    except Exception as e:
        print(f"Get user error: {e}")
        return jsonify({'error': 'Failed to fetch user'}), 500

@bp.route('/all', methods=['GET'])
@require_auth
@require_role(['admin'])
def get_all_users():
    """Get all users (admin only)"""
    try:
        users_collection = get_users_collection()
        if users_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        users = list(users_collection.find())
        
        # Remove sensitive data
        for user in users:
            user.pop('password_hash', None)
            user['_id'] = str(user['_id'])
        
        return jsonify({'users': users, 'count': len(users)}), 200
    
    except Exception as e:
        print(f"Get users error: {e}")
        return jsonify({'error': 'Failed to fetch users'}), 500

@bp.route('/update-profile', methods=['POST'])
@require_auth
def update_profile():
    """Update user profile with comprehensive fields, setting is_profile_complete if all required medical data is present."""
    try:
        users_collection = get_users_collection()
        if users_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        data = request.get_json()
        user_id = request.user['user_id']
        
        # Fetch current user data first
        current_user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Fields that can be updated
        update_fields = {}
        
        # Basic information
        if 'full_name' in data and data['full_name']:
            update_fields['full_name'] = data['full_name']
        
        if 'phone' in data:
            update_fields['phone'] = data['phone']
        
        if 'gender' in data:
            update_fields['gender'] = data['gender']
        
        if 'address' in data:
            update_fields['address'] = data['address']
        
        if 'date_of_birth' in data:
            update_fields['date_of_birth'] = data['date_of_birth']
        
        if 'blood_group' in data:
            update_fields['blood_group'] = data['blood_group']
        
        # Physical measurements
        if 'height' in data:
            update_fields['height'] = data['height']
        
        if 'weight' in data:
            update_fields['weight'] = data['weight']
        
        # Emergency contact information
        if 'emergency_contact' in data:
            update_fields['emergency_contact'] = data['emergency_contact']
        
        if 'emergency_contact_name' in data:
            update_fields['emergency_contact_name'] = data['emergency_contact_name']
        
        if 'emergency_contact_relation' in data:
            update_fields['emergency_contact_relation'] = data['emergency_contact_relation']
        
        # Medical information - ENSURE EMPTY LISTS ARE ACCEPTED
        if 'allergies' in data:
            update_fields['allergies'] = data['allergies'] if isinstance(data['allergies'], list) else []
        
        if 'chronic_conditions' in data:
            update_fields['chronic_conditions'] = data['chronic_conditions'] if isinstance(data['chronic_conditions'], list) else []
        
        if 'current_medications' in data:
            update_fields['current_medications'] = data['current_medications'] if isinstance(data['current_medications'], list) else []
        
        if not update_fields:
            return jsonify({'error': 'No fields to update'}), 400
        
        update_fields['updated_at'] = datetime.utcnow()
        
        # Check for profile completion for patient role
        if request.user['role'] == 'patient':
            # Merge current data with updates
            combined_profile = {**current_user, **update_fields}
            
            # Check if profile is now complete
            is_complete = check_profile_completion(combined_profile)
            
            # Always set the completion status based on current state
            update_fields['is_profile_complete'] = is_complete
            
            print(f"Profile completion check: {is_complete}")
            print(f"Required fields status:")
            required_fields = [
                'full_name', 'phone', 'gender', 'date_of_birth', 'blood_group', 'address', 
                'emergency_contact', 'emergency_contact_name', 'emergency_contact_relation',
                'allergies', 'chronic_conditions'
            ]
            for field in required_fields:
                value = combined_profile.get(field)
                print(f"  {field}: {value} (type: {type(value)})")

        # Update user
        result = users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_fields}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'User not found'}), 404
        
        # Get updated user
        updated_user = users_collection.find_one({'_id': ObjectId(user_id)})
        updated_user.pop('password_hash', None)
        updated_user['_id'] = str(updated_user['_id'])
        
        log_action(user_id, 'update_profile', 'user', user_id)
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': updated_user
        }), 200
    
    except Exception as e:
        print(f"Update profile error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@bp.route('/upload-photo', methods=['POST'])
@require_auth
def upload_profile_photo():
    """Upload profile photo"""
    try:
        users_collection = get_users_collection()
        if users_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        user_id = request.user['user_id']
        
        # Check if file is in request
        if 'photo' not in request.files:
            return jsonify({'error': 'No photo file provided'}), 400
        
        file = request.files['photo']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type
        allowed_extensions = {'jpg', 'jpeg', 'png'}
        file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        
        if file_ext not in allowed_extensions:
            return jsonify({'error': 'Invalid file type. Only JPG, JPEG, PNG allowed'}), 400
        
        # Read file data
        file_data = file.read()
        
        # Validate file size (max 2MB)
        if len(file_data) > 2 * 1024 * 1024:
            return jsonify({'error': 'File too large. Maximum size is 2MB'}), 400
        
        # Convert to base64 for storage
        photo_base64 = base64.b64encode(file_data).decode('utf-8')
        photo_data = f"data:image/{file_ext};base64,{photo_base64}"
        
        # Update user profile
        result = users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {
                'profile_photo': photo_data,
                'updated_at': datetime.utcnow()
            }}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'User not found'}), 404
        
        # Get updated user
        updated_user = users_collection.find_one({'_id': ObjectId(user_id)})
        updated_user.pop('password_hash', None)
        updated_user['_id'] = str(updated_user['_id'])
        
        log_action(user_id, 'upload_profile_photo', 'user', user_id)
        
        return jsonify({
            'message': 'Profile photo uploaded successfully',
            'photo_url': photo_data,
            'user': updated_user
        }), 200
    
    except Exception as e:
        print(f"Upload profile photo error: {e}")
        return jsonify({'error': 'Failed to upload photo'}), 500

@bp.route('/delete-photo', methods=['POST'])
@require_auth
def delete_profile_photo():
    """Delete profile photo"""
    try:
        users_collection = get_users_collection()
        if users_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        user_id = request.user['user_id']
        
        # Remove profile photo
        result = users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {
                'profile_photo': None,
                'updated_at': datetime.utcnow()
            }}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'User not found'}), 404
        
        log_action(user_id, 'delete_profile_photo', 'user', user_id)
        
        return jsonify({'message': 'Profile photo deleted successfully'}), 200
    
    except Exception as e:
        print(f"Delete profile photo error: {e}")
        return jsonify({'error': 'Failed to delete photo'}), 500