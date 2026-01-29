/**
 * ML Recommendation Modal Component
 * Displays ML suggestions in a modal dialog
 */
import React, { useState } from 'react';
import { getMLRecommendation } from '../utils/ml';
import { showError, showSuccess, showLoading, dismissToast } from '../utils/toast';
import { useTranslation } from 'react-i18next';

interface MLRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: Record<string, any>;
}

export const MLRecommendationModal: React.FC<MLRecommendationModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const { t } = useTranslation();
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRecommendation = async () => {
    setLoading(true);
    const toastId = showLoading(t('common.loading', 'טוען...') || 'טוען...');

    try {
      const response = await getMLRecommendation(data);
      setSuggestion(response.suggestion);
      dismissToast(toastId);
      showSuccess(t('toast.ml_recommendation_success', 'ההמלצה נטענה בהצלחה') || 'ההמלצה נטענה בהצלחה');
    } catch (error: any) {
      dismissToast(toastId);
      const errorMessage = error.response?.data?.detail || error.message || 'שגיאה בטעינת המלצה';
      showError(errorMessage);
      console.error('ML recommendation error:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && !suggestion && !loading) {
      fetchRecommendation();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
              {t('ml.recommendation_title', 'המלצת AI') || 'המלצת AI'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white transition-colors"
              aria-label="סגור"
            >
              <span className="emoji text-2xl">✕</span>
            </button>
          </div>

          {/* Content */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky"></div>
              <span className="ml-3 text-gray-600 dark:text-dark-text">
                {t('common.loading', 'טוען...') || 'טוען...'}
              </span>
            </div>
          )}

          {!loading && suggestion && (
            <div className="space-y-4">
              <div className="bg-cream dark:bg-dark-bg p-4 rounded-lg">
                <p className="text-gray-900 dark:text-dark-text whitespace-pre-wrap">
                  {suggestion}
                </p>
              </div>
              <button
                onClick={fetchRecommendation}
                className="w-full btn btn-sky"
              >
                {t('ml.refresh_recommendation', 'רענן המלצה') || 'רענן המלצה'}
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-dark-hover text-gray-700 dark:text-dark-text rounded-lg hover:bg-gray-300 dark:hover:bg-dark-border transition-colors"
            >
              {t('common.close', 'סגור') || 'סגור'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
