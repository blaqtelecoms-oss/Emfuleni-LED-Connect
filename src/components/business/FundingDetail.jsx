import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatRand, formatSAST } from "@/lib/ledUtils";
import StatusPill from "@/components/StatusPill";
import { evaluateChecklist, checklistCounts, CHECKLIST_STATUS, CALL_STATUSES } from "@/lib/fundingUtils";
import { Landmark, Calendar, ExternalLink, CheckCircle2, AlertCircle, HelpCircle, FileText, User, ShieldCheck } from "lucide-react";

const ICON = {
  met: CheckCircle2,
  missing: AlertCircle,
  needs_review: HelpCircle,
};

export default function FundingDetail({ program, business, docs, existingApp, onApply, onClose }) {
  const checklist = useMemo(
    () => (program ? evaluateChecklist(program, business, docs) : []),
    [program, business, docs]
  );
  if (!program) return null;
  const counts = checklistCounts(checklist);
  const callLabel = CALL_STATUSES.find((c) => c.key === program.call_status)?.label || program.call_status;

  return (
    <Dialog open={!!program} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[88vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-line">
          <DialogTitle className="pr-6">{program.name}</DialogTitle>
          <DialogDescription>
            {program.funder}
            {program.funding_type ? ` · ${program.funding_type}` : ""}
            {program.max_amount != null ? ` · Up to ${formatRand(program.max_amount)}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-5 py-4 space-y-4 text-sm">
          {program.summary && <p className="text-ink font-medium">{program.summary}</p>}
          {program.description && <p className="text-mute leading-relaxed">{program.description}</p>}

          {/* Key facts */}
          <div className="grid grid-cols-2 gap-2.5">
            {program.call_status && (
              <Fact label="Availability" value={callLabel} />
            )}
            {program.deadline && (
              <Fact label="Closing date" value={formatSAST(program.deadline)} />
            )}
            {program.support_type && (
              <Fact label="Support" value={program.support_type} />
            )}
            {program.target_groups?.length > 0 && (
              <Fact label="Who it's for" value={program.target_groups.join(", ")} />
            )}
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-brand" /> Requirement checklist
              </h3>
              <span className="text-xs text-mute">
                {counts.met} met · {counts.missing} missing · {counts.needs_review} to review
              </span>
            </div>
            <div className="rounded-xl border border-line overflow-hidden">
              {checklist.map((c, i) => {
                const Icon = ICON[c.status];
                const cs = CHECKLIST_STATUS[c.status];
                return (
                  <div key={c.key || i} className="flex items-start gap-2.5 px-3 py-2.5 border-b border-line last:border-0 bg-shell/40">
                    <Icon className={`w-4 h-4 mt-0.5 flex-none ${c.status === "met" ? "text-emerald-600" : c.status === "missing" ? "text-red-500" : "text-amber-500"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <b className="text-xs text-ink">{c.label}</b>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${cs.className}`}>{cs.label}</span>
                      </div>
                      {c.hint && <p className="text-[11px] text-mute mt-0.5 leading-snug">{c.hint}</p>}
                      {c.type === "document" && c.status === "missing" && (
                        <p className="text-[11px] text-red-500 mt-0.5">Upload this document during the application to mark it.</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {checklist.length === 0 && <p className="px-3 py-3 text-xs text-mute">No specific requirements recorded for this programme.</p>}
            </div>
            <p className="text-[11px] text-mute mt-1.5 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Checklist is based on your saved onboarding profile and documents — it is not a funding decision.
            </p>
          </div>

          {/* Official source */}
          <div className="rounded-xl bg-soft/60 border border-line p-3 text-xs">
            <div className="flex items-center gap-1.5 text-ink font-semibold mb-1">
              <User className="w-3.5 h-3.5" /> Source & how to apply
            </div>
            <p className="text-mute leading-snug">
              {program.source_name || "Official source"}
              {program.source_verified_at && ` · verified ${program.source_verified_at}`}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {program.source_url && (
                <a href={program.source_url} target="_blank" rel="noreferrer" className="led-btn led-btn-s led-btn-l flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" /> Source page
                </a>
              )}
              {program.apply_url && (
                <a href={program.apply_url} target="_blank" rel="noreferrer" className="led-btn led-btn-s flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5" /> Official apply portal
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-line bg-shell/60 flex items-center gap-2">
          {existingApp ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-mute">You've applied</span>
              <StatusPill status={existingApp.status} />
            </div>
          ) : (
            <>
              <button onClick={onApply} className="led-btn flex-1 flex items-center justify-center gap-2">
                <Landmark className="w-4 h-4" /> Apply on the LED portal
              </button>
              {program.apply_url && (
                <a href={program.apply_url} target="_blank" rel="noreferrer" className="led-btn led-btn-l flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4" /> Official
                </a>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Fact({ label, value }) {
  return (
    <div className="rounded-lg bg-soft/50 p-2.5">
      <p className="text-[10px] font-semibold text-mute uppercase tracking-wide">{label}</p>
      <p className="text-xs text-ink mt-0.5 leading-snug">{value}</p>
    </div>
  );
}