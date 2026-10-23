import React from "react";

// Matches the supplied design's `.tag` pill: 11px, weight 600, rounded-full,
// with the three semantic colour variants (v = green, p = gold, x = red).
const VARIANTS = {
  // green — verified/approved/live/resolved/fixed/hired/awarded/open/active
  v: "bg-[#d9efe0] text-[#14532b] dark:bg-emerald-500/15 dark:text-emerald-300",
  // gold — pending/in progress/under review/submitted/new/scheduled/uploaded
  p: "bg-[#fbeccb] text-[#6b4d00] dark:bg-amber-500/15 dark:text-amber-300",
  // red — declined/rejected/cancelled/closed
  x: "bg-[#f9dcd2] text-[#8a2c10] dark:bg-red-500/15 dark:text-red-300",
};

function variantFor(status) {
  const s = String(status || "").toLowerCase();
  if (
    ["verified", "approved", "live", "resolved", "fixed", "hired_or_awarded", "open", "active"].includes(s)
  )
    return "v";
  if (
    ["pending", "in_progress", "under_review", "submitted", "new", "scheduled", "uploaded", "awaiting", "assigned"].includes(s)
  )
    return "p";
  if (["declined", "rejected", "cancelled", "closed"].includes(s)) return "x";
  return "p";
}

export default function StatusPill({ status, className }) {
  if (!status) return null;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${VARIANTS[variantFor(status)]} ${className || ""}`}
    >
      {String(status).replace(/_/g, " ")}
    </span>
  );
}