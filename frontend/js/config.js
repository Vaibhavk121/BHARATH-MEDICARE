// Configuration JavaScript

// API Base URL - adjust this based on your environment
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'http://localhost:5000';

// API Endpoints
const API_ENDPOINTS = {
    // Health check
    HEALTH: '/api/health',
    
    // Authentication
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    VERIFY_TOKEN: '/api/auth/verify',
    
    // User endpoints
    CURRENT_USER: '/api/users/me',
    GET_USER: (userId) => `/api/users/${userId}`,
    ALL_USERS: '/api/users/all',
    UPDATE_PROFILE: '/api/users/update-profile',
    UPLOAD_PHOTO: '/api/users/upload-photo',
    DELETE_PHOTO: '/api/users/delete-photo',
    
    // Patient endpoints
    PATIENT_PROFILE: '/api/patients/profile',
    LIST_PATIENTS: '/api/patients/list',
    HEALTH_CARD: '/api/patients/health-card',
    
    // Records endpoints
    UPLOAD_RECORD: '/api/records/upload',
    MY_RECORDS: '/api/records/my-records',
    GET_RECORD: (recordId) => `/api/records/${recordId}`,
    DOWNLOAD_RECORD: (recordId) => `/api/records/${recordId}/download`,
    DELETE_RECORD: (recordId) => `/api/records/${recordId}`,
    
    // Access control endpoints
    GRANT_ACCESS: '/api/access/grant',
    REVOKE_ACCESS: '/api/access/revoke',
    MY_PERMISSIONS: '/api/access/my-permissions',
    
    // Admin endpoints
    ADMIN_STATS: '/api/admin/stats',
    AUDIT_LOGS: '/api/admin/audit-logs',
    TOGGLE_USER_STATUS: (userId) => `/api/admin/users/${userId}/toggle-status`,
    PENDING_DOCTORS: '/api/admin/pending-doctors',
    VERIFY_DOCTOR: (doctorId) => `/api/admin/verify-doctor/${doctorId}`
};

// Local storage keys
const STORAGE_KEYS = {
    AUTH_TOKEN: 'bharath_medicare_token',
    USER_DATA: 'bharath_medicare_user'
};

// Application constants
const APP_CONFIG = {
    APP_NAME: 'Bharath Medicare',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_PHOTO_SIZE: 2 * 1024 * 1024, // 2MB for profile photos
    ALLOWED_FILE_TYPES: [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ],
    ALLOWED_PHOTO_TYPES: [
        'image/jpeg',
        'image/jpg',
        'image/png'
    ],
    PASSWORD_MIN_LENGTH: 8,
    NMC_UID_LENGTH: 7
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_BASE_URL,
        API_ENDPOINTS,
        STORAGE_KEYS,
        APP_CONFIG
    };
}
