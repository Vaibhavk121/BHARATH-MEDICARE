// API Helper Functions

// Make API call
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
        'Content-Type': 'application/json'
    };
    
    // Add auth token if available
    const token = getAuthToken();
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Upload file with FormData
async function apiCallUpload(endpoint, formData) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = {};
    
    // Add auth token if available
    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('Upload failed:', error);
        throw error;
    }
}

// API call for photo upload (specialized)
async function apiCallPhoto(endpoint, file) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAuthToken();
    
    const formData = new FormData();
    formData.append('photo', file);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Photo upload failed');
        }
        
        return data;
    } catch (error) {
        console.error('Photo upload error:', error);
        throw error;
    }
}

// Auth token management
function setAuthToken(token) {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
}

function getAuthToken() {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
}

function removeAuthToken() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
}

// User data management
function setUserData(userData) {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
}

function getUserData() {
    const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
}

function removeUserData() {
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
}

// Check if user is authenticated
function isAuthenticated() {
    return !!getAuthToken();
}

// Logout
function logout() {
    removeAuthToken();
    removeUserData();
    window.location.href = '../index.html';
}

// Require authentication
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '../pages/login.html';
        return false;
    }
    return true;
}

// Redirect to appropriate dashboard
function redirectToDashboard(role) {
    switch(role) {
        case 'admin':
            window.location.href = 'admin-dashboard.html';
            break;
        case 'doctor':
            window.location.href = 'doctor-dashboard.html';
            break;
        case 'patient':
            window.location.href = 'patient-dashboard.html';
            break;
        default:
            window.location.href = '../index.html';
    }
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Truncate text
function truncateText(text, length = 50) {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
}

// Confirm action
function confirmAction(message) {
    return confirm(message);
}

// Clear form
function clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }
}

// Validate file
function validateFile(file) {
    // Check file size
    if (file.size > APP_CONFIG.MAX_FILE_SIZE) {
        return {
            valid: false,
            error: 'File size must be less than 10MB'
        };
    }
    
    // Check file type
    if (!APP_CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: 'Invalid file type. Only PDF, JPG, and PNG files are allowed'
        };
    }
    
    return { valid: true };
}

// Validate photo file
function validatePhotoFile(file) {
    // Check file size (max 2MB for photos)
    if (file.size > 2 * 1024 * 1024) {
        return {
            valid: false,
            error: 'Photo size must be less than 2MB'
        };
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Invalid photo type. Only JPG and PNG files are allowed'
        };
    }
    
    return { valid: true };
}

// Validate NMC UID
function validateNMCUID(nmcUid) {
    const regex = /^\d{7}$/;
    return regex.test(nmcUid);
}

// Parse comma-separated string to array
function parseCommaSeparated(text) {
    if (!text || text.trim() === '') return [];
    return text.split(',').map(item => item.trim()).filter(item => item !== '');
}

// Array to comma-separated string
function arrayToCommaSeparated(arr) {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return '';
    return arr.join(', ');
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        apiCall,
        apiCallUpload,
        apiCallPhoto,
        setAuthToken,
        getAuthToken,
        removeAuthToken,
        setUserData,
        getUserData,
        removeUserData,
        isAuthenticated,
        logout,
        requireAuth,
        redirectToDashboard,
        formatDate,
        formatFileSize,
        truncateText,
        confirmAction,
        clearForm,
        validateFile,
        validatePhotoFile,
        validateNMCUID,
        parseCommaSeparated,
        arrayToCommaSeparated
    };
}
