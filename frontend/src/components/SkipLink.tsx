import { memo } from 'react';

interface SkipLinkProps {
  /** Target element ID to skip to */
  targetId?: string;
  /** Link text */
  children?: React.ReactNode;
}

/**
 * SkipLink component for keyboard navigation
 * Allows users to skip repetitive navigation and jump to main content
 * 
 * Usage: Place at the very beginning of the page, before NavBar
 * 
 * WCAG 2.1 Success Criterion 2.4.1 (Bypass Blocks)
 */
export const SkipLink = memo(({ 
  targetId = 'main-content', 
  children = 'דלג לתוכן הראשי' 
}: SkipLinkProps) => {
  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    
    if (target) {
      // Make target focusable if it isn't already
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus();
      
      // Scroll to target
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick(e);
        }
      }}
      className="
        sr-only focus:not-sr-only
        focus:fixed focus:top-4 focus:right-4 focus:z-[100]
        focus:px-4 focus:py-2
        focus:bg-sky focus:text-white
        focus:rounded-lg focus:shadow-lg
        focus:outline-none focus:ring-2 focus:ring-white
        transition-all duration-200
      "
    >
      {children}
    </a>
  );
});
SkipLink.displayName = 'SkipLink';

/**
 * Multiple skip links for complex pages
 */
export const SkipLinks = memo(({ 
  links 
}: { 
  links: Array<{ targetId: string; label: string }> 
}) => (
  <nav 
    aria-label="קפיצה מהירה"
    className="
      sr-only focus-within:not-sr-only
      focus-within:fixed focus-within:top-4 focus-within:right-4 focus-within:z-[100]
      focus-within:bg-white focus-within:dark:bg-dark-surface
      focus-within:rounded-lg focus-within:shadow-lg focus-within:p-2
    "
  >
    <ul className="space-y-1">
      {links.map(({ targetId, label }) => (
        <li key={targetId}>
          <SkipLink targetId={targetId}>{label}</SkipLink>
        </li>
      ))}
    </ul>
  </nav>
));
SkipLinks.displayName = 'SkipLinks';

export default SkipLink;
