# 🐳 מדריך Docker Compose - Override Files

## 📋 מבוא

הפרויקט משתמש במספר קבצי Docker Compose למצבים שונים:
- `docker-compose.yml` - קובץ בסיס (base)
- `docker-compose.override.yml` - **נטען אוטומטית** לפיתוח (development)
- `docker-compose.prod.yml` - לפרודקשן (production)
- `docker-compose.https.yml` - עם HTTPS

---

## 🔍 איך Docker Compose Override עובד?

### הכלל הבסיסי:

**Docker Compose טוען אוטומטית את `docker-compose.override.yml` אם הוא קיים באותו תיקייה**, גם בלי לציין אותו במפורש!

### סדר הטעינה:

כשאתה מריץ `docker compose up` **ללא** `-f`:
1. Docker Compose מחפש את `docker-compose.yml`
2. Docker Compose **אוטומטית** מחפש את `docker-compose.override.yml`
3. אם קיים - הוא נטען ומחליף/מרחיב את ההגדרות מ-`docker-compose.yml`

---

## 🚀 מצבים שונים

### 1️⃣ Development (פיתוח) - עם Override

**הפקודה:**
```bash
docker compose up
```

**מה קורה:**
- טוען את `docker-compose.yml`
- **אוטומטית** טוען את `docker-compose.override.yml`
- ההגדרות מ-`override.yml` **מחליפות/מרחיבות** את הבסיס

**הגדרות מ-`docker-compose.override.yml`:**
```yaml
services:
  backend:
    environment:
      - DEBUG=true
      - LOG_LEVEL=debug
    volumes:
      - ./backend:/app  # Hot reload
```

**מתי להשתמש:**
- פיתוח מקומי
- רוצה hot reload
- רוצה DEBUG mode
- רוצה לוגים מפורטים

---

### 2️⃣ Production (פרודקשן) - בלי Override

**הפקודה:**
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up
```

**מה קורה:**
- טוען את `docker-compose.yml`
- **לא** טוען את `docker-compose.override.yml` (כי ציינת `-f` במפורש)
- טוען את `docker-compose.prod.yml` (במפורש)

**הגדרות מ-`docker-compose.prod.yml`:**
```yaml
services:
  backend:
    environment:
      - DEBUG=False  # Production mode
    image: your-registry/eli-maor-backend:latest  # Build image
    deploy:
      replicas: 3
```

**מתי להשתמש:**
- פרודקשן
- staging
- רוצה הגדרות production
- לא רוצה DEBUG mode

---

### 3️⃣ Production - רק Base (בלי Override)

**הפקודה:**
```bash
docker compose -f docker-compose.yml up
```

**מה קורה:**
- טוען רק את `docker-compose.yml`
- **לא** טוען את `docker-compose.override.yml` (כי ציינת `-f` במפורש)

**מתי להשתמש:**
- רוצה הרצה "קרובה ל-production"
- רוצה את ההגדרות הבסיסיות בלבד
- לא רוצה DEBUG mode

---

### 4️⃣ HTTPS

**הפקודה:**
```bash
docker compose -f docker-compose.yml -f docker-compose.https.yml up
```

**מה קורה:**
- טוען את `docker-compose.yml`
- טוען את `docker-compose.https.yml`
- לא טוען את `docker-compose.override.yml` (כי ציינת `-f` במפורש)

---

## ⚠️ נקודות חשובות

### ❌ טעות נפוצה:

```bash
# ❌ זה לא יעבוד כמו שציפית!
docker compose up -f docker-compose.override.yml
```

**למה?** כי `-f` דורש שם קובץ, אבל `docker-compose.override.yml` **נטען אוטומטית** גם בלי `-f`.

### ✅ הדרך הנכונה:

**Development (עם override אוטומטי):**
```bash
docker compose up
# או
docker compose -f docker-compose.yml -f docker-compose.override.yml up
```

**Production (בלי override):**
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up
```

**רק base (בלי override):**
```bash
docker compose -f docker-compose.yml up
```

---

## 📝 סיכום פקודות

| מצב | פקודה | Override נטען? | Production נטען? |
|-----|-------|----------------|------------------|
| **Development** | `docker compose up` | ✅ אוטומטי | ❌ |
| **Production** | `docker compose -f docker-compose.yml -f docker-compose.prod.yml up` | ❌ | ✅ |
| **Base בלבד** | `docker compose -f docker-compose.yml up` | ❌ | ❌ |
| **HTTPS** | `docker compose -f docker-compose.yml -f docker-compose.https.yml up` | ❌ | ❌ |

---

## 🔧 קבצי Override בפרויקט

### `docker-compose.override.yml`

**מטרה:** הגדרות פיתוח (development)

**הגדרות עיקריות:**
- `DEBUG=true`
- `LOG_LEVEL=debug`
- Volumes ל-hot reload
- Mount של קבצים מקומיים

**מתי נטען:** אוטומטית כשמריץ `docker compose up` ללא `-f`

---

### `docker-compose.prod.yml`

**מטרה:** הגדרות פרודקשן (production)

**הגדרות עיקריות:**
- `DEBUG=False`
- Images מ-registry
- Replicas
- Resource limits
- Health checks

**מתי נטען:** רק במפורש עם `-f docker-compose.prod.yml`

---

### `docker-compose.https.yml`

**מטרה:** הגדרות HTTPS

**הגדרות עיקריות:**
- SSL certificates
- HTTPS ports
- Nginx SSL config

**מתי נטען:** רק במפורש עם `-f docker-compose.https.yml`

---

## 🎯 המלצות

### לפיתוח:
1. השאר את `docker-compose.override.yml` בפרויקט
2. הרץ `docker compose up` (ללא `-f`)
3. Override יטען אוטומטית

### לפרודקשן:
1. הרץ `docker compose -f docker-compose.yml -f docker-compose.prod.yml up`
2. Override **לא** יטען (כי ציינת `-f` במפורש)
3. Production settings יטענו

### לבדיקות:
1. הרץ `docker compose -f docker-compose.yml up`
2. Override **לא** יטען
3. רק Base settings יטענו

---

## 📚 קישורים שימושיים

- [Docker Compose Documentation - Override Files](https://docs.docker.com/compose/extends/#multiple-compose-files)
- [Docker Compose - Environment Variables](https://docs.docker.com/compose/environment-variables/)

---

## ✅ Checklist

- [ ] הבנתי ש-`docker-compose.override.yml` נטען אוטומטית
- [ ] יודע מתי להשתמש ב-`-f` למניעת טעינת override
- [ ] יודע להריץ development עם override
- [ ] יודע להריץ production בלי override
- [ ] יודע להריץ base בלבד
