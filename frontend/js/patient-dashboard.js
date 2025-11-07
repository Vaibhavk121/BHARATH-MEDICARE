// Patient Dashboard JavaScript

let myRecords = [];
let myPermissions = [];
let healthCardData = null;
let currentPhotoFile = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Authentication and Role Check
    if (!requireAuth()) return;
    
    const user = getUserData();
    
    if (user.role !== 'patient') {
        showError('Access denied. This page is for patients only.');
        setTimeout(() => {
            redirectToDashboard(user.role);
        }, 2000);
        return;
    }
    
    // Set patient name
    document.getElementById('patientName').textContent = user.full_name || 'Patient';
    
    // 2. Load profile first to ensure the latest status is available
    await loadProfile(); 
    const updatedUser = getUserData();

    // Debug logging
    console.log('User data after loadProfile:', updatedUser);
    console.log('is_profile_complete:', updatedUser.is_profile_complete);

    // 3. Enforce Profile Completion
    if (updatedUser.hasOwnProperty('is_profile_complete') && updatedUser.is_profile_complete === false) {
        showError('Profile completion required. Please fill in all required fields to access the full dashboard.', 5000);
        
        // Show only the profile section
        showSection('profile');
        
        // Disable all other sidebar links
        document.querySelectorAll('.sidebar-menu-link').forEach(link => {
            if (!link.getAttribute('onclick').includes('profile')) {
                link.style.pointerEvents = 'none';
                link.style.opacity = '0.5';
                link.classList.remove('active');
            } else {
                link.classList.add('active');
            }
        });

        // Skip loading other data and setting up listeners since dashboard is restricted
        return;
    }

    // 4. Load remaining data
    await loadDashboardData();
    
    // 5. Setup event listeners
    setupEventListeners();
    
    // 6. Set initial view
    showSection('dashboard');
});

// Setup all event listeners
function setupEventListeners() {
    // Profile Section Listeners
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.onchange = handlePhotoSelect;
    }
    
    const deletePhotoBtn = document.getElementById('deletePhotoBtn');
    if (deletePhotoBtn) {
        deletePhotoBtn.onclick = handleDeletePhoto;
    }
    
    const profilePhoto = user.profile_photo ? 
        `<img src="${user.profile_photo}" style="width: 100%; height: 100%; object-fit: cover;">` :
        '<i class="fas fa-user" style="font-size: 2rem; color: white;"></i>';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Health Card Print</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;800&display=swap" rel="stylesheet">
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet"/>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }
                
                body {
                    font-family: 'Courier New', monospace;
                    padding: 15mm;
                    background: #ffffff;
                }
                
                .card-container {
                    display: flex;
                    gap: 15mm;
                    justify-content: center;
                    align-items: flex-start;
                    margin-bottom: 12mm;
                }
                
                .health-card {
                    width: 85.6mm;
                    height: 54mm;
                    border-radius: 16px;
                    padding: 15px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    font-family: 'Courier New', monospace;
                }
                
                .card-front {
                    background: linear-gradient(135deg, #FF9933, #FFB366);
                }
                
                .card-back {
                    background: linear-gradient(135deg, #2ecc71, #52c97a);
                }
                
                .card-bg-pattern {
                    position: absolute;
                    top: -30%;
                    right: -10%;
                    width: 300px;
                    height: 300px;
                    background: radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px);
                    background-size: 20px 20px;
                    border-radius: 50%;
                }
                
                .card-content {
                    position: relative;
                    z-index: 2;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                
                .front-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 10px;
                }
                
                .front-left {
                    flex: 1;
                }
                
                .logo-section {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 10px;
                }
                
                .logo {
                    height: 32px;
                    background: white;
                    border-radius: 6px;
                    padding: 3px;
                }
                
                .brand-name {
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: white;
                    line-height: 1.1;
                }
                
                .brand-subtitle {
                    font-size: 0.5rem;
                    color: rgba(255,255,255,0.9);
                }
                
                .card-id-section {
                    margin-left: 40px;
                }
                
                .label {
                    font-size: 0.5rem;
                    color: rgba(255,255,255,0.8);
                    text-transform: uppercase;
                    font-weight: 600;
                    margin-bottom: 2px;
                }
                
                .card-number {
                    font-size: 0.85rem;
                    font-weight: 800;
                    color: white;
                    letter-spacing: 1px;
                }
                
                .front-right {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }
                
                .photo-container {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.3);
                    border: 2px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
                
                .qr-container {
                    background: white;
                    border-radius: 8px;
                    padding: 4px;
                    width: 60px;
                    height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .qr-container img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }
                
                .front-details {
                    display: flex;
                    gap: 15px;
                }
                
                .detail-item {
                    min-width: 80px;
                }
                
                .detail-value {
                    font-size: 0.75rem;
                    color: white;
                    font-weight: 700;
                }
                
                .back-header {
                    text-align: center;
                    font-size: 0.8rem;
                    font-weight: 800;
                    color: white;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 8px;
                }
                
                .info-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    flex: 1;
                }
                
                .info-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 6px;
                }
                
                .info-box {
                    background: rgba(255,255,255,0.15);
                    padding: 6px 8px;
                    border-radius: 6px;
                    border: 1px solid rgba(255,255,255,0.2);
                }
                
                .info-label {
                    font-size: 0.5rem;
                    color: rgba(255,255,255,0.85);
                    text-transform: uppercase;
                    font-weight: 600;
                    margin-bottom: 2px;
                }
                
                .info-value {
                    font-size: 0.7rem;
                    color: white;
                    font-weight: 700;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 100%;
                }
                
                .back-footer {
                    border-top: 1px solid rgba(255,255,255,0.3);
                    padding-top: 6px;
                    text-align: center;
                    font-size: 0.55rem;
                    color: rgba(255,255,255,0.9);
                }
                
                .instruction {
                    text-align: center;
                    font-family: 'Poppins', sans-serif;
                    font-size: 10pt;
                    line-height: 1.7;
                    color: #333;
                    margin-top: 10mm;
                }
                
                .warning {
                    background: #fff3cd;
                    border: 2px solid #ffc107;
                    padding: 10px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    color: #856404;
                    font-weight: bold;
                }
                
                @media print {
                    body { padding: 10mm; }
                }
                
                @page {
                    size: A4 landscape;
                    margin: 10mm;
                }
            </style>
        </head>
        <body>
            <div class="card-container">
                <div class="health-card card-front">
                    <div class="card-bg-pattern"></div>
                    <div class="card-content">
                        <div class="front-header">
                            <div class="front-left">
                                <div class="logo-section">
                                    <img src="../assets/images/logo.png" class="logo" alt="Logo">
                                    <div>
                                        <div class="brand-name">BharathMedicare</div>
                                        <div class="brand-subtitle">Health ID</div>
                                    </div>
                                </div>
                                <div class="card-id-section">
                                    <div class="label">Card ID</div>
                                    <div class="card-number">${cardId}</div>
                                </div>
                            </div>
                            <div class="front-right">
                                <div class="photo-container">${profilePhoto}</div>
                                <div class="qr-container">
                                    <img src="${qrImageUrl}" alt="QR Code">
                                </div>
                            </div>
                        </div>
                        <div class="front-details">
                            <div class="detail-item">
                                <div class="label">Name</div>
                                <div class="detail-value">${user.full_name || 'Patient'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="label">Gender</div>
                                <div class="detail-value">${user.gender || '--'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="label">DOB</div>
                                <div class="detail-value">${dobFormatted}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="health-card card-back">
                    <div class="card-bg-pattern"></div>
                    <div class="card-content">
                        <div class="back-header">MEDICAL INFO</div>
                        <div class="info-grid">
                            <div class="info-row">
                                <div class="info-box">
                                    <div class="info-label">Blood Group</div>
                                    <div class="info-value">${user.blood_group || 'O+'}</div>
                                </div>
                                <div class="info-box">
                                    <div class="info-label">Diabetics</div>
                                    <div class="info-value">${isDiabetic}</div>
                                </div>
                            </div>
                            <div class="info-row">
                                <div class="info-box">
                                    <div class="info-label">Emerg. Name</div>
                                    <div class="info-value">${user.emergency_contact_name || 'Not Provided'}</div>
                                </div>
                                <div class="info-box">
                                    <div class="info-label">Emerg. Phone</div>
                                    <div class="info-value">${user.emergency_contact || '+91 --------'}</div>
                                </div>
                            </div>
                        </div>
                        <div class="back-footer">Keep Safe</div>
                    </div>
                </div>
            </div>
            
            <div class="instruction">
                <div class="warning">⚠️ IMPORTANT: Enable "Background graphics" in print settings!</div>
                <strong>PRINTING INSTRUCTIONS</strong><br>
                ✓ Print in COLOR on card stock (350 gsm recommended)<br>
                ✓ <strong>Enable "Background graphics"</strong> checkbox in print options<br>
                ✓ Print in landscape orientation<br>
                ✓ Cut each card to size (85.6mm × 54mm)<br>
                ✓ Laminate for durability and protection
            </div>
            <script>
                window.onload = function() {
                    setTimeout(() => { window.print(); }, 1000);
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Show section
function showSection(section) {
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('healthcardSection').style.display = 'none';
    document.getElementById('recordsSection').style.display = 'none';
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('accessSection').style.display = 'none';
    document.getElementById('profileSection').style.display = 'none';
    
    document.querySelectorAll('.sidebar-menu-link').forEach(link => {
        link.classList.remove('active');
    });
    
    let targetSectionElement;
    let targetLinkElement;
    
    switch(section) {
        case 'dashboard':
            targetSectionElement = document.getElementById('dashboardSection');
            targetLinkElement = document.querySelector('.sidebar-menu-link[onclick*="dashboard"]');
            break;
        case 'healthcard':
            targetSectionElement = document.getElementById('healthcardSection');
            targetLinkElement = document.querySelector('.sidebar-menu-link[onclick*="healthcard"]');
            break;
        case 'records':
            targetSectionElement = document.getElementById('recordsSection');
            targetLinkElement = document.querySelector('.sidebar-menu-link[onclick*="records"]');
            break;
        case 'upload':
            targetSectionElement = document.getElementById('uploadSection');
            targetLinkElement = document.querySelector('.sidebar-menu-link[onclick*="upload"]');
            break;
        case 'access':
            targetSectionElement = document.getElementById('accessSection');
            targetLinkElement = document.querySelector('.sidebar-menu-link[onclick*="access"]');
            break;
        case 'profile':
            targetSectionElement = document.getElementById('profileSection');
            targetLinkElement = document.querySelector('.sidebar-menu-link[onclick*="profile"]');
            break;
    }
    
    if (targetSectionElement) {
        targetSectionElement.style.display = 'block';
    }
    
    if (targetLinkElement) {
        targetLinkElement.classList.add('active');
    }
}Form = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.onsubmit = handleUpdateProfile;
    }
    
    const profileResetBtn = document.querySelector('#profileSection .btn-secondary');
    if (profileResetBtn) {
        profileResetBtn.onclick = loadProfile;
    }
    
    // Upload Section Listeners
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.onsubmit = handleUpload;
    }
    
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.onchange = handleFileSelect;
    }
    
    // Access Control Listeners
    const grantAccessForm = document.getElementById('grantAccessForm');
    if (grantAccessForm) {
        grantAccessForm.onsubmit = handleGrantAccess;
    }
    
    // Health Card Listeners
    const printCardBtn = document.querySelector('#healthcardSection .btn-primary');
    if (printCardBtn) {
        printCardBtn.onclick = printHealthCardSideBySide;
    }
    
    const downloadCardBtn = document.querySelector('#healthcardSection .btn-secondary');
    if (downloadCardBtn) {
        downloadCardBtn.onclick = downloadHealthCardSideBySide;
    }
    
    // Sidebar Navigation
    document.querySelectorAll('.sidebar-menu-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('onclick').match(/'(.*?)'/)[1];
            showSection(section);
            document.querySelectorAll('.sidebar-menu-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Logout Handler
    const logoutBtn = document.querySelector('.sidebar-footer .btn-danger');
    if (logoutBtn) {
        logoutBtn.onclick = handleLogout;
    }

// Load all dashboard data
async function loadDashboardData() {
    showLoading();
    
    try {
        await Promise.all([
            loadRecords(),
            loadPermissions(),
            loadHealthCard()
        ]);
        
        updateStats();
        
    } catch (error) {
        showError('Failed to load dashboard data');
        console.error(error);
    } finally {
        hideLoading();
    }
}

// Load patient records
async function loadRecords() {
    try {
        const response = await apiCall(API_ENDPOINTS.MY_RECORDS);
        myRecords = response.records || [];
        displayRecords();
        displayRecentRecords();
    } catch (error) {
        console.error('Failed to load records:', error);
        myRecords = [];
    }
}

// Load access permissions
async function loadPermissions() {
    try {
        const response = await apiCall(API_ENDPOINTS.MY_PERMISSIONS);
        myPermissions = response.permissions || [];
        displayAuthorizedDoctors();
    } catch (error) {
        console.error('Failed to load permissions:', error);
        myPermissions = [];
    }
}

// Load profile
async function loadProfile() {
    try {
        const response = await apiCall(API_ENDPOINTS.CURRENT_USER);
        const user = response.user;
        
        if (user) {
            // Update local storage
            setUserData(user);
            
            // Basic info
            document.getElementById('profileName').value = user.full_name || '';
            document.getElementById('profileEmail').value = user.email || '';
            document.getElementById('profilePhone').value = user.phone || '';
            document.getElementById('profileGender').value = user.gender || '';
            document.getElementById('profileDob').value = user.date_of_birth || '';
            document.getElementById('profileAddress').value = user.address || '';
            
            // Medical info
            document.getElementById('profileBloodGroup').value = user.blood_group || '';
            document.getElementById('profileHeight').value = user.height || '';
            document.getElementById('profileWeight').value = user.weight || '';
            
            // Convert arrays to comma-separated strings
            document.getElementById('profileAllergies').value = arrayToCommaSeparated(user.allergies);
            document.getElementById('profileConditions').value = arrayToCommaSeparated(user.chronic_conditions);
            document.getElementById('profileMedications').value = arrayToCommaSeparated(user.current_medications);
            
            // Emergency contact
            document.getElementById('profileEmergencyName').value = user.emergency_contact_name || '';
            document.getElementById('profileEmergency').value = user.emergency_contact || '';
            document.getElementById('profileEmergencyRelation').value = user.emergency_contact_relation || '';
            
            // Account info
            document.getElementById('profileCreated').value = formatDate(user.created_at || new Date());
            
            // Display profile photo
            displayProfilePhoto(user.profile_photo);
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

// Display profile photo
function displayProfilePhoto(photoUrl) {
    const preview = document.getElementById('profilePhotoPreview');
    const deleteBtn = document.getElementById('deletePhotoBtn');
    
    if (photoUrl) {
        preview.innerHTML = `<img src="${photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="Profile Photo">`;
        deleteBtn.style.display = 'inline-flex';
    } else {
        preview.innerHTML = '<i class="fas fa-user" style="font-size: 4rem; color: white;"></i>';
        deleteBtn.style.display = 'none';
    }
}

// Handle photo selection
function handlePhotoSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file
    const validation = validatePhotoFile(file);
    if (!validation.valid) {
        showError(validation.error);
        event.target.value = '';
        return;
    }
    
    // Preview photo
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('profilePhotoPreview');
        preview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;" alt="Profile Preview">`;
    };
    reader.readAsDataURL(file);
    
    // Upload photo immediately
    uploadProfilePhoto(file);
}

// Upload profile photo
async function uploadProfilePhoto(file) {
    showLoading();
    
    try {
        const response = await apiCallPhoto(API_ENDPOINTS.UPLOAD_PHOTO, file);
        
        // Update user data
        setUserData(response.user);
        
        // Display updated photo
        displayProfilePhoto(response.photo_url);
        
        // Update health card if loaded
        if (healthCardData) {
            await loadHealthCard();
        }
        
        showSuccess('Profile photo uploaded successfully!');
        
    } catch (error) {
        showError(error.message || 'Failed to upload photo');
        await loadProfile();
    } finally {
        hideLoading();
    }
}

// Delete profile photo
async function handleDeletePhoto() {
    if (!confirmAction('Are you sure you want to remove your profile photo?')) return;
    
    showLoading();
    
    try {
        await apiCall(API_ENDPOINTS.DELETE_PHOTO, {
            method: 'POST'
        });
        
        // Reset preview
        displayProfilePhoto(null);
        
        // Update user data
        const user = getUserData();
        user.profile_photo = null;
        setUserData(user);
        
        // Update health card
        if (healthCardData) {
            await loadHealthCard();
        }
        
        showSuccess('Profile photo removed successfully');
        
    } catch (error) {
        showError('Failed to delete photo');
    } finally {
        hideLoading();
    }
}

// Load health card
async function loadHealthCard() {
    try {
        const response = await apiCall(API_ENDPOINTS.HEALTH_CARD);
        healthCardData = response.health_card;
        displayHealthCard();
    } catch (error) {
        console.error('Failed to load health card:', error);
    }
}

// Display health card
function displayHealthCard() {
    if (!healthCardData) return;
    
    const user = getUserData();
    
    // Format DOB
    let dobFormatted = '--/--/----';
    if (user.date_of_birth) {
        const birthDate = new Date(user.date_of_birth);
        dobFormatted = birthDate.toLocaleDateString('en-IN');
    }
    
    // Check if diabetic
    let isDiabetic = 'No';
    if (user.chronic_conditions && Array.isArray(user.chronic_conditions)) {
        isDiabetic = user.chronic_conditions.some(cond => 
            cond.toLowerCase().includes('diabet')
        ) ? 'Yes' : 'No';
    }
    
    // FRONT SIDE
    document.getElementById('cardNumberFront').textContent = healthCardData.patient_id.substring(0, 8).toUpperCase();
    document.getElementById('cardHolderName').textContent = user.full_name || 'Patient Name';
    document.getElementById('cardGenderFront').textContent = user.gender || '--';
    document.getElementById('cardDOBFront').textContent = dobFormatted;
    
    // Display Photo on Card
    const photoContainer = document.getElementById('cardPhotoContainer');
    if (photoContainer) {
        if (user.profile_photo) {
            photoContainer.innerHTML = `<img src="${user.profile_photo}" style="width: 100%; height: 100%; object-fit: cover;" alt="Profile Photo">`;
        } else {
            photoContainer.innerHTML = '<i class="fas fa-user" style="font-size: 2rem; color: white;"></i>';
        }
    }
    
    // BACK SIDE
    document.getElementById('backBloodGroup').textContent = user.blood_group || 'O+';
    document.getElementById('backDiabetics').textContent = isDiabetic;
    document.getElementById('backEmergencyName').textContent = user.emergency_contact_name || 'Not Provided';
    document.getElementById('backEmergencyPhone').textContent = user.emergency_contact || '+91 --------';
    
    // Generate QR code with delay
    setTimeout(() => {
        generateQRCode(user, healthCardData);
    }, 300);
}

// Generate QR Code
function generateQRCode(user, healthCardData) {
    const container = document.getElementById('healthCardQR');
    if (!container) {
        console.error('QR container not found');
        return;
    }
    
    container.innerHTML = '';
    
    const qrData = `BHARATH|${healthCardData.patient_id}|${user.full_name}|${user.email}`;
    
    try {
        const encodedData = encodeURIComponent(qrData);
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodedData}&color=2ecc71&bgcolor=ffffff&qzone=1`;
        
        const img = document.createElement('img');
        img.src = qrImageUrl;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.borderRadius = '6px';
        img.alt = 'QR Code';
        
        img.onload = function() {
            console.log('QR Code loaded successfully');
        };
        
        img.onerror = function() {
            console.error('Failed to load QR code');
            container.innerHTML = '<div style="font-size: 0.6rem; color: #999; text-align: center; padding: 10px;">QR</div>';
        };
        
        container.appendChild(img);
        
    } catch (error) {
        console.error('QR Code error:', error);
        container.innerHTML = '<div style="font-size: 0.6rem; color: #999;">QR</div>';
    }
}

// Update statistics
function updateStats() {
    document.getElementById('totalRecords').textContent = myRecords.length;
    document.getElementById('authorizedDoctors').textContent = myPermissions.length;
}

// Display records in grid
function displayRecords() {
    const grid = document.getElementById('recordsGrid');
    
    if (myRecords.length === 0) {
        grid.innerHTML = `
            <div class="card" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-folder-open" style="font-size: 4rem; color: var(--text-secondary); margin-bottom: 20px;"></i>
                <h3 style="color: var(--text-primary); margin-bottom: 10px;">No Records Yet</h3>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">Upload your first medical record to get started</p>
                <button class="btn btn-primary" onclick="showSection('upload')">
                    <i class="fas fa-cloud-upload-alt"></i> Upload Record
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = myRecords.map(record => `
        <div class="record-card">
            <div class="record-icon">
                <i class="fas fa-file-${record.file_type === 'application/pdf' ? 'pdf' : 'image'}"></i>
            </div>
            <div class="record-name">${truncateText(record.file_name, 30)}</div>
            <div class="record-date">${formatDate(record.uploaded_at)}</div>
            ${record.description ? `<p style="font-size: 0.85rem; color: var(--text-secondary); margin: 8px 0;">${truncateText(record.description, 50)}</p>` : ''}
            <div style="display: flex; gap: 8px; margin-top: 12px;">
                <button class="btn btn-primary" style="flex: 1; padding: 8px;" onclick="downloadRecord('${record._id}')">
                    <i class="fas fa-download"></i>
                </button>
                <button class="btn btn-danger" style="flex: 1; padding: 8px;" onclick="deleteRecord('${record._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Display recent records
function displayRecentRecords() {
    const container = document.getElementById('recentRecordsContainer');
    const recentRecords = myRecords.slice(0, 5);
    
    if (recentRecords.length === 0) {
        container.innerHTML = '<p class="text-center" style="padding: 20px; color: var(--text-secondary);">No records uploaded yet</p>';
        return;
    }
    
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
            ${recentRecords.map(record => `
                <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
                    <i class="fas fa-file-${record.file_type === 'application/pdf' ? 'pdf' : 'image'}" style="font-size: 1.5rem; color: var(--primary-color);"></i>
                    <div style="flex: 1;">
                        <div style="font-weight: 600;">${truncateText(record.file_name, 40)}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">${formatDate(record.uploaded_at)}</div>
                    </div>
                    <button class="btn btn-primary" style="padding: 8px 16px;" onclick="downloadRecord('${record._id}')">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

// Display authorized doctors
function displayAuthorizedDoctors() {
    const container = document.getElementById('authorizedDoctorsList');
    
    if (myPermissions.length === 0) {
        container.innerHTML = '<p class="text-center" style="padding: 20px; color: var(--text-secondary);">No doctors authorized yet</p>';
        return;
    }
    
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
            ${myPermissions.map(permission => `
                <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
                    <i class="fas fa-user-md" style="font-size: 1.5rem; color: var(--primary-color);"></i>
                    <div style="flex: 1;">
                        <div style="font-weight: 600;">${permission.doctor_name || 'Doctor'}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Access granted: ${formatDate(permission.granted_at)}</div>
                    </div>
                    <button class="btn btn-danger" style="padding: 8px 16px;" onclick="revokeAccess('${permission._id}')">
                        <i class="fas fa-times"></i> Revoke
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

// Handle profile update
async function handleUpdateProfile(event) {
    event.preventDefault();
    
    showLoading();
    
    try {
        const updateData = {
            full_name: document.getElementById('profileName').value,
            phone: document.getElementById('profilePhone').value,
            gender: document.getElementById('profileGender').value,
            date_of_birth: document.getElementById('profileDob').value,
            address: document.getElementById('profileAddress').value,
            blood_group: document.getElementById('profileBloodGroup').value,
            height: document.getElementById('profileHeight').value,
            weight: document.getElementById('profileWeight').value,
            allergies: parseCommaSeparated(document.getElementById('profileAllergies').value),
            chronic_conditions: parseCommaSeparated(document.getElementById('profileConditions').value),
            current_medications: parseCommaSeparated(document.getElementById('profileMedications').value),
            emergency_contact_name: document.getElementById('profileEmergencyName').value,
            emergency_contact: document.getElementById('profileEmergency').value,
            emergency_contact_relation: document.getElementById('profileEmergencyRelation').value
        };
        
        const response = await apiCall(API_ENDPOINTS.UPDATE_PROFILE, {
            method: 'POST',
            body: JSON.stringify(updateData)
        });
        
        // Update stored user data
        setUserData(response.user);
        
        showSuccess('Profile updated successfully!');
        
        // Reload health card with updated data
        await loadHealthCard();
        
        // Check and reload if profile is now complete
        if (response.user && response.user.is_profile_complete === true) {
            showSuccess('Profile complete! Accessing full dashboard...', 2000);
            setTimeout(() => {
                window.location.reload(); 
            }, 2000);
        }
        
    } catch (error) {
        showError(error.message || 'Failed to update profile');
    } finally {
        hideLoading();
    }
}

// Handle file upload
async function handleUpload(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('fileInput');
    const description = document.getElementById('description').value;
    
    if (!fileInput.files || fileInput.files.length === 0) {
        showError('Please select a file to upload');
        return;
    }
    
    const file = fileInput.files[0];
    const validation = validateFile(file);
    
    if (!validation.valid) {
        showError(validation.error);
        return;
    }
    
    showLoading();
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('description', description);
        
        await apiCallUpload(API_ENDPOINTS.UPLOAD_RECORD, formData);
        
        showSuccess('File uploaded successfully!');
        
        await loadRecords();
        await loadHealthCard();
        updateStats();
        
        clearForm('uploadForm');
        clearFile();
        
        showSection('records');
        
    } catch (error) {
        showError(error.message || 'Upload failed');
    } finally {
        hideLoading();
    }
}

// Download record
async function downloadRecord(recordId) {
    showLoading();
    
    try {
        const url = `${API_BASE_URL}${API_ENDPOINTS.DOWNLOAD_RECORD(recordId)}`;
        const token = getAuthToken();
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Download failed');
        
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `medical_record_${recordId}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
        
        showSuccess('Record downloaded successfully');
        
    } catch (error) {
        showError('Download failed');
    } finally {
        hideLoading();
    }
}

// Delete record
async function deleteRecord(recordId) {
    if (!confirmAction('Are you sure you want to delete this record? This action cannot be undone.')) return;
    
    showLoading();
    
    try {
        await apiCall(API_ENDPOINTS.DELETE_RECORD(recordId), {
            method: 'DELETE'
        });
        
        showSuccess('Record deleted successfully');
        
        await loadRecords();
        await loadHealthCard();
        updateStats();
        
    } catch (error) {
        showError('Delete failed');
    } finally {
        hideLoading();
    }
}

// Grant access to doctor
async function handleGrantAccess(event) {
    event.preventDefault();
    
    const doctorEmail = document.getElementById('doctorEmail').value;
    
    showLoading();
    
    try {
        await apiCall(API_ENDPOINTS.GRANT_ACCESS, {
            method: 'POST',
            body: JSON.stringify({ doctor_email: doctorEmail })
        });
        
        showSuccess('Access granted successfully');
        
        await loadPermissions();
        updateStats();
        
        clearForm('grantAccessForm');
        
    } catch (error) {
        showError(error.message || 'Failed to grant access');
    } finally {
        hideLoading();
    }
}

// Revoke access
async function revokeAccess(permissionId) {
    if (!confirmAction('Are you sure you want to revoke this doctor\'s access?')) return;
    
    showLoading();
    
    try {
        await apiCall(API_ENDPOINTS.REVOKE_ACCESS, {
            method: 'POST',
            body: JSON.stringify({ permission_id: permissionId })
        });
        
        showSuccess('Access revoked successfully');
        
        await loadPermissions();
        updateStats();
        
    } catch (error) {
        showError('Failed to revoke access');
    } finally {
        hideLoading();
    }
}

// File selection handler
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.style.display = 'block';
}

// Clear file
function clearFile() {
    document.getElementById('fileInput').value = '';
    document.getElementById('fileInfo').style.display = 'none';
}

// Download health card as image
function downloadHealthCardSideBySide() {
    const cardFront = document.getElementById('cardFront');
    const cardBack = document.getElementById('cardBack');
    
    if (!cardFront || !cardBack) {
        showError('Health card not loaded. Please try again.');
        return;
    }
    
    showLoading();
    
    // Load html2canvas from CDN if not already loaded
    if (typeof html2canvas === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = () => captureAndDownload(cardFront, cardBack);
        script.onerror = () => {
            hideLoading();
            showError('Failed to load download library. Please try print option instead.');
        };
        document.head.appendChild(script);
    } else {
        captureAndDownload(cardFront, cardBack);
    }
}

async function captureAndDownload(cardFront, cardBack) {
    try {
        // Create a container for both cards side by side
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.gap = '40px';
        container.style.padding = '40px';
        container.style.background = 'white';
        container.style.width = 'fit-content';
        
        // Clone the cards
        const frontClone = cardFront.cloneNode(true);
        const backClone = cardBack.cloneNode(true);
        
        // Set explicit dimensions
        frontClone.style.width = '856px';
        frontClone.style.height = '540px';
        backClone.style.width = '856px';
        backClone.style.height = '540px';
        
        container.appendChild(frontClone);
        container.appendChild(backClone);
        
        // Temporarily add to document
        document.body.appendChild(container);
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        
        // Capture with html2canvas
        const canvas = await html2canvas(container, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true,
            allowTaint: true
        });
        
        // Remove temporary container
        document.body.removeChild(container);
        
        // Convert to blob and download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `BharathMedicare_HealthCard_${new Date().getTime()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            hideLoading();
            showSuccess('Health card downloaded successfully!');
        }, 'image/png');
        
    } catch (error) {
        console.error('Download error:', error);
        hideLoading();
        showError('Failed to download health card. Please try print option instead.');
    }
}

// Print health card
function printHealthCardSideBySide() {
    const user = getUserData();
    
    // Format DOB
    let dobFormatted = '--/--/----';
    if (user.date_of_birth) {
        const birthDate = new Date(user.date_of_birth);
        dobFormatted = birthDate.toLocaleDateString('en-IN');
    }
    
    // Check if diabetic
    let isDiabetic = 'No';
    if (user.chronic_conditions && Array.isArray(user.chronic_conditions)) {
        isDiabetic = user.chronic_conditions.some(cond => 
            cond.toLowerCase().includes('diabet')
        ) ? 'Yes' : 'No';
    }
    
    const cardId = healthCardData ? healthCardData.patient_id.substring(0, 8).toUpperCase() : '--------';
    
    const qrData = healthCardData ? 
        encodeURIComponent(`BHARATH|${healthCardData.patient_id}|${user.full_name}|${user.email}`) :
        encodeURIComponent('BHARATH|PATIENT|DATA');
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}&color=2ecc71&bgcolor=ffffff&qzone=1`;
    
    const profilePhoto = user.profile_photo ? 
        `<img src="${user.profile_photo}" style="width: 100%; height: 100%; object-fit: cover;">` :
        '<i class="fas fa-user" style="font-size: 2rem; color: white;"></i>';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Health Card Print</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;800&display=swap" rel="stylesheet">
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet"/>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }
                
                body {
                    font-family: 'Courier New', monospace;
                    padding: 15mm;
                    background: #ffffff;
                }
                
                .card-container {
                    display: flex;
                    gap: 15mm;
                    justify-content: center;
                    align-items: flex-start;
                    margin-bottom: 12mm;
                }
                
                .health-card {
                    width: 85.6mm;
                    height: 54mm;
                    border-radius: 16px;
                    padding: 15px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    font-family: 'Courier New', monospace;
                }
                
                .card-front {
                    background: linear-gradient(135deg, #FF9933, #FFB366);
                }
                
                .card-back {
                    background: linear-gradient(135deg, #2ecc71, #52c97a);
                }
                
                .card-bg-pattern {
                    position: absolute;
                    top: -30%;
                    right: -10%;
                    width: 300px;
                    height: 300px;
                    background: radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px);
                    background-size: 20px 20px;
                    border-radius: 50%;
                }
                
                .card-content {
                    position: relative;
                    z-index: 2;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                
                .front-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 10px;
                }
                
                .front-left {
                    flex: 1;
                }
                
                .logo-section {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 10px;
                }
                
                .logo {
                    height: 32px;
                    background: white;
                    border-radius: 6px;
                    padding: 3px;
                }
                
                .brand-name {
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: white;
                    line-height: 1.1;
                }
                
                .brand-subtitle {
                    font-size: 0.5rem;
                    color: rgba(255,255,255,0.9);
                }
                
                .card-id-section {
                    margin-left: 40px;
                }
                
                .label {
                    font-size: 0.5rem;
                    color: rgba(255,255,255,0.8);
                    text-transform: uppercase;
                    font-weight: 600;
                    margin-bottom: 2px;
                }
                
                .card-number {
                    font-size: 0.85rem;
                    font-weight: 800;
                    color: white;
                    letter-spacing: 1px;
                }
                
                .front-right {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }
                
                .photo-container {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.3);
                    border: 2px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
                
                .qr-container {
                    background: white;
                    border-radius: 8px;
                    padding: 4px;
                    width: 60px;
                    height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .qr-container img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }
                
                .front-details {
                    display: flex;
                    gap: 15px;
                }
                
                .detail-item {
                    min-width: 80px;
                }
                
                .detail-value {
                    font-size: 0.75rem;
                    color: white;
                    font-weight: 700;
                }
                
                .back-header {
                    text-align: center;
                    font-size: 0.8rem;
                    font-weight: 800;
                    color: white;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 8px;
                }
                
                .info-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    flex: 1;
                }
                
                .info-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 6px;
                }
                
                .info-box {
                    background: rgba(255,255,255,0.15);
                    padding: 6px 8px;
                    border-radius: 6px;
                    border: 1px solid rgba(255,255,255,0.2);
                }
                
                .info-label {
                    font-size: 0.5rem;
                    color: rgba(255,255,255,0.85);
                    text-transform: uppercase;
                    font-weight: 600;
                    margin-bottom: 2px;
                }
                
                .info-value {
                    font-size: 0.7rem;
                    color: white;
                    font-weight: 700;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 100%;
                }
                
                .back-footer {
                    border-top: 1px solid rgba(255,255,255,0.3);
                    padding-top: 6px;
                    text-align: center;
                    font-size: 0.55rem;
                    color: rgba(255,255,255,0.9);
                }
                
                .instruction {
                    text-align: center;
                    font-family: 'Poppins', sans-serif;
                    font-size: 10pt;
                    line-height: 1.7;
                    color: #333;
                    margin-top: 10mm;
                }
                
                .warning {
                    background: #fff3cd;
                    border: 2px solid #ffc107;
                    padding: 10px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    color: #856404;
                    font-weight: bold;
                }
                
                @media print {
                    body { padding: 10mm; }
                }
                
                @page {
                    size: A4 landscape;
                    margin: 10mm;
                }
            </style>
        </head>
        <body>
            <div class="card-container">
                <div class="health-card card-front">
                    <div class="card-bg-pattern"></div>
                    <div class="card-content">
                        <div class="front-header">
                            <div class="front-left">
                                <div class="logo-section">
                                    <img src="../assets/images/logo.png" class="logo" alt="Logo">
                                    <div>
                                        <div class="brand-name">BharathMedicare</div>
                                        <div class="brand-subtitle">Health ID</div>
                                    </div>
                                </div>
                                <div class="card-id-section">
                                    <div class="label">Card ID</div>
                                    <div class="card-number">${cardId}</div>
                                </div>
                            </div>
                            <div class="front-right">
                                <div class="photo-container">${profilePhoto}</div>
                                <div class="qr-container">
                                    <img src="${qrImageUrl}" alt="QR Code">
                                </div>
                            </div>
                        </div>
                        <div class="front-details">
                            <div class="detail-item">
                                <div class="label">Name</div>
                                <div class="detail-value">${user.full_name || 'Patient'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="label">Gender</div>
                                <div class="detail-value">${user.gender || '--'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="label">DOB</div>
                                <div class="detail-value">${dobFormatted}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="health-card card-back">
                    <div class="card-bg-pattern"></div>
                    <div class="card-content">
                        <div class="back-header">MEDICAL INFO</div>
                        <div class="info-grid">
                            <div class="info-row">
                                <div class="info-box">
                                    <div class="info-label">Blood Group</div>
                                    <div class="info-value">${user.blood_group || 'O+'}</div>
                                </div>
                                <div class="info-box">
                                    <div class="info-label">Diabetics</div>
                                    <div class="info-value">${isDiabetic}</div>
                                </div>
                            </div>
                            <div class="info-row">
                                <div class="info-box">
                                    <div class="info-label">Emerg. Name</div>
                                    <div class="info-value">${user.emergency_contact_name || 'Not Provided'}</div>
                                </div>
                                <div class="info-box">
                                    <div class="info-label">Emerg. Phone</div>
                                    <div class="info-value">${user.emergency_contact || '+91 --------'}</div>
                                </div>
                            </div>
                        </div>
                        <div class="back-footer">Keep Safe</div>
                    </div>
                </div>
            </div>
            
            <div class="instruction">
                <div class="warning">⚠️ IMPORTANT: Enable "Background graphics" in print settings!</div>
                <strong>PRINTING INSTRUCTIONS</strong><br>
                ✓ Print in COLOR on card stock (350 gsm recommended)<br>
                ✓ <strong>Enable "Background graphics"</strong> checkbox in print options<br>
                ✓ Print in landscape orientation<br>
                ✓ Cut each card to size (85.6mm × 54mm)<br>
                ✓ Laminate for durability and protection
            </div>
            <script>
                window.onload = function() {
                    setTimeout(() => { window.print(); }, 1000);
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Show section
function showSection(section) {
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('healthcardSection').style.display = 'none';
    document.getElementById('recordsSection').style.display = 'none';
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('accessSection').style.display = 'none';
    document.getElementById('profileSection').style.display = 'none';
    
    document.querySelectorAll('.sidebar-menu-link').forEach(link => {
        link.classList.remove('active');
    });
    
    let targetSectionElement;
    let targetLinkElement;
    
    switch(section) {
        case 'dashboard':
            targetSectionElement = document.getElementById('dashboardSection');
            targetLinkElement = document.querySelector('.sidebar-menu-link[onclick*="dashboard"]');
            break;
        case 'healthcard':
            targetSectionElement = document.getElementById('healthcardSection');
            targetLinkElement = document.querySelector('.sidebar-menu-link[onclick*="healthcard"]');
            break;
        case 'records':
            targetSectionElement = document.getElementById('recordsSection');
            targetLinkElement = document.querySelector('.sidebar-menu-link[onclick*="records"]');
            break;
        case 'upload':
            targetSectionElement = document.getElementById('uploadSection');
            targetLinkElement = document.querySelector('.sidebar-menu-link[onclick*="upload"]');
            break;
        case 'access':
            targetSectionElement = document.getElementById('accessSection');
            targetLinkElement = document.querySelector('.sidebar-menu-link[onclick*="access"]');
            break;
        case 'profile':
            targetSectionElement = document.getElementById('profileSection');
            targetLinkElement = document.querySelector('.sidebar-menu-link[onclick*="profile"]');
            break;
    }
    
    if (targetSectionElement) {
        targetSectionElement.style.display = 'block';
    }
    
    if (targetLinkElement) {
        targetLinkElement.classList.add('active');
    }
}