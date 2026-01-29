#!/usr/bin/env python3
"""
Generate VAPID keys for Web Push notifications
Run this script once to generate keys for your .env file
"""
from pywebpush import generate_vapid_keys

if __name__ == "__main__":
    keys = generate_vapid_keys()
    print("\n" + "="*60)
    print("VAPID Keys Generated Successfully!")
    print("="*60)
    print("\nAdd these to your .env file:\n")
    print(f"VAPID_PUBLIC_KEY={keys['publicKey']}")
    print(f"VAPID_PRIVATE_KEY={keys['privateKey']}")
    print("\n" + "="*60)
