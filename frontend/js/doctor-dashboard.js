// Doctor Dashboard JavaScript

let myPatients = [];
let currentPatientRecords = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;
    
    const user = getUserData();
    
    if (user.role !== 'doctor') {
        showError('Access denied. This page is for doctors only.');
        setTimeout(() => {
            redirectToDashboard(user.role);
        }, 2000);
        return;
    }
    
    // Display doctor name
    document.getElementById('doctorName').textContent = user.full_name;
    
    await loadDashboardData();
});

// Load all dashboard data
async function loadDashboardData() {
    showLoading();
    
    try {
        await Promise.all([
            loadProfile(),
            loadPatients()
        ]);
        
        updateStats();
    } catch (error) {
        showError('Failed to load dashboard data');
        console.error(error);
    } finally {
        hideLoading();
    }
}

// Load profile
async function loadProfile() {
    try {
        const response = await apiCall(API_ENDPOINTS.CURRENT_USER);
        displayProfile(response.user);
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

// Load patients with access
async function loadPatients() {
    try {
        const response = await apiCall(API_ENDPOINTS.MY_PERMISSIONS);
        myPatients = response.permissions || [];
        displayPatients();
        displayRecentPatients();
    } catch (error) {
        console.error('Failed to load patients:', error);
        myPatients = [];
    }
}

// Update statistics
function updateStats() {
    document.getElementById('totalPatients').textContent = myPatients.length;
    
    // Count total accessible records (simplified - would need separate API call for exact count)
    document.getElementById('accessibleRecords').textContent = myPatients.length * 5; // Placeholder
}

// Display profile
function displayProfile(profile) {
    const profileDiv = document.getElementById('profileInfo');
    profileDiv.innerHTML = `
        <div style="display: grid; gap: 16px;">
            <div>
                <strong>Name:</strong> Dr. ${profile.full_name}
            </div>
            <div>
                <strong>Email:</strong> ${profile.email}
            </div>
            <div>
                <strong>Phone:</strong> ${profile.phone || 'Not provided'}
            </div>
            <div>
                <strong>Role:</strong> ${profile.role}
            </div>
            <div>
                <strong>Total Patients:</strong> ${myPatients.length}
            </div>
            <div>
                <strong>Account Created:</strong> ${formatDate(profile.created_at)}
            </div>
        </div>
    `;
}

// Display patients in table
function displayPatients() {
    const tbody = document.getElementById('patientsTableBody');
    
    if (myPatients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">No patients have granted you access yet</td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = myPatients.map(perm => `
        <tr>
            <td>${perm.patient.full_name}</td>
            <td>${perm.patient.email}</td>
            <td>
                <span style="padding: 4px 12px; background: var(--success-color); color: white; border-radius: 12px; font-size: 0.85rem;">
                    ${perm.permission_level}
                </span>
            </td>
            <td>${formatDate(perm.granted_at)}</td>
            <td>
                <button class="btn btn-primary" style="padding: 6px 12px;" 
                    onclick="viewPatientRecords('${perm.patient_id}', '${perm.patient.full_name}')">
                    View Records
                </button>
            </td>
        </tr>
    `).join('');
}

// Display recent patients
function displayRecentPatients() {
    const container = document.getElementById('recentPatientsList');
    const recentPatients = myPatients.slice(0, 5);
    
    if (recentPatients.length === 0) {
        container.innerHTML = '<p>No patients yet. Wait for patients to grant you access.</p>';
        return;
    }
    
    container.innerHTML = recentPatients.map(perm => `
        <div style="padding: 12px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>${perm.patient.full_name}</strong><br>
                <small style="color: var(--light-text);">Access granted: ${formatDate(perm.granted_at)}</small>
            </div>
            <button class="btn btn-primary" style="padding: 6px 12px;" 
                onclick="viewPatientRecords('${perm.patient_id}', '${perm.patient.full_name}')">
                View
            </button>
        </div>
    `).join('');
}

// View patient records
async function viewPatientRecords(patientId, patientName) {
    showLoading();
    
    try {
        // Note: This would need a new API endpoint to get records for a specific patient
        // For now, we'll show a placeholder
        document.getElementById('modalPatientName').textContent = `${patientName}'s Records`;
        document.getElementById('modalRecordsList').innerHTML = `
            <p style="color: var(--light-text);">
                This feature requires an additional API endpoint to fetch patient records by patient ID.
                Contact the system administrator to enable this functionality.
            </p>
            <p style="margin-top: 16px;">
                <strong>Patient ID:</strong> ${patientId}
            </p>
        `;
        
        document.getElementById('recordsModal').style.display = 'flex';
        
    } catch (error) {
        showError('Failed to load patient records');
    } finally {
        hideLoading();
    }
}

// Close records modal
function closeRecordsModal() {
    document.getElementById('recordsModal').style.display = 'none';
}

// Download patient record
async function downloadPatientRecord(recordId, fileName) {
    showLoading();
    
    try {
        const token = getAuthToken();
        const url = API_ENDPOINTS.DOWNLOAD_RECORD(recordId);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Download failed');
        }
        
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        
        showSuccess('Download started');
        
    } catch (error) {
        showError('Download failed');
    } finally {
        hideLoading();
    }
}

// Show section
function showSection(section) {
    // Hide all sections
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('patientsSection').style.display = 'none';
    document.getElementById('profileSection').style.display = 'none';
    
    // Remove active class from all menu items
    document.querySelectorAll('.sidebar-menu-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section
    switch(section) {
        case 'dashboard':
            document.getElementById('dashboardSection').style.display = 'block';
            break;
        case 'patients':
            document.getElementById('patientsSection').style.display = 'block';
            break;
        case 'profile':
            document.getElementById('profileSection').style.display = 'block';
            break;
    }
}
