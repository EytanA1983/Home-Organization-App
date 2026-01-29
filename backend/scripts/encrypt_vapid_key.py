#!/usr/bin/env python3
"""
Encrypt VAPID private key for secure storage in .env file.

This script encrypts a VAPID private key using Fernet encryption.
The encrypted key can be safely stored in .env files.

Usage:
    python scripts/encrypt_vapid_key.py

The script will:
1. Prompt for VAPID private key (or read from env)
2. Prompt for encryption key (or read from env)
3. Encrypt the private key
4. Output the encrypted value for .env file

Environment variables:
    VAPID_PRIVATE_KEY: Plain VAPID private key (optional, will prompt if not set)
    VAPID_ENCRYPTION_KEY: Encryption key (optional, will prompt if not set)
"""
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.vapid_encryption import encrypt_vapid_key, get_encryption_key

def get_input(prompt: str, secret: bool = False, default: str = None) -> str:
    """Get input from user, optionally masked for secrets."""
    if default:
        prompt = f"{prompt} [{default}]: "
    else:
        prompt = f"{prompt}: "

    if secret:
        import getpass
        value = getpass.getpass(prompt)
    else:
        value = input(prompt)

    return value.strip() if value else (default or "")


if __name__ == "__main__":
    print("\n" + "="*70)
    print("VAPID Private Key Encryption Tool")
    print("="*70)

    # Get VAPID private key
    private_key = os.getenv("VAPID_PRIVATE_KEY")
    if not private_key:
        print("\nEnter your VAPID private key:")
        private_key = get_input("VAPID Private Key", secret=True)

    if not private_key:
        print("\n❌ Error: VAPID private key is required")
        sys.exit(1)

    # Get encryption key
    encryption_key = get_encryption_key()
    if not encryption_key:
        print("\nEnter encryption key (or set VAPID_ENCRYPTION_KEY env var):")
        key_str = get_input("Encryption Key", secret=True)
        if key_str:
            encryption_key = key_str.encode()
        else:
            print("\n❌ Error: Encryption key is required")
            print("   Generate one with: python scripts/generate_encryption_key.py")
            sys.exit(1)

    try:
        # Encrypt the key
        encrypted = encrypt_vapid_key(private_key, encryption_key)

        print("\n" + "="*70)
        print("✅ VAPID Private Key Encrypted Successfully!")
        print("="*70)
        print("\nAdd this to your .env file:")
        print("-"*70)
        print(f"VAPID_PRIVATE_KEY_ENCRYPTED={encrypted}")
        print("\n" + "-"*70)
        print("Or use the encrypted value directly:")
        print("-"*70)
        print(f"VAPID_PRIVATE_KEY={encrypted}")
        print("\n" + "="*70)
        print("\n⚠️  IMPORTANT:")
        print("   - Keep the encryption key secure (VAPID_ENCRYPTION_KEY)")
        print("   - Never commit the encryption key to version control")
        print("   - Store encryption key in HashiCorp Vault or AWS Secrets Manager")
        print("="*70 + "\n")

    except Exception as e:
        print(f"\n❌ Error encrypting VAPID key: {e}")
        sys.exit(1)
