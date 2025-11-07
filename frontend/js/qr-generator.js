// Smart Health ID QR Code Generator (for testing purposes)

// Generate Smart Health ID QR code data
function generateSmartHealthIdQR(email, password, healthId = null) {
    // Format 1: JSON format (recommended)
    const qrData = {
        email: email,
        password: password,
        smart_health_id: healthId || generateHealthId(),
        generated_at: new Date().toISOString(),
        version: "1.0"
    };
    
    return JSON.stringify(qrData);
}

// Generate a sample Health ID
function generateHealthId() {
    const prefix = "SHID";
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
}

// Alternative formats for QR code generation

// Format 2: URL parameters
function generateSmartHealthIdURL(email, password, healthId = null) {
    const params = new URLSearchParams({
        email: email,
        password: password,
        smart_health_id: healthId || generateHealthId()
    });
    
    return `bharathmedicare://login?${params.toString()}`;
}

// Format 3: Pipe-separated values
function generateSmartHealthIdPipe(email, password, healthId = null) {
    return `${email}|${password}|${healthId || generateHealthId()}`;
}

// Format 4: Colon-separated key-value pairs
function generateSmartHealthIdColon(email, password, healthId = null) {
    return `email:${email},password:${password},healthId:${healthId || generateHealthId()}`;
}

// Example usage and testing function
function createTestQRCode() {
    const testEmail = "patient@test.com";
    const testPassword = "TestPass123";
    
    console.log("=== Smart Health ID QR Code Test Data ===");
    console.log("JSON Format:", generateSmartHealthIdQR(testEmail, testPassword));
    console.log("URL Format:", generateSmartHealthIdURL(testEmail, testPassword));
    console.log("Pipe Format:", generateSmartHealthIdPipe(testEmail, testPassword));
    console.log("Colon Format:", generateSmartHealthIdColon(testEmail, testPassword));
}

// Export functions if using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateSmartHealthIdQR,
        generateSmartHealthIdURL,
        generateSmartHealthIdPipe,
        generateSmartHealthIdColon,
        generateHealthId,
        createTestQRCode
    };
}