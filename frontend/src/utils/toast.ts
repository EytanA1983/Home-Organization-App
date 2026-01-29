/**
 * Toast utility functions
 * Centralized toast notifications with i18n support
 */
import toast from 'react-hot-toast';
import { TFunction } from 'i18next';

/**
 * Show success toast
 */
export const showSuccess = (message: string, t?: TFunction) => {
  toast.success(t ? t(message) : message, {
    icon: '✅',
  });
};

/**
 * Show error toast
 */
export const showError = (message: string, t?: TFunction) => {
  toast.error(t ? t(message) : message, {
    icon: '❌',
  });
};

/**
 * Show info toast
 */
export const showInfo = (message: string, t?: TFunction) => {
  toast(t ? t(message) : message, {
    icon: 'ℹ️',
  });
};

/**
 * Show loading toast
 */
export const showLoading = (message: string, t?: TFunction) => {
  return toast.loading(t ? t(message) : message);
};

/**
 * Show promise toast (for async operations)
 */
export const showPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  },
  t?: TFunction
) => {
  return toast.promise(
    promise,
    {
      loading: t ? t(messages.loading) : messages.loading,
      success: t ? t(messages.success) : messages.success,
      error: t ? t(messages.error) : messages.error,
    },
    {
      success: {
        icon: '✅',
      },
      error: {
        icon: '❌',
      },
    }
  );
};

/**
 * Dismiss toast
 */
export const dismissToast = (toastId?: string) => {
  toast.dismiss(toastId);
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};
