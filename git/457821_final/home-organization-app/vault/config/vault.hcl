# HashiCorp Vault Configuration
# For production, use a proper backend like Consul or Raft

# Storage backend
storage "file" {
  path = "/vault/data"
}

# HTTP listener
listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = true  # Enable TLS in production!
}

# API address
api_addr = "http://0.0.0.0:8200"
cluster_addr = "https://0.0.0.0:8201"

# UI
ui = true

# Disable mlock (for Docker)
disable_mlock = true

# Telemetry
telemetry {
  prometheus_retention_time = "30s"
  disable_hostname          = true
}
