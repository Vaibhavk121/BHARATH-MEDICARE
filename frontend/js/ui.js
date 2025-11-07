// UI Helper Functions for BharathMedicare

// ============================================
// LOADING OVERLAY
// ============================================

/**
 * Show loading overlay
 */
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'flex';
    }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds before auto-dismiss
 */
function showToast(message, type = 'info', duration = 3000) {
    // Remove any existing toasts
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => toast.remove());
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    
    // Set base inline styles
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        min-width: 300px;
        max-width: 450px;
        border-radius: 12px;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        transform: translateX(500px);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        font-family: 'Poppins', sans-serif;
    `;
    
    // Set color based on type
    let bgColor = '';
    let iconHtml = '';
    
    switch(type) {
        case 'success':
            bgColor = 'background: linear-gradient(135deg, #10b981, #059669);';
            iconHtml = '<i class="fas fa-check-circle" style="font-size: 1.5rem; flex-shrink: 0; color: white;"></i>';
            break;
        case 'error':
            bgColor = 'background: linear-gradient(135deg, #ef4444, #dc2626);';
            iconHtml = '<i class="fas fa-exclamation-circle" style="font-size: 1.5rem; flex-shrink: 0; color: white;"></i>';
            break;
        case 'warning':
            bgColor = 'background: linear-gradient(135deg, #f59e0b, #d97706);';
            iconHtml = '<i class="fas fa-exclamation-triangle" style="font-size: 1.5rem; flex-shrink: 0; color: white;"></i>';
            break;
        case 'info':
            bgColor = 'background: linear-gradient(135deg, #3b82f6, #2563eb);';
            iconHtml = '<i class="fas fa-info-circle" style="font-size: 1.5rem; flex-shrink: 0; color: white;"></i>';
            break;
        default:
            bgColor = 'background: linear-gradient(135deg, #3b82f6, #2563eb);';
            iconHtml = '<i class="fas fa-info-circle" style="font-size: 1.5rem; flex-shrink: 0; color: white;"></i>';
    }
    
    toast.style.cssText += bgColor + ' color: white;';
    
    toast.innerHTML = `
        ${iconHtml}
        <span style="flex: 1; font-weight: 500; font-size: 0.95rem; line-height: 1.4; color: white;">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()" style="background: none; border: none; cursor: pointer; padding: 4px; color: white; opacity: 0.8; font-size: 1.2rem;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    }, 10);
    
    // Auto remove after duration
    setTimeout(() => {
        toast.style.transform = 'translateX(500px)';
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

/**
 * Show success toast
 * @param {string} message - Success message
 * @param {number} duration - Duration in milliseconds
 */
function showSuccess(message, duration = 3000) {
    showToast(message, 'success', duration);
}

/**
 * Show error toast
 * @param {string} message - Error message
 * @param {number} duration - Duration in milliseconds
 */
function showError(message, duration = 4000) {
    showToast(message, 'error', duration);
}

/**
 * Show warning toast
 * @param {string} message - Warning message
 * @param {number} duration - Duration in milliseconds
 */
function showWarning(message, duration = 3500) {
    showToast(message, 'warning', duration);
}

/**
 * Show info toast
 * @param {string} message - Info message
 * @param {number} duration - Duration in milliseconds
 */
function showInfo(message, duration = 3000) {
    showToast(message, 'info', duration);
}

// ============================================
// MESSAGE CONTAINER (Legacy Support)
// ============================================

/**
 * Show message in container (backward compatibility)
 * @param {string} message - Message to display
 * @param {string} type - Message type (success, error, warning, info)
 * @param {HTMLElement} container - Container element
 */
function showMessage(message, type, container) {
    if (container) {
        const messageClass = `message-${type}`;
        container.innerHTML = `
            <div class="message ${messageClass}">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    } else {
        // Use toast if no container specified
        showToast(message, type);
    }
}

// ============================================
// FORM HELPERS
// ============================================

/**
 * Clear form inputs
 * @param {string} formId - Form ID
 */
function clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }
}

/**
 * Disable form submit button
 * @param {HTMLElement} button - Button element
 * @param {string} text - Button text while disabled
 */
function disableButton(button, text = 'Processing...') {
    if (button) {
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
    }
}

/**
 * Enable form submit button
 * @param {HTMLElement} button - Button element
 */
function enableButton(button) {
    if (button && button.dataset.originalText) {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText;
    }
}

// ============================================
// CONFIRMATION DIALOG
// ============================================

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @returns {boolean} - User's choice
 */
function confirmAction(message) {
    return confirm(message);
}

/**
 * Show custom confirmation dialog (future enhancement)
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {function} onConfirm - Callback on confirm
 * @param {function} onCancel - Callback on cancel
 */
function showConfirmDialog(title, message, onConfirm, onCancel) {
    // For now, use native confirm
    // Can be enhanced with custom modal later
    if (confirm(`${title}\n\n${message}`)) {
        if (onConfirm) onConfirm();
    } else {
        if (onCancel) onCancel();
    }
}

// ============================================
// MODAL HELPERS (for future use)
// ============================================

/**
 * Show modal
 * @param {string} modalId - Modal element ID
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Hide modal
 * @param {string} modalId - Modal element ID
 */
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
    if (!date) return 'N/A';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Truncate text
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} - Truncated text
 */
function truncateText(text, length = 50) {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
}

/**
 * Debounce function
 * @param {function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {function} - Debounced function
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// EXPORT (if using modules)
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showLoading,
        hideLoading,
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showMessage,
        clearForm,
        disableButton,
        enableButton,
        confirmAction,
        showConfirmDialog,
        showModal,
        hideModal,
        formatDate,
        formatFileSize,
        truncateText,
        debounce
    };
}
