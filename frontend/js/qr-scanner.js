// QR Code Scanner for Smart Health ID Login

let html5QrCode = null;
let isScanning = false;

// Start QR Scanner
async function startQRScanner() {
    const qrScannerContainer = document.getElementById('qrScannerContainer');
    const qrScanButton = document.getElementById('qrScanButton');
    const scannerStatus = document.getElementById('scannerStatus');
    
    try {
        // Show scanner container
        qrScannerContainer.style.display = 'block';
        qrScanButton.style.display = 'none';
        
        // Update status
        scannerStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Initializing camera...';
        
        // Initialize QR Code scanner
        html5QrCode = new Html5Qrcode("qrReader");
        
        // Get camera devices
        const devices = await Html5Qrcode.getCameras();
        
        if (devices && devices.length) {
            // Use back camera if available, otherwise use first camera
            const cameraId = devices.find(device => 
                device.label.toLowerCase().includes('back') || 
                device.label.toLowerCase().includes('rear')
            )?.id || devices[0].id;
            
            // Start scanning
            await html5QrCode.start(
                cameraId,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                onScanSuccess,
                onScanFailure
            );
            
            isScanning = true;
            scannerStatus.innerHTML = '<i class="fas fa-camera"></i> Camera ready - Position QR code in view';
            
        } else {
            throw new Error('No cameras found');
        }
        
    } catch (error) {
        console.error('QR Scanner error:', error);
        showError('Failed to start camera. Please check camera permissions.');
        stopQRScanner();
    }
}

// Stop QR Scanner
async function stopQRScanner() {
    const qrScannerContainer = document.getElementById('qrScannerContainer');
    const qrScanButton = document.getElementById('qrScanButton');
    
    try {
        if (html5QrCode && isScanning) {
            await html5QrCode.stop();
            html5QrCode.clear();
        }
    } catch (error) {
        console.error('Error stopping scanner:', error);
    }
    
    html5QrCode = null;
    isScanning = false;
    
    // Hide scanner container
    qrScannerContainer.style.display = 'none';
    qrScanButton.style.display = 'block';
}

// Handle successful QR scan
function onScanSuccess(decodedText, decodedResult) {
    console.log('QR Code scanned:', decodedText);
    
    try {
        // Parse the QR code data
        const healthIdData = parseSmartHealthId(decodedText);
        
        if (healthIdData && healthIdData.email && healthIdData.password) {
            // Stop scanner
            stopQRScanner();
            
            // Fill login form
            document.getElementById('email').value = healthIdData.email;
            document.getElementById('password').value = healthIdData.password;
            
            // Show success message
            showSuccess('Smart Health ID scanned successfully! Logging in...');
            
            // Auto-submit login form after a short delay
            setTimeout(() => {
                document.getElementById('loginForm').dispatchEvent(new Event('submit'));
            }, 1000);
            
        } else {
            showError('Invalid Smart Health ID QR code format');
        }
        
    } catch (error) {
        console.error('QR parsing error:', error);
        showError('Failed to parse Smart Health ID QR code');
    }
}

// Handle scan failure (optional)
function onScanFailure(error) {
    // This is called when no QR code is found in the frame
    // We don't need to show errors for this as it's normal
}

// Parse Smart Health ID QR code
function parseSmartHealthId(qrData) {
    try {
        // Try to parse as JSON first
        if (qrData.startsWith('{')) {
            const data = JSON.parse(qrData);
            return {
                email: data.email,
                password: data.password,
                healthId: data.healthId || data.smart_health_id
            };
        }
        
        // Try to parse as URL parameters
        if (qrData.includes('email=') && qrData.includes('password=')) {
            const params = new URLSearchParams(qrData.split('?')[1] || qrData);
            return {
                email: params.get('email'),
                password: params.get('password'),
                healthId: params.get('healthId') || params.get('smart_health_id')
            };
        }
        
        // Try to parse as pipe-separated values (email|password|healthId)
        if (qrData.includes('|')) {
            const parts = qrData.split('|');
            if (parts.length >= 2) {
                return {
                    email: parts[0],
                    password: parts[1],
                    healthId: parts[2] || null
                };
            }
        }
        
        // Try to parse as colon-separated key-value pairs
        if (qrData.includes(':') && qrData.includes(',')) {
            const data = {};
            const pairs = qrData.split(',');
            
            pairs.forEach(pair => {
                const [key, value] = pair.split(':');
                if (key && value) {
                    data[key.trim()] = value.trim();
                }
            });
            
            return {
                email: data.email,
                password: data.password,
                healthId: data.healthId || data.smart_health_id
            };
        }
        
        return null;
        
    } catch (error) {
        console.error('Error parsing QR data:', error);
        return null;
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (isScanning) {
        stopQRScanner();
    }
});