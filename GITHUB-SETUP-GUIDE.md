# GitHub Setup Guide

## הכנה להעלאה ל-GitHub

### צעד 1: בדיקת מצב Git

הרץ את הסקריפט להכנה:

```powershell
.\SETUP-GITHUB.ps1
```

או באופן ידני:

```bash
# בדוק שאתה בתיקיית הפרויקט
cd "C:\Users\maore\git\סידור וארגון הבית - אלי מאור"

# בדוק אם git מאותחל
git status
```

### צעד 2: הוסף את כל הקבצים

```bash
git add .
```

### צעד 3: צור commit ראשון

```bash
git commit -m "feat: Initial commit - Home Organization App

Features:
- FastAPI backend with authentication, rooms, tasks, categories
- React frontend with Tailwind CSS and dark mode
- WebSocket support for real-time updates
- Push notifications (Web Push)
- JWT refresh tokens with revocation
- Rate limiting and brute-force protection
- Audit logging
- Google OAuth2 with PKCE
- PWA support
- i18n support (Hebrew)
- Accessibility (WCAG AA compliant)

Tech Stack:
- Backend: Python 3.12, FastAPI, SQLAlchemy, PostgreSQL, Redis
- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- Deployment: Docker, Kubernetes, Helm, NGINX
"
```

או הרץ את הסקריפט המוכן:

```powershell
.\COMMIT-ALL.ps1
```

### צעד 4: צור repository חדש ב-GitHub

1. **פתח דפדפן** ועבור ל: https://github.com/new

2. **הגדרות Repository**:
   - **Repository name**: `home-organization-eli-maor`
   - **Description**: `אפליקציה לניהול ארגון הבית - FastAPI + React + WebSocket + PWA`
   - **Public/Private**: בחר לפי העדפתך
   - **DON'T** check "Initialize with README" (יש לנו README קיים)
   - **DON'T** add .gitignore (יש לנו .gitignore קיים)
   - **License**: אופציונלי (MIT מומלץ)

3. **לחץ** "Create repository"

### צעד 5: חבר את ה-Repository המקומי ל-GitHub

אחרי שיצרת את ה-repository ב-GitHub, GitHub יציג לך הוראות.
השתמש בפקודות הבאות (החלף `YOUR_USERNAME` בשם המשתמש שלך):

```bash
# הוסף remote
git remote add origin https://github.com/YOUR_USERNAME/home-organization-eli-maor.git

# בדוק שה-remote נוסף
git remote -v

# דחף את הקוד ל-GitHub
git push -u origin main
```

### צעד 6: אימות

1. רענן את דף ה-repository ב-GitHub
2. אמת שכל הקבצים עלו
3. בדוק שה-README מוצג נכון

## פקודות מהירות

### הוספת שינויים חדשים

```bash
# בדוק מה השתנה
git status

# הוסף קבצים ספציפיים
git add path/to/file

# או הוסף הכל
git add .

# צור commit
git commit -m "הודעת commit"

# דחף ל-GitHub
git push
```

### עבודה עם Branches

```bash
# צור branch חדש
git checkout -b feature/new-feature

# החלף בין branches
git checkout main
git checkout feature/new-feature

# מזג branch
git checkout main
git merge feature/new-feature

# מחק branch
git branch -d feature/new-feature
```

### ביטול שינויים

```bash
# ביטול שינויים בקובץ (לפני add)
git checkout -- path/to/file

# הסרה מ-staging (אחרי add)
git reset HEAD path/to/file

# ביטול commit אחרון (שמירת שינויים)
git reset --soft HEAD~1

# ביטול commit אחרון (מחיקת שינויים) - זהירות!
git reset --hard HEAD~1
```

## בעיות נפוצות

### Problem: Git מאותחל בתיקייה הלא נכונה

**Solution**:
```bash
# מצא איפה ה-.git נמצא
git rev-parse --show-toplevel

# אם זה לא התיקייה הנכונה, מחק את ה-.git (זהירות!)
# rm -rf .git  # Linux/Mac
# Remove-Item -Recurse -Force .git  # PowerShell

# אתחל מחדש בתיקייה הנכונה
cd "path/to/project"
git init
```

### Problem: "Permission denied" errors

**Solution**:
אזהרות על "Permission denied" לתיקיות כמו "Application Data" הן תקינות - זה קורה כש-git repository מאותחל בתיקיית הבית במקום בפרויקט.

וודא שאתה בתיקיית הפרויקט הנכונה לפני הפקודות.

### Problem: Hebrew characters in path

**Solution**:
```powershell
# Use full path with quotes
Set-Location "C:\Users\maore\git\סידור וארגון הבית - אלי מאור"

# Or use Push-Location/Pop-Location
Push-Location "C:\Users\maore\git\סידור וארגון הבית - אלי מאור"
# ... commands ...
Pop-Location
```

## המלצות נוספות

### 1. הוסף GitHub Actions CI/CD

הקובץ `.github/workflows/ci.yml` כבר קיים. תוכל לראות אותו עובד אוטומטית אחרי ה-push הראשון.

### 2. הגן על main branch

בהגדרות GitHub:
1. Settings → Branches
2. Add rule for `main`
3. ✅ Require pull request reviews
4. ✅ Require status checks to pass

### 3. הוסף Secrets

בהגדרות GitHub → Secrets:
- `DOCKER_HUB_USERNAME`
- `DOCKER_HUB_TOKEN`
- `DATABASE_URL`
- `REDIS_URL`
- `SECRET_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

### 4. Enable GitHub Pages (אופציונלי)

אם תרצה Storybook docs:
1. Settings → Pages
2. Source: GitHub Actions
3. הרץ `npm run build-storybook`
4. העלה את `storybook-static/` ל-GitHub Pages

## משאבים

- [GitHub Docs](https://docs.github.com/)
- [Git Documentation](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org/)
