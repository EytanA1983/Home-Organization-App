# Secrets Management Guide

## Overview

The application supports multiple methods for managing secrets:

1. **Environment Variables** - Simple, works everywhere
2. **Docker Secrets** - Secure for Docker Swarm/Compose
3. **AWS Secrets Manager** - Enterprise-grade for AWS deployments

## Priority Order

Secrets are loaded in this order (first found wins):
1. Environment variable
2. Docker secret file (`/run/secrets/<key>`)
3. AWS Secrets Manager
4. Default value (only for non-sensitive settings)

## Required Secrets

| Secret | Required | Description |
|--------|----------|-------------|
| `SECRET_KEY` | ✅ Yes | JWT signing key (min 32 chars) |
| `DATABASE_URL` | ✅ Yes | Database connection string |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth secret |
| `VAPID_PRIVATE_KEY` | Optional | Push notifications |
| `MAIL_PASSWORD` | Optional | SMTP password |
| `OPENAI_API_KEY` | Optional | AI features |

## Method 1: Environment Variables

### Development (.env file)

```bash
# Create .env file from example
cp .env.example .env

# Edit with your values
nano .env
```

### Production (System Environment)

```bash
# Set environment variables
export SECRET_KEY="your-very-long-secret-key-at-least-32-characters"
export DATABASE_URL="postgresql://user:pass@host:5432/db"
export DEBUG=false
```

## Method 2: Docker Secrets

### Setup

```bash
# Create secrets directory
mkdir -p secrets
chmod 700 secrets

# Generate secret key
python -c "import secrets; print(secrets.token_urlsafe(64))" > secrets/secret_key.txt

# Add database URL
echo "postgresql://user:pass@db:5432/eli_maor" > secrets/database_url.txt

# Protect files
chmod 600 secrets/*.txt
```

### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

secrets:
  secret_key:
    file: ./secrets/secret_key.txt
  database_url:
    file: ./secrets/database_url.txt

services:
  api:
    image: eli-maor-api
    secrets:
      - secret_key
      - database_url
    environment:
      - DEBUG=false
```

### Reading in Application

Secrets are automatically read from `/run/secrets/<secret_name>`:

```python
# In config.py - automatic reading
SECRET_KEY: str = Field(default="")  # Reads from /run/secrets/secret_key
```

## Method 3: AWS Secrets Manager

### Setup AWS Secret

```bash
# Create secret in AWS
aws secretsmanager create-secret \
    --name eli-maor/production \
    --description "Eli Maor Production Secrets" \
    --secret-string '{
        "SECRET_KEY": "your-secret-key",
        "DATABASE_URL": "postgresql://...",
        "GOOGLE_CLIENT_SECRET": "...",
        "OPENAI_API_KEY": "sk-..."
    }'
```

### Configure Application

```bash
# Set environment variable to enable AWS Secrets Manager
export AWS_SECRET_NAME=eli-maor/production
export AWS_REGION=us-east-1

# If not using IAM role, also set:
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
```

### IAM Policy

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue"
            ],
            "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:eli-maor/*"
        }
    ]
}
```

## Generating Secure Keys

### Python

```python
import secrets

# Generate secure secret key
print(secrets.token_urlsafe(64))
```

### OpenSSL

```bash
openssl rand -base64 64
```

### VAPID Keys

```bash
npx web-push generate-vapid-keys
```

## Security Best Practices

1. **Never commit secrets to Git**
   - Add `.env` and `secrets/` to `.gitignore`

2. **Use strong keys**
   - SECRET_KEY: Minimum 32 characters, random
   - Passwords: Minimum 16 characters

3. **Rotate secrets regularly**
   - Recommended: Every 90 days

4. **Limit access**
   - Use IAM roles instead of access keys when possible
   - Apply principle of least privilege

5. **Audit access**
   - Enable CloudTrail for AWS Secrets Manager
   - Monitor access logs

## Validation

The application validates secrets on startup:

```python
# In main.py
from app.config import validate_production_secrets

# Called during startup
validate_production_secrets()
```

Validation errors:
- Missing required secrets
- Weak/placeholder values in production
- Invalid formats

## Troubleshooting

### "SECRET_KEY must be set"

```bash
# Check if environment variable is set
echo $SECRET_KEY

# Check Docker secret
docker exec <container> cat /run/secrets/secret_key
```

### "AWS Secrets Manager not working"

```bash
# Test AWS credentials
aws sts get-caller-identity

# Test secret access
aws secretsmanager get-secret-value --secret-id eli-maor/production
```

### Debug secrets loading

```python
from app.core.secrets import SecretsInfo

# Get status of all secrets
print(SecretsInfo.get_status())
```
