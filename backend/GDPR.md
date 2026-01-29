# GDPR & Privacy Compliance

## Overview

This document outlines the GDPR (General Data Protection Regulation) compliance measures implemented in the application, particularly for AI/ML features that send data to external APIs (OpenAI, Google).

## Data Minimization

### What Data is Sent to External APIs?

Only **minimal, non-identifying data** is sent to external APIs:

**✅ Safe to Send:**
- Task titles and short descriptions
- Room and category names
- Completion status (without user identifiers)
- Generic metadata (task count, completion rate)

**❌ NEVER Sent:**
- User IDs (`user_id`, `owner_id`)
- Email addresses
- User names or full names
- Passwords or authentication tokens
- Personal information
- Any PII (Personally Identifiable Information)

### Implementation

Data sanitization is implemented in:
- `backend/app/services/data_sanitizer.py` - Service for sanitizing data before sending to external APIs
- `backend/app/api/ml.py` - ML endpoints sanitize request data
- `backend/app/api/ai.py` - AI endpoints use sanitized data structures

## Privacy Warning & Consent

### Frontend Implementation

The `PrivacyConsentModal` component (`frontend/src/components/PrivacyConsentModal.tsx`) displays a GDPR-compliant consent dialog before using AI/ML features.

**Features:**
- Clear explanation of what data is sent
- List of data that is NOT sent
- Option to read more details
- Accept/Decline buttons
- Multi-language support (Hebrew, English, Russian)

### Usage Example

```typescript
import { PrivacyConsentModal } from '../components/PrivacyConsentModal';
import { useState } from 'react';

const MyComponent = () => {
  const [showConsent, setShowConsent] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  const handleUseAI = () => {
    if (!consentGiven) {
      setShowConsent(true);
      return;
    }
    // Use AI feature
  };

  return (
    <>
      <button onClick={handleUseAI}>Use AI Feature</button>
      <PrivacyConsentModal
        isOpen={showConsent}
        onAccept={() => {
          setConsentGiven(true);
          setShowConsent(false);
          // Use AI feature
        }}
        onDecline={() => {
          setShowConsent(false);
        }}
        serviceName="OpenAI"
      />
    </>
  );
};
```

## Backend Data Sanitization

### DataSanitizer Service

The `DataSanitizer` service (`backend/app/services/data_sanitizer.py`) provides methods to sanitize data:

```python
from app.services.data_sanitizer import data_sanitizer

# Sanitize task data
sanitized_tasks = data_sanitizer.sanitize_task_data(tasks)

# Sanitize category data
sanitized_categories = data_sanitizer.sanitize_category_data(categories)

# Sanitize dictionary (removes PII fields)
sanitized_dict = data_sanitizer.sanitize_dict(data, allowed_fields=['room_id', 'task_count'])
```

### ML/AI Endpoints

All ML/AI endpoints sanitize data before sending to external APIs:

```python
# backend/app/api/ml.py
# GDPR: Sanitize data - remove PII
sanitized_data = {}
if request.data:
    safe_fields = ['room_id', 'task_count', 'completion_rate']
    for key in safe_fields:
        if key in request.data:
            sanitized_data[key] = request.data[key]

# Build prompt (without user_id - GDPR compliant)
prompt = f"Suggest a next home-organising task based on the following data: {sanitized_data}"
```

## Best Practices

### 1. Always Sanitize Before Sending

Never send raw user data to external APIs. Always use the `DataSanitizer` service.

### 2. Minimize Data Sent

Only send the absolute minimum data required for the AI/ML feature to work.

### 3. Remove Identifiers

Never include user IDs, emails, or any PII in prompts sent to external APIs.

### 4. Logging

Logs may contain user IDs for internal tracking, but these should NEVER be sent to external APIs.

### 5. User Consent

Always show a privacy warning and get user consent before using AI/ML features.

## External API Privacy Policies

### OpenAI

- **Data Retention**: OpenAI does not use data submitted via the API for training models (as of 2024-01-15)
- **Data Storage**: Data is processed but not stored permanently
- **Privacy Policy**: https://openai.com/policies/privacy-policy

### Google (Calendar API)

- **Data Usage**: Used for calendar synchronization only
- **OAuth Scope**: Limited to calendar read/write permissions
- **Privacy Policy**: https://policies.google.com/privacy

## Compliance Checklist

- [x] Data minimization - only minimal data sent
- [x] PII removal - user IDs, emails removed
- [x] Privacy warnings - consent modal implemented
- [x] Data sanitization - DataSanitizer service
- [x] Documentation - this file
- [x] Multi-language support - privacy warnings in Hebrew, English, Russian
- [ ] User consent storage (optional - can be stored in database)
- [ ] Consent withdrawal mechanism (optional)

## Future Improvements

1. **User Consent Storage**: Store user consent in the database for audit purposes
2. **Consent Withdrawal**: Allow users to withdraw consent and delete related data
3. **Data Retention Policy**: Define how long AI-processed data is stored
4. **Audit Logging**: Log all data sent to external APIs for compliance auditing

## Questions?

For questions about GDPR compliance or data privacy, please contact the development team.
