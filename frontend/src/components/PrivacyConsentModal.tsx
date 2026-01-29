/**
 * Privacy Consent Modal Component
 * GDPR-compliant consent dialog for AI/ML features
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PrivacyConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  serviceName?: string; // e.g., "OpenAI", "Google"
}

export const PrivacyConsentModal: React.FC<PrivacyConsentModalProps> = ({
  isOpen,
  onAccept,
  onDecline,
  serviceName = 'OpenAI',
}) => {
  const { t } = useTranslation();
  const [readMore, setReadMore] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
              {t('privacy.consent_title', 'אזהרת פרטיות') || 'אזהרת פרטיות'}
            </h2>
            <button
              onClick={onDecline}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white transition-colors"
              aria-label="סגור"
            >
              <span className="emoji text-2xl">✕</span>
            </button>
          </div>

          {/* Warning Icon */}
          <div className="flex items-center gap-3 mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <span className="emoji text-3xl">⚠️</span>
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                {t('privacy.consent_warning', 'שימוש בשירותי AI חיצוניים') || 'שימוש בשירותי AI חיצוניים'}
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {t('privacy.consent_warning_desc', 'פיצ\'ר זה שולח נתונים לשירות חיצוני. רק מידע מינימלי (ללא פרטים מזהים) נשלח.') || 'פיצ\'ר זה שולח נתונים לשירות חיצוני. רק מידע מינימלי (ללא פרטים מזהים) נשלח.'}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-dark-text mb-2">
                {t('privacy.what_data_sent', 'איזה נתונים נשלחים?') || 'איזה נתונים נשלחים?'}
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-dark-text text-sm">
                <li>{t('privacy.data_sent_1', 'כותרות משימות ותיאורים קצרים') || 'כותרות משימות ותיאורים קצרים'}</li>
                <li>{t('privacy.data_sent_2', 'שמות חדרים וקטגוריות') || 'שמות חדרים וקטגוריות'}</li>
                <li>{t('privacy.data_sent_3', 'סטטוס השלמה (בלי פרטים מזהים)') || 'סטטוס השלמה (בלי פרטים מזהים)'}</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-dark-text mb-2">
                {t('privacy.what_not_sent', 'מה לא נשלח?') || 'מה לא נשלח?'}
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-dark-text text-sm">
                <li>{t('privacy.not_sent_1', 'כתובת אימייל או פרטי משתמש') || 'כתובת אימייל או פרטי משתמש'}</li>
                <li>{t('privacy.not_sent_2', 'מספרי זיהוי משתמש') || 'מספרי זיהוי משתמש'}</li>
                <li>{t('privacy.not_sent_3', 'מידע אישי או רגיש') || 'מידע אישי או רגיש'}</li>
              </ul>
            </div>

            {readMore && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-dark-bg rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-dark-text mb-2">
                  {t('privacy.external_service', 'שירות חיצוני') || 'שירות חיצוני'}
                </h3>
                <p className="text-sm text-gray-700 dark:text-dark-text">
                  {t('privacy.external_service_desc', `הנתונים נשלחים ל-${serviceName} לצורך עיבוד AI. הנתונים לא נשמרים לצמיתות ולא משמשים לאימון מודלים.`, { service: serviceName }) || `הנתונים נשלחים ל-${serviceName} לצורך עיבוד AI. הנתונים לא נשמרים לצמיתות ולא משמשים לאימון מודלים.`}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  {t('privacy.gdpr_compliant', 'זה תואם GDPR - רק מידע מינימלי ונדרש נשלח.') || 'זה תואם GDPR - רק מידע מינימלי ונדרש נשלח.'}
                </p>
              </div>
            )}

            <button
              onClick={() => setReadMore(!readMore)}
              className="text-sm text-sky hover:text-sky/80 underline"
            >
              {readMore
                ? (t('privacy.read_less', 'קרא פחות') || 'קרא פחות')
                : (t('privacy.read_more', 'קרא עוד') || 'קרא עוד')}
            </button>
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-dark-border">
            <button
              onClick={onDecline}
              className="px-4 py-2 bg-gray-200 dark:bg-dark-hover text-gray-700 dark:text-dark-text rounded-lg hover:bg-gray-300 dark:hover:bg-dark-border transition-colors"
            >
              {t('privacy.decline', 'דחה') || 'דחה'}
            </button>
            <button
              onClick={onAccept}
              className="px-4 py-2 bg-sky text-white rounded-lg hover:bg-sky/90 transition-colors"
            >
              {t('privacy.accept', 'אני מסכים') || 'אני מסכים'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
