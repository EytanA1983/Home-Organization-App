# Vault Policy for Backend Application
# Grants read-only access to application secrets

# Read secrets from KV v2
path "secret/data/eli-maor/*" {
  capabilities = ["read", "list"]
}

# Read secret metadata
path "secret/metadata/eli-maor/*" {
  capabilities = ["read", "list"]
}

# Allow token renewal
path "auth/token/renew-self" {
  capabilities = ["update"]
}

# Allow token lookup
path "auth/token/lookup-self" {
  capabilities = ["read"]
}
