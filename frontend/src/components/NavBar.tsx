import { NavLink } from "react-router-dom";
import { ROUTES } from "../utils/routes";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { isRtlLang } from "../utils/localeDirection";

export const NavBar = () => {
  const { i18n } = useTranslation();
  const { t } = useTranslation("nav");
  const dir = isRtlLang(i18n.language) ? "rtl" : "ltr";
  const { isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav
      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 py-2 px-4 border border-gray-200 dark:border-gray-700 rounded-xl safe-top"
      dir={dir}
    >
      <div className="flex justify-between items-center">
        <NavLink
          to={ROUTES.HOME}
          className="text-base sm:text-lg font-semibold touch-target"
          onClick={closeMobileMenu}
        >
          {t("home")}
        </NavLink>

        <div className="hidden md:flex items-center space-x-4 space-x-reverse">
          <NavLink
            to={ROUTES.CALENDAR}
            className="touch-target px-3 py-1 rounded transition-colors hover:bg-blue-50 dark:hover:bg-gray-700"
          >
            {t("calendar")}
          </NavLink>
          <NavLink
            to={ROUTES.CATEGORIES}
            className="touch-target px-3 py-1 rounded transition-colors hover:bg-blue-50 dark:hover:bg-gray-700"
          >
            {t("categories")}
          </NavLink>
          <NavLink
            to={ROUTES.ALL_TASKS}
            className="touch-target px-3 py-1 rounded transition-colors hover:bg-blue-50 dark:hover:bg-gray-700"
          >
            {t("tasks")}
          </NavLink>
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="touch-target px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t("logout")}
            </button>
          )}
        </div>

        {!isAuthenticated && (
          <div className="hidden md:flex items-center space-x-3 space-x-reverse">
            <NavLink
              to={ROUTES.LOGIN}
              className="touch-target px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-sm"
            >
              {t("login")}
            </NavLink>
            <NavLink
              to={ROUTES.REGISTER}
              className="touch-target px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
            >
              {t("register")}
            </NavLink>
          </div>
        )}

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden touch-target p-2"
          aria-label={t("menu")}
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex flex-col space-y-3">
            <NavLink
              to={ROUTES.CALENDAR}
              className="touch-target py-2 px-4 hover:bg-blue-50 dark:hover:bg-gray-700 rounded transition-colors"
              onClick={closeMobileMenu}
            >
              {t("calendar")}
            </NavLink>
            <NavLink
              to={ROUTES.CATEGORIES}
              className="touch-target py-2 px-4 hover:bg-blue-50 dark:hover:bg-gray-700 rounded transition-colors"
              onClick={closeMobileMenu}
            >
              {t("categories")}
            </NavLink>
            <NavLink
              to={ROUTES.ALL_TASKS}
              className="touch-target py-2 px-4 hover:bg-blue-50 dark:hover:bg-gray-700 rounded transition-colors"
              onClick={closeMobileMenu}
            >
              {t("tasks")}
            </NavLink>
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="touch-target text-right py-2 px-4 rounded border border-gray-300 dark:border-gray-600"
              >
                {t("logout")}
              </button>
            )}
            {!isAuthenticated && (
              <>
                <NavLink
                  to={ROUTES.LOGIN}
                  className="touch-target text-right py-2 px-4 rounded border border-gray-300 dark:border-gray-600"
                  onClick={closeMobileMenu}
                >
                  {t("login")}
                </NavLink>
                <NavLink
                  to={ROUTES.REGISTER}
                  className="touch-target text-right py-2 px-4 rounded bg-blue-600 text-white"
                  onClick={closeMobileMenu}
                >
                  {t("register")}
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
