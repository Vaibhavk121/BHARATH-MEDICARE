from flask import Blueprint, request, jsonify
from app.models.database import get_users_collection
from app.models.schemas import UserSchema
from app.utils.auth import create_token
from app.utils.password import hash_password, verify_password, is_strong_password
from app.utils.audit import log_action

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def check_profile_completion(user):
    """Check if user profile is complete"""
    if user.get('role') != 'patient':
        return True  # Only check for patients
    
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
    
    # Check if all required fields are filled and not empty
    for field in required_fields:
        value = user.get(field)
        # For lists, check if they exist (even if empty, that's valid)
        # For other fields, check if they're not None or empty string
        if field in ['allergies', 'chronic_conditions']:
            if value is None:
                return False
        else:
            if value is None or value == '':
                return False
    
    return True

@bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        # Get users collection
        users_collection = get_users_collection()
        if users_collection is None:
            return jsonify({'error': 'Database connection error. Please try again later.'}), 503
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'full_name', 'role']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Validate role
        if not UserSchema.validate_role(data['role']):
            return jsonify({'error': 'Invalid role. Must be patient, doctor, or admin'}), 400
        
        # Validate NMC UID for doctors
        if data['role'] == 'doctor':
            if 'nmc_uid' not in data or not data['nmc_uid']:
                return jsonify({'error': 'NMC UID is required for doctor registration'}), 400
            
            if not UserSchema.validate_nmc_uid(data['nmc_uid']):
                return jsonify({'error': 'Invalid NMC UID format. Must be 7 digits'}), 400
            
            # Check if NMC UID already registered
            existing_nmc = users_collection.find_one({'nmc_uid': data['nmc_uid']})
            if existing_nmc:
                return jsonify({'error': 'This NMC UID is already registered'}), 409
        
        # Check password strength
        is_strong, message = is_strong_password(data['password'])
        if not is_strong:
            return jsonify({'error': message}), 400
        
        # Check if user already exists
        existing_user = users_collection.find_one({'email': data['email']})
        if existing_user:
            return jsonify({'error': 'User with this email already exists'}), 409
        
        # Hash password
        password_hash = hash_password(data['password'])
        
        # Determine diabetic status
        is_diabetic_flag = data.get('is_diabetic', False)
        
        # Create user document
        user_doc = UserSchema.create(
            email=data['email'],
            password_hash=password_hash,
            role=data['role'],
            full_name=data['full_name'],
            phone=data.get('phone'),
            nmc_uid=data.get('nmc_uid') if data['role'] == 'doctor' else None,
            is_diabetic=is_diabetic_flag
        )
        
        # NEW: Set is_profile_complete to False for new patients
        if data['role'] == 'patient':
            user_doc['is_profile_complete'] = False
        
        # Insert into database
        result = users_collection.insert_one(user_doc)
        
        # Log the action
        log_action(str(result.inserted_id), 'register', 'user', str(result.inserted_id))
        
        # Different message for doctor vs patient
        if data['role'] == 'doctor':
            message = 'Registration successful! Your account is pending admin approval. You will be notified once verified.'
        else:
            message = 'User registered successfully'
        
        return jsonify({
            'message': message,
            'user_id': str(result.inserted_id),
            'requires_approval': data['role'] == 'doctor'
        }), 201
    
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed. Please try again.'}), 500

@bp.route('/login', methods=['POST'])
def login():
    """Login user and return JWT token"""
    try:
        # Get users collection
        users_collection = get_users_collection()
        if users_collection is None:
            return jsonify({'error': 'Database connection error. Please try again later.'}), 503
        
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400
        
        # Find user
        user = users_collection.find_one({'email': data['email']})
        
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Verify password
        if not verify_password(data['password'], user['password_hash']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Check if user is active
        if not user.get('is_active', True):
            return jsonify({'error': 'Account is deactivated. Please contact administrator.'}), 403
        
        # Check if doctor is verified
        if user['role'] == 'doctor' and not user.get('is_verified', False):
            return jsonify({'error': 'Your account is pending admin approval. Please wait for verification.'}), 403
        
        # NEW: Check and update profile completion status
        is_complete = check_profile_completion(user)
        
        # Update the user document if completion status has changed
        if user.get('is_profile_complete') != is_complete:
            users_collection.update_one(
                {'_id': user['_id']},
                {'$set': {'is_profile_complete': is_complete}}
            )
            user['is_profile_complete'] = is_complete
        
        # Create JWT token
        token = create_token(
            user_id=str(user['_id']),
            email=user['email'],
            role=user['role']
        )
        
        if not token:
            return jsonify({'error': 'Failed to create authentication token'}), 500
        
        # Log the action
        log_action(str(user['_id']), 'login', 'user', str(user['_id']))
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': str(user['_id']),
                'email': user['email'],
                'role': user['role'],
                'full_name': user['full_name'],
                'is_profile_complete': is_complete  # Use calculated value
            }
        }), 200
    
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': 'Login failed. Please try again.'}), 500

@bp.route('/verify', methods=['GET'])
def verify_token():
    """Verify if token is valid"""
    try:
        from app.utils.auth import decode_token
        
        # Get token from header
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No token provided'}), 401
        
        try:
            token = auth_header.split(" ")[1]
        except IndexError:
            return jsonify({'error': 'Invalid token format'}), 401
        
        # Decode token
        payload = decode_token(token)
        
        if 'error' in payload:
            return jsonify({'error': payload['error']}), 401
        
        return jsonify({
            'valid': True,
            'user': payload
        }), 200
    
    except Exception as e:
        print(f"Token verification error: {e}")
        return jsonify({'error': 'Token verification failed'}), 500