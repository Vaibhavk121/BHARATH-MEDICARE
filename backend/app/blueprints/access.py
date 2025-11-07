from flask import Blueprint, request, jsonify
from bson import ObjectId
from app.models.database import get_access_permissions_collection, get_users_collection
from app.models.schemas import AccessPermissionSchema
from app.utils.auth import require_auth
from app.utils.audit import log_action

bp = Blueprint('access', __name__, url_prefix='/api/access')

@bp.route('/grant', methods=['POST'])
@require_auth
def grant_access():
    """Grant access to a doctor"""
    try:
        access_collection = get_access_permissions_collection()
        users_collection = get_users_collection()
        
        if access_collection is None or users_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        data = request.get_json()
        
        if not data.get('doctor_id'):
            return jsonify({'error': 'doctor_id required'}), 400
        
        patient_id = data.get('patient_id', request.user['user_id'])
        doctor_id = data['doctor_id']
        
        # Verify user can grant for this patient
        if request.user['role'] == 'patient' and patient_id != request.user['user_id']:
            return jsonify({'error': 'Cannot grant access for other patients'}), 403
        
        # Check if permission already exists
        existing = access_collection.find_one({
            'patient_id': ObjectId(patient_id),
            'doctor_id': ObjectId(doctor_id)
        })
        
        if existing:
            return jsonify({'error': 'Access already granted'}), 409
        
        # Create permission
        permission = AccessPermissionSchema.create(
            patient_id=patient_id,
            doctor_id=doctor_id,
            permission_level=data.get('permission_level', 'read')
        )
        
        result = access_collection.insert_one(permission)
        
        log_action(request.user['user_id'], 'grant_access', 'access_permission', str(result.inserted_id))
        
        return jsonify({
            'message': 'Access granted successfully',
            'permission_id': str(result.inserted_id)
        }), 201
    
    except Exception as e:
        print(f"Grant access error: {e}")
        return jsonify({'error': 'Failed to grant access'}), 500

@bp.route('/revoke', methods=['POST'])
@require_auth
def revoke_access():
    """Revoke doctor's access"""
    try:
        access_collection = get_access_permissions_collection()
        if access_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        data = request.get_json()
        
        if not data.get('doctor_id'):
            return jsonify({'error': 'doctor_id required'}), 400
        
        patient_id = data.get('patient_id', request.user['user_id'])
        
        result = access_collection.delete_one({
            'patient_id': ObjectId(patient_id),
            'doctor_id': ObjectId(data['doctor_id'])
        })
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Permission not found'}), 404
        
        log_action(request.user['user_id'], 'revoke_access', 'access_permission')
        
        return jsonify({'message': 'Access revoked successfully'}), 200
    
    except Exception as e:
        print(f"Revoke access error: {e}")
        return jsonify({'error': 'Failed to revoke access'}), 500

@bp.route('/my-permissions', methods=['GET'])
@require_auth
def get_my_permissions():
    """Get permissions for current user"""
    try:
        access_collection = get_access_permissions_collection()
        users_collection = get_users_collection()
        
        if access_collection is None or users_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        user_id = request.user['user_id']
        role = request.user['role']
        
        if role == 'patient':
            permissions = list(access_collection.find({'patient_id': ObjectId(user_id)}))
            
            for perm in permissions:
                perm['_id'] = str(perm['_id'])
                perm['patient_id'] = str(perm['patient_id'])
                perm['doctor_id'] = str(perm['doctor_id'])
                
                doctor = users_collection.find_one({'_id': ObjectId(perm['doctor_id'])})
                if doctor:
                    doctor.pop('password_hash', None)
                    perm['doctor'] = {
                        'id': str(doctor['_id']),
                        'full_name': doctor['full_name'],
                        'email': doctor['email']
                    }
        
        elif role == 'doctor':
            permissions = list(access_collection.find({'doctor_id': ObjectId(user_id)}))
            
            for perm in permissions:
                perm['_id'] = str(perm['_id'])
                perm['patient_id'] = str(perm['patient_id'])
                perm['doctor_id'] = str(perm['doctor_id'])
                
                patient = users_collection.find_one({'_id': ObjectId(perm['patient_id'])})
                if patient:
                    patient.pop('password_hash', None)
                    perm['patient'] = {
                        'id': str(patient['_id']),
                        'full_name': patient['full_name'],
                        'email': patient['email']
                    }
        
        else:
            permissions = []
        
        return jsonify({'permissions': permissions, 'count': len(permissions)}), 200
    
    except Exception as e:
        print(f"Get permissions error: {e}")
        return jsonify({'error': 'Failed to fetch permissions'}), 500
