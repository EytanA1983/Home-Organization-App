import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../utils/routes';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { announce } from '../utils/accessibility';

/**
 * NavBar component with full accessibility support
 * - ARIA labels for all interactive elements
 * - Keyboard navigation
 * - Screen reader announcements
 * - Focus indicators
 */
const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, [location]);

  // Announce page changes to screen readers
  useEffect(() => {
    const pageName = navItems.find(item => item.path === location.pathname)?.translationKey;
    if (pageName) {
      announce(`עמוד ${t(pageName)} נטען`, 'polite');
    }
  }, [location.pathname, t]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    announce('התנתקת בהצלחה', 'assertive');
    navigate(ROUTES.LOGIN);
  }, [navigate]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => {
      announce(prev ? 'תפריט נסגר' : 'תפריט נפתח', 'polite');
      return !prev;
    });
  }, []);

  const navItems = [
    { path: ROUTES.HOME, icon: '🏠', translationKey: 'rooms.title', ariaLabel: 'דף הבית' },
    { path: ROUTES.CALENDAR, icon: '📅', translationKey: 'calendar.title', ariaLabel: 'לוח שנה' },
    { path: ROUTES.SETTINGS, icon: '⚙️', translationKey: 'settings.title', ariaLabel: 'הגדרות' },
  ];

  return (
    <header role="banner">
      <nav 
        className="bg-white dark:bg-dark-surface shadow-sm border-b border-gray-200 dark:border-dark-border"
        role="navigation"
        aria-label="ניווט ראשי"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <Link 
              to={ROUTES.HOME} 
              className="text-2xl font-bold text-gray-900 dark:text-dark-text hover:text-sky transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2 rounded-lg px-2 py-1"
              aria-label={`${t('common.app_name')} - חזרה לדף הבית`}
            >
              <span aria-hidden="true">🏡</span>
              <span className="mr-2">{t('common.app_name')}</span>
            </Link>
            
            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
              onClick={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileMenuOpen ? 'סגור תפריט' : 'פתח תפריט'}
            >
              <span className="sr-only">{isMobileMenuOpen ? 'סגור תפריט' : 'פתח תפריט'}</span>
              <span className="emoji text-xl" aria-hidden="true">
                {isMobileMenuOpen ? '✕' : '☰'}
              </span>
            </button>
            
            {/* Desktop navigation */}
            <div 
              className="hidden md:flex items-center gap-2"
              role="menubar"
              aria-label="תפריט ניווט"
            >
              <ThemeToggle />
              <LanguageSwitcher />
              
              {isAuthenticated ? (
                <>
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`
                          flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2
                          ${isActive
                            ? 'bg-mint text-white'
                            : 'text-gray-700 dark:text-dark-text hover:bg-cream dark:hover:bg-dark-bg'
                          }
                        `}
                        role="menuitem"
                        aria-current={isActive ? 'page' : undefined}
                        aria-label={item.ariaLabel}
                      >
                        <span className="emoji" aria-hidden="true">{item.icon}</span>
                        <span>{t(item.translationKey || 'common.app_name')}</span>
                      </Link>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 dark:text-dark-text hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                    role="menuitem"
                    aria-label="התנתק מהחשבון"
                  >
                    <span className="emoji" aria-hidden="true">🚪</span>
                    <span>{t('auth.logout')}</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to={ROUTES.LOGIN}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 dark:text-dark-text hover:bg-cream dark:hover:bg-dark-bg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2"
                    role="menuitem"
                    aria-label="התחבר לחשבון קיים"
                  >
                    <span className="emoji" aria-hidden="true">🔑</span>
                    <span>{t('auth.login')}</span>
                  </Link>
                  <Link
                    to={ROUTES.REGISTER}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky text-white hover:bg-sky/90 dark:bg-sky/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2"
                    role="menuitem"
                    aria-label="צור חשבון חדש"
                  >
                    <span className="emoji" aria-hidden="true">📝</span>
                    <span>{t('auth.register')}</span>
                  </Link>
                </>
              )}
            </div>
          </div>
          
          {/* Mobile navigation */}
          <div
            id="mobile-menu"
            className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}
            role="menu"
            aria-label="תפריט נייד"
          >
            <div className="py-2 space-y-1 border-t border-gray-200 dark:border-dark-border">
              {isAuthenticated ? (
                <>
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`
                          flex items-center gap-2 px-4 py-3 rounded-lg transition-colors
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky
                          ${isActive
                            ? 'bg-mint text-white'
                            : 'text-gray-700 dark:text-dark-text hover:bg-cream dark:hover:bg-dark-bg'
                          }
                        `}
                        role="menuitem"
                        aria-current={isActive ? 'page' : undefined}
                        aria-label={item.ariaLabel}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="emoji" aria-hidden="true">{item.icon}</span>
                        <span>{t(item.translationKey)}</span>
                      </Link>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-gray-700 dark:text-dark-text hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    role="menuitem"
                    aria-label="התנתק מהחשבון"
                  >
                    <span className="emoji" aria-hidden="true">🚪</span>
                    <span>{t('auth.logout')}</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to={ROUTES.LOGIN}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-gray-700 dark:text-dark-text hover:bg-cream dark:hover:bg-dark-bg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
                    role="menuitem"
                    aria-label="התחבר לחשבון קיים"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="emoji" aria-hidden="true">🔑</span>
                    <span>{t('auth.login')}</span>
                  </Link>
                  <Link
                    to={ROUTES.REGISTER}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg bg-sky text-white hover:bg-sky/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
                    role="menuitem"
                    aria-label="צור חשבון חדש"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="emoji" aria-hidden="true">📝</span>
                    <span>{t('auth.register')}</span>
                  </Link>
                </>
              )}
              
              {/* Theme and language in mobile */}
              <div className="flex items-center gap-4 px-4 py-3 border-t border-gray-200 dark:border-dark-border mt-2">
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Skip link target */}
      <div id="main-content" tabIndex={-1} className="outline-none" />
    </header>
  );
};

export { NavBar };
export default NavBar;
