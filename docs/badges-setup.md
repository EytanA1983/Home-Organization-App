# Badges Setup Guide

## Overview

ה-README כולל badges שמציגים את סטטוס הפרויקט, טכנולוגיות, ו-CI/CD.

## Badges כלולים

### Status & CI/CD
- **Docker Hub** - מספר ה-pulls של התמונות
- **CI** - סטטוס GitHub Actions
- **Coverage** - כיסוי קוד (Codecov)
- **Security** - CodeQL security scanning

### Tech Stack
- Python, Node.js, FastAPI, React, TypeScript
- PostgreSQL, Redis
- Docker, Kubernetes

### License & Status
- License type
- Maintenance status

## הגדרה

### 1. עדכן GitHub Repository URLs

בקובץ `README.md`, החלף:
- `YOUR_USERNAME` → GitHub username שלך
- `YOUR_REPO` → שם ה-repository

**דוגמה:**
```markdown
# לפני
[![CI](https://img.shields.io/github/actions/workflow/status/YOUR_USERNAME/YOUR_REPO/...)]

# אחרי
[![CI](https://img.shields.io/github/actions/workflow/status/elimaor/home-org/...)]
```

### 2. Docker Hub Setup

1. **צור Docker Hub account:**
   - הירשם ב-[hub.docker.com](https://hub.docker.com)

2. **צור repositories:**
   - `elimaor/backend`
   - `elimaor/frontend`

3. **עדכן ב-README:**
   ```markdown
   [![Docker Hub](https://img.shields.io/docker/pulls/elimaor/backend?...)]
   ```

4. **הוסף GitHub Secrets:**
   - `DOCKER_USERNAME` - Docker Hub username
   - `DOCKER_PASSWORD` - Docker Hub access token

### 3. Codecov Setup

1. **הירשם ב-[codecov.io](https://codecov.io)**
   - התחבר עם GitHub

2. **הוסף את ה-repository**
   - בחר את ה-repo שלך
   - העתק את ה-token (אם נדרש)

3. **הוסף GitHub Secret (אם נדרש):**
   - `CODECOV_TOKEN` - Codecov token

4. **ה-workflow כבר מוגדר:**
   - `.github/workflows/ci.yml` כולל upload ל-Codecov

### 4. GitHub Actions

ה-workflows כבר מוגדרים:

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | Backend/Frontend tests, linting, Docker build |
| `.github/workflows/codeql.yml` | Security scanning |
| `.github/workflows/docker-publish.yml` | Docker Hub publishing |

**להפעלה:**
1. ודא שה-workflows קיימים ב-`.github/workflows/`
2. Push ל-GitHub
3. ה-badges יתעדכנו אוטומטית

### 5. בדיקת Badges

לאחר ההגדרה, בדוק:

```bash
# בדוק שהתמונות נטענות
# פתח README.md ב-GitHub

# בדוק CI status
# לך ל: https://github.com/YOUR_USERNAME/YOUR_REPO/actions

# בדוק Docker Hub
# לך ל: https://hub.docker.com/r/elimaor/backend
```

## Badges נוספים (אופציונלי)

### Performance
```markdown
[![Lighthouse](https://img.shields.io/badge/Lighthouse-95-green?logo=lighthouse)](https://pagespeed.web.dev/)
```

### Dependencies
```markdown
[![Dependabot](https://img.shields.io/badge/Dependabot-enabled-green?logo=dependabot)](https://github.com/YOUR_USERNAME/YOUR_REPO/security/dependabot)
```

### Version
```markdown
[![Version](https://img.shields.io/github/v/release/YOUR_USERNAME/YOUR_REPO?logo=github)](https://github.com/YOUR_USERNAME/YOUR_REPO/releases)
```

### Contributors
```markdown
[![Contributors](https://img.shields.io/github/contributors/YOUR_USERNAME/YOUR_REPO?logo=github)](https://github.com/YOUR_USERNAME/YOUR_REPO/graphs/contributors)
```

## Troubleshooting

### Badges לא מופיעים
- ודא שה-URLs נכונים
- בדוק שהתמונות נטענות ישירות
- ודא שה-repository public (או שיש לך גישה)

### CI Badge מציג "unknown"
- ודא שה-workflow קיים ב-`.github/workflows/`
- ודא שה-workflow רץ לפחות פעם אחת
- בדוק את שם ה-workflow ב-URL

### Coverage Badge מציג "unknown"
- ודא שה-repository נוסף ל-Codecov
- ודא שה-coverage report נשלח מה-CI
- בדוק את ה-token (אם נדרש)

## Resources

- [Shields.io](https://shields.io/) - Badge generator
- [GitHub Actions](https://docs.github.com/en/actions)
- [Codecov](https://docs.codecov.com/)
- [Docker Hub](https://docs.docker.com/docker-hub/)
