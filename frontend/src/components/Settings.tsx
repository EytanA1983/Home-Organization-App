import { useEffect, useState } from 'react';
import { registerPush, unregisterPush } from '../utils/push';
import { GoogleLoginButton } from './GoogleLoginButton';
import { ThemeToggleWithLabel } from './ThemeToggle';
import { useVoice } from '../hooks/useVoice';

export const Settings = () => {
  const [pushEnabled, setPushEnabled] = useState(false);
  const { speak } = useVoice();

  const enablePush = async () => {
    try {
      await registerPush();
      setPushEnabled(true);
      speak('קיבלת התראות פוש');
    } catch (e) {
      console.error(e);
      speak('ההגדרה נכשלת');
    }
  };

  const disablePush = async () => {
    // כאן אפשר לקבל את המנוי מה‑indexedDB או לשמור את ה‑endpoint במשתנה גלובלי.
    // נניח שמאוחסן ב‑localStorage
    const endpoint = localStorage.getItem('push_endpoint');
    if (endpoint) {
      try {
        await unregisterPush(endpoint);
        setPushEnabled(false);
        speak('הפוש נוטרל');
      } catch (e) {
        console.error(e);
        speak('ביטול התראות נכשל');
      }
    }
  };

  // בדיקה ראשונית אם כבר קיים subscription
  useEffect(() => {
    // ניתוח של subscription קיים ב‑navigator.serviceWorker
    const check = async () => {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        setPushEnabled(true);
        localStorage.setItem('push_endpoint', sub.endpoint);
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    check();
  }, []);

  return (
    <div className="p-6 space-y-4 bg-cream dark:bg-dark-bg min-h-screen">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">הגדרות</h2>

      {/* Theme Toggle */}
      <section>
        <ThemeToggleWithLabel />
      </section>

      <section>
        <h3 className="font-medium">התראות פוש</h3>
        {pushEnabled ? (
          <button onClick={disablePush} className="btn btn-red">
            בטל התראות
          </button>
        ) : (
          <button onClick={enablePush} className="btn btn-sky">
            הפעל התראות
          </button>
        )}
      </section>

      <section>
        <h3 className="font-medium">סינכרון ל‑Google Calendar</h3>
        <GoogleLoginButton />
      </section>

      <section>
        <h3 className="font-medium">תצוגה</h3>
        <p>הצבעים המוגדרים כבר נטענים מה‑Tailwind – ניתן לשנות בקובץ tailwind.config.ts</p>
      </section>
    </div>
  );
};

export default Settings;
