import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { LogOut } from "lucide-react";
import PortalCalendar from "@/components/PortalCalendar";
import { useLedProfile } from "@/hooks/useLedProfile";
import MobileBottomNav from "@/components/MobileBottomNav";
import EditProfileDialog from "@/components/EditProfileDialog";
import { HeaderArt, EmfuleniBrand } from "@/components/EmfuleniBrandArt";

export default function PortalLayout({ portal, navItems, activeKey, allowedAccountType, children }) {
  const { user, logout } = useAuth();
  const { profile, business } = useLedProfile();
  const [editOpen, setEditOpen] = useState(false);

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
    <div className="h-screen portal-bg overflow-hidden p-4">
      <div className="relative max-w-[1240px] mx-auto">
        <div className="relative rounded-[28px] overflow-hidden portal-bg shadow-[0_20px_60px_rgba(0,0,0,0.25)] h-[calc(100vh-32px)]">
          {/* Header art bar — Emfuleni palette pattern, behind content */}
          <div className="absolute top-0 left-0 right-0 h-[96px] overflow-hidden z-0">
            <HeaderArt />
            {/* LED pill */}
            <div className="absolute right-6 top-[30px] hidden sm:flex bg-card text-ink rounded-[20px] px-4 py-2 text-[12.5px] font-medium gap-2 items-center shadow-[0_4px_14px_rgba(0,0,0,0.18)]">
              <span className="w-2 h-2 rounded-full bg-brand" />
              Local Economic Development
            </div>
          </div>

          {/* Content grid — above header art */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[240px_1fr_276px] h-[calc(100vh-32px)] overflow-hidden">
            {/* Sidebar */}
            <aside className="hidden lg:flex lg:p-3.5 min-h-0">
              <div className="w-full h-full bg-card rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.14)] flex flex-col p-4 overflow-hidden">
                {/* Brand */}
                <div className="flex flex-col items-center gap-1.5 text-center pb-2">
                  <EmfuleniBrand />
                </div>

                {/* Identity */}
                <div className="text-center my-3">
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="w-[54px] h-[54px] rounded-full mx-auto mb-1.5 grid place-items-center text-[18px] font-medium text-white bg-aqua shadow-[0_0_0_4px_hsl(var(--card)),0_0_0_5px_hsl(var(--line))] overflow-hidden cursor-pointer relative group"
                    title="Edit profile"
                  >
                    {user?.profile_picture
                      ? (() => {
                          const { data } = supabase.storage
                            .from("avatars")
                            .getPublicUrl(user.profile_picture);
                          return (
                            <img
                              src={data.publicUrl}
                              alt={displayName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          );
                        })()
                      : initials}
                  </button>
                  <p className="text-[12px] text-mute">Welcome back,</p>
                  <b className="block text-[14px] font-semibold text-ink mt-0.5">{displayName}</b>
                  <span className="block text-[11px] text-mute mt-0.5">{subtitle}</span>
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

                {/* Navigation */}
                <nav
                  className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-0.5 -mx-1 px-1"
                  aria-label="Portal navigation"
                >
                  {navItems.map((item) => {
                    const active = item.key === activeKey;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.key}
                        to={`/${portal}/${item.key}`}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 w-full px-2.5 py-2 rounded-[12px] text-[13px] cursor-pointer transition-colors ${
                          active
                            ? "text-ink font-semibold"
                            : "text-mute hover:bg-soft hover:text-ink"
                        }`}
                      >
                        <Icon className="w-[17px] h-[17px] flex-none" strokeWidth={1.8} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-2.5 py-2 rounded-[12px] text-[13px] text-mute hover:bg-soft hover:text-ink cursor-pointer transition-colors border-t border-line pt-3 mt-2"
                  >
                    <LogOut className="w-[17px] h-[17px] flex-none" strokeWidth={1.8} />
                    <span>Log out</span>
                  </button>
                </nav>
              </div>
            </aside>

            {/* Main content */}
            <main className="mt-[96px] p-5 lg:p-6 lg:px-8 min-w-0 pb-28 lg:pb-6 overflow-y-auto min-h-0">
              {children}
            </main>

            {/* Right calendar panel */}
            <aside className="hidden lg:block mt-[96px] border-l border-line bg-soft overflow-y-auto min-h-0">
              <PortalCalendar portal={portal} />
            </aside>
          </div>
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

      {/* Profile edit dialog — shared by both portals */}
      <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
