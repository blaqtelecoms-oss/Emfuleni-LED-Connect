import React from "react";
import { base44 } from "@/api/base44Client";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import { SectionLoading } from "@/components/SectionStates";
import { formatRand, formatSAST } from "@/lib/ledUtils";
import { TrendingUp, Store, Briefcase, Landmark, Flag, Users } from "lucide-react";

const SECTORS = ["Retail", "Food", "Trades", "Services", "Agriculture", "Manufacturing"];

export default function OfficerImpact() {
  const { data, loading } = useLedList(() =>
    Promise.all([
      base44.entities.Business.list().catch(() => []),
      base44.entities.Opportunity.list().catch(() => []),
      base44.entities.OpportunityResponse.list().catch(() => []),
      base44.entities.FundingApplication.list().catch(() => []),
      base44.entities.Report.list().catch(() => []),
      base44.entities.WorkshopBooking.list().catch(() => []),
    ])
  );

  if (loading || !data) return <SectionLoading />;
  const [businesses, opps, responses, apps, reports, bookings] = data;

  const verifiedBiz = businesses.filter((b) => b.status === "verified");
  const jobsPosted = opps.filter((o) => o.type === "job");
  const awarded = responses.filter((r) => r.status === "hired_or_awarded");
  const approvedFunding = apps.filter((a) => a.status === "approved");
  const disbursed = approvedFunding.reduce((s, a) => s + (a.requested_amount || 0), 0);
  const fixedReports = reports.filter((r) => r.status === "fixed");

  const kpis = [
    { icon: Store, value: verifiedBiz.length, label: "Verified businesses", tone: "bg-brand text-white" },
    { icon: Briefcase, value: jobsPosted.length, label: "Jobs posted", tone: "bg-aqua text-ink" },
    { icon: Users, value: awarded.length, label: "People hired/awarded", tone: "bg-tangerine text-white" },
    { icon: Landmark, value: formatRand(disbursed), label: "Funding disbursed", tone: "bg-brand text-white" },
    { icon: Flag, value: fixedReports.length, label: "Reports fixed", tone: "bg-aqua text-ink" },
    { icon: TrendingUp, value: bookings.length, label: "Workshop bookings", tone: "bg-tangerine text-white" },
  ];

  const sectorCounts = SECTORS.map((s) => ({
    sector: s,
    count: verifiedBiz.filter((b) => b.sector === s).length,
  }));
  const maxSector = Math.max(...sectorCounts.map((s) => s.count), 1);

  return (
    <div>
      <PageHeader title="Impact" subtitle="Key performance indicators across the LED programme, calculated from live data." />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {kpis.map((k, i) => (
          <div key={i} className={`rounded-[14px] p-4 ${k.tone} min-h-[100px] flex flex-col justify-between`}>
            <k.icon className="w-5 h-5 opacity-80" />
            <div>
              <b className="text-[22px] font-bold block leading-none">{k.value}</b>
              <span className="text-xs opacity-80 block mt-0.5">{k.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="led-box">
          <h2 className="text-[17px] font-bold text-ink mb-3">Businesses by sector</h2>
          <div className="space-y-2.5">
            {sectorCounts.map((s) => (
              <div key={s.sector}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-ink">{s.sector}</span>
                  <span className="text-xs text-mute">{s.count}</span>
                </div>
                <div className="h-2.5 rounded-full bg-soft overflow-hidden">
                  <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${(s.count / maxSector) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="led-box">
          <h2 className="text-[17px] font-bold text-ink mb-3">Funding decisions</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-soft p-3 text-center">
              <b className="text-[20px] text-ink block">{apps.filter((a) => a.status === "approved").length}</b>
              <span className="text-xs text-mute">Approved</span>
            </div>
            <div className="rounded-lg bg-soft p-3 text-center">
              <b className="text-[20px] text-ink block">{apps.filter((a) => a.status === "declined").length}</b>
              <span className="text-xs text-mute">Declined</span>
            </div>
            <div className="rounded-lg bg-soft p-3 text-center">
              <b className="text-[20px] text-ink block">{apps.filter((a) => a.status === "submitted" || a.status === "under_review").length}</b>
              <span className="text-xs text-mute">In review</span>
            </div>
            <div className="rounded-lg bg-soft p-3 text-center">
              <b className="text-[20px] text-ink block">{apps.length}</b>
              <span className="text-xs text-mute">Total</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}