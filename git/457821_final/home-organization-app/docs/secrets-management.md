# Secrets Management

## Overview

This project supports multiple secrets management backends:

| Backend | Use Case | Setup Complexity |
|---------|----------|------------------|
| **Environment Variables** | Development | Simple |
| **Docker Secrets** | Docker Compose/Swarm | Medium |
| **HashiCorp Vault** | Enterprise/Multi-environment | Complex |
| **AWS Secrets Manager** | AWS-based deployments | Medium |

## Priority Order

Secrets are loaded in this order (first found wins):

1. Environment variable
2. Docker secret (`/run/secrets/`)
3. HashiCorp Vault
4. AWS Secrets Manager
5. Default value

## Option 1: Environment Variables (Development)

Simplest option for local development:

```bash
# Create .env file
cp .env.example .env

# Edit with your values
nano .env

# Run
docker compose up -d
```

## Option 2: Docker Secrets (Recommended for Docker Compose)

### Setup

1. Create secrets directory:

```bash
mkdir -p secrets
cd secrets

# Generate secrets
openssl rand -hex 32 > secret_key.txt
echo "your-db-password" > db_password.txt
echo "your-google-client-id" > google_client_id.txt
echo "your-google-client-secret" > google_client_secret.txt
# ... etc
```

2. Run with secrets:

```bash
docker compose -f docker-compose.yml -f docker-compose.secrets.yml up -d
```

### Docker Swarm (Production)

```bash
# Create secrets in Swarm
echo "super-secret-key" | docker secret create secret_key -
echo "db-password" | docker secret create db_password -

# Deploy stack
docker stack deploy -c docker-compose.yml -c docker-compose.secrets.yml eli-maor
```

## Option 3: HashiCorp Vault (Enterprise)

### Quick Start (Development)

```bash
# Start with Vault
docker compose -f docker-compose.yml -f docker-compose.vault.yml up -d

# Vault UI: http://localhost:8200
# Token: dev-root-token
```

### Production Setup

1. **Deploy Vault cluster** (external or managed)

2. **Store secrets:**

```bash
vault kv put secret/eli-maor/production \
    SECRET_KEY="$(openssl rand -hex 32)" \
    DATABASE_URL="postgresql://user:pass@host:5432/db" \
    REDIS_URL="redis://host:6379/0" \
    GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com" \
    GOOGLE_CLIENT_SECRET="xxx" \
    VAPID_PUBLIC_KEY="xxx" \
    VAPID_PRIVATE_KEY="xxx"
```

3. **Create AppRole:**

```bash
# Enable AppRole
vault auth enable approle

# Create policy
vault policy write eli-maor-backend vault/policies/eli-maor-backend.hcl

# Create role
vault write auth/approle/role/eli-maor-backend \
    token_policies="eli-maor-backend" \
    token_ttl=1h \
    token_max_ttl=4h

# Get role-id and secret-id
vault read auth/approle/role/eli-maor-backend/role-id
vault write -f auth/approle/role/eli-maor-backend/secret-id
```

4. **Configure application:**

```yaml
environment:
  - VAULT_ADDR=https://vault.example.com:8200
  - VAULT_SECRET_PATH=eli-maor/production
  - VAULT_ROLE_ID=xxx
  - VAULT_SECRET_ID=xxx
```

### Kubernetes Integration

For Kubernetes, use the Vault Agent Injector:

```yaml
annotations:
  vault.hashicorp.com/agent-inject: "true"
  vault.hashicorp.com/role: "eli-maor-backend"
  vault.hashicorp.com/agent-inject-secret-config: "secret/data/eli-maor/production"
```

## Option 4: AWS Secrets Manager

### Setup

1. **Create secret in AWS:**

```bash
aws secretsmanager create-secret \
    --name eli-maor/production \
    --secret-string '{
        "SECRET_KEY": "xxx",
        "DATABASE_URL": "postgresql://...",
        "REDIS_URL": "redis://...",
        "GOOGLE_CLIENT_ID": "xxx",
        "GOOGLE_CLIENT_SECRET": "xxx",
        "VAPID_PUBLIC_KEY": "xxx",
        "VAPID_PRIVATE_KEY": "xxx"
    }'
```

2. **Configure IAM policy:**

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

3. **Run with AWS Secrets:**

```bash
docker compose -f docker-compose.yml -f docker-compose.aws-secrets.yml up -d
```

### ECS/EKS (Production)

Use IAM roles for tasks/pods:

```yaml
# ECS Task Definition
taskRoleArn: arn:aws:iam::xxx:role/eli-maor-backend-role

# EKS Service Account
serviceAccountName: eli-maor-backend
```

## Secrets Reference

| Secret | Required | Description |
|--------|----------|-------------|
| `SECRET_KEY` | ✅ | JWT signing key (32+ chars) |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ❌ | Redis connection string |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth client secret |
| `VAPID_PUBLIC_KEY` | ❌ | Push notifications public key |
| `VAPID_PRIVATE_KEY` | ❌ | Push notifications private key |
| `MAIL_PASSWORD` | ❌ | SMTP password |
| `OPENAI_API_KEY` | ❌ | OpenAI API key |

## Generate Secrets

```bash
# Secret key
openssl rand -hex 32

# VAPID keys
npx web-push generate-vapid-keys

# Database password
openssl rand -base64 24
```

## Security Best Practices

### Do's

- ✅ Use different secrets per environment
- ✅ Rotate secrets regularly (90 days)
- ✅ Use IAM roles instead of access keys
- ✅ Enable audit logging
- ✅ Use TLS for Vault connections

### Don'ts

- ❌ Commit secrets to git
- ❌ Use weak or default secrets
- ❌ Share secrets between environments
- ❌ Log secret values
- ❌ Store secrets in plain text files on servers

## Troubleshooting

### Secret not found

```bash
# Check priority order
# 1. Environment variable
echo $SECRET_KEY

# 2. Docker secret
cat /run/secrets/secret_key

# 3. Vault
vault kv get secret/eli-maor/production

# 4. AWS
aws secretsmanager get-secret-value --secret-id eli-maor/production
```

### Vault authentication failed

```bash
# Check Vault status
vault status

# Check token
vault token lookup

# Test AppRole login
vault write auth/approle/login \
    role_id="xxx" \
    secret_id="xxx"
```

### AWS access denied

```bash
# Check IAM role
aws sts get-caller-identity

# Test secrets access
aws secretsmanager get-secret-value --secret-id eli-maor/production
```

## API Endpoint

Check secrets status via API:

```bash
curl http://localhost:8000/health/secrets
```

Response:

```json
{
    "docker_secrets_available": true,
    "vault_available": true,
    "aws_secrets_configured": false,
    "secrets_sources": {
        "SECRET_KEY": "vault",
        "DATABASE_URL": "docker_secret",
        "REDIS_URL": "environment"
    }
}
```
