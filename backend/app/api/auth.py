from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, RefreshToken, TokenBlocklist
from app.schemas.user import UserCreate, UserRead, Token, RefreshTokenRequest
from app.api.deps import get_current_user
from app.api.deps_audit import get_audit_context
from app.services.audit import audit_service, AuditAction
from app.config import settings
from app.services.rate_limiter import rate_limiter
from app.core.limiter import RATE_LIMIT_AUTH, limiter
from app.core.logging import logger, log_api_call
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
import urllib.parse
import secrets
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(*, data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a short-lived access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({
        "exp": expire,
        "type": "access",
        "jti": str(uuid.uuid4()),
    })
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(
    db: Session,
    user: User,
    device_info: str | None = None,
    ip_address: str | None = None
) -> tuple[str, RefreshToken]:
    """
    Create a long-lived refresh token and store it in the database.
    Returns tuple of (token_string, RefreshToken model)
    """
    jti = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    # Create JWT refresh token
    token_data = {
        "sub": user.email,
        "jti": jti,
        "type": "refresh",
        "exp": expires_at,
    }
    token_string = jwt.encode(token_data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    # Store in database for revocation capability
    db_token = RefreshToken(
        user_id=user.id,
        jti=jti,
        expires_at=expires_at,
        device_info=device_info,
        ip_address=ip_address,
    )
    db.add(db_token)
    db.commit()
    db.refresh(db_token)

    return token_string, db_token


def verify_refresh_token(db: Session, token: str) -> tuple[User, RefreshToken]:
    """
    Verify a refresh token and return the user and token model.
    Raises HTTPException if invalid.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

        # Verify token type
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )

        jti = payload.get("jti")
        email = payload.get("sub")

        if not jti or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )

        # Check if token exists and is not revoked
        db_token = db.query(RefreshToken).filter(
            RefreshToken.jti == jti,
            RefreshToken.revoked == False
        ).first()

        if not db_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked or does not exist"
            )

        if not db_token.is_valid():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )

        # Get user
        user = db.query(User).filter(User.email == email).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )

        return user, db_token

    except JWTError as e:
        logger.warning(f"JWT verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate token"
        )


def block_access_token(
    db: Session,
    jti: str,
    expires_at: datetime,
    user_id: int | None = None,
    reason: str | None = None
) -> TokenBlocklist:
    """
    Add an access token to the blocklist.

    Args:
        db: Database session
        jti: JWT ID from the token
        expires_at: When the token naturally expires
        user_id: User ID (optional, for cleanup)
        reason: Reason for blocking (optional, for audit)

    Returns:
        TokenBlocklist instance
    """
    # Check if already blocked
    existing = db.query(TokenBlocklist).filter(TokenBlocklist.jti == jti).first()
    if existing:
        return existing

    blocked = TokenBlocklist(
        jti=jti,
        token_type="access",
        user_id=user_id,
        expires_at=expires_at,
        reason=reason
    )
    db.add(blocked)
    db.commit()
    db.refresh(blocked)
    return blocked


def block_refresh_token(
    db: Session,
    jti: str,
    expires_at: datetime,
    user_id: int | None = None,
    reason: str | None = None
) -> TokenBlocklist:
    """
    Add a refresh token to the blocklist.

    Note: Refresh tokens are also stored in RefreshToken table with revoked flag.
    This blocklist provides additional security layer.
    """
    existing = db.query(TokenBlocklist).filter(TokenBlocklist.jti == jti).first()
    if existing:
        return existing

    blocked = TokenBlocklist(
        jti=jti,
        token_type="refresh",
        user_id=user_id,
        expires_at=expires_at,
        reason=reason
    )
    db.add(blocked)
    db.commit()
    db.refresh(blocked)
    return blocked


def revoke_all_user_tokens(db: Session, user_id: int) -> dict:
    """
    Revoke all tokens (both access and refresh) for a user.

    Returns:
        dict with counts of revoked tokens
    """
    # Revoke all refresh tokens
    refresh_count = db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.revoked == False
    ).update({
        "revoked": True,
        "revoked_at": datetime.utcnow()
    })

    # Block all refresh tokens in blocklist
    refresh_tokens = db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.revoked == False
    ).all()

    for token in refresh_tokens:
        block_refresh_token(
            db=db,
            jti=token.jti,
            expires_at=token.expires_at,
            user_id=user_id,
            reason="User logout all devices"
        )

    db.commit()

    return {
        "refresh_tokens_revoked": refresh_count,
        "message": "All tokens revoked successfully"
    }


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute;20/hour")  # Stricter rate limit for registration
def register(request: Request, user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user and return access + refresh tokens immediately.
    This provides better UX as the user doesn't need to login after registration.
    """
    log_api_call("/api/auth/register", "POST", email=user_in.email)

    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        logger.warning("Registration attempt with existing email", extra={"email": user_in.email})
        raise HTTPException(status_code=400, detail="האימייל כבר במערכת")

    hashed = get_password_hash(user_in.password)
    user = User(email=user_in.email, hashed_password=hashed)
    db.add(user)
    db.flush()  # Flush to get the ID

    # Get audit context (no user yet, so use request info)
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    # Create audit log for user registration
    new_values = {
        "email": user.email,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
    }
    audit_service.create_audit_log(
        session=db,
        instance=user,
        action=AuditAction.CREATE,
        user_id=user.id,  # User created themselves
        user_email=user.email,
        new_values=new_values,
        ip_address=client_ip,
        user_agent=user_agent,
    )

    db.commit()
    db.refresh(user)

    # Send welcome email in background
    try:
        from app.workers.email_tasks import send_welcome_email
        send_welcome_email.delay(user.id)
    except Exception as e:
        logger.warning(f"Failed to queue welcome email: {e}", extra={"user_id": user.id})

    logger.info("User registered successfully", extra={"user_id": user.id, "email": user.email})

    # Create access + refresh tokens for immediate login
    access_token = create_access_token(data={"sub": user.email})
    refresh_token_str, _ = create_refresh_token(
        db=db,
        user=user,
        device_info=user_agent,
        ip_address=client_ip
    )

    return Token(
        access_token=access_token,
        refresh_token=refresh_token_str,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/login", response_model=Token)
@limiter.limit("10/minute;50/hour")  # Rate limit per IP for login
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login endpoint with brute-force protection. Returns access and refresh tokens."""
    log_api_call("/api/auth/login", "POST", email=form_data.username)

    # Get client identifier (IP or email)
    client_ip = rate_limiter._get_client_ip(request)
    identifier = f"{client_ip}:{form_data.username}"

    # Check if account is locked out
    attempt_count, is_locked_out = rate_limiter.record_failed_login(identifier)

    if is_locked_out:
        ttl = rate_limiter.get_lockout_ttl(identifier)
        minutes = (ttl // 60) + 1 if ttl else settings.BRUTE_FORCE_LOCKOUT_MINUTES
        logger.warning(
            "Login attempt on locked account",
            extra={
                "email": form_data.username,
                "client_ip": client_ip,
                "attempt_count": attempt_count,
                "lockout_minutes": minutes,
            }
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"חשבון נחסם לאחר {settings.BRUTE_FORCE_MAX_ATTEMPTS} ניסיונות כושלים. "
                   f"נסה שוב בעוד {minutes} דקות."
        )

    # Verify credentials
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        remaining = rate_limiter.get_remaining_attempts(identifier)
        logger.warning(
            "Failed login attempt",
            extra={
                "email": form_data.username,
                "client_ip": client_ip,
                "remaining_attempts": remaining,
            }
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"אימייל/סיסמא לא נכונים. נותרו {remaining} ניסיונות."
        )

    # Successful login - reset failed attempts
    rate_limiter.reset_failed_logins(identifier)

    # Get device info from request
    user_agent = request.headers.get("user-agent", "")[:255]

    # Create tokens
    access_token = create_access_token(data={"sub": user.email})
    refresh_token, _ = create_refresh_token(
        db=db,
        user=user,
        device_info=user_agent,
        ip_address=client_ip
    )

    logger.info(
        "User logged in successfully",
        extra={"user_id": user.id, "email": user.email, "client_ip": client_ip}
    )

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/refresh", response_model=Token)
def refresh_tokens(
    request: Request,
    body: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using a valid refresh token.

    The old refresh token is revoked and a new one is issued (token rotation).
    This provides better security as stolen refresh tokens become useless after one use.
    """
    log_api_call("/api/auth/refresh", "POST")

    # Verify the refresh token
    user, old_token = verify_refresh_token(db, body.refresh_token)

    # Revoke old refresh token (token rotation)
    old_token.revoke()
    db.add(old_token)

    # Block old refresh token in blocklist
    block_refresh_token(
        db=db,
        jti=old_token.jti,
        expires_at=old_token.expires_at,
        user_id=user.id,
        reason="Token rotation"
    )

    # Get client info
    client_ip = rate_limiter._get_client_ip(request) if hasattr(rate_limiter, '_get_client_ip') else None
    user_agent = request.headers.get("user-agent", "")[:255]

    # Create new tokens
    access_token = create_access_token(data={"sub": user.email})
    refresh_token, _ = create_refresh_token(
        db=db,
        user=user,
        device_info=user_agent,
        ip_address=client_ip
    )

    logger.info(
        "Tokens refreshed successfully",
        extra={"user_id": user.id, "email": user.email}
    )

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    body: RefreshTokenRequest | None = None,
    db: Session = Depends(get_db)
):
    """
    Logout by revoking refresh token and optionally blocking current access token.

    Can be called in two ways:
    1. With refresh token in body - revokes refresh token
    2. With access token in Authorization header - blocks access token (even if expired/invalid)

    The client should clear both tokens from local storage.
    """
    log_api_call("/api/auth/logout", "POST")

    # Try to block access token from Authorization header (even if expired)
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
        try:
            # Decode without expiration check (verify_signature=False would be unsafe, but we check signature)
            # We'll decode and check expiration manually
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM],
                options={"verify_exp": False}  # Don't fail on expired tokens
            )
            jti = payload.get("jti")
            exp = payload.get("exp")
            user_email = payload.get("sub")

            if jti and exp:
                # Calculate expiration time (exp is Unix timestamp)
                expires_at = datetime.utcfromtimestamp(exp)

                # Get user_id if possible
                user_id = None
                if user_email:
                    user = db.query(User).filter(User.email == user_email).first()
                    if user:
                        user_id = user.id

                block_access_token(
                    db=db,
                    jti=jti,
                    expires_at=expires_at,
                    user_id=user_id,
                    reason="User logout"
                )
                logger.info("Access token blocked on logout", extra={"jti": jti, "user_id": user_id})
        except JWTError:
            # Token invalid - ignore (might already be expired or malformed)
            pass

    # Revoke refresh token if provided
    if body and body.refresh_token:
        try:
            _, token = verify_refresh_token(db, body.refresh_token)
            token.revoke()
            db.add(token)

            # Also block in blocklist
            block_refresh_token(
                db=db,
                jti=token.jti,
                expires_at=token.expires_at,
                user_id=token.user_id,
                reason="User logout"
            )

            db.commit()
            logger.info("Refresh token revoked on logout", extra={"token_jti": token.jti})
        except HTTPException:
            # Token already invalid/revoked - that's fine for logout
            pass

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/logout-all", status_code=status.HTTP_204_NO_CONTENT)
def logout_all_devices(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Logout from all devices by revoking all refresh tokens and blocking all access tokens.

    Requires a valid access token.

    This will:
    - Revoke all refresh tokens for the user
    - Block all access tokens (they will be rejected on next use)
    - Force re-authentication on all devices
    """
    log_api_call("/api/auth/logout-all", "POST")

    result = revoke_all_user_tokens(db, current_user.id)

    # Also block current access token
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM],
                options={"verify_exp": False}  # Don't fail on expired tokens
            )
            jti = payload.get("jti")
            exp = payload.get("exp")

            if jti and exp:
                expires_at = datetime.utcfromtimestamp(exp)
                block_access_token(
                    db=db,
                    jti=jti,
                    expires_at=expires_at,
                    user_id=current_user.id,
                    reason="User logout all devices"
                )
        except JWTError:
            pass

    logger.info(
        "User logged out from all devices",
        extra={
            "user_id": current_user.id,
            "refresh_tokens_revoked": result.get("refresh_tokens_revoked", 0)
        }
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)):
    """Return current authenticated user (without hashed_password)."""
    return UserRead(
        id=current_user.id,
        email=current_user.email,
        is_active=current_user.is_active,
        is_superuser=current_user.is_superuser,
    )


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    audit_context: dict = Depends(get_audit_context),
):
    """
    Deactivate (soft-delete) the current user's account.

    We prefer soft-delete to avoid FK/cascade issues across existing rows (tasks/rooms/etc.).
    The user is anonymized and password is invalidated. All refresh tokens are revoked.
    """
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Store old values for audit log
    old_email = user.email
    old_is_active = user.is_active

    # Revoke all refresh tokens
    revoke_all_user_tokens(db, user.id)

    user.is_active = False
    # Anonymize email to free up the original address and reduce PII retention
    new_email = f"deleted_{user.id}_{int(datetime.utcnow().timestamp())}@deleted.local"
    user.email = new_email
    # Invalidate password so the account cannot be reused for login
    user.hashed_password = get_password_hash(secrets.token_urlsafe(32))

    db.add(user)
    db.flush()  # Flush to get updated values

    # Create audit log for user deletion (soft-delete)
    old_values = {
        "email": old_email,
        "is_active": old_is_active,
    }
    new_values = {
        "email": new_email,
        "is_active": False,
    }
    audit_service.create_audit_log(
        session=db,
        instance=user,
        action=AuditAction.DELETE,  # Using DELETE action for soft-delete
        user_id=audit_context["user_id"],
        user_email=audit_context["user_email"],
        old_values=old_values,
        new_values=new_values,
        changed_fields={"email": {"old": old_email, "new": new_email}, "is_active": {"old": old_is_active, "new": False}},
        ip_address=audit_context["ip_address"],
        user_agent=audit_context["user_agent"],
    )

    db.commit()

    logger.info("User account deactivated", extra={"user_id": user.id})
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Google OAuth with PKCE ----------
@router.get("/google/login")
def google_login(request: Request):
    """
    Initiate Google OAuth flow with PKCE (Proof Key for Code Exchange).

    PKCE protects against authorization code interception attacks.
    Required for production security.
    """
    from app.core.pkce import generate_pkce_pair, store_pkce_state
    import secrets

    # Generate state for CSRF protection
    state = secrets.token_urlsafe(32)

    # Generate PKCE pair (code_verifier, code_challenge)
    if settings.GOOGLE_OAUTH_USE_PKCE:
        code_verifier, code_challenge = generate_pkce_pair(
            method=settings.GOOGLE_OAUTH_PKCE_METHOD
        )
        # Store verifier for later use in callback
        store_pkce_state(state, code_verifier, code_challenge, settings.GOOGLE_OAUTH_PKCE_METHOD)
    else:
        code_challenge = None
        code_verifier = None

    # Build OAuth2 authorization URL
    google_auth_base = "https://accounts.google.com/o/oauth2/v2/auth"
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "response_type": "code",
        "scope": "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email",
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "access_type": "offline",
        "prompt": "consent",
        "state": state,  # CSRF protection
    }

    # Add PKCE parameters if enabled
    if settings.GOOGLE_OAUTH_USE_PKCE and code_challenge:
        params["code_challenge"] = code_challenge
        params["code_challenge_method"] = settings.GOOGLE_OAUTH_PKCE_METHOD

    url = f"{google_auth_base}?{urllib.parse.urlencode(params)}"

    logger.info(
        "Google OAuth login initiated",
        extra={
            "state": state[:8] + "...",
            "pkce_enabled": settings.GOOGLE_OAUTH_USE_PKCE,
            "pkce_method": settings.GOOGLE_OAUTH_PKCE_METHOD if settings.GOOGLE_OAUTH_USE_PKCE else None
        }
    )

    return {"auth_url": url, "state": state}


@router.get("/google/callback")
def google_callback(
    request: Request,
    code: str,
    state: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Google OAuth callback with PKCE support.

    Receives authorization code from Google, exchanges for tokens using PKCE.
    """
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import Flow
    from app.core.pkce import get_pkce_verifier, clear_pkce_state, validate_code_verifier
    import httpx

    try:
        # Get PKCE verifier if PKCE is enabled
        code_verifier = None
        if settings.GOOGLE_OAUTH_USE_PKCE:
            code_verifier = get_pkce_verifier(state)
            if not code_verifier:
                logger.error("PKCE verifier not found for state", extra={"state": state[:8] + "..."})
                return RedirectResponse(url=f"{settings.FRONTEND_URL}?google_error=1&reason=pkce_verifier_not_found")

        # Exchange authorization code for tokens
        if settings.GOOGLE_OAUTH_USE_PKCE and code_verifier:
            # Use PKCE flow - manual token exchange with code_verifier
            token_url = "https://oauth2.googleapis.com/token"
            token_data = {
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
                "code_verifier": code_verifier,  # PKCE: send code_verifier
            }

            # Make token request
            response = httpx.post(token_url, data=token_data)
            response.raise_for_status()
            token_response = response.json()

            # Create credentials from token response
            credentials = Credentials(
                token=token_response.get("access_token"),
                refresh_token=token_response.get("refresh_token"),
                token_uri="https://oauth2.googleapis.com/token",
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
                scopes=token_response.get("scope", "").split() if token_response.get("scope") else [],
            )
        else:
            # Fallback to non-PKCE flow (not recommended for production)
            flow = Flow.from_client_config(
                client_config={
                    "web": {
                        "client_id": settings.GOOGLE_CLIENT_ID,
                        "client_secret": settings.GOOGLE_CLIENT_SECRET,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                    }
                },
                scopes=["https://www.googleapis.com/auth/calendar"],
                redirect_uri=settings.GOOGLE_REDIRECT_URI,
            )
            flow.fetch_token(code=code)
            credentials = flow.credentials

        # Save refresh token to user
        if credentials.refresh_token:
            current_user.google_refresh_token = credentials.refresh_token
            db.commit()
            logger.info(
                "Google OAuth tokens saved",
                extra={
                    "user_id": current_user.id,
                    "pkce_used": settings.GOOGLE_OAUTH_USE_PKCE
                }
            )
        else:
            logger.warning("No refresh token received from Google OAuth")

        # Clear PKCE state
        if settings.GOOGLE_OAUTH_USE_PKCE:
            clear_pkce_state(state)

        # Redirect to frontend with success
        return RedirectResponse(url=f"{settings.FRONTEND_URL}?google_success=1")

    except httpx.HTTPStatusError as e:
        logger.error(
            "Google OAuth token exchange failed",
            extra={
                "status_code": e.response.status_code,
                "response": e.response.text[:200],
                "pkce_used": settings.GOOGLE_OAUTH_USE_PKCE
            }
        )
        return RedirectResponse(url=f"{settings.FRONTEND_URL}?google_error=1&reason=token_exchange_failed")
    except Exception as e:
        logger.error(
            "Google OAuth callback error",
            extra={
                "error": str(e),
                "pkce_used": settings.GOOGLE_OAUTH_USE_PKCE
            },
            exc_info=True
        )
        return RedirectResponse(url=f"{settings.FRONTEND_URL}?google_error=1&reason=unknown")
