# 🧹 מדריך למחיקת תרגילים מ-GitHub

## מטרה
למחוק את כל התרגילים מ-[my-jb-exercise](https://github.com/EytanA1983/my-jb-exercise) ולהשאיר רק **פרויקטים ומבחנים**.

---

## תיקיות למחיקה (תרגילים)

לפי מה שאני רואה ב-repository, צריך למחוק:

### ✅ תרגילים למחיקה:
1. **DHTML** - תרגיל
2. **DHTML4** - תרגיל
3. **Dhtml2** - תרגיל
4. **Dhtml3** - תרגיל
5. **Geolocations** - תרגיל
6. **JSON - Books exercise** - תרגיל
7. **בגדים** - תרגיל
8. **מכוניות** - תרגיל
9. **תרגיל dom** - תרגיל

### 🎯 להשאיר (פרויקטים/מבחנים):
- כרגע אין פרויקטים מזוהים ב-repository
- נעלה את **"סידור וארגון הבית - אלי מאור"** כפרויקט עיקרי

---

## שיטה 1: מחיקה דרך GitHub Web Interface (קל ביותר)

### צעדים:

1. **היכנס ל-Repository**
   - לך ל: https://github.com/EytanA1983/my-jb-exercise

2. **מחק כל תרגיל:**

   לכל תיקיית תרגיל:

   a. לחץ על שם התיקייה (למשל `DHTML`)

   b. לחץ על כפתור "..." (More options) בפינה ימנית עליונה

   c. בחר **"Delete directory"**

   d. הקלד את שם התיקייה לאישור

   e. הוסף commit message: `chore: remove exercise folder`

   f. לחץ **"Commit changes"**

3. **חזור על זה לכל 9 התרגילים**

4. **עדכן README**
   - לחץ על `README.md`
   - לחץ על כפתור העריכה (עיפרון)
   - עדכן את התיאור לפרויקט החדש
   - Commit השינויים

---

## שיטה 2: מחיקה דרך Git (מתקדם)

אם אתה רוצה למחוק את כל התרגילים בבת אחת:

### A. Clone את הRepository

```powershell
cd C:\Users\maore\git
git clone https://github.com/EytanA1983/my-jb-exercise.git
cd my-jb-exercise
```

### B. מחק את התיקיות

```powershell
# Remove exercise directories
Remove-Item -Recurse -Force "DHTML"
Remove-Item -Recurse -Force "DHTML4"
Remove-Item -Recurse -Force "Dhtml2"
Remove-Item -Recurse -Force "Dhtml3"
Remove-Item -Recurse -Force "Geolocations"
Remove-Item -Recurse -Force "JSON - Books exercise"
Remove-Item -Recurse -Force "בגדים"
Remove-Item -Recurse -Force "מכוניות"
Remove-Item -Recurse -Force "תרגיל dom"
```

### C. Commit והעלה

```powershell
git add .
git commit -m "chore: remove all exercise folders, keep only projects"
git push origin main
```

---

## שיטה 3: מחיקה מלאה והתחלה חדשה (הכי נקי)

אם אתה רוצה למחוק **הכל** ולהעלות רק את הפרויקט החדש:

### A. מחק את כל התוכן ב-GitHub

1. לך ל: https://github.com/EytanA1983/my-jb-exercise/settings
2. גלול למטה ל-**"Danger Zone"**
3. לחץ **"Delete this repository"**
4. הקלד את שם הrepository לאישור
5. לחץ **"I understand the consequences, delete this repository"**

### B. צור Repository חדש

1. לך ל: https://github.com/new
2. שם: `my-jb-exercise` (או שם חדש)
3. תיאור: "Home Organization App - פרויקט סידור וארגון הבית"
4. Public/Private (לפי העדפתך)
5. **לא** לסמן "Initialize with README"
6. לחץ **"Create repository"**

### C. העלה את הפרויקט החדש

```powershell
cd "C:\Users\maore\git\סידור וארגון הבית - אלי מאור"

# Initialize git
git init

# Add remote
git remote add origin https://github.com/EytanA1983/my-jb-exercise.git

# Add files
git add .

# Commit
git commit -m "feat: home organization app - initial commit

Complete full-stack application for home organization:
- Backend: FastAPI + PostgreSQL
- Frontend: React + TypeScript + Vite
- Features: Rooms, Tasks, Calendar, Voice
- DevOps: Docker, K8s, Monitoring"

# Push
git branch -M main
git push -u origin main
```

---

## ⚡ Quick Action - מה אני ממליץ?

**השיטה המהירה ביותר:**

1. **מחק הכל דרך GitHub Web**:
   - לך ל: https://github.com/EytanA1983/my-jb-exercise
   - לחץ על כל תיקיית תרגיל → "..." → "Delete directory"
   - חזור על זה 9 פעמים (לכל תרגיל)

2. **העלה את הפרויקט החדש**:
   ```powershell
   cd "C:\Users\maore\git\סידור וארגון הבית - אלי מאור"
   .\UPLOAD-TO-GITHUB.ps1
   ```

---

## 📝 רשימת תרגילים למחיקה

- [ ] DHTML
- [ ] DHTML4
- [ ] Dhtml2
- [ ] Dhtml3
- [ ] Geolocations
- [ ] JSON - Books exercise
- [ ] בגדים
- [ ] מכוניות
- [ ] תרגיל dom

---

## 🎯 לאחר המחיקה

1. ✅ עדכן את README.md עם תיאור הפרויקט החדש
2. ✅ הוסף screenshot של האפליקציה
3. ✅ הוסף הוראות הרצה (מ-`HOW-TO-START-MANUALLY.md`)
4. ✅ הוסף badges (build status, license, etc.)

---

## 💡 עצה

אם אתה רוצה לשמור את התרגילים:
1. צור repository נפרד בשם `jb-exercises`
2. העבר את התרגילים לשם
3. השאר את `my-jb-exercise` לפרויקטים בלבד

---

**עדכון אחרון**: 2026-01-29
