import React from "react";
import { formatRand } from "@/lib/ledUtils";
import StatusPill from "@/components/StatusPill";
import { Landmark, Calendar, ChevronRight, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import { checklistCounts } from "@/lib/fundingUtils";

// Map funding_type to a civic tag + icon colour variant.
const TAG = {
  grant: { tag: "led-tag-green", icon: "led-icon-green" },
  loan: { tag: "led-tag-blue", icon: "led-icon-blue" },
  voucher: { tag: "led-tag-amber", icon: "led-icon-amber" },
  incentive: { tag: "led-tag-violet", icon: "led-icon-violet" },
};

function tagFor(program) {
  const ft = (program.funding_type || "").toLowerCase();
  for (const key of Object.keys(TAG)) {
    if (ft.includes(key)) return TAG[key];
  }
  return { tag: "led-tag-neutral", icon: "led-icon-neutral" };
}

export default function FundingProgramCard({ program, business, docs, hasApp, onOpen }) {
  const checklist = (program.requirements || []).map((r) => {
    const hit = (() => {
      if (r.type === "document") return (docs || []).some((d) => d.document_type === r.document_type && d.status !== "rejected");
      if (r.type === "profile") {
        const val = business ? business[r.field] : undefined;
        if (r.values?.length) return Array.isArray(val) ? val.some((v) => r.values.includes(v)) : r.values.includes(val);
        return val !== undefined && val !== null && val !== "" && val !== false && val !== "Not sure";
      }
      return null;
    })();
    const status = hit === true ? "met" : hit === false ? "missing" : "needs_review";
    return { status };
  });
  const counts = checklistCounts(checklist);
  const t = tagFor(program);

  return (
    <button
      onClick={onOpen}
      className="led-box text-left flex flex-col group transition-colors hover:border-[hsl(137_57%_20%/0.25)]"
    >
      {/* Header: icon tile + category tag */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`led-icon-box led-icon-box-sm ${t.icon}`}>
          <Landmark className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-1.5">
          {hasApp && <StatusPill status="submitted" />}
          <span className={`led-tag ${t.tag}`}>{program.funding_type || "Funding"}</span>
        </div>
      </div>

      {/* Title */}
      <b className="text-sm text-ink leading-snug mb-1">{program.name}</b>
      {program.summary && <p className="text-xs text-mute mb-3 leading-snug line-clamp-2">{program.summary}</p>}

      {/* Meta */}
      <div className="text-xs text-mute mb-3 space-y-1">
        {program.max_amount != null && (
          <span className="flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5" />
            {program.min_amount != null ? `${formatRand(program.min_amount)} – ${formatRand(program.max_amount)}` : `Up to ${formatRand(program.max_amount)}`}
          </span>
        )}
        {program.deadline && (
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Closes {new Date(program.deadline).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        )}
        <span className="block text-[11px]">{program.funder}</span>
      </div>

      {/* Checklist badges */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#d9efe0] text-[#14532b] dark:bg-emerald-500/15 dark:text-emerald-300">
          <CheckCircle2 className="w-3 h-3" /> {counts.met}
        </span>
        {counts.missing > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#f9dcd2] text-[#8a2c10] dark:bg-red-500/15 dark:text-red-300">
            <AlertCircle className="w-3 h-3" /> {counts.missing}
          </span>
        )}
        {counts.needs_review > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#fbeccb] text-[#6b4d00] dark:bg-amber-500/15 dark:text-amber-300">
            <HelpCircle className="w-3 h-3" /> {counts.needs_review}
          </span>
        )}
        {program.call_status === "standing" && (
          <span className="text-[10px] text-mute ml-auto">Standing</span>
        )}
      </div>

      {/* Footer: forest-green action bar */}
      <div className="mt-auto pt-2.5 border-t border-line flex items-center justify-between">
        <span className="text-xs font-semibold text-[hsl(137_57%_20%)]">View details</span>
        <ChevronRight className="w-4 h-4 text-[hsl(137_57%_20%)]" />
      </div>
    </button>
  );
}
