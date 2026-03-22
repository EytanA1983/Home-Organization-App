#!/usr/bin/env python3
"""
Generate encryption key for VAPID private key encryption.

This script generates a Fernet encryption key that can be used to encrypt
VAPID private keys before storing them in .env files.

Usage:
    python scripts/generate_encryption_key.py

Output:
    - Prints the encryption key to stdout
    - Save this key securely (e.g., in HashiCorp Vault, AWS Secrets Manager, or .env file)
    - Set VAPID_ENCRYPTION_KEY=<generated_key> in your environment
"""
from cryptography.fernet import Fernet

if __name__ == "__main__":
    # Generate a new Fernet key
    key = Fernet.generate_key()
    key_str = key.decode()

    print("\n" + "="*70)
    print("VAPID Encryption Key Generated Successfully!")
    print("="*70)
    print("\n⚠️  IMPORTANT: Save this key securely!")
    print("   - Store in HashiCorp Vault (recommended)")
    print("   - Store in AWS Secrets Manager")
    print("   - Store in .env file (less secure, only for development)")
    print("\n" + "-"*70)
    print("Add this to your environment:")
    print("-"*70)
    print(f"VAPID_ENCRYPTION_KEY={key_str}")
    print("\n" + "-"*70)
    print("Or save to a file and set:")
    print("-"*70)
    print(f"VAPID_ENCRYPTION_KEY_FILE=/path/to/encryption_key.txt")
    print("\n" + "="*70)
    print("\nTo encrypt your VAPID private key, run:")
    print("  python scripts/encrypt_vapid_key.py")
    print("="*70 + "\n")
