from flask import Blueprint, request, jsonify
from bson import ObjectId
from app.models.database import get_users_collection, get_records_collection
from app.utils.auth import require_auth, require_role

bp = Blueprint('patients', __name__, url_prefix='/api/patients')

@bp.route('/profile', methods=['GET'])
@require_auth
@require_role(['patient'])
def get_patient_profile():
    """Get patient's own profile with record count"""
    try:
        users_collection = get_users_collection()
        records_collection = get_records_collection()
        
        if users_collection is None or records_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        user_id = request.user['user_id']
        
        # Get user info
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Count records
        record_count = records_collection.count_documents({
            'patient_id': ObjectId(user_id),
            'is_deleted': False
        })
        
        user.pop('password_hash', None)
        user['_id'] = str(user['_id'])
        user['record_count'] = record_count
        
        return jsonify({'patient': user}), 200
    
    except Exception as e:
        print(f"Get patient profile error: {e}")
        return jsonify({'error': 'Failed to fetch profile'}), 500

@bp.route('/list', methods=['GET'])
@require_auth
@require_role(['admin', 'doctor'])
def list_patients():
    """List all patients (admin/doctor only)"""
    try:
        users_collection = get_users_collection()
        if users_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        patients = list(users_collection.find({'role': 'patient'}))
        
        for patient in patients:
            patient.pop('password_hash', None)
            patient['_id'] = str(patient['_id'])
        
        return jsonify({'patients': patients, 'count': len(patients)}), 200
    
    except Exception as e:
        print(f"List patients error: {e}")
        return jsonify({'error': 'Failed to fetch patients'}), 500

@bp.route('/health-card', methods=['GET'])
@require_auth
def get_health_card():
    """Get patient digital health card data"""
    try:
        users_collection = get_users_collection()
        records_collection = get_records_collection()
        
        if users_collection is None or records_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        user_id = request.user['user_id']
        
        # Get user details
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user['role'] != 'patient':
            return jsonify({'error': 'Only patients can have health cards'}), 403
        
        # Get record count
        record_count = records_collection.count_documents({
            'patient_id': ObjectId(user_id),
            'is_deleted': False
        })
        
        # Create health card data
        health_card = {
            'patient_id': str(user['_id']),
            'full_name': user.get('full_name', ''),
            'email': user.get('email', ''),
            'phone': user.get('phone', 'Not provided'),
            'blood_group': user.get('blood_group', 'Not specified'),
            'date_of_birth': user.get('date_of_birth', 'Not specified'),
            'address': user.get('address', 'Not provided'),
            'emergency_contact': user.get('emergency_contact', 'Not provided'),
            'member_since': user.get('created_at').isoformat() if user.get('created_at') else '',
            'total_records': record_count,
            'qr_data': f"BHARATH_MEDICARE_PATIENT:{str(user['_id'])}"
        }
        
        return jsonify({'health_card': health_card}), 200
    
    except Exception as e:
        print(f"Get health card error: {e}")
        return jsonify({'error': 'Failed to get health card'}), 500
