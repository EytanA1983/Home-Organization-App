"""
Secrets Management Module

Supports multiple secrets backends:
- Environment variables
- Docker secrets (/run/secrets/)
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault (optional)

Priority order:
1. Environment variable
2. Docker secret file
3. HashiCorp Vault
4. AWS Secrets Manager
5. Default value (only for non-sensitive settings)
"""
import os
import json
from pathlib import Path
from typing import Optional, Any, Dict
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)

# Docker secrets directory
DOCKER_SECRETS_PATH = Path("/run/secrets")


# ==================== Docker Secrets ====================

def read_docker_secret(secret_name: str) -> Optional[str]:
    """
    Read a secret from Docker secrets directory.
    Docker secrets are mounted as files in /run/secrets/

    Args:
        secret_name: Name of the secret file

    Returns:
        Secret value or None if not found
    """
    secret_path = DOCKER_SECRETS_PATH / secret_name
    try:
        if secret_path.exists():
            return secret_path.read_text().strip()
    except Exception as e:
        logger.warning(f"Failed to read Docker secret {secret_name}: {e}")
    return None


# ==================== HashiCorp Vault ====================

class VaultClient:
    """HashiCorp Vault client wrapper"""

    _instance: Optional['VaultClient'] = None
    _client: Any = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._client is not None:
            return

        try:
            import hvac

            vault_addr = os.getenv("VAULT_ADDR", "http://vault:8200")
            vault_token = os.getenv("VAULT_TOKEN")
            vault_role_id = os.getenv("VAULT_ROLE_ID")
            vault_secret_id = os.getenv("VAULT_SECRET_ID")

            # Try token auth first
            if vault_token:
                self._client = hvac.Client(url=vault_addr, token=vault_token)
                if self._client.is_authenticated():
                    logger.info("Vault authenticated via token")
                    return

            # Try AppRole auth
            if vault_role_id and vault_secret_id:
                self._client = hvac.Client(url=vault_addr)
                self._client.auth.approle.login(
                    role_id=vault_role_id,
                    secret_id=vault_secret_id
                )
                if self._client.is_authenticated():
                    logger.info("Vault authenticated via AppRole")
                    return

            # Try Kubernetes auth
            k8s_role = os.getenv("VAULT_K8S_ROLE")
            k8s_token_path = "/var/run/secrets/kubernetes.io/serviceaccount/token"
            if k8s_role and Path(k8s_token_path).exists():
                self._client = hvac.Client(url=vault_addr)
                jwt = Path(k8s_token_path).read_text()
                self._client.auth.kubernetes.login(role=k8s_role, jwt=jwt)
                if self._client.is_authenticated():
                    logger.info("Vault authenticated via Kubernetes")
                    return

            self._client = None

        except ImportError:
            logger.debug("hvac not installed, Vault integration disabled")
            self._client = None
        except Exception as e:
            logger.warning(f"Failed to initialize Vault client: {e}")
            self._client = None

    @property
    def is_available(self) -> bool:
        return self._client is not None and self._client.is_authenticated()

    def read_secret(self, path: str, key: Optional[str] = None, mount_point: str = "secret") -> Optional[Any]:
        """
        Read a secret from Vault.

        Args:
            path: Secret path (e.g., "eli-maor/production")
            key: Specific key within the secret (optional)
            mount_point: Secrets engine mount point

        Returns:
            Secret value or None
        """
        if not self.is_available:
            return None

        try:
            # Try KV v2 first
            response = self._client.secrets.kv.v2.read_secret_version(
                path=path,
                mount_point=mount_point
            )
            data = response.get("data", {}).get("data", {})

            if key:
                return data.get(key)
            return data

        except Exception:
            try:
                # Fall back to KV v1
                response = self._client.secrets.kv.v1.read_secret(
                    path=path,
                    mount_point=mount_point
                )
                data = response.get("data", {})

                if key:
                    return data.get(key)
                return data

            except Exception as e:
                logger.warning(f"Failed to read Vault secret {path}: {e}")
                return None


@lru_cache(maxsize=1)
def get_vault_secrets(path: str = None) -> Dict[str, Any]:
    """
    Get all secrets from Vault (cached).

    Args:
        path: Secret path in Vault (defaults to VAULT_SECRET_PATH env var)

    Returns:
        Dictionary of secrets
    """
    path = path or os.getenv("VAULT_SECRET_PATH", "eli-maor/production")
    mount_point = os.getenv("VAULT_MOUNT_POINT", "secret")

    client = VaultClient()
    secrets = client.read_secret(path, mount_point=mount_point)
    return secrets or {}


# ==================== AWS Secrets Manager ====================

def read_aws_secret(secret_name: str, region: str = None) -> Optional[Dict[str, Any]]:
    """
    Read a secret from AWS Secrets Manager.

    Args:
        secret_name: Name or ARN of the secret
        region: AWS region (defaults to AWS_REGION env var)

    Returns:
        Secret value (parsed JSON) or None if not found
    """
    try:
        import boto3
        from botocore.exceptions import ClientError

        region = region or os.getenv("AWS_REGION", "us-east-1")

        client = boto3.client(
            service_name='secretsmanager',
            region_name=region
        )

        response = client.get_secret_value(SecretId=secret_name)

        if 'SecretString' in response:
            return json.loads(response['SecretString'])
        else:
            # Binary secret
            import base64
            return json.loads(base64.b64decode(response['SecretBinary']))

    except ImportError:
        logger.debug("boto3 not installed, AWS Secrets Manager disabled")
        return None
    except Exception as e:
        logger.warning(f"Failed to read AWS secret {secret_name}: {e}")
        return None


@lru_cache(maxsize=1)
def get_aws_secrets(secret_name: str = None) -> Dict[str, Any]:
    """
    Get all secrets from AWS Secrets Manager (cached).

    Args:
        secret_name: Name of the secret in AWS (defaults to AWS_SECRET_NAME env var)

    Returns:
        Dictionary of secrets
    """
    secret_name = secret_name or os.getenv("AWS_SECRET_NAME", "eli-maor/production")
    region = os.getenv("AWS_REGION", "us-east-1")

    secrets = read_aws_secret(secret_name, region)
    return secrets or {}


# ==================== Main Secret Retrieval ====================

def get_secret(
    key: str,
    default: Any = None,
    required: bool = False,
    sensitive: bool = False,
) -> Any:
    """
    Get a secret value with fallback chain.

    Priority:
    1. Environment variable (KEY_NAME)
    2. Docker secret (/run/secrets/key_name)
    3. HashiCorp Vault
    4. AWS Secrets Manager
    5. Default value

    Args:
        key: Secret key name (e.g., "SECRET_KEY", "DATABASE_URL")
        default: Default value if not found
        required: If True, raise error if not found
        sensitive: If True, validate that it's not using a weak default

    Returns:
        Secret value

    Raises:
        ValueError: If required secret is not found or sensitive secret has weak default
    """
    value = None
    source = None

    # 1. Try environment variable
    env_value = os.getenv(key)
    if env_value is not None:
        value = env_value
        source = "environment"

    # 2. Try Docker secret
    if value is None:
        docker_secret = read_docker_secret(key.lower())
        if docker_secret is not None:
            value = docker_secret
            source = "docker_secret"

    # 3. Try HashiCorp Vault
    if value is None:
        vault_path = os.getenv("VAULT_SECRET_PATH")
        if vault_path:
            vault_secrets = get_vault_secrets(vault_path)
            if key in vault_secrets:
                value = vault_secrets[key]
                source = "vault"

    # 4. Try AWS Secrets Manager
    if value is None:
        aws_secret_name = os.getenv("AWS_SECRET_NAME")
        if aws_secret_name:
            aws_secrets = get_aws_secrets(aws_secret_name)
            if key in aws_secrets:
                value = aws_secrets[key]
                source = "aws_secrets_manager"

    # 5. Use default
    if value is None:
        value = default
        source = "default"

    # Validation
    if value is None and required:
        raise ValueError(
            f"Required secret '{key}' not found. "
            f"Set it via environment variable, Docker secret, Vault, or AWS Secrets Manager."
        )

    # Check for weak defaults on sensitive values in production
    is_production = os.getenv("ENVIRONMENT", "development") == "production"
    if sensitive and source == "default" and is_production:
        weak_defaults = ["CHANGE_ME", "changeme", "secret", "password", ""]
        if value in weak_defaults or (isinstance(value, str) and any(w in value.lower() for w in weak_defaults)):
            raise ValueError(
                f"Sensitive secret '{key}' is using a weak default value in production. "
                f"Please set a secure value via environment variable, Docker secret, Vault, or AWS Secrets Manager."
            )

    # Log source (without value) for debugging
    if source != "default":
        logger.debug(f"Secret '{key}' loaded from {source}")

    return value


def mask_secret(value: str, show_chars: int = 4) -> str:
    """
    Mask a secret value for logging (show only first/last N chars).

    Args:
        value: Secret value to mask
        show_chars: Number of characters to show at start and end

    Returns:
        Masked string like "abc***xyz"
    """
    if not value or len(value) <= show_chars * 2:
        return "***"
    return f"{value[:show_chars]}***{value[-show_chars:]}"


def validate_secrets():
    """
    Validate that all required secrets are configured.
    Call this on application startup.

    Raises:
        ValueError: If required secrets are missing
    """
    required_secrets = [
        ("SECRET_KEY", True),  # (key, is_sensitive)
        ("DATABASE_URL", False),
    ]

    optional_sensitive = [
        "GOOGLE_CLIENT_SECRET",
        "VAPID_PRIVATE_KEY",
        "MAIL_PASSWORD",
        "OPENAI_API_KEY",
        "AWS_SECRET_ACCESS_KEY",
    ]

    errors = []

    for key, is_sensitive in required_secrets:
        try:
            get_secret(key, required=True, sensitive=is_sensitive)
        except ValueError as e:
            errors.append(str(e))

    # Check optional sensitive secrets (warn but don't fail)
    is_production = os.getenv("ENVIRONMENT", "development") == "production"
    if is_production:
        for key in optional_sensitive:
            value = get_secret(key)
            if value and value in ["", "CHANGE_ME"]:
                errors.append(f"Warning: Sensitive secret '{key}' appears to have a placeholder value")

    if errors:
        raise ValueError("\n".join(errors))


class SecretsInfo:
    """Helper class to display secrets configuration status"""

    @staticmethod
    def get_status() -> Dict[str, Any]:
        """Get status of secrets configuration"""
        vault_client = VaultClient()

        return {
            "docker_secrets_available": DOCKER_SECRETS_PATH.exists(),
            "vault_available": vault_client.is_available,
            "aws_secrets_configured": bool(os.getenv("AWS_SECRET_NAME")),
            "env_file_exists": Path(".env").exists(),
            "environment": os.getenv("ENVIRONMENT", "development"),
            "secrets_sources": SecretsInfo._get_sources(),
        }

    @staticmethod
    def _get_sources() -> Dict[str, str]:
        """Determine source for each secret"""
        secrets_to_check = [
            "SECRET_KEY", "DATABASE_URL", "REDIS_URL",
            "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET",
            "VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_PRIVATE_KEY_ENCRYPTED",
            "VAPID_ENCRYPTION_KEY", "VAPID_ENCRYPTION_PASSWORD",
            "MAIL_PASSWORD", "OPENAI_API_KEY",
        ]

        sources = {}
        vault_client = VaultClient()
        vault_secrets = get_vault_secrets() if vault_client.is_available else {}
        aws_secrets = get_aws_secrets() if os.getenv("AWS_SECRET_NAME") else {}

        for key in secrets_to_check:
            if os.getenv(key):
                sources[key] = "environment"
            elif read_docker_secret(key.lower()):
                sources[key] = "docker_secret"
            elif key in vault_secrets:
                sources[key] = "vault"
            elif key in aws_secrets:
                sources[key] = "aws_secrets_manager"
            else:
                sources[key] = "not_set"

        return sources
