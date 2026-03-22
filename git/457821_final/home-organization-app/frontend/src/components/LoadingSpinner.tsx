import { memo } from 'react';

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Loading message for screen readers */
  label?: string;
  /** Show text label visually */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Accessible LoadingSpinner component
 * - ARIA live region for screen readers
 * - Customizable size and label
 * - Respects reduced motion preference
 */
export const LoadingSpinner = memo(({
  size = 'md',
  label = 'טוען...',
  showLabel = true,
  className = ''
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div
      className={`flex items-center justify-center p-4 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Spinner */}
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full border-sky border-t-transparent
          animate-spin motion-reduce:animate-none
        `}
        aria-hidden="true"
      />

      {/* Label */}
      {showLabel ? (
        <span className={`mr-3 text-gray-600 dark:text-gray-300 ${textSizeClasses[size]}`}>
          {label}
        </span>
      ) : (
        // Screen reader only text
        <span className="sr-only">{label}</span>
      )}
    </div>
  );
});
LoadingSpinner.displayName = 'LoadingSpinner';

/**
 * Full page loading overlay
 */
export const LoadingOverlay = memo(({ label = 'טוען...' }: { label?: string }) => (
  <div
    className="fixed inset-0 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-sm flex items-center justify-center z-50"
    role="alert"
    aria-busy="true"
    aria-live="assertive"
  >
    <div className="text-center">
      <LoadingSpinner size="lg" label={label} />
      <p className="mt-4 text-gray-600 dark:text-gray-300">אנא המתן...</p>
    </div>
  </div>
));
LoadingOverlay.displayName = 'LoadingOverlay';

/**
 * Inline loading indicator (for buttons, etc.)
 */
export const LoadingDots = memo(({ label = 'טוען' }: { label?: string }) => (
  <span className="inline-flex items-center" role="status" aria-live="polite">
    <span className="sr-only">{label}</span>
    <span className="flex gap-1" aria-hidden="true">
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </span>
  </span>
));
LoadingDots.displayName = 'LoadingDots';

export default LoadingSpinner;
