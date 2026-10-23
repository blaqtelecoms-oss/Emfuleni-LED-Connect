import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import MunicipalityLogo from "@/components/MunicipalityLogo";
import { LogOut } from "lucide-react";
import PortalCalendar from "@/components/PortalCalendar";
import { useLedProfile } from "@/hooks/useLedProfile";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function PortalLayout({ portal, navItems, activeKey, allowedAccountType, children }) {
  const { user, logout } = useAuth();
  const { profile, business } = useLedProfile();

  // Account-type gate: send users to their own portal.
  // Invited LED officers log in as role "admin" with no account_type — treat them as officer.
  const accountType = user?.account_type || (user?.role === "admin" ? "officer" : null);
  if (accountType && accountType !== allowedAccountType) {
    return <Navigate to={`/${accountType}`} replace />;
  }

  const displayName =
    portal === "business"
      ? business?.name || user?.full_name || user?.email || "Business"
      : profile?.full_name || user?.full_name || user?.email || "Member";

  const subtitle =
    portal === "business"
      ? business
        ? [business.area, business.sector].filter(Boolean).join(" · ")
        : "Business account"
      : portal === "member"
      ? profile?.area
        ? `${profile.area} · Resident`
        : "Resident"
      : user?.officer_role
      ? user.officer_role.charAt(0).toUpperCase() + user.officer_role.slice(1) + " · LED Office"
      : "LED Officer · Emfuleni";

  const initials = (displayName || "U")
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Identity tag under the avatar — matches the supplied designs.
  const identityTag =
    portal === "business"
      ? business?.status === "verified"
        ? "Verified"
        : business?.status === "rejected"
        ? "Rejected"
        : "Pending"
      : portal === "member"
      ? "Job seeker"
      : null;

  const handleLogout = () => {
    logout(false);
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-page relative">
      {/* ambient mist glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -left-32 w-[480px] h-[480px] rounded-full bg-[hsl(var(--green)/0.10)] blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[440px] h-[440px] rounded-full bg-[hsl(var(--blue)/0.20)] blur-3xl" />
      </div>

      <div className="relative max-w-[1240px] mx-auto p-3.5">
        <div className="glass-surface shadow-glass rounded-[28px] overflow-hidden grid grid-cols-1 lg:grid-cols-[218px_1fr_272px] min-h-[calc(100vh-28px)] border border-[hsl(var(--line))]">
          {/* Sidebar */}
          <aside className="border-b lg:border-b-0 lg:border-r border-[hsl(var(--line)/0.8)] py-[22px] px-[18px] relative bg-[hsl(var(--shell)/0.4)]">
            <MunicipalityLogo />

            {/* Identity block — desktop only */}
            <div className="hidden lg:block text-center my-[22px]">
              <div className="w-[78px] h-[78px] rounded-full mx-auto grid place-items-center text-[26px] font-bold text-ink border-4 border-[hsl(var(--shell))] bg-gradient-to-br from-[hsl(var(--blue))] to-[hsl(var(--green)/0.55)] shadow-soft">
                {initials}
              </div>
              <b className="block mt-2.5 text-sm text-ink leading-tight">{displayName}</b>
              <span className="text-mute text-xs">{subtitle}</span>
              {identityTag && (
                <span
                  className={`inline-block mt-2 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                    identityTag === "Verified" || identityTag === "Job seeker"
                      ? "bg-[hsl(var(--green)/0.14)] text-[hsl(var(--green-dark))] dark:bg-[hsl(var(--green)/0.22)] dark:text-[hsl(var(--green))]"
                      : identityTag === "Rejected"
                      ? "bg-[#f9dcd2] text-[#8a2c10] dark:bg-red-500/15 dark:text-red-300"
                      : "bg-[#fbeccb] text-[#6b4d00] dark:bg-amber-500/15 dark:text-amber-300"
                  }`}
                >
                  {identityTag}
                </span>
              )}
            </div>

            {/* Navigation — desktop only; mobile uses the bottom docked bar */}
            <nav
              className="hidden lg:flex lg:flex-col gap-1 mt-0 pb-0"
              aria-label="Portal navigation"
            >
              {navItems.map((item) => {
                const active = item.key === activeKey;
                return (
                  <Link
                    key={item.key}
                    to={`/${portal}/${item.key}`}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex items-center gap-2.5 pl-3 pr-2.5 py-2 rounded-[12px] text-sm whitespace-nowrap transition-all ${
                      active
                        ? "bg-[hsl(var(--green)/0.10)] text-[hsl(var(--green-dark))] font-semibold dark:text-[hsl(var(--green))]"
                        : "text-mute hover:text-ink hover:bg-[hsl(var(--shell)/0.6)] font-medium"
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-[hsl(var(--green))]" />
                    )}
                    <span
                      className={`w-2 h-2 rounded-[3px] flex-none ${
                        active ? "bg-[hsl(var(--green))]" : "bg-[hsl(var(--line))]"
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 pl-3 pr-2.5 py-2 rounded-[12px] text-sm whitespace-nowrap font-medium text-mute hover:text-tangerine transition-colors lg:mt-2"
              >
                <span className="w-2 h-2 rounded-[3px] flex-none bg-[hsl(var(--line))]" />
                <span className="flex items-center gap-2">
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  Log out
                </span>
              </button>
            </nav>
          </aside>

          {/* Main content */}
          <main className="p-5 lg:p-[24px] lg:px-7 min-w-0 pb-28 lg:pb-[24px]">{children}</main>

          {/* Right calendar panel */}
          <aside className="hidden lg:block border-l border-[hsl(var(--line)/0.7)] bg-[hsl(var(--shell)/0.35)]">
            <PortalCalendar portal={portal} />
          </aside>
        </div>
      </div>

      {/* Mobile bottom navigation — all portals */}
      <MobileBottomNav
        portal={portal}
        navItems={navItems}
        activeKey={activeKey}
        primaryKeys={navItems.slice(0, 4).map((n) => n.key)}
        onLogout={handleLogout}
      />
    </div>
  );
}