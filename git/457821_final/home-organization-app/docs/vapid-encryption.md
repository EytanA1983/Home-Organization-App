# VAPID Private Key Encryption

## סקירה כללית

ה-VAPID Private Key הוא מפתח רגיש המשמש לחתימת Web Push notifications. מערכת ההצפנה מאפשרת לאחסן את המפתח בצורה מוצפנת ב-`.env` או ב-HashiCorp Vault.

## אפשרויות אחסון

### 1. HashiCorp Vault (מומלץ לפרודקשן)

האפשרות הבטוחה ביותר. המפתח מאוחסן ב-Vault ומוצפן שם.

#### הגדרה:

1. **הגדר Vault:**
   ```bash
   export VAULT_ADDR=http://vault:8200
   export VAULT_TOKEN=your-token
   export VAULT_SECRET_PATH=eli-maor/production
   ```

2. **שמור את VAPID_PRIVATE_KEY ב-Vault:**
   ```bash
   vault kv put secret/eli-maor/production VAPID_PRIVATE_KEY="your-private-key"
   ```

3. **הגדר ב-`.env`:**
   ```env
   VAULT_ADDR=http://vault:8200
   VAULT_TOKEN=your-token
   VAULT_SECRET_PATH=eli-maor/production
   # VAPID_PRIVATE_KEY יקרא אוטומטית מ-Vault
   ```

#### יתרונות:
- ✅ אבטחה מקסימלית
- ✅ רוטציה קלה של מפתחות
- ✅ גישה מבוקרת
- ✅ Audit logging

### 2. Encrypted .env (פיתוח/סטייג'ינג)

המפתח מוצפן ב-`.env` באמצעות Fernet encryption.

#### שלב 1: צור מפתח הצפנה

```bash
python backend/scripts/generate_encryption_key.py
```

**פלט:**
```
VAPID_ENCRYPTION_KEY=your-encryption-key-here
```

**שמור את המפתח:**
- ב-Vault (מומלץ): `vault kv put secret/eli-maor/production VAPID_ENCRYPTION_KEY="your-key"`
- ב-AWS Secrets Manager
- ב-`.env` (רק לפיתוח!)

#### שלב 2: הצפן את VAPID Private Key

```bash
python backend/scripts/encrypt_vapid_key.py
```

**או עם environment variables:**
```bash
export VAPID_PRIVATE_KEY="your-private-key"
export VAPID_ENCRYPTION_KEY="your-encryption-key"
python backend/scripts/encrypt_vapid_key.py
```

**פלט:**
```
VAPID_PRIVATE_KEY_ENCRYPTED=encrypted-value-here
```

#### שלב 3: הוסף ל-`.env`

```env
# Encryption key (שמור ב-Vault או AWS Secrets Manager)
VAPID_ENCRYPTION_KEY=your-encryption-key

# Encrypted VAPID private key
VAPID_PRIVATE_KEY_ENCRYPTED=encrypted-value-here
```

**או:**
```env
# Encrypted value directly in VAPID_PRIVATE_KEY
VAPID_PRIVATE_KEY=encrypted-value-here
VAPID_ENCRYPTION_KEY=your-encryption-key
```

### 3. Plain Text (לא מומלץ)

רק לפיתוח מקומי:

```env
VAPID_PRIVATE_KEY=your-private-key-plain-text
```

⚠️ **אזהרה:** לעולם אל תשמור מפתחות plain text ב-production!

## Priority Order

המערכת מחפשת את VAPID_PRIVATE_KEY בסדר הבא:

1. **VAPID_PRIVATE_KEY** (plain או encrypted)
2. **VAPID_PRIVATE_KEY_ENCRYPTED** (encrypted בלבד)
3. **HashiCorp Vault** (`VAULT_SECRET_PATH/VAPID_PRIVATE_KEY`)
4. **AWS Secrets Manager** (`AWS_SECRET_NAME/VAPID_PRIVATE_KEY`)
5. **Docker secrets** (`/run/secrets/vapid_private_key`)

## Encryption Methods

### Method 1: Direct Fernet Key

```env
VAPID_ENCRYPTION_KEY=your-fernet-key-base64
```

**יצירת מפתח:**
```bash
python backend/scripts/generate_encryption_key.py
```

### Method 2: Password-based (PBKDF2)

```env
VAPID_ENCRYPTION_PASSWORD=your-password
VAPID_ENCRYPTION_SALT=your-salt  # Optional, default provided
```

**יתרונות:**
- קל יותר לזכור
- פחות בטוח מ-Fernet key ישיר

### Method 3: Key File

```env
VAPID_ENCRYPTION_KEY_FILE=/path/to/encryption_key.txt
```

**יתרונות:**
- מפתח לא ב-`.env`
- יכול להיות ב-mounted volume

## דוגמאות שימוש

### דוגמה 1: Vault (Production)

```env
# .env
VAULT_ADDR=http://vault:8200
VAULT_TOKEN=your-token
VAULT_SECRET_PATH=eli-maor/production
# VAPID_PRIVATE_KEY יקרא אוטומטית מ-Vault
```

```bash
# שמור ב-Vault
vault kv put secret/eli-maor/production \
  VAPID_PRIVATE_KEY="your-private-key" \
  VAPID_PUBLIC_KEY="your-public-key"
```

### דוגמה 2: Encrypted .env (Development)

```env
# .env
VAPID_ENCRYPTION_KEY=your-encryption-key
VAPID_PRIVATE_KEY_ENCRYPTED=gAAAAABh...encrypted...value
VAPID_PUBLIC_KEY=your-public-key
```

### דוגמה 3: Password-based Encryption

```env
# .env
VAPID_ENCRYPTION_PASSWORD=my-secure-password
VAPID_PRIVATE_KEY_ENCRYPTED=gAAAAABh...encrypted...value
VAPID_PUBLIC_KEY=your-public-key
```

## בדיקת הגדרה

### בדיקה 1: האם המפתח נטען?

```python
from app.config import settings

# בדוק אם המפתח נטען
if settings.vapid_private_key_decrypted:
    print("✅ VAPID private key loaded successfully")
else:
    print("❌ VAPID private key not found")
```

### בדיקה 2: מאיפה המפתח נטען?

```python
from app.core.secrets import SecretsInfo

status = SecretsInfo.get_status()
print(status["secrets_sources"]["VAPID_PRIVATE_KEY"])
# Output: "vault", "environment", "docker_secret", etc.
```

### בדיקה 3: בדיקת הצפנה/פענוח

```python
from app.core.vapid_encryption import encrypt_vapid_key, decrypt_vapid_key

# הצפן
encrypted = encrypt_vapid_key("your-private-key", encryption_key)

# פענח
decrypted = decrypt_vapid_key(encrypted, encryption_key)
assert decrypted == "your-private-key"
```

## Best Practices

### 1. Production

✅ **מומלץ:**
- HashiCorp Vault
- AWS Secrets Manager
- Encrypted .env עם מפתח ב-Vault

❌ **לא מומלץ:**
- Plain text ב-`.env`
- Encryption key ב-`.env` (שמור ב-Vault)

### 2. Development

✅ **מומלץ:**
- Encrypted .env
- Plain text (רק מקומי, לא ב-git)

❌ **לא מומלץ:**
- Plain text ב-git repository

### 3. Security

- ✅ שמור encryption key ב-Vault או AWS Secrets Manager
- ✅ אל תעשה commit של encryption keys ל-git
- ✅ השתמש ב-`.env.example` ללא ערכים אמיתיים
- ✅ רוטציה תקופתית של מפתחות
- ✅ Audit logging של גישה למפתחות

## Troubleshooting

### שגיאה: "Encryption key not found"

**פתרון:**
```bash
# בדוק אם VAPID_ENCRYPTION_KEY מוגדר
echo $VAPID_ENCRYPTION_KEY

# או בדוק ב-.env
grep VAPID_ENCRYPTION_KEY .env
```

### שגיאה: "Failed to decrypt VAPID key"

**סיבות אפשריות:**
1. Encryption key שגוי
2. Encrypted value פגום
3. Salt שונה (אם משתמש ב-password)

**פתרון:**
```bash
# בדוק את הערכים
echo $VAPID_ENCRYPTION_KEY
echo $VAPID_PRIVATE_KEY_ENCRYPTED

# נסה לפענח ידנית
python -c "from app.core.vapid_encryption import decrypt_vapid_key; print(decrypt_vapid_key('$VAPID_PRIVATE_KEY_ENCRYPTED'))"
```

### VAPID key לא נטען מ-Vault

**פתרון:**
```bash
# בדוק חיבור ל-Vault
vault status

# בדוק שהמפתח קיים
vault kv get secret/eli-maor/production

# בדוק environment variables
echo $VAULT_ADDR
echo $VAULT_TOKEN
echo $VAULT_SECRET_PATH
```

## Migration Guide

### מעבר מ-Plain Text ל-Encrypted

1. **צור encryption key:**
   ```bash
   python backend/scripts/generate_encryption_key.py
   ```

2. **הצפן את המפתח:**
   ```bash
   export VAPID_PRIVATE_KEY="your-current-plain-key"
   export VAPID_ENCRYPTION_KEY="generated-key"
   python backend/scripts/encrypt_vapid_key.py
   ```

3. **עדכן .env:**
   ```env
   # הסר את השורה הישנה:
   # VAPID_PRIVATE_KEY=plain-text-key

   # הוסף את החדשה:
   VAPID_ENCRYPTION_KEY=generated-key
   VAPID_PRIVATE_KEY_ENCRYPTED=encrypted-value
   ```

4. **בדוק:**
   ```bash
   # הפעל את האפליקציה ובדוק שהכל עובד
   python -c "from app.config import settings; print('✅' if settings.vapid_private_key_decrypted else '❌')"
   ```

### מעבר ל-Vault

1. **הגדר Vault:**
   ```bash
   export VAULT_ADDR=http://vault:8200
   export VAULT_TOKEN=your-token
   ```

2. **שמור את המפתח:**
   ```bash
   vault kv put secret/eli-maor/production \
     VAPID_PRIVATE_KEY="your-private-key" \
     VAPID_PUBLIC_KEY="your-public-key"
   ```

3. **עדכן .env:**
   ```env
   VAULT_ADDR=http://vault:8200
   VAULT_TOKEN=your-token
   VAULT_SECRET_PATH=eli-maor/production
   # הסר VAPID_PRIVATE_KEY מ-.env
   ```

4. **בדוק:**
   ```bash
   vault kv get secret/eli-maor/production
   ```

## סיכום

מערכת ההצפנה מספקת:
- ✅ תמיכה ב-HashiCorp Vault (מומלץ לפרודקשן)
- ✅ תמיכה ב-encrypted .env (פיתוח/סטייג'ינג)
- ✅ תמיכה ב-password-based encryption
- ✅ תמיכה ב-key file
- ✅ Automatic decryption
- ✅ Fallback chain (env → Docker → Vault → AWS)

**המלצה:** השתמש ב-HashiCorp Vault לפרודקשן, ו-encrypted .env לפיתוח.
