from cryptography.fernet import Fernet
import os
import base64
from dotenv import load_dotenv

load_dotenv()

def get_encryption_key():
    """Get encryption key from environment variables"""
    key = os.getenv('ENCRYPTION_KEY')
    if not key:
        raise ValueError("ENCRYPTION_KEY not found in environment variables")
    return key.encode()

def encrypt_file_data(file_data):
    """
    Encrypt file data using Fernet symmetric encryption
    
    Args:
        file_data: bytes - The file data to encrypt
    
    Returns:
        dict: Contains encrypted data and metadata
    """
    try:
        key = get_encryption_key()
        fernet = Fernet(key)
        
        # Encrypt the file data
        encrypted_data = fernet.encrypt(file_data)
        
        # Convert to base64 for safe storage
        encrypted_base64 = base64.b64encode(encrypted_data).decode('utf-8')
        
        return {
            'encrypted_data': encrypted_base64,
            'encryption_method': 'Fernet',
            'success': True
        }
    
    except Exception as e:
        return {
            'error': str(e),
            'success': False
        }

def decrypt_file_data(encrypted_base64):
    """
    Decrypt file data
    
    Args:
        encrypted_base64: str - Base64 encoded encrypted data
    
    Returns:
        bytes: The decrypted file data
    """
    try:
        key = get_encryption_key()
        fernet = Fernet(key)
        
        # Decode from base64
        encrypted_data = base64.b64decode(encrypted_base64.encode('utf-8'))
        
        # Decrypt the data
        decrypted_data = fernet.decrypt(encrypted_data)
        
        return decrypted_data
    
    except Exception as e:
        raise Exception(f"Decryption failed: {str(e)}")

def generate_encryption_key():
    """
    Generate a new Fernet encryption key
    Use this only once to generate the key for your .env file
    """
    key = Fernet.generate_key()
    return key.decode()

# Utility function to test encryption/decryption
def test_encryption():
    """Test encryption and decryption"""
    test_data = b"This is sensitive medical data"
    
    # Encrypt
    encrypted = encrypt_file_data(test_data)
    print(f"Encryption successful: {encrypted['success']}")
    print(f"Encrypted data (first 50 chars): {encrypted['encrypted_data'][:50]}...")
    
    # Decrypt
    decrypted = decrypt_file_data(encrypted['encrypted_data'])
    print(f"Decrypted data: {decrypted.decode()}")
    print(f"Match: {test_data == decrypted}")

if __name__ == "__main__":
    # Generate a new key (run this once and put in .env)
    print("Generated Encryption Key:")
    print(generate_encryption_key())
