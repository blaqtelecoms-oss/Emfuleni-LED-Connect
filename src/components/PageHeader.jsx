import React from "react";
import { todayLong } from "@/lib/ledUtils";

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-[18px]">
      <div className="min-w-0">
        <h1 className="text-[22px] font-bold text-ink leading-tight">{title}</h1>
        <p className="text-mute text-xs mt-0.5">{subtitle || `Today is ${todayLong()}`}</p>
      </div>
      {actions && <div className="flex gap-2 flex-wrap items-center">{actions}</div>}
    </div>
  );
}