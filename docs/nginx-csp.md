# Content Security Policy (CSP) in NGINX

## Overview

ה-CSP (Content Security Policy) מוגדר ב-NGINX כדי להגן מפני:
- **XSS attacks** - מונע execution של malicious scripts
- **Data injection** - מונע injection של data
- **Clickjacking** - מונע embedding ב-iframes
- **Mixed content** - מאלץ HTTPS

## CSP Configuration

### Current Policy

```nginx
Content-Security-Policy:
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval'
        https://www.googletagmanager.com
        https://www.google-analytics.com;
    style-src 'self' 'unsafe-inline'
        https://fonts.googleapis.com;
    font-src 'self'
        https://fonts.gstatic.com
        data:;
    img-src 'self'
        data:
        blob:
        https:;
    connect-src 'self'
        ws://localhost:8000
        wss://localhost:8000
        ws://backend:8000
        wss://backend:8000
        https://accounts.google.com
        https://oauth2.googleapis.com
        https://www.googleapis.com
        https://fcm.googleapis.com;
    frame-src 'self'
        https://accounts.google.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self'
        https://accounts.google.com;
    frame-ancestors 'self';
    upgrade-insecure-requests;
```

## Directive Explanations

### default-src 'self'
- Default source for all resources
- `'self'` = same origin only

### script-src
**Allowed:**
- `'self'` - Scripts from same origin
- `'unsafe-inline'` - Inline scripts (required for Vite HMR and theme script)
- `'unsafe-eval'` - eval() (required for Vite dev mode)
- `https://www.googletagmanager.com` - Google Analytics
- `https://www.google-analytics.com` - Google Analytics

**Note:** `'unsafe-inline'` ו-`'unsafe-eval'` נדרשים ל-Vite, אבל לא מומלצים לפרודקשן. ב-production, השתמש ב-nonce או hash.

### style-src
**Allowed:**
- `'self'` - Styles from same origin
- `'unsafe-inline'` - Inline styles (required for Tailwind and theme)
- `https://fonts.googleapis.com` - Google Fonts CSS

### font-src
**Allowed:**
- `'self'` - Fonts from same origin
- `https://fonts.gstatic.com` - Google Fonts
- `data:` - Data URIs (for favicon)

### img-src
**Allowed:**
- `'self'` - Images from same origin
- `data:` - Data URIs
- `blob:` - Blob URLs (for dynamic images)
- `https:` - All HTTPS images (for external images)

### connect-src
**Allowed:**
- `'self'` - API calls to same origin
- `ws://localhost:8000` - WebSocket (development)
- `wss://localhost:8000` - WebSocket Secure (development)
- `ws://backend:8000` - WebSocket (Docker)
- `wss://backend:8000` - WebSocket Secure (Docker)
- `https://accounts.google.com` - Google OAuth
- `https://oauth2.googleapis.com` - Google OAuth token exchange
- `https://www.googleapis.com` - Google APIs
- `https://fcm.googleapis.com` - Firebase Cloud Messaging (push notifications)

### frame-src
**Allowed:**
- `'self'` - Frames from same origin
- `https://accounts.google.com` - Google OAuth popup

### object-src 'none'
- Blocks all `<object>`, `<embed>`, `<applet>` tags

### base-uri 'self'
- Restricts `<base>` tag to same origin

### form-action
**Allowed:**
- `'self'` - Form submissions to same origin
- `https://accounts.google.com` - Google OAuth forms

### frame-ancestors 'self'
- Prevents embedding in iframes (except same origin)
- Equivalent to `X-Frame-Options: SAMEORIGIN`

### upgrade-insecure-requests
- Automatically upgrades HTTP requests to HTTPS

## Production Recommendations

### 1. Remove unsafe-inline and unsafe-eval

**Current (Development):**
```nginx
script-src 'self' 'unsafe-inline' 'unsafe-eval' ...;
```

**Production (Recommended):**
```nginx
script-src 'self'
    'nonce-{random-nonce}'
    https://www.googletagmanager.com
    https://www.google-analytics.com;
```

**Implementation:**
1. Generate nonce per request
2. Inject nonce into inline scripts
3. Add nonce to CSP header

### 2. Use Hash for Inline Scripts

**Alternative to nonce:**
```nginx
script-src 'self'
    'sha256-{hash-of-inline-script}'
    https://www.googletagmanager.com;
```

**Generate hash:**
```bash
echo -n "script content" | openssl dgst -sha256 -binary | openssl base64
```

### 3. Stricter Image Sources

**Current:**
```nginx
img-src 'self' data: blob: https:;
```

**Production (if possible):**
```nginx
img-src 'self'
    data:
    blob:
    https://fonts.gstatic.com
    https://*.googleusercontent.com;
```

## Testing CSP

### 1. Check CSP Violations

**Browser Console:**
- Open DevTools → Console
- Look for CSP violation errors

**Example:**
```
Refused to load the script 'https://evil.com/script.js'
because it violates the following Content Security Policy directive:
"script-src 'self' 'unsafe-inline'".
```

### 2. Test with CSP Evaluator

**Tool:**
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- Paste your CSP policy
- Get security recommendations

### 3. Monitor CSP Reports

**CSP reporting is already configured:**
```nginx
report-uri /api/csp-report/;
```

**Backend endpoint:**
- `POST /api/csp-report/` - Receives and logs CSP violations
- `GET /api/csp-report/test` - Test endpoint to verify reporting works

**View violations:**
- Check application logs for "CSP violation detected"
- Violations are logged with full details (blocked URI, violated directive, etc.)

## Development vs Production

### Development
- `'unsafe-inline'` - Required for Vite HMR
- `'unsafe-eval'` - Required for Vite dev mode
- More permissive for easier development

### Production
- Remove `'unsafe-inline'` and `'unsafe-eval'`
- Use nonces or hashes
- Stricter policy
- Monitor violations

## Common Issues

### 1. Vite HMR Not Working

**Problem:** Hot Module Replacement blocked by CSP

**Solution:**
```nginx
# Development only
script-src 'self' 'unsafe-inline' 'unsafe-eval' ...;
```

### 2. Google Fonts Not Loading

**Problem:** Fonts blocked by CSP

**Solution:**
```nginx
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
```

### 3. WebSocket Not Connecting

**Problem:** WebSocket blocked by CSP

**Solution:**
```nginx
connect-src 'self'
    ws://localhost:8000
    wss://localhost:8000
    ws://backend:8000
    wss://backend:8000;
```

### 4. Google OAuth Not Working

**Problem:** OAuth popup blocked

**Solution:**
```nginx
frame-src 'self' https://accounts.google.com;
form-action 'self' https://accounts.google.com;
connect-src 'self'
    https://accounts.google.com
    https://oauth2.googleapis.com;
```

## CSP Levels

### Level 1: Basic (Current)
- Allows `'unsafe-inline'` and `'unsafe-eval'`
- Good for development
- Basic XSS protection

### Level 2: Strict (Recommended for Production)
- Uses nonces or hashes
- No `'unsafe-inline'` or `'unsafe-eval'`
- Strong XSS protection

### Level 3: Maximum (Advanced)
- Very strict policy
- Minimal external resources
- Self-hosted fonts and assets

## Resources

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [OWASP: Content Security Policy](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [CSP Best Practices](https://content-security-policy.com/)
