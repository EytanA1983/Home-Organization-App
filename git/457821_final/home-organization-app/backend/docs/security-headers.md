# Security Headers Configuration (Helmet-style)

## Overview

המערכת כוללת middleware ל-security headers בסגנון Helmet של Express.js, המגן מפני:
- **Clickjacking** (X-Frame-Options)
- **MIME type sniffing** (X-Content-Type-Options)
- **XSS attacks** (X-XSS-Protection, CSP)
- **Man-in-the-Middle** (HSTS)
- **Information disclosure** (Remove Server headers)

## Security Headers

### X-Content-Type-Options: nosniff
מונע מהדפדפן לנסות לנחש את סוג התוכן (MIME type sniffing).

**Default:** `true`

### X-Frame-Options
מונע clickjacking attacks על ידי שליטה על איך הדף יכול להיות מוטמע ב-iframe.

**Options:**
- `DENY` - לא ניתן להטמיע בשום מקום (default)
- `SAMEORIGIN` - ניתן להטמיע רק מאותו origin
- `ALLOW-FROM <uri>` - ניתן להטמיע רק מ-URI מסוים

**Default:** `DENY`

### X-XSS-Protection: 1; mode=block
מפעיל את ה-XSS filter בדפדפנים ישנים יותר.

**Default:** `true`

### Strict-Transport-Security (HSTS)
מאלץ את הדפדפן להשתמש ב-HTTPS בלבד.

**Headers:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Settings:**
- `SECURITY_HEADERS_HSTS_ENABLED=true` - מופעל רק ב-HTTPS
- `SECURITY_HEADERS_HSTS_MAX_AGE=31536000` - שנה (בשניות)
- `SECURITY_HEADERS_HSTS_INCLUDE_SUBDOMAINS=true` - כולל subdomains
- `SECURITY_HEADERS_HSTS_PRELOAD=false` - דורש הרשמה ידנית ל-HSTS preload list

**Default:** מופעל ב-production (HTTPS)

### Content-Security-Policy (CSP)
שולט באילו resources ניתן לטעון (scripts, styles, images, וכו').

**Example:**
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
```

**Configuration:**
```python
CSP_POLICY = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
```

**Default:** `None` (לא מוגדר)

### Referrer-Policy
שולט כמה מידע referrer נשלח עם requests.

**Options:**
- `no-referrer` - לא שולח referrer
- `no-referrer-when-downgrade` - לא שולח ב-HTTP אם היה HTTPS
- `origin` - שולח רק את ה-origin
- `origin-when-cross-origin` - origin ב-cross-origin, full ב-same-origin
- `same-origin` - רק ב-same-origin
- `strict-origin` - origin, לא ב-HTTP אם היה HTTPS
- `strict-origin-when-cross-origin` - strict-origin ב-cross-origin, full ב-same-origin (default)
- `unsafe-url` - תמיד שולח full URL

**Default:** `strict-origin-when-cross-origin`

### Permissions-Policy (formerly Feature-Policy)
שולט על אילו browser features ו-APIs זמינים.

**Example:**
```
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

**Configuration:**
```python
PERMISSIONS_POLICY = "geolocation=(), microphone=(), camera=()"
```

**Default:** `None` (לא מוגדר)

### X-DNS-Prefetch-Control: off
מכבה DNS prefetching (privacy).

**Default:** `true`

### X-Download-Options: noopen
מונע מ-IE לבצע downloads בהקשר של האתר.

**Default:** `true`

### X-Permitted-Cross-Domain-Policies: none
מונע מ-Adobe Flash/PDF לטעון תוכן cross-domain.

**Default:** `true`

### Server Headers Removal
ה-middleware מסיר אוטומטית:
- `X-Powered-By` - מידע על ה-framework
- `Server` - מידע על ה-server

**Security through obscurity** - לא חושף מידע על הטכנולוגיה.

## Trusted Host Middleware

מגן מפני **Host header attacks** - תוקף יכול לשלוח Host header מזויף.

**Configuration:**
```python
TRUSTED_HOSTS = ["api.example.com", "www.example.com"]
```

**Development:**
```python
TRUSTED_HOSTS = ["*"]  # Allow all (development only!)
```

**Production:**
```python
TRUSTED_HOSTS = ["api.example.com", "www.example.com"]  # Specific hosts only
```

## הגדרות

### Environment Variables

```bash
# Enable/disable security headers
SECURITY_HEADERS_ENABLED=true

# Individual header settings
SECURITY_HEADERS_CONTENT_TYPE_NOSNIFF=true
SECURITY_HEADERS_FRAME_OPTIONS=DENY
SECURITY_HEADERS_XSS_PROTECTION=true

# HSTS settings
SECURITY_HEADERS_HSTS_ENABLED=true
SECURITY_HEADERS_HSTS_MAX_AGE=31536000  # 1 year
SECURITY_HEADERS_HSTS_INCLUDE_SUBDOMAINS=true
SECURITY_HEADERS_HSTS_PRELOAD=false

# Other headers
SECURITY_HEADERS_REFERRER_POLICY=strict-origin-when-cross-origin
SECURITY_HEADERS_DNS_PREFETCH_CONTROL=true
SECURITY_HEADERS_DOWNLOAD_OPTIONS=true
SECURITY_HEADERS_PERMITTED_CROSS_DOMAIN=true

# CSP and Permissions Policy
CSP_POLICY="default-src 'self'; script-src 'self' 'unsafe-inline'"
PERMISSIONS_POLICY="geolocation=(), microphone=(), camera=()"

# Trusted Hosts
TRUSTED_HOSTS=["api.example.com", "www.example.com"]
```

## Middleware Order

**חשוב:** סדר ה-middleware הוא קריטי!

```python
# 1. Trusted Host (first - protects against Host header attacks)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=...)

# 2. CORS (must be early)
app.add_middleware(CORSMiddleware, ...)

# 3. Security Headers (after CORS)
app.add_middleware(SecureHeadersMiddleware, ...)

# 4. Cookie Middleware (after CORS)
app.add_middleware(SecureCookieMiddleware)

# 5. Other middleware...
```

## Testing

### בדיקת Security Headers

```bash
# בדוק את ה-headers שנשלחים
curl -I http://localhost:8000/api/health

# צפוי לראות:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000; includeSubDomains (HTTPS only)
# Referrer-Policy: strict-origin-when-cross-origin
```

### בדיקת Trusted Host

```bash
# עם Host מותר - עובד
curl -H "Host: api.example.com" http://localhost:8000/api/health

# עם Host לא מותר - 400 Bad Request
curl -H "Host: evil.com" http://localhost:8000/api/health
```

### בדיקה עם Security Scanner

```bash
# Mozilla Observatory
https://observatory.mozilla.org/

# Security Headers
https://securityheaders.com/

# SSL Labs (HTTPS)
https://www.ssllabs.com/ssltest/
```

## Production Checklist

- [ ] `SECURITY_HEADERS_ENABLED=true`
- [ ] `TRUSTED_HOSTS` מוגדר ל-hosts ספציפיים (לא `["*"]`)
- [ ] `SECURITY_HEADERS_HSTS_ENABLED=true` (HTTPS only)
- [ ] `CSP_POLICY` מוגדר (אם נדרש)
- [ ] `PERMISSIONS_POLICY` מוגדר (אם נדרש)
- [ ] בדיקה עם Security Headers scanner
- [ ] בדיקה עם Mozilla Observatory

## Troubleshooting

### Headers לא מופיעים

1. **בדוק שה-middleware מופעל:**
   ```python
   SECURITY_HEADERS_ENABLED=true
   ```

2. **בדוק את סדר ה-middleware:**
   - Security Headers חייב להיות אחרי CORS

3. **בדוק שה-path לא ב-skip list:**
   - `/docs`, `/redoc`, `/openapi.json`, `/health` - לא מקבלים headers

### HSTS לא מופיע

- HSTS מופיע רק ב-HTTPS
- בדוק ש-`request.url.scheme == 'https'` או `x-forwarded-proto == 'https'`

### CSP חוסם resources

- בדוק את ה-CSP policy
- השתמש ב-`'unsafe-inline'` רק אם נדרש (לא מומלץ)
- הוסף domains מותרים ל-`script-src`, `style-src`, וכו'

### Trusted Host חוסם requests

- ב-development: השתמש ב-`TRUSTED_HOSTS=["*"]`
- ב-production: הוסף את כל ה-hosts המותרים

## Resources

- [OWASP: Security Headers](https://owasp.org/www-project-secure-headers/)
- [MDN: Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [Security Headers Scanner](https://securityheaders.com/)
- [HSTS Preload List](https://hstspreload.org/)
