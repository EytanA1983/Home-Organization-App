# 🏠 Home Organization App - אלי מאור

> **סידור וארגון הבית** - אפליקציה מתקדמת לניהול משימות בית עם הכרת קול, תזמון חכם ותמיכה מלאה בעברית

[![GitHub](https://img.shields.io/badge/GitHub-EytanA1983-blue?logo=github)](https://github.com/EytanA1983/my-jb-exercise)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.13-blue?logo=python)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com)

---

## 📋 תוכן עניינים

- [תיאור הפרויקט](#תיאור-הפרויקט)
- [תכונות עיקריות](#תכונות-עיקריות)
- [טכנולוגיות](#טכנולוגיות)
- [הרצה מהירה](#הרצה-מהירה)
- [תיעוד](#תיעוד)
- [Screenshots](#screenshots)
- [מבנה הפרויקט](#מבנה-הפרויקט)

---

## 🎯 תיאור הפרויקט

אפליקציית ווב מתקדמת לניהול משימות בית עם התמקדות בחוויית משתמש מעולה, נגישות ותמיכה מלאה בעברית.

### מיועד עבור:
- ✅ משפחות המחפשות לארגן את הבית ביעילות
- ✅ אנשים עם צרכים מיוחדים (הכרת קול, נגישות)
- ✅ משתמשים המעוניינים במעקב חכם אחר משימות

---

## ⚡ תכונות עיקריות

### 🎤 הכרת קול
- תמיכה מלאה ב-Web Speech API
- הוספת משימות בקול
- תמיכה בעברית ובאנגלית

### 🏠 ניהול חדרים
- חדרים מוגדרים מראש (מטבח, סלון, חדר שינה, אמבטיה)
- התאמה אישית של חדרים
- תמונות רקע ייחודיות לכל חדר

### ✅ משימות חכמות
- יצירה, עריכה ומחיקה של משימות
- הקצאת משימות לחדרים
- מעקב אחר סטטוס (פתוח/בתהליך/הושלם)
- קטגוריות מותאמות אישית

### 📅 לוח שנה משולב
- תצוגת משימות לפי תאריכים
- סנכרון עם Google Calendar
- תזכורות אוטומטיות

### 🔔 התראות
- Push notifications (Web Push API)
- הצפנת VAPID
- התראות בזמן אמת על משימות

### 🌙 מצב כהה
- עיצוב מותאם לשני מצבים
- שמירת העדפות משתמש
- CSS Variables לעיצוב דינמי

### 🔒 אבטחה
- אימות JWT
- Audit logging למעקב אחר פעולות
- הצפנת מפתחות רגישים (Vault/AWS Secrets)
- CORS מוגדר כראוי
- Rate limiting

### 📊 ניטור וביצועים
- Prometheus metrics
- Grafana dashboards
- Structured logging
- Health checks

---

## 🛠️ טכנולוגיות

### Backend
- **Framework**: FastAPI 0.115+
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT with refresh tokens
- **Caching**: Redis
- **Task Queue**: Celery with Redis broker
- **Migrations**: Alembic
- **Testing**: Pytest
- **Linting**: Ruff, mypy

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query (@tanstack/react-query)
- **Routing**: React Router v6
- **Forms**: React Hook Form
- **HTTP Client**: Axios
- **Testing**: Vitest, Cypress
- **Linting**: ESLint, Prettier

### DevOps
- **Containerization**: Docker, Docker Compose
- **Orchestration**: Kubernetes (Helm charts)
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus, Grafana
- **Logging**: Structured JSON logging
- **Secrets**: HashiCorp Vault / AWS Secrets Manager

---

## 🚀 הרצה מהירה

### דרישות מקדימות
- Python 3.13+
- Node.js 20+
- PostgreSQL 15+
- Redis (optional, for caching)

### התקנה

#### 1. Clone הRepository
```bash
git clone https://github.com/EytanA1983/my-jb-exercise.git
cd my-jb-exercise
```

#### 2. הגדרת Backend
```powershell
cd backend
pip install -r requirements.txt
# or
poetry install

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Run migrations
alembic upgrade head

# Start server
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

#### 3. הגדרת Frontend
```powershell
cd frontend
npm install

# Start dev server
npm run dev
```

#### 4. פתח בדפדפן
- **Application**: http://localhost:5178
- **API Docs**: http://localhost:8000/docs

### 🐳 הרצה עם Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 📚 תיעוד

### מדריכים מפורטים
- [How to Start Manually](HOW-TO-START-MANUALLY.md) - הרצה ידנית
- [Testing & Optimization Guide](docs/testing-optimization-guide.md) - בדיקות ואופטימיזציה
- [Architecture](ARCHITECTURE.md) - ארכיטקטורת המערכת
- [Authentication Setup](AUTHENTICATION-SETUP.md) - הגדרת אימות
- [Deployment](DEPLOYMENT.md) - פריסה לproduction

### API Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

---

## 📸 Screenshots

### דף הבית - רשימת חדרים
![Home Page](docs/screenshots/home.png)

### ניהול משימות בחדר
![Room Tasks](docs/screenshots/room.png)

### מצב כהה
![Dark Mode](docs/screenshots/dark-mode.png)

*(הוסף screenshots במידת האפשר)*

---

## 📁 מבנה הפרויקט

```
.
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Core functionality
│   │   ├── db/           # Database models
│   │   ├── services/     # Business logic
│   │   └── main.py       # FastAPI app
│   ├── alembic/          # Database migrations
│   ├── tests/            # Backend tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── contexts/     # React contexts
│   │   ├── utils/        # Utilities
│   │   └── main.tsx
│   ├── public/           # Static assets
│   └── package.json
├── docs/                 # Documentation
├── k8s/                  # Kubernetes configs
├── helm/                 # Helm charts
├── docker-compose.yml
└── README.md
```

---

## 🧪 Testing

### Backend Tests
```powershell
cd backend
pytest
pytest --cov  # With coverage
```

### Frontend Tests
```powershell
cd frontend
npm run test          # Unit tests
npm run test:e2e      # E2E tests with Cypress
```

### Full System Test
```powershell
.\TEST-ALL.ps1
```

---

## 🔧 Development Tools

### Code Quality
```powershell
# Backend
cd backend
ruff check .          # Linting
ruff format .         # Formatting
mypy .                # Type checking

# Frontend
cd frontend
npm run lint          # ESLint
npm run format        # Prettier
npm run typecheck     # TypeScript check
```

### Build Optimization
```powershell
cd frontend
npm run build:analyze  # Bundle size analysis
```

---

## 🤝 Contributing

אנשים רבים יכולים להשתמש ולתרום לפרויקט זה. אם אתם מעוניינים:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## 📄 License

MIT License - ראו את [LICENSE](LICENSE) לפרטים נוספים.

---

## 👤 Author

**Eli Maor (EytanA1983)**
- GitHub: [@EytanA1983](https://github.com/EytanA1983)
- Repository: [my-jb-exercise](https://github.com/EytanA1983/my-jb-exercise)

---

## 🙏 Acknowledgments

- פרויקט זה פותח כחלק מלימודי Full Stack Development
- תודה למורים ולקהילת המפתחים על התמיכה

---

## 📞 Support

אם נתקלתם בבעיות או יש לכם שאלות:
1. פתחו [Issue](https://github.com/EytanA1983/my-jb-exercise/issues)
2. בדקו את התיעוד ב-`docs/`
3. הריצו `.\TEST-ALL.ps1` לאבחון

---

**עודכן לאחרונה**: 2026-01-29

**Status**: ✅ Production Ready
