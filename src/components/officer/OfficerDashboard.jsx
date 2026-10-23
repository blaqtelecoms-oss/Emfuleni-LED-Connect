import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { SectionLoading } from "@/components/SectionStates";
import { formatRand } from "@/lib/ledUtils";
import { ChevronRight } from "lucide-react";

// Program card colours — cycle through the design's g / b / o palette.
const PC = ["bg-brand text-white", "bg-aqua text-ink", "bg-tangerine text-white"];

export default function OfficerDashboard() {
  const { data, loading } = useLedList(() =>
    Promise.all([
      base44.entities.Business.list().catch(() => []),
      base44.entities.FundingApplication.list().catch(() => []),
      base44.entities.Report.list().catch(() => []),
      base44.entities.Notice.list().catch(() => []),
      base44.entities.Opportunity.filter({ status: "open" }).catch(() => []),
      base44.entities.Program.list().catch(() => []),
    ])
  );

  if (loading || !data) return <SectionLoading />;
  const [biz, apps, reports, notices, opps, programs] = data;

  const pending = biz.filter((b) => b.status === "pending");
  const toReview = apps.filter((a) => a.status === "submitted" || a.status === "under_review");
  const openReports = reports.filter((r) => r.status !== "fixed");

  // Program progress cards (design .pc) — decided vs total per program.
  const programProgress = programs.map((p, i) => {
    const pApps = apps.filter((a) => a.program === p.id);
    const decided = pApps.filter((a) => a.status === "approved" || a.status === "declined").length;
    const total = pApps.length || p.slots_total || 0;
    const pct = total ? Math.round((decided / total) * 100) : 0;
    return { p, decided, total, pct, color: PC[i % PC.length] };
  });

  // "Needs your attention" task rows (design .task) — derived from live queues.
  const tasks = [
    pending.length && { label: `Verify ${pending.length} new business registration${pending.length === 1 ? "" : "s"}`, meta: "Business register", to: "/officer/businesses", tone: "o" },
    toReview.length && { label: `Review ${toReview.length} funding application${toReview.length === 1 ? "" : "s"}`, meta: "Programs and tenders", to: "/officer/programs", tone: "g" },
    openReports.length && { label: `Action ${openReports.length} open service report${openReports.length === 1 ? "" : "s"}`, meta: "Service reports", to: "/officer/reports", tone: "b" },
  ].filter(Boolean);

  return (
    <div>
      <PageHeader title="Hello" subtitle="An overview of community and economic activity, and what needs your attention." />

      {/* Program progress cards */}
      {programProgress.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 mb-5">
          {programProgress.map(({ p, decided, total, pct, color }) => (
            <Link
              key={p.id}
              to="/officer/programs"
              className={`rounded-[14px] p-4 ${color} min-h-[122px] flex flex-col justify-between`}
            >
              <b className="text-[17px] leading-tight block">{p.name}</b>
              <span className="opacity-90 text-xs mt-2 block">
                {decided} of {total} applications decided · {pct}%
                <span className="block h-[5px] rounded bg-white/35 mt-1.5 overflow-hidden">
                  <span className="block h-full bg-current" style={{ width: `${pct}%` }} />
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Needs your attention */}
        <div>
          <h2 className="text-[17px] font-bold text-ink mb-2.5">Needs your attention</h2>
          {tasks.length === 0 ? (
            <div className="led-box text-mute text-sm">Nothing waiting. New items appear here.</div>
          ) : (
            tasks.map((t, i) => (
              <Link key={i} to={t.to} className={`led-task ${t.tone} hover:border-brand/40`}>
                <div className="min-w-0 flex-1">
                  <b className="text-sm text-ink block">{t.label}</b>
                  <span className="text-mute text-xs">{t.meta}</span>
                </div>
                <span className="led-btn led-btn-s led-btn-l flex items-center gap-1">
                  Open <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))
          )}
        </div>

        {/* Statistics */}
        <div>
          <h2 className="text-[17px] font-bold text-ink mb-2.5">Statistics</h2>
          <div className="grid grid-cols-3 gap-2.5 mb-3">
            <div className="rounded-[12px] bg-soft p-3">
              <b className="text-[22px] font-bold text-ink block leading-none">{biz.length}</b>
              <span className="text-mute text-xs">Businesses</span>
            </div>
            <div className="rounded-[12px] bg-soft p-3">
              <b className="text-[22px] font-bold text-ink block leading-none">{toReview.length}</b>
              <span className="text-mute text-xs">To decide</span>
            </div>
            <Link to="/officer/businesses" className="rounded-[12px] border-2 border-dashed border-line p-3 grid place-items-center text-mute hover:text-brand hover:border-brand/40">
              <b className="text-lg leading-none">+</b>
              <span className="text-xs">New business</span>
            </Link>
          </div>
          <div className="rounded-[14px] bg-soft p-4 relative overflow-hidden">
            <span className="text-mute text-xs">Open opportunities</span>
            <b className="text-[20px] text-ink block">{opps.length} live</b>
            <p className="text-mute text-xs mt-1 max-w-[60%]">Tenders and jobs open to the community right now.</p>
            <Link to="/officer/opportunities" className="led-btn led-btn-s mt-2 inline-flex">View</Link>
            {/* decorative bubbles */}
            <span className="absolute -right-8 -bottom-10 w-[130px] h-[130px] rounded-full bg-aqua/70" />
            <span className="absolute right-12 -bottom-4 w-15 h-15 rounded-full bg-gold/80" style={{ width: 60, height: 60 }} />
          </div>
        </div>
      </div>
    </div>
  );
}