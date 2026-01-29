# הוספת תמונת רקע לחדר האמבטיה

## 📸 הוראות:

### 1. הוסף את התמונה:
- העתק את תמונת האמבטיה המודרנית לתיקייה: `frontend/public/`
- שם הקובץ: `bathroom-background.jpg` (או `.png`)
- גודל מומלץ: 1920x1080px או יותר
- פורמט: JPG או PNG

### 2. הקוד כבר מוכן:
- `RoomPage.tsx` מזהה אוטומטית חדר אמבטיה
- מציג את התמונה כרקע
- מוסיף overlay כהה כדי שהטקסט יהיה קריא
- כרטיסיות המשימות עם רקע לבן שקוף

### 3. זיהוי חדר אמבטיה:
הקוד מזהה חדר אמבטיה לפי:
- "שירותים"
- "bathroom"
- "אמבטיה"

### 4. אם התמונה לא נטענת:
- ודא שהקובץ נמצא ב-`frontend/public/`
- ודא ששם הקובץ: `bathroom-background.jpg`
- נסה לרענן את הדף (Ctrl+F5)

## 🎨 אפשרויות נוספות:

אם תרצה להוסיף תמונות רקע לחדרים נוספים:
1. הוסף את התמונות ל-`frontend/public/`
2. עדכן את `RoomPage.tsx` להוסיף לוגיקה דומה לחדרים אחרים

## 📝 דוגמה:
```
frontend/public/
  ├── bathroom-background.jpg
  ├── kitchen-background.jpg
  ├── bedroom-background.jpg
  └── ...
```
