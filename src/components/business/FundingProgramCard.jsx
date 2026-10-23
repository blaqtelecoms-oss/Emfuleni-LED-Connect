import React from "react";
import { formatRand } from "@/lib/ledUtils";
import StatusPill from "@/components/StatusPill";
import { Landmark, Calendar, ExternalLink, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import { checklistCounts } from "@/lib/fundingUtils";

export default function FundingProgramCard({ program, business, docs, hasApp, onOpen }) {
  const checklist = (program.requirements || []).map((r) => {
    const hit = (() => {
      if (r.type === "document") return (docs || []).some((d) => d.document_type === r.document_type && d.status !== "rejected");
      if (r.type === "profile") {
        const val = business ? business[r.field] : undefined;
        if (r.values?.length) return Array.isArray(val) ? val.some((v) => r.values.includes(v)) : r.values.includes(val);
        return val !== undefined && val !== null && val !== "" && val !== false && val !== "Not sure";
      }
      return null; // info → unknown
    })();
    const status = hit === true ? "met" : hit === false ? "missing" : "needs_review";
    return { status };
  });
  const counts = checklistCounts(checklist);

  return (
    <button
      onClick={onOpen}
      className="led-box text-left flex flex-col hover:shadow-soft transition-shadow"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <b className="text-sm text-ink leading-snug">{program.name}</b>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-soft text-mute whitespace-nowrap">
          {program.funder}
        </span>
      </div>
      {program.summary && <p className="text-xs text-mute mb-2 leading-snug line-clamp-2">{program.summary}</p>}
      <div className="text-xs text-mute mb-2.5 space-y-0.5">
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
        {program.funding_type && <span className="block">{program.funding_type}</span>}
      </div>
      <div className="flex items-center gap-1.5 mb-2.5">
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
      <div className="mt-auto flex items-center justify-between pt-1">
        <span className="text-xs text-brand font-semibold flex items-center gap-1">
          View details <ExternalLink className="w-3.5 h-3.5" />
        </span>
        {hasApp && <StatusPill status="submitted" />}
      </div>
    </button>
  );
}