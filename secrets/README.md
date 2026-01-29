# Secrets Directory

This directory contains secret files for Docker Compose secrets.

## Setup

1. Copy example files and fill in real values:

```bash
cp secret_key.txt.example secret_key.txt
cp db_password.txt.example db_password.txt
# ... etc
```

2. Edit each file with the actual secret value (one value per file, no newline at end)

3. Run with secrets:

```bash
docker compose -f docker-compose.yml -f docker-compose.secrets.yml up -d
```

## Files

| File | Description |
|------|-------------|
| `secret_key.txt` | JWT signing key |
| `db_password.txt` | PostgreSQL password |
| `google_client_id.txt` | Google OAuth client ID |
| `google_client_secret.txt` | Google OAuth client secret |
| `vapid_public_key.txt` | VAPID public key for push notifications |
| `vapid_private_key.txt` | VAPID private key for push notifications |

## Generate Secrets

```bash
# Generate random secret key
openssl rand -hex 32 > secret_key.txt

# Generate VAPID keys
npx web-push generate-vapid-keys
```

## Security Notes

- **NEVER commit secret files to git**
- Use `.gitignore` to exclude all files except examples
- In production, use Docker Swarm secrets or external secrets manager
- Rotate secrets regularly
