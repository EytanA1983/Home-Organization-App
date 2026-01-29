"""
Application Configuration
All values are loaded from environment variables or secrets management systems.
NO hardcoded secrets allowed!

Secrets are loaded in this priority:
1. Environment variables
2. Docker secrets (/run/secrets/)
3. AWS Secrets Manager
"""
import os
from pathlib import Path
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


def get_secret_with_fallback(key: str, default: str = "") -> str:
    """
    Get a secret from environment or Docker secrets.
    For use in Field defaults.
    """
    # Try environment variable first
    value = os.getenv(key)
    if value:
        return value

    # Try Docker secret
    docker_secret_path = Path(f"/run/secrets/{key.lower()}")
    if docker_secret_path.exists():
        try:
            return docker_secret_path.read_text().strip()
        except Exception:
            pass

    return default


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    IMPORTANT: All sensitive values MUST be set via environment variables
    or secrets management (Docker secrets, AWS Secrets Manager, HashiCorp Vault).

    VAPID_PRIVATE_KEY supports:
    - Plain text (not recommended for production)
    - Encrypted format (requires VAPID_ENCRYPTION_KEY)
    - HashiCorp Vault (recommended for production)
    - AWS Secrets Manager
    """

    # =====================================================
    # CORE SETTINGS
    # =====================================================
    PROJECT_NAME: str = Field(
        default="אלי מאור – סידור ואירגון הבית",
        description="Project name"
    )
    DEBUG: bool = Field(
        default=False,  # Default to False for security
        description="Debug mode (set to true only in development)"
    )
    ENVIRONMENT: str = Field(
        default="production",
        description="Environment: development, staging, production"
    )

    # =====================================================
    # SECURITY SETTINGS (SENSITIVE!)
    # =====================================================
    SECRET_KEY: str = Field(
        default="",  # MUST be set via environment
        description="Secret key for JWT tokens - MUST BE SET!"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=15,
        description="Access token expiry in minutes (10-15 minutes recommended)"
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(
        default=30,
        description="Refresh token expiry in days (30 days recommended)"
    )
    ALGORITHM: str = Field(
        default="HS256",
        description="JWT algorithm"
    )

    # =====================================================
    # DATABASE (SENSITIVE!)
    # =====================================================
    DATABASE_URL: str = Field(
        default="",  # MUST be set via environment
        description="Database connection URL - MUST BE SET!"
    )

    # =====================================================
    # REDIS / CELERY
    # =====================================================
    CELERY_BROKER_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis URL for Celery broker"
    )
    CELERY_RESULT_BACKEND: str = Field(
        default="redis://localhost:6379/0",
        description="Redis URL for Celery result backend"
    )
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis URL for caching"
    )

    # =====================================================
    # CACHE SETTINGS
    # =====================================================
    CACHE_ENABLED: bool = Field(default=True)
    CACHE_TTL_ROOMS: int = Field(default=60)
    CACHE_TTL_TASKS: int = Field(default=120)
    CACHE_TTL_CATEGORIES: int = Field(default=60)

    # =====================================================
    # COOKIE SETTINGS
    # =====================================================
    COOKIE_SECURE: bool = Field(
        default=False,
        description="Set Secure flag on cookies (HTTPS only). Auto-enabled in production."
    )
    COOKIE_HTTPONLY: bool = Field(
        default=True,
        description="Set HttpOnly flag on cookies (prevents XSS attacks)"
    )
    COOKIE_SAMESITE: str = Field(
        default="Strict",
        description="SameSite cookie attribute: Strict, Lax, or None"
    )
    COOKIE_DOMAIN: Optional[str] = Field(
        default=None,
        description="Cookie domain (optional, for cross-subdomain cookies)"
    )
    COOKIE_PATH: str = Field(
        default="/",
        description="Cookie path (default: /)"
    )
    # Session cookie settings (if using session-based auth)
    SESSION_COOKIE_NAME: str = Field(
        default="session",
        description="Session cookie name"
    )
    SESSION_COOKIE_MAX_AGE: int = Field(
        default=60 * 60 * 24 * 30,  # 30 days
        description="Session cookie max age in seconds"
    )

    # =====================================================
    # SECURITY HEADERS (Helmet-style)
    # =====================================================
    SECURITY_HEADERS_ENABLED: bool = Field(
        default=True,
        description="Enable security headers middleware"
    )
    SECURITY_HEADERS_CONTENT_TYPE_NOSNIFF: bool = Field(
        default=True,
        description="X-Content-Type-Options: nosniff"
    )
    SECURITY_HEADERS_FRAME_OPTIONS: str = Field(
        default="DENY",
        description="X-Frame-Options: DENY, SAMEORIGIN, or ALLOW-FROM"
    )
    SECURITY_HEADERS_XSS_PROTECTION: bool = Field(
        default=True,
        description="X-XSS-Protection: 1; mode=block"
    )
    SECURITY_HEADERS_HSTS_ENABLED: bool = Field(
        default=True,
        description="Enable Strict-Transport-Security (HSTS)"
    )
    SECURITY_HEADERS_HSTS_MAX_AGE: int = Field(
        default=31536000,  # 1 year
        description="HSTS max-age in seconds"
    )
    SECURITY_HEADERS_HSTS_INCLUDE_SUBDOMAINS: bool = Field(
        default=True,
        description="HSTS includeSubDomains"
    )
    SECURITY_HEADERS_HSTS_PRELOAD: bool = Field(
        default=False,
        description="HSTS preload (requires manual submission to HSTS preload list)"
    )
    SECURITY_HEADERS_REFERRER_POLICY: str = Field(
        default="strict-origin-when-cross-origin",
        description="Referrer-Policy value"
    )
    SECURITY_HEADERS_DNS_PREFETCH_CONTROL: bool = Field(
        default=True,
        description="X-DNS-Prefetch-Control: off"
    )
    SECURITY_HEADERS_DOWNLOAD_OPTIONS: bool = Field(
        default=True,
        description="X-Download-Options: noopen"
    )
    SECURITY_HEADERS_PERMITTED_CROSS_DOMAIN: bool = Field(
        default=True,
        description="X-Permitted-Cross-Domain-Policies: none"
    )

    # Content Security Policy (CSP)
    CSP_POLICY: Optional[str] = Field(
        default=None,
        description="Content-Security-Policy header value"
    )

    # Permissions Policy (formerly Feature-Policy)
    PERMISSIONS_POLICY: Optional[str] = Field(
        default=None,
        description="Permissions-Policy header value"
    )

    # Trusted Hosts
    TRUSTED_HOSTS: List[str] = Field(
        default=["*"],
        description="List of trusted hostnames (use ['*'] to allow all in development)"
    )

    # =====================================================
    # RATE LIMITING
    # =====================================================
    RATE_LIMIT_ENABLED: bool = Field(default=True)
    RATE_LIMIT_PER_MINUTE: int = Field(default=60)
    RATE_LIMIT_PER_HOUR: int = Field(default=1000)
    BRUTE_FORCE_MAX_ATTEMPTS: int = Field(default=5)
    BRUTE_FORCE_LOCKOUT_MINUTES: int = Field(default=15)

    # =====================================================
    # GOOGLE OAUTH (SENSITIVE!)
    # =====================================================
    GOOGLE_CLIENT_ID: str = Field(
        default="",
        description="Google OAuth Client ID"
    )
    GOOGLE_CLIENT_SECRET: str = Field(
        default="",  # Sensitive - must be set via secrets
        description="Google OAuth Client Secret - SENSITIVE"
    )
    GOOGLE_REDIRECT_URI: str = Field(
        default="http://localhost:8000/api/google-calendar/callback"
    )
    GOOGLE_OAUTH_USE_PKCE: bool = Field(
        default=True,
        description="Use PKCE (Proof Key for Code Exchange) for OAuth2. Required for production."
    )
    GOOGLE_OAUTH_PKCE_METHOD: str = Field(
        default="S256",
        description="PKCE challenge method: S256 (SHA256, recommended) or plain"
    )

    # =====================================================
    # WEB PUSH / VAPID (SENSITIVE!)
    # =====================================================
    VAPID_PRIVATE_KEY: str = Field(
        default="",  # Sensitive - must be set via secrets (can be encrypted)
        description="VAPID private key - SENSITIVE (supports encrypted format)"
    )
    VAPID_PRIVATE_KEY_ENCRYPTED: str = Field(
        default="",  # Encrypted VAPID private key
        description="Encrypted VAPID private key (requires VAPID_ENCRYPTION_KEY)"
    )
    VAPID_PUBLIC_KEY: str = Field(
        default="",
        description="VAPID public key"
    )
    # VAPID Encryption Settings
    VAPID_ENCRYPTION_KEY: str = Field(
        default="",
        description="Fernet encryption key for VAPID private key (from Vault or env)"
    )
    VAPID_ENCRYPTION_PASSWORD: str = Field(
        default="",
        description="Password to derive encryption key (alternative to VAPID_ENCRYPTION_KEY)"
    )
    VAPID_ENCRYPTION_KEY_FILE: str = Field(
        default="",
        description="Path to file containing encryption key"
    )
    VAPID_ENCRYPTION_SALT: str = Field(
        default="eli-maor-vapid-salt-2024",
        description="Salt for PBKDF2 key derivation (if using password)"
    )

    # =====================================================
    # EMAIL (SENSITIVE!)
    # =====================================================
    MAIL_USERNAME: str = Field(default="")
    MAIL_PASSWORD: str = Field(
        default="",  # Sensitive - must be set via secrets
        description="SMTP password - SENSITIVE"
    )
    MAIL_FROM: str = Field(default="noreply@eli-maor.com")
    MAIL_FROM_NAME: str = Field(default="אלי מאור - סידור וארגון הבית")
    MAIL_PORT: int = Field(default=587)
    MAIL_SERVER: str = Field(default="smtp.gmail.com")
    MAIL_STARTTLS: bool = Field(default=True)
    MAIL_SSL_TLS: bool = Field(default=False)
    MAIL_USE_CREDENTIALS: bool = Field(default=True)
    MAIL_VALIDATE_CERTS: bool = Field(default=True)
    EMAIL_REMINDERS_ENABLED: bool = Field(default=True)
    EMAIL_REMINDER_HOUR: int = Field(default=9)

    # =====================================================
    # AI / OPENAI (SENSITIVE!)
    # =====================================================
    OPENAI_API_KEY: str = Field(
        default="",  # Sensitive - must be set via secrets
        description="OpenAI API key - SENSITIVE"
    )
    AI_ENABLED: bool = Field(default=True)
    AI_MODEL: str = Field(default="gpt-4o-mini")
    AI_TEMPERATURE: float = Field(default=0.7)
    AI_MAX_TOKENS: int = Field(default=1000)

    # =====================================================
    # FRONTEND / CORS
    # =====================================================
    FRONTEND_URL: str = Field(default="http://localhost:3000")
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:5178"]
    )

    # =====================================================
    # LOGGING
    # =====================================================
    LOG_LEVEL: str = Field(default="INFO")
    LOG_FORMAT: str = Field(default="json")
    LOG_DIR: str = Field(default="logs")
    LOG_ROTATION: str = Field(default="100 MB")
    LOG_RETENTION: str = Field(default="30 days")
    LOG_COMPRESSION: str = Field(default="gz")

    # =====================================================
    # AWS CLOUDWATCH
    # =====================================================
    AWS_CLOUDWATCH_LOG_GROUP: str = Field(default="")
    AWS_CLOUDWATCH_LOG_STREAM: str = Field(default="eli-maor-api")
    AWS_REGION: str = Field(default="us-east-1")
    AWS_ACCESS_KEY_ID: str = Field(
        default="",  # Sensitive
        description="AWS access key - SENSITIVE"
    )
    AWS_SECRET_ACCESS_KEY: str = Field(
        default="",  # Sensitive
        description="AWS secret key - SENSITIVE"
    )
    AWS_SECRET_NAME: str = Field(
        default="",
        description="AWS Secrets Manager secret name"
    )

    # =====================================================
    # ELK / ELASTICSEARCH
    # =====================================================
    ELK_URL: str = Field(default="")
    ELK_INDEX_PREFIX: str = Field(default="logs-eli-maor")

    # =====================================================
    # VALIDATORS
    # =====================================================

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str, info) -> str:
        """Validate SECRET_KEY is set and secure"""
        # Allow empty in development mode
        debug = os.getenv("DEBUG", "false").lower() == "true"

        if not v and not debug:
            # Try Docker secret
            docker_secret = Path("/run/secrets/secret_key")
            if docker_secret.exists():
                return docker_secret.read_text().strip()
            raise ValueError(
                "SECRET_KEY must be set in production! "
                "Use environment variable, Docker secret, or AWS Secrets Manager."
            )

        if v and len(v) < 32 and not debug:
            raise ValueError("SECRET_KEY must be at least 32 characters in production")

        # Return a dev key for development
        if not v and debug:
            return "dev-secret-key-not-for-production-use-only"

        return v

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str, info) -> str:
        """Validate DATABASE_URL is set"""
        debug = os.getenv("DEBUG", "false").lower() == "true"

        if not v:
            # Try Docker secret
            docker_secret = Path("/run/secrets/database_url")
            if docker_secret.exists():
                return docker_secret.read_text().strip()

            # Use SQLite for development
            if debug:
                return "sqlite:///./eli_maor_dev.db"

            raise ValueError(
                "DATABASE_URL must be set in production! "
                "Use environment variable, Docker secret, or AWS Secrets Manager."
            )

        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


def get_settings() -> Settings:
    """
    Get application settings.
    Use this function instead of accessing settings directly
    to allow for easier testing and mocking.
    """
    return Settings()


# Create global settings instance
settings = get_settings()


# Add property to Settings class for decrypted VAPID key
def _get_vapid_private_key_decrypted(self) -> str:
    """
    Get decrypted VAPID private key.
    Automatically handles encryption/decryption and Vault integration.
    """
    from app.core.vapid_encryption import get_vapid_private_key
    return get_vapid_private_key() or ""


# Add as property to Settings class
Settings.vapid_private_key_decrypted = property(_get_vapid_private_key_decrypted)


def validate_production_secrets():
    """
    Validate that all required secrets are properly configured for production.
    Call this on application startup in production.
    """
    if settings.DEBUG:
        return  # Skip validation in development

    errors = []

    # Required secrets
    if not settings.SECRET_KEY or settings.SECRET_KEY.startswith("dev-"):
        errors.append("SECRET_KEY: Must be set to a secure value")

    if not settings.DATABASE_URL or "sqlite" in settings.DATABASE_URL.lower():
        errors.append("DATABASE_URL: Must use a production database (not SQLite)")

    # Optional but important secrets
    warnings = []

    if not settings.GOOGLE_CLIENT_SECRET:
        warnings.append("GOOGLE_CLIENT_SECRET: Not set - Google OAuth disabled")

    # Check VAPID_PRIVATE_KEY (supports encrypted format and Vault)
    try:
        from app.core.vapid_encryption import get_vapid_private_key
        vapid_key = get_vapid_private_key()
        if not vapid_key:
            warnings.append("VAPID_PRIVATE_KEY: Not set - Push notifications disabled")
    except Exception as e:
        warnings.append(f"VAPID_PRIVATE_KEY: Error loading key - {e}")

    if not settings.OPENAI_API_KEY:
        warnings.append("OPENAI_API_KEY: Not set - AI features disabled")

    if errors:
        raise ValueError(
            "Production secrets validation failed:\n" +
            "\n".join(f"  - {e}" for e in errors)
        )

    if warnings:
        import logging
        logger = logging.getLogger(__name__)
        for w in warnings:
            logger.warning(f"Secret warning: {w}")
