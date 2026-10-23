import React from "react";
import { Loader2 } from "lucide-react";

export function SectionLoading() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 text-brand animate-spin" />
    </div>
  );
}

export function SectionEmpty({ children }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-soft/50 py-12 text-center text-mute text-sm">
      {children || "Nothing here yet."}
    </div>
  );
}