import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, LogOut, X } from "lucide-react";

/**
 * Mobile-only bottom navigation inspired by the supplied reference:
 * a black rounded pill bar with four primary destinations and a raised
 * circular blue center control. Tapping the center control blurs the
 * page behind and reveals the remaining portal destinations in an overlay.
 *
 * Only rendered below the lg breakpoint; desktop layout is untouched.
 *
 * Props:
 *  - portal: "member" | "business"
 *  - navItems: [{ key, label, icon }]
 *  - activeKey: current section key
 *  - primaryKeys: array of up to 4 keys shown on the bar (rest go in the overlay)
 *  - onLogout: () => void
 */
export default function MobileBottomNav({
  portal,
  navItems,
  activeKey,
  primaryKeys = [],
  onLogout,
}) {
  const [open, setOpen] = useState(false);

  const primary = navItems.filter((n) => primaryKeys.includes(n.key));
  const more = navItems.filter((n) => !primaryKeys.includes(n.key));

  const close = () => setOpen(false);

  // Build the bar layout: [0] [1] CENTER [2] [3]
  const slots = [primary[0], primary[1], "CENTER", primary[2], primary[3]];

  return (
    <>
      {/* More destinations overlay — blurs the page behind */}
      {open && (
        <div className="mob-nav-overlay lg:hidden" role="dialog" aria-modal="true" aria-label="More pages">
          <div className="mob-nav-backdrop" onClick={close} aria-hidden="true" />
          <div className="mob-nav-sheet">
            <div className="mob-nav-sheet-head">
              <span className="mob-nav-sheet-title">More pages</span>
              <button type="button" className="mob-nav-close" onClick={close} aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mob-nav-grid">
              {more.map((item) => {
                const Icon = item.icon;
                const active = item.key === activeKey;
                return (
                  <Link
                    key={item.key}
                    to={`/${portal}/${item.key}`}
                    onClick={close}
                    className={`mob-nav-tile ${active ? "on" : ""}`}
                  >
                    <span className="mob-nav-tile-ic">
                      {Icon ? <Icon className="w-5 h-5" /> : null}
                    </span>
                    <span className="mob-nav-tile-label">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <button type="button" className="mob-nav-logout" onClick={onLogout}>
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      )}

      {/* Bottom docked bar */}
      <nav className="mob-nav lg:hidden" aria-label="Portal navigation">
        {slots.map((slot, i) => {
          if (slot === "CENTER") {
            return (
              <button
                key="center"
                type="button"
                className={`mob-nav-center ${open ? "open" : ""}`}
                onClick={() => setOpen((v) => !v)}
                aria-label="More pages"
                aria-expanded={open}
              >
                {open ? <X className="w-6 h-6" /> : <LayoutGrid className="w-6 h-6" />}
              </button>
            );
          }
          if (!slot) return <span key={i} className="mob-nav-slot-empty" />;
          const Icon = slot.icon;
          const active = slot.key === activeKey;
          return (
            <Link
              key={slot.key}
              to={`/${portal}/${slot.key}`}
              className={`mob-nav-slot ${active ? "on" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="mob-nav-ic">
                {Icon ? <Icon className="w-5 h-5" /> : null}
              </span>
              <span className="mob-nav-label">{slot.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}