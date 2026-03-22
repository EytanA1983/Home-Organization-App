"""
VAPID Private Key Encryption/Decryption

Supports encrypted storage of VAPID private key in .env files.
Uses Fernet (symmetric encryption) from cryptography library.

Usage:
1. Generate encryption key: python scripts/generate_encryption_key.py
2. Encrypt VAPID key: python scripts/encrypt_vapid_key.py
3. Store encrypted value in .env: VAPID_PRIVATE_KEY_ENCRYPTED=...
4. Set encryption key: VAPID_ENCRYPTION_KEY=...
"""
import os
import base64
from typing import Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import logging

logger = logging.getLogger(__name__)


def derive_key_from_password(password: str, salt: bytes = None) -> bytes:
    """
    Derive encryption key from password using PBKDF2.

    Args:
        password: Password string
        salt: Salt bytes (if None, uses default salt from env)

    Returns:
        Encryption key (32 bytes)
    """
    if salt is None:
        # Use a fixed salt from env or default
        salt_str = os.getenv("VAPID_ENCRYPTION_SALT", "eli-maor-vapid-salt-2024")
        salt = salt_str.encode()[:16]  # 16 bytes salt

    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
        backend=default_backend()
    )
    key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
    return key


def get_encryption_key() -> Optional[bytes]:
    """
    Get encryption key from environment.

    Priority:
    1. VAPID_ENCRYPTION_KEY (direct Fernet key)
    2. VAPID_ENCRYPTION_PASSWORD (derive key from password)
    3. VAPID_ENCRYPTION_KEY_FILE (read from file)

    Returns:
        Encryption key bytes or None
    """
    # 1. Direct Fernet key
    key_str = os.getenv("VAPID_ENCRYPTION_KEY")
    if key_str:
        try:
            return key_str.encode()
        except Exception as e:
            logger.warning(f"Invalid VAPID_ENCRYPTION_KEY format: {e}")

    # 2. Derive from password
    password = os.getenv("VAPID_ENCRYPTION_PASSWORD")
    if password:
        return derive_key_from_password(password)

    # 3. Read from file
    key_file = os.getenv("VAPID_ENCRYPTION_KEY_FILE")
    if key_file:
        try:
            from pathlib import Path
            key_path = Path(key_file)
            if key_path.exists():
                return key_path.read_bytes().strip()
        except Exception as e:
            logger.warning(f"Failed to read encryption key file: {e}")

    return None


def encrypt_vapid_key(private_key: str, encryption_key: Optional[bytes] = None) -> str:
    """
    Encrypt VAPID private key.

    Args:
        private_key: Plain VAPID private key
        encryption_key: Encryption key (if None, gets from env)

    Returns:
        Encrypted key (base64 string)

    Raises:
        ValueError: If encryption key is not available
    """
    if encryption_key is None:
        encryption_key = get_encryption_key()

    if encryption_key is None:
        raise ValueError(
            "Encryption key not found. Set VAPID_ENCRYPTION_KEY, "
            "VAPID_ENCRYPTION_PASSWORD, or VAPID_ENCRYPTION_KEY_FILE"
        )

    try:
        f = Fernet(encryption_key)
        encrypted = f.encrypt(private_key.encode())
        return base64.urlsafe_b64encode(encrypted).decode()
    except Exception as e:
        raise ValueError(f"Failed to encrypt VAPID key: {e}")


def decrypt_vapid_key(encrypted_key: str, encryption_key: Optional[bytes] = None) -> str:
    """
    Decrypt VAPID private key.

    Args:
        encrypted_key: Encrypted key (base64 string)
        encryption_key: Encryption key (if None, gets from env)

    Returns:
        Decrypted private key

    Raises:
        ValueError: If decryption fails
    """
    if encryption_key is None:
        encryption_key = get_encryption_key()

    if encryption_key is None:
        raise ValueError(
            "Encryption key not found. Set VAPID_ENCRYPTION_KEY, "
            "VAPID_ENCRYPTION_PASSWORD, or VAPID_ENCRYPTION_KEY_FILE"
        )

    try:
        f = Fernet(encryption_key)
        encrypted_bytes = base64.urlsafe_b64decode(encrypted_key.encode())
        decrypted = f.decrypt(encrypted_bytes)
        return decrypted.decode()
    except Exception as e:
        raise ValueError(f"Failed to decrypt VAPID key: {e}")


def is_encrypted(value: str) -> bool:
    """
    Check if a value appears to be encrypted (base64 format).

    Args:
        value: Value to check

    Returns:
        True if value looks encrypted
    """
    if not value:
        return False

    try:
        # Check if it's valid base64
        base64.urlsafe_b64decode(value.encode())
        # Check if it's long enough to be encrypted (encrypted data is longer)
        return len(value) > 50  # Encrypted keys are typically longer
    except Exception:
        return False


def get_vapid_private_key() -> Optional[str]:
    """
    Get VAPID private key with automatic decryption.

    Priority:
    1. VAPID_PRIVATE_KEY (plain or encrypted)
    2. VAPID_PRIVATE_KEY_ENCRYPTED (encrypted, requires decryption)
    3. HashiCorp Vault
    4. AWS Secrets Manager
    5. Docker secrets

    Returns:
        Decrypted private key or None
    """
    from app.core.secrets import get_secret

    # 1. Try VAPID_PRIVATE_KEY (might be plain or encrypted)
    private_key = get_secret("VAPID_PRIVATE_KEY")
    if private_key:
        # Check if it's encrypted
        if is_encrypted(private_key):
            try:
                return decrypt_vapid_key(private_key)
            except Exception as e:
                logger.warning(f"Failed to decrypt VAPID_PRIVATE_KEY: {e}")
                return None
        return private_key

    # 2. Try VAPID_PRIVATE_KEY_ENCRYPTED (explicitly encrypted)
    encrypted_key = get_secret("VAPID_PRIVATE_KEY_ENCRYPTED")
    if encrypted_key:
        try:
            return decrypt_vapid_key(encrypted_key)
        except Exception as e:
            logger.warning(f"Failed to decrypt VAPID_PRIVATE_KEY_ENCRYPTED: {e}")
            return None

    return None
