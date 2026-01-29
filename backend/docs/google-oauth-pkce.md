# Google OAuth2 with PKCE

## Overview

המערכת משתמשת ב-**PKCE (Proof Key for Code Exchange)** ל-OAuth2 עם Google.

**PKCE** הוא security extension ל-OAuth2 שמגן מפני authorization code interception attacks, במיוחד חשוב ל:
- Single-Page Applications (SPA)
- Mobile applications
- Public clients (clients without client secret)

## מה זה PKCE?

PKCE מוסיף layer נוסף של אבטחה ל-OAuth2 Authorization Code Flow:

1. **code_verifier** - random string שנוצר על ידי ה-client
2. **code_challenge** - hash של ה-code_verifier (SHA256)
3. **code_challenge_method** - השיטה ל-hash (S256 או plain)

**Flow:**
1. Client יוצר `code_verifier` ו-`code_challenge`
2. Client שולח `code_challenge` ב-authorization request
3. Authorization server מחזיר `authorization_code`
4. Client שולח `code_verifier` ב-token exchange request
5. Authorization server בודק ש-`code_verifier` תואם ל-`code_challenge`

## Configuration

### Environment Variables

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback

# PKCE Settings
GOOGLE_OAUTH_USE_PKCE=true          # Enable PKCE (recommended)
GOOGLE_OAUTH_PKCE_METHOD=S256       # S256 (SHA256) or plain
```

### Production vs Development

- **Development:**
  - `GOOGLE_OAUTH_USE_PKCE=true` (מומלץ גם ב-development)
  - `GOOGLE_OAUTH_PKCE_METHOD=S256`

- **Production:**
  - `GOOGLE_OAUTH_USE_PKCE=true` (חובה!)
  - `GOOGLE_OAUTH_PKCE_METHOD=S256` (מומלץ)

## API Endpoints

### 1. Initiate OAuth Flow

```http
GET /api/auth/google/login
```

**Response:**
```json
{
  "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "random-state-token"
}
```

**Query Parameters (in auth_url):**
- `client_id` - Google Client ID
- `response_type=code` - Authorization Code flow
- `scope` - Requested scopes
- `redirect_uri` - Callback URL
- `state` - CSRF protection token
- `code_challenge` - PKCE challenge (SHA256 hash)
- `code_challenge_method=S256` - PKCE method

### 2. OAuth Callback

```http
GET /api/auth/google/callback?code=AUTHORIZATION_CODE&state=STATE_TOKEN
```

**Process:**
1. Validate `state` token (CSRF protection)
2. Retrieve `code_verifier` from storage (by state)
3. Exchange `code` + `code_verifier` for tokens
4. Save refresh token to user
5. Redirect to frontend

## Implementation Details

### PKCE Generation

```python
from app.core.pkce import generate_pkce_pair

# Generate PKCE pair
code_verifier, code_challenge = generate_pkce_pair(method="S256")

# code_verifier: random base64url string (43-128 chars)
# code_challenge: SHA256(code_verifier) base64url encoded
```

### State Storage

**Current Implementation:**
- In-memory dictionary (development only)
- Key: `state` token
- Value: `code_verifier`, `code_challenge`, `method`

**Production Recommendation:**
- Use Redis with TTL (5-10 minutes)
- Key: `pkce:state:{state}`
- TTL: 600 seconds (10 minutes)

### Token Exchange

**With PKCE:**
```python
token_data = {
    "code": authorization_code,
    "client_id": GOOGLE_CLIENT_ID,
    "client_secret": GOOGLE_CLIENT_SECRET,
    "redirect_uri": REDIRECT_URI,
    "grant_type": "authorization_code",
    "code_verifier": code_verifier,  # PKCE: required
}
```

**Without PKCE (not recommended):**
```python
# Uses google_auth_oauthlib.flow.Flow
flow.fetch_token(code=authorization_code)
```

## Security Benefits

### 1. Authorization Code Interception Protection

**Without PKCE:**
- Attacker יכול ליירט authorization code
- Attacker יכול להחליף את ה-code ל-tokens (אם יש לו access ל-redirect URI)

**With PKCE:**
- Attacker צריך גם את ה-`code_verifier` (שלא נשלח ב-authorization request)
- `code_verifier` נשמר רק ב-client ולא נשלח עד token exchange

### 2. Public Client Support

PKCE מאפשר להשתמש ב-OAuth2 עם public clients (ללא client secret):
- Mobile apps
- SPAs
- Desktop applications

### 3. Defense in Depth

PKCE מוסיף layer נוסף של אבטחה גם עם client secret:
- מגן מפני code interception
- מגן מפני replay attacks
- מגן מפני man-in-the-middle

## Google Cloud Console Setup

### 1. Create OAuth 2.0 Client

1. לך ל-[Google Cloud Console](https://console.cloud.google.com/)
2. בחר project
3. לך ל-APIs & Services > Credentials
4. צור OAuth 2.0 Client ID
5. בחר Application type: Web application

### 2. Configure Redirect URIs

**Authorized redirect URIs:**
```
https://your-domain.com/api/auth/google/callback
http://localhost:8000/api/auth/google/callback  # Development
```

### 3. Enable APIs

**Required APIs:**
- Google Calendar API
- Google People API (for user info)

### 4. OAuth Consent Screen

1. הגדר OAuth consent screen
2. הוסף scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/userinfo.email`

## Testing

### 1. Test PKCE Flow

```bash
# 1. Initiate OAuth flow
curl http://localhost:8000/api/auth/google/login

# Response:
# {
#   "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?...&code_challenge=...&code_challenge_method=S256",
#   "state": "..."
# }

# 2. Open auth_url in browser
# 3. Authorize and get redirected to callback
# 4. Check that tokens are saved
```

### 2. Verify PKCE Parameters

**Authorization URL should include:**
- `code_challenge` - Base64URL encoded SHA256 hash
- `code_challenge_method=S256`

**Token Exchange should include:**
- `code_verifier` - Original random string

### 3. Test Error Cases

```bash
# Missing code_verifier
# Should fail with: "invalid_grant" or "pkce_verifier_not_found"

# Invalid code_verifier
# Should fail with: "invalid_grant"
```

## Troubleshooting

### PKCE verifier not found

**Problem:** `code_verifier` לא נמצא ב-callback

**Solutions:**
1. ודא ש-`state` זהה ב-login ו-callback
2. ודא ש-PKCE state נשמר (בדוק Redis/in-memory storage)
3. ודא ש-TTL לא פג (אם משתמשים ב-Redis)

### Invalid code_verifier

**Problem:** Google מחזיר `invalid_grant`

**Solutions:**
1. ודא ש-`code_verifier` תואם ל-`code_challenge`
2. ודא ש-`code_challenge_method` נכון (S256)
3. ודא ש-`code_verifier` לא השתנה בין login ל-callback

### PKCE not working in production

**Problem:** PKCE לא עובד ב-production

**Solutions:**
1. ודא ש-`GOOGLE_OAUTH_USE_PKCE=true`
2. ודא ש-Redis מוגדר (אם משתמשים ב-Redis ל-state storage)
3. בדוק את ה-logs ל-errors

## Migration from Non-PKCE

### Step 1: Enable PKCE

```bash
GOOGLE_OAUTH_USE_PKCE=true
GOOGLE_OAUTH_PKCE_METHOD=S256
```

### Step 2: Update Frontend

Frontend צריך:
1. לשמור את ה-`state` token
2. לשלוח את ה-`state` ב-callback

### Step 3: Test

1. Test ב-development
2. Test ב-staging
3. Deploy ל-production

## Best Practices

1. **Always use PKCE in production** - חובה לאבטחה
2. **Use S256 method** - לא להשתמש ב-`plain` (רק ל-testing)
3. **Store state securely** - Redis עם TTL
4. **Validate state** - CSRF protection
5. **Clear state after use** - למנוע reuse
6. **Log PKCE usage** - לניפוי באגים

## Resources

- [RFC 7636: PKCE](https://tools.ietf.org/html/rfc7636)
- [Google OAuth 2.0 with PKCE](https://developers.google.com/identity/protocols/oauth2/native-app)
- [OAuth 2.0 Security Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)
