#!/usr/bin/env python3
"""
Setup Test Users for Load Testing
==================================

Creates test users in the database for faster load testing
(avoids registration overhead during tests).

Usage:
    python setup_test_users.py
    python setup_test_users.py --count 200 --url http://localhost:8000
"""

import argparse
import asyncio
import httpx
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed


def create_user(client: httpx.Client, base_url: str, index: int) -> dict:
    """Create a single test user."""
    email = f"loadtest_user_{index}@test.com"
    password = "LoadTest123!"

    # Check if user exists (try login)
    response = client.post(
        f"{base_url}/api/auth/login",
        json={"email": email, "password": password}
    )

    if response.status_code == 200:
        return {"email": email, "status": "exists"}

    # Register new user
    response = client.post(
        f"{base_url}/api/auth/register",
        json={
            "email": email,
            "password": password,
            "name": f"Load Test User {index}"
        }
    )

    if response.status_code in [200, 201]:
        return {"email": email, "status": "created"}
    else:
        return {"email": email, "status": "failed", "error": response.text}


def main():
    parser = argparse.ArgumentParser(description="Setup test users for load testing")
    parser.add_argument("--count", type=int, default=100, help="Number of users to create")
    parser.add_argument("--url", type=str, default="http://localhost:8000", help="API base URL")
    parser.add_argument("--workers", type=int, default=10, help="Number of parallel workers")
    args = parser.parse_args()

    print(f"Setting up {args.count} test users at {args.url}")
    print("-" * 50)

    # Verify API is accessible
    try:
        with httpx.Client(timeout=10) as client:
            response = client.get(f"{args.url}/health")
            if response.status_code != 200:
                print(f"ERROR: API health check failed: {response.status_code}")
                sys.exit(1)
    except Exception as e:
        print(f"ERROR: Cannot connect to API: {e}")
        sys.exit(1)

    print("API is healthy. Creating users...")

    created = 0
    existing = 0
    failed = 0

    with httpx.Client(timeout=30) as client:
        with ThreadPoolExecutor(max_workers=args.workers) as executor:
            futures = {
                executor.submit(create_user, client, args.url, i): i
                for i in range(args.count)
            }

            for future in as_completed(futures):
                result = future.result()
                if result["status"] == "created":
                    created += 1
                    print(f"✓ Created: {result['email']}")
                elif result["status"] == "exists":
                    existing += 1
                    print(f"• Exists: {result['email']}")
                else:
                    failed += 1
                    print(f"✗ Failed: {result['email']} - {result.get('error', 'Unknown error')}")

    print("-" * 50)
    print(f"Summary:")
    print(f"  Created:  {created}")
    print(f"  Existing: {existing}")
    print(f"  Failed:   {failed}")
    print(f"  Total:    {created + existing + failed}")

    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
