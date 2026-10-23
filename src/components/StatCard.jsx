import React from "react";

// Matches the supplied design's `.tile`: soft background, rounded-12, big bold number,
// muted label — no border, no icon (the design tiles are bare stat blocks).
export default function StatCard({ value, label, accent = "brand", icon: Icon }) {
  return (
    <div className="rounded-[12px] bg-soft p-3 text-left">
      <b className="text-[22px] font-bold text-ink leading-none block">{value}</b>
      <span className="text-mute text-xs mt-1 block leading-tight">{label}</span>
    </div>
  );
}