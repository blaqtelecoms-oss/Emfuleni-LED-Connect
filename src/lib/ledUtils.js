// Automated MSME Data Capturing, Profiling and Management System — shared helpers and constants

// Brand mark (attached Emfuleni Local Municipality logo)
export const LOGO_URL =
  "https://media.base44.com/images/public/6accb538d1f89e245701b224/6a853b1e2_Emfuleni-Water-And-Sanitation-removebg-preview.png";

// Generated login hero photograph
export const HERO_URL =
  "https://media.base44.com/images/public/6ac748a5e17c2620a194f576/3681d07b2_generated_image.png";

// Format an amount as rand, e.g. 45000 -> "R 45 000"
export function formatRand(n) {
  if (n == null || n === "" || isNaN(Number(n))) return "R 0";
  return "R " + Math.round(Number(n)).toLocaleString("en-ZA");
}

// Format a date string in South African time (Africa/Johannesburg = SAST, UTC+2)
export function formatSAST(dateStr, opts) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const o = opts || { day: "numeric", month: "short", year: "numeric" };
  return d.toLocaleDateString("en-ZA", { timeZone: "Africa/Johannesburg", ...o });
}

export function formatSASTTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-ZA", { timeZone: "Africa/Johannesburg", hour: "2-digit", minute: "2-digit" });
}

// Today's date, long form, in SAST
export function todayLong() {
  return new Date().toLocaleDateString("en-ZA", {
    timeZone: "Africa/Johannesburg",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Status tag colour helper — returns {bg, text} Tailwind classes
export function statusTag(status) {
  const s = String(status || "").toLowerCase();
  // green = verified/approved/live/resolved/fixed/hired/awarded/open
  if (["verified", "approved", "live", "resolved", "fixed", "hired_or_awarded", "open", "active"].includes(s))
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300";
  // gold = pending/in progress/under review/submitted/new/scheduled/uploaded
  if (["pending", "in_progress", "under_review", "submitted", "new", "scheduled", "uploaded", "awaiting", "assigned"].includes(s))
    return "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300";
  // red = declined/rejected/cancelled/closed
  if (["declined", "rejected", "cancelled", "closed"].includes(s))
    return "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300";
  return "bg-soft text-mute";
}