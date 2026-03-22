import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PRODUCT_CATEGORY_NAV_ORDER } from "../domain/productCategories";
import { ROUTES, getCategoryRoute } from "../utils/routes";

type Props = {
  tabLabel: string;
  isActive: boolean;
  authenticated: boolean;
};

const HOVER_CLOSE_MS = 320;
/** 0 — avoids a dead zone between tab and fixed panel (wrapper uses padding-bridge in CSS). */
const PANEL_GAP_PX = 0;
const PANEL_MIN_WIDTH_PX = 200;
const PANEL_MAX_WIDTH_PX = 320;
const VIEWPORT_MARGIN_PX = 8;

/**
 * Shell "Categories" tab: primary click → `/categories` (all categories).
 * Hover opens a pill-shaped dropdown below the tab, horizontally aligned with the pointer (clamped to tab + viewport).
 */
export function CategoriesNavTab({ tabLabel, isActive, authenticated }: Props) {
  const { t: tLayout } = useTranslation("layout");
  const { t: tPc } = useTranslation("productCategories");
  const navigate = useNavigate();
  const location = useLocation();
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  /** Viewport X of pointer while over the tab — anchors dropdown under the cursor. */
  const [anchorClientX, setAnchorClientX] = useState<number | null>(null);

  const updatePosition = useCallback(() => {
    const el = wrapRef.current;
    if (!el || !open) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.min(PANEL_MAX_WIDTH_PX, Math.max(PANEL_MIN_WIDTH_PX, r.width));
    const top = r.bottom + PANEL_GAP_PX;
    const maxH = Math.max(160, Math.min(vh * 0.72, vh - top - VIEWPORT_MARGIN_PX));

    const pointerX = anchorClientX ?? (r.left + r.right) / 2;
    const tabPad = 4;
    const minLeft = Math.max(VIEWPORT_MARGIN_PX, r.left - tabPad);
    const maxLeft = Math.min(vw - w - VIEWPORT_MARGIN_PX, r.right + tabPad - w);
    let left = pointerX - w / 2;
    if (maxLeft >= minLeft) {
      left = Math.max(minLeft, Math.min(left, maxLeft));
    } else {
      const cx = (r.left + r.right) / 2;
      left = Math.max(VIEWPORT_MARGIN_PX, Math.min(vw - w - VIEWPORT_MARGIN_PX, cx - w / 2));
    }

    setPanelStyle({
      position: "fixed",
      top,
      left,
      right: "auto",
      width: w,
      maxHeight: maxH,
      zIndex: 200,
      transformOrigin: `${Math.round(Math.max(0, pointerX - left))}px 0`,
    });
  }, [open, anchorClientX]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, updatePosition]);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setOpen(false);
      setAnchorClientX(null);
    }, HOVER_CLOSE_MS);
  }, [cancelClose]);

  const openNow = useCallback(() => {
    cancelClose();
    setOpen(true);
  }, [cancelClose]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setAnchorClientX(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (wrapRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
      setAnchorClientX(null);
    };
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, [open]);

  const tabClass = `roomTab ${isActive ? "roomTabActive" : ""}${authenticated ? "" : " roomTabLocked"}`;

  const goLogin = (from: string) => {
    setOpen(false);
    setAnchorClientX(null);
    navigate(ROUTES.LOGIN, { state: { from } });
  };

  return (
    <div
      ref={wrapRef}
      className="navCategoriesWrap"
      aria-haspopup="true"
      aria-expanded={open}
      onMouseEnter={(e) => {
        setAnchorClientX(e.clientX);
        openNow();
      }}
      onMouseMove={(e) => {
        setAnchorClientX(e.clientX);
        if (!open) openNow();
      }}
      onMouseLeave={scheduleClose}
      onFocusCapture={openNow}
    >
      {authenticated ? (
        <Link to={ROUTES.CATEGORIES} className={tabClass}>
          {tabLabel}
        </Link>
      ) : (
        <button
          type="button"
          className={tabClass}
          onClick={() => goLogin(ROUTES.CATEGORIES)}
          title={tLayout("loginRequired")}
        >
          🔒 {tabLabel}
        </button>
      )}
      {open ? (
        <nav
          ref={panelRef}
          className="navCategoriesDropdown navCategoriesPanel navCategoriesDropdown--pill"
          style={panelStyle}
          onMouseEnter={openNow}
          onMouseLeave={scheduleClose}
          aria-label={tLayout("categoriesNavRailAria")}
        >
          <div className="navCategoriesDropdownHeader navCategoriesDropdownHeader--pill">
            {authenticated ? (
              <Link
                to={ROUTES.CATEGORIES}
                className="navCategoriesDropdownAllLink navCategoriesDropdownAllLink--pill"
                onClick={() => setOpen(false)}
              >
                {tLayout("categoriesAllPageLink")}
              </Link>
            ) : (
              <button
                type="button"
                className="navCategoriesDropdownAllLink navCategoriesDropdownAllLinkBtn navCategoriesDropdownAllLink--pill"
                onClick={() => goLogin(ROUTES.CATEGORIES)}
              >
                {tLayout("categoriesAllPageLink")}
              </button>
            )}
          </div>
          <div className="navCategoriesPanelInner navCategoriesDropdownList navCategoriesDropdownList--stack">
            {PRODUCT_CATEGORY_NAV_ORDER.map((key) => {
              const to = getCategoryRoute(key);
              const label = tPc(`items.${key}`);
              const path = location.pathname;
              const pathActive = path === to || path.startsWith(`${to}/`);
              const itemClass = `navCategoriesPanelItem navCategoriesDropdownItem navCategoriesDropdownItem--row${
                pathActive ? " navCategoriesDropdownItem--active" : ""
              }`;
              if (authenticated) {
                return (
                  <Link key={key} to={to} className={itemClass} onClick={() => setOpen(false)}>
                    {label}
                  </Link>
                );
              }
              return (
                <button
                  key={key}
                  type="button"
                  className={`${itemClass} navCategoriesPanelItemBtn`}
                  onClick={() => goLogin(to)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
