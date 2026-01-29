# 🚀 איך להריץ את האפליקציה - מדריך פשוט

## ⚠️ חשוב!

בגלל תווים עבריים בשם התיקייה, חלק מהסקריפטים עלולים לא לעבוד.  
**הפתרון הכי פשוט**: הרצה ידנית של שני השרתים.

---

## שלב 1: הפעל את Backend

1. פתח **PowerShell** (או **Windows Terminal**)
2. הרץ:

```powershell
cd "C:\Users\maore\git\סידור וארגון הבית - אלי מאור\backend"
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**אם יש שגיאה** `No module named 'app'`:
```powershell
# Install dependencies first
pip install -r requirements.txt
# or
poetry install
```

**תוצאה צפויה:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process using WatchFiles
INFO:     Application startup complete.
```

✅ **Backend מוכן!**

---

## שלב 2: הפעל את Frontend

1. פתח **PowerShell חדש** (חלון נוסף!)
2. הרץ:

```powershell
cd "C:\Users\maore\git\סידור וארגון הבית - אלי מאור\frontend"
npm run dev
```

**אם יש שגיאה** `Missing script: "dev"`:
```powershell
# Install dependencies first
npm install
npm run dev
```

**תוצאה צפויה:**
```
VITE v5.x.x ready in XXX ms

➜  Local:   http://localhost:5178/
➜  Network: use --host to expose
```

✅ **Frontend מוכן!**

---

## שלב 3: פתח בדפדפן

לחץ על הקישורים האלה (או העתק לדפדפן):

### 🌐 האפליקציה
**http://localhost:5178**

### 📚 תיעוד API
**http://localhost:8000/docs**

---

## 🔍 בדיקת סטטוס

### האם Backend רץ?

```powershell
# בדוק אם משהו מאזין על פורט 8000
netstat -ano | findstr :8000
```

אם רואים תוצאה - הbackend רץ ✅

### האם Frontend רץ?

```powershell
# בדוק אם משהו מאזין על פורט 5178
netstat -ano | findstr :5178
```

אם רואים תוצאה - הfrontend רץ ✅

---

## 🛑 איך לעצור את השרתים?

בכל חלון PowerShell, לחץ:
```
Ctrl + C
```

---

## ⚡ Quick Copy-Paste

### Backend:
```powershell
cd "C:\Users\maore\git\סידור וארגון הבית - אלי מאור\backend" ; python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend:
```powershell
cd "C:\Users\maore\git\סידור וארגון הבית - אלי מאור\frontend" ; npm run dev
```

---

## 📝 סטטוס נוכחי

**✅ Backend רץ** - זוהה על פורט 8000 (PID: 17064, 10856)  
**❌ Frontend לא רץ** - צריך להפעיל ידנית

---

## 🔧 Troubleshooting

### Backend לא עולה

**שגיאה**: `No module named 'app'`

```powershell
cd "C:\Users\maore\git\סידור וארגון הבית - אלי מאור\backend"
pip install -r requirements.txt
# or
poetry install
```

### Frontend לא עולה

**שגיאה**: `Missing script: "dev"`

```powershell
cd "C:\Users\maore\git\סידור וארגון הבית - אלי מאור\frontend"
npm install
npm run dev
```

### פורט תפוס

**שגיאה**: `Address already in use`

```powershell
# מצא את התהליך
netstat -ano | findstr :8000

# הרוג אותו (החלף PID במספר האמיתי)
taskkill /F /PID <PID>
```

---

## 🎯 מה עכשיו?

1. ✅ פתח 2 terminals
2. ✅ הרץ את Backend (terminal 1)
3. ✅ הרץ את Frontend (terminal 2)
4. ✅ פתח http://localhost:5178
5. 🎉 **תהנה!**

---

**עדכון אחרון**: 2026-01-29
