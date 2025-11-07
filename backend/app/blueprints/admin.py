from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime, timedelta
from app.models.database import get_users_collection, get_records_collection, get_audit_logs_collection
from app.utils.auth import require_auth, require_role
from app.utils.audit import log_action

bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@bp.route('/stats', methods=['GET'])
@require_auth
@require_role(['admin'])
def get_stats():
    """Get system statistics"""
    try:
        users_collection = get_users_collection()
        records_collection = get_records_collection()
        
        if users_collection is None or records_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        total_users = users_collection.count_documents({})
        total_patients = users_collection.count_documents({'role': 'patient'})
        total_doctors = users_collection.count_documents({'role': 'doctor', 'is_verified': True})
        pending_doctors = users_collection.count_documents({'role': 'doctor', 'is_verified': False})
        total_records = records_collection.count_documents({'is_deleted': False})
        
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        recent_uploads = records_collection.count_documents({
            'uploaded_at': {'$gte': seven_days_ago},
            'is_deleted': False
        })
        
        recent_registrations = users_collection.count_documents({
            'created_at': {'$gte': seven_days_ago}
        })
        
        return jsonify({
            'users': {
                'total': total_users,
                'patients': total_patients,
                'doctors': total_doctors,
                'pending_doctors': pending_doctors
            },
            'records': {
                'active': total_records
            },
            'recent_activity': {
                'uploads_last_7_days': recent_uploads,
                'registrations_last_7_days': recent_registrations
            }
        }), 200
    
    except Exception as e:
        print(f"Get stats error: {e}")
        return jsonify({'error': 'Failed to fetch statistics'}), 500

@bp.route('/audit-logs', methods=['GET'])
@require_auth
@require_role(['admin'])
def get_audit_logs():
    """Get audit logs"""
    try:
        audit_collection = get_audit_logs_collection()
        if audit_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        logs = list(audit_collection.find().sort('timestamp', -1).limit(100))
        
        for log in logs:
            log['_id'] = str(log['_id'])
        
        return jsonify({'logs': logs, 'count': len(logs)}), 200
    
    except Exception as e:
        print(f"Get audit logs error: {e}")
        return jsonify({'error': 'Failed to fetch audit logs'}), 500

@bp.route('/users/<user_id>/toggle-status', methods=['PATCH'])
@require_auth
@require_role(['admin'])
def toggle_user_status(user_id):
    """Toggle user active status"""
    try:
        users_collection = get_users_collection()
        if users_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        new_status = not user.get('is_active', True)
        
        users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'is_active': new_status}}
        )
        
        log_action(request.user['user_id'], 'toggle_user_status', 'user', user_id)
        
        return jsonify({
            'message': f'User {"activated" if new_status else "deactivated"} successfully',
            'is_active': new_status
        }), 200
    
    except Exception as e:
        print(f"Toggle user status error: {e}")
        return jsonify({'error': 'Failed to toggle user status'}), 500

@bp.route('/pending-doctors', methods=['GET'])
@require_auth
@require_role(['admin'])
def get_pending_doctors():
    """Get all pending doctor registrations"""
    try:
        users_collection = get_users_collection()
        if users_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        pending_doctors = list(users_collection.find({
            'role': 'doctor',
            'is_verified': False
        }).sort('created_at', -1))
        
        for doctor in pending_doctors:
            doctor.pop('password_hash', None)
            doctor['_id'] = str(doctor['_id'])
        
        return jsonify({
            'pending_doctors': pending_doctors,
            'count': len(pending_doctors)
        }), 200
    
    except Exception as e:
        print(f"Get pending doctors error: {e}")
        return jsonify({'error': 'Failed to fetch pending doctors'}), 500

@bp.route('/verify-doctor/<user_id>', methods=['PATCH'])
@require_auth
@require_role(['admin'])
def verify_doctor(user_id):
    """Approve or reject doctor registration"""
    try:
        users_collection = get_users_collection()
        if users_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        data = request.get_json()
        action = data.get('action')  # 'approve' or 'reject'
        
        if action not in ['approve', 'reject']:
            return jsonify({'error': 'Invalid action. Must be approve or reject'}), 400
        
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        
        if not user:
            return jsonify({'error': 'Doctor not found'}), 404
        
        if user['role'] != 'doctor':
            return jsonify({'error': 'User is not a doctor'}), 400
        
        if action == 'approve':
            users_collection.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': {
                    'is_verified': True,
                    'verified_at': datetime.utcnow(),
                    'verified_by': request.user['user_id']
                }}
            )
            message = 'Doctor verified successfully'
            log_action(request.user['user_id'], 'doctor_approve', 'user', user_id)
        else:
            # For rejection, delete the registration
            users_collection.delete_one({'_id': ObjectId(user_id)})
            message = 'Doctor registration rejected and removed'
            log_action(request.user['user_id'], 'doctor_reject', 'user', user_id)
        
        return jsonify({'message': message}), 200
    
    except Exception as e:
        print(f"Verify doctor error: {e}")
        return jsonify({'error': 'Failed to verify doctor'}), 500
