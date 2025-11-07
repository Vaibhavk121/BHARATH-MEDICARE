// Authentication JavaScript for BharathMedicare

// ============================================
// LOGIN HANDLER
// ============================================

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Validate inputs
    if (!email || !password) {
        showError('Please enter both email and password');
        return;
    }
    
    showLoading();
    
    try {
        const response = await apiCall(API_ENDPOINTS.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        // Store token and user data
        setAuthToken(response.token);
        setUserData(response.user);
        
        showSuccess('Login successful! Redirecting...');
        
        // Redirect based on role
        setTimeout(() => {
            redirectToDashboard(response.user.role);
        }, 1000);
        
    } catch (error) {
        showError(error.message || 'Login failed. Please check your credentials.');
    } finally {
        hideLoading();
    }
}

// ============================================
// REGISTER HANDLER
// ============================================

async function handleRegister(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('role').value;
    const phone = document.getElementById('phone')?.value;
    const nmcUid = document.getElementById('nmcUid')?.value;
    const isDiabeticInput = document.getElementById('isDiabetic');
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    // Validate NMC UID for doctors
    if (role === 'doctor') {
        if (!nmcUid) {
            showError('NMC UID is required for doctor registration');
            return;
        }
        if (!/^\d{7}$/.test(nmcUid)) {
            showError('NMC UID must be exactly 7 digits');
            return;
        }
    }
    
    showLoading();
    
    try {
        const registerData = {
            full_name: fullName,
            email,
            password,
            role,
            phone
        };
        
        // Add NMC UID if doctor
        if (role === 'doctor') {
            registerData.nmc_uid = nmcUid;
        } else if (role === 'patient') {
            // ADD DIABETIC STATUS FOR PATIENT (isDiabetic is a boolean based on dropdown value)
            registerData.is_diabetic = isDiabeticInput ? isDiabeticInput.value === 'true' : false;
        }
        
        const response = await apiCall(API_ENDPOINTS.REGISTER, {
            method: 'POST',
            body: JSON.stringify(registerData)
        });
        
        // Show success message based on role
        if (role === 'patient') {
            showSuccess('Basic registration successful! Please log in immediately to complete your detailed health profile.', 5000);
        } else if (role === 'admin') {
            showSuccess('Admin account created successfully! You can now log in.', 3000);
        } else {
            showSuccess('Registration successful! You can now log in.', 3000);
        }
        
        // Redirect to login page
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);
        
    } catch (error) {
        showError(error.message || 'Registration failed. Please try again.');
    } finally {
        hideLoading();
    }
}

// ============================================
// PASSWORD TOGGLE
// ============================================

function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const button = field.parentElement.querySelector('.password-toggle');
    const icon = button.querySelector('i');
    
    if (field.type === 'password') {
        field.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        field.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// ============================================
// ROLE FIELD TOGGLE (for register page)
// UPDATED to include Diabetic Status toggle
// ============================================

function toggleNMCField() {
    const role = document.getElementById('role').value;
    const nmcField = document.getElementById('nmcField');
    const nmcInput = document.getElementById('nmcUid');
    const diabeticField = document.getElementById('diabeticField');
    const isDiabeticInput = document.getElementById('isDiabetic');

    if (role === 'doctor') {
        // Show NMC for doctors, hide diabetic
        nmcField.style.display = 'block';
        diabeticField.style.display = 'none';
        nmcInput.required = true;
        isDiabeticInput.required = false;

    } else if (role === 'patient') {
        // Show diabetic for patients, hide NMC
        nmcField.style.display = 'none';
        diabeticField.style.display = 'block';
        nmcInput.required = false;
        isDiabeticInput.required = true; // Diabtic status is now mandatory for quick registration

    } else {
        // Default state
        nmcField.style.display = 'none';
        diabeticField.style.display = 'none';
        nmcInput.required = false;
        isDiabeticInput.required = false;
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function redirectToDashboard(role) {
    switch(role) {
        case 'admin':
            window.location.href = '/pages/admin-dashboard.html';
            break;
        case 'doctor':
            window.location.href = '/pages/doctor-dashboard.html';
            break;
        case 'patient':
            window.location.href = '/pages/patient-dashboard.html';
            break;
        default:
            window.location.href = '/index.html';
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        logout();
        showSuccess('Logged out successfully');
    }
}

// ============================================
// AUTO-FOCUS (on page load)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Auto-focus first input field
    const firstInput = document.querySelector('input[type="text"], input[type="email"]');
    if (firstInput) {
        firstInput.focus();
    }
    
    // Initial call to set correct display state for conditional fields
    const roleSelect = document.getElementById('role');
    if (roleSelect) {
        toggleNMCField(); 
    }
});