/**
 * Analytics utilities for tracking user activity
 * Supports Google Analytics and Plausible (privacy-friendly)
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    plausible?: (eventName: string, options?: { props?: Record<string, any> }) => void;
  }
}

/**
 * Initialize Google Analytics
 * @param measurementId - Google Analytics Measurement ID (e.g., G-XXXXXXXXXX)
 */
export const initGA = (measurementId: string) => {
  if (typeof window === 'undefined' || window.gtag) {
    return;
  }

  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer!.push(args);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', measurementId, {
    anonymize_ip: true, // שמירה על פרטיות
    respect_dnt: true,   // כיבוד Do Not Track
  });
};

/**
 * Track an event in Google Analytics
 * @param action - Event action (e.g., 'click', 'submit')
 * @param category - Event category (e.g., 'button', 'form')
 * @param label - Optional event label
 */
export const trackGAEvent = (action: string, category: string, label?: string) => {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
    });
  }
};

/**
 * Track a page view in Plausible
 * @param url - URL of the page
 */
export const trackPlausiblePageView = (url: string) => {
  if (window.plausible) {
    window.plausible('pageview', { props: { url } });
  }
};

/**
 * Track an event in Plausible
 * @param eventName - Name of the event
 * @param props - Optional event properties
 */
export const trackPlausibleEvent = (eventName: string, props?: Record<string, any>) => {
  if (window.plausible) {
    window.plausible(eventName, { props });
  }
};

/**
 * Universal event tracking (works with both GA and Plausible)
 * @param eventName - Name of the event
 * @param category - Event category
 * @param props - Optional event properties
 */
export const trackEvent = (eventName: string, category?: string, props?: Record<string, any>) => {
  // Track in Google Analytics if available
  if (window.gtag && category) {
    trackGAEvent(eventName, category, props?.label);
  }

  // Track in Plausible if available
  if (window.plausible) {
    trackPlausibleEvent(eventName, { category, ...props });
  }
};
