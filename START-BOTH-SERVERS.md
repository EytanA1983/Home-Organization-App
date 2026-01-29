# 🚀 How to Start the Application

## Method 1: Manual Start (Recommended)

### Step 1: Start Backend

Open a PowerShell terminal and run:

```powershell
cd "C:\Users\maore\git\סידור וארגון הבית - אלי מאור"
.\RUN-BACKEND-ONLY.ps1
```

**Expected output:**
```
Starting Backend...
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```

✅ **Backend is ready at:** http://127.0.0.1:8000

### Step 2: Start Frontend

Open **another** PowerShell terminal and run:

```powershell
cd "C:\Users\maore\git\סידור וארגון הבית - אלי מאור"
.\RUN-FRONTEND-ONLY.ps1
```

**Expected output:**
```
Starting Frontend...
VITE v5.x.x ready in XXX ms

➜  Local:   http://localhost:5178/
➜  Network: use --host to expose
➜  press h + enter to show help
```

✅ **Frontend is ready at:** http://localhost:5178

### Step 3: Open in Browser

Click on these links or manually open them:

1. **Application**: http://localhost:5178
2. **API Documentation**: http://localhost:8000/docs

---

## Method 2: Using BAT File

Double-click on:
```
START-SERVERS-SIMPLE.bat
```

This will:
1. Open a terminal for Backend
2. Open a terminal for Frontend  
3. Open both URLs in your browser

---

## Method 3: From Cursor/VSCode

### Terminal 1 (Backend):
```powershell
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Terminal 2 (Frontend):
```powershell
cd frontend
npm run dev
```

---

## 🔗 URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5178 | React application |
| **Backend** | http://127.0.0.1:8000 | FastAPI server |
| **API Docs** | http://127.0.0.1:8000/docs | Swagger UI |
| **ReDoc** | http://127.0.0.1:8000/redoc | Alternative API docs |

---

## 🛑 How to Stop Servers

### If using separate PowerShell windows:
- Press `Ctrl+C` in each terminal

### If using BAT file:
- Close the terminal windows

---

## ❓ Troubleshooting

### Backend fails to start

**Error**: `No module named 'app'`

**Solution**:
```powershell
cd backend
pip install -r requirements.txt
# or
poetry install
```

---

### Frontend fails to start

**Error**: `npm error Missing script: "dev"`

**Solution**:
```powershell
cd frontend
npm install
npm run dev
```

---

### Port already in use

**Error**: `Address already in use`

**Solution**:
```powershell
# Find process using the port
netstat -ano | findstr :8000
netstat -ano | findstr :5178

# Kill the process (replace PID with actual number)
taskkill /F /PID <PID>
```

---

### Database connection error

**Error**: `could not connect to database`

**Solution**:
1. Check if PostgreSQL is running
2. Verify `.env` file in `backend/` has correct DB credentials
3. Run migrations:
   ```powershell
   cd backend
   alembic upgrade head
   ```

---

## 📝 Notes

- **Backend** must start first (Frontend depends on it)
- Keep both terminals open while using the app
- Check terminal output for any errors
- Logs are in `backend/logs/`

---

## ✅ Ready?

Run these commands in order:

```powershell
# Terminal 1
cd "C:\Users\maore\git\סידור וארגון הבית - אלי מאור"
.\RUN-BACKEND-ONLY.ps1

# Terminal 2 (new window)
cd "C:\Users\maore\git\סידור וארגון הבית - אלי מאור"
.\RUN-FRONTEND-ONLY.ps1

# Then open in browser
start http://localhost:5178
```

**Enjoy! 🎉**
