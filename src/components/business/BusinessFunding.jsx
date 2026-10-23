import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useLedProfile } from "@/hooks/useLedProfile";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { SectionLoading, SectionEmpty } from "@/components/SectionStates";
import { toast } from "@/components/ui/use-toast";
import { formatRand } from "@/lib/ledUtils";
import { FUNDERS } from "@/lib/fundingUtils";
import FundingProgramCard from "@/components/business/FundingProgramCard";
import FundingDetail from "@/components/business/FundingDetail";
import FundingApplyDialog from "@/components/business/FundingApplyDialog";
import { Search, Landmark } from "lucide-react";

export default function BusinessFunding() {
  const { business } = useLedProfile();
  const { data, loading, reload } = useLedList(
    () =>
      Promise.all([
        base44.entities.Program.filter({ status: "open" }).catch(() => []),
        base44.entities.FundingApplication.filter({}).catch(() => []),
        business?.id ? base44.entities.BusinessDocument.filter({ business: business.id }).catch(() => []) : Promise.resolve([]),
      ]),
    [business?.id]
  );

  const [query, setQuery] = useState("");
  const [funder, setFunder] = useState("All");
  const [detail, setDetail] = useState(null);
  const [applying, setApplying] = useState(null);
  const appMap = useMemo(() => Object.fromEntries((data?.[1] || []).map((a) => [a.program, a])), [data]);

  if (loading || !data) return <SectionLoading />;
  const [programs, apps, docs] = data;

  const isVerified = business?.status === "verified";

  const filtered = programs.filter((p) => {
    if (funder !== "All" && p.funder !== funder) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.summary?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.target_groups?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const openApply = (p) => {
    if (!isVerified) {
      toast({ title: "Verification required", description: "Your business must be verified before applying for funding.", variant: "destructive" });
      return;
    }
    setDetail(null);
    setApplying(p);
  };

  return (
    <div>
      <PageHeader title="Funding" subtitle="Browse local and national programmes, see your readiness checklist, and apply on the LED portal." />

      {!isVerified && (
        <div className="led-box border-l-4 border-l-tangerine mb-4">
          <b className="text-sm text-ink">Verification required</b>
          <p className="text-mute text-xs mt-0.5">Your business must be verified before you can submit a funding application.</p>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-mute absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search programmes…"
            className="led-field pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["All", ...FUNDERS].map((f) => (
            <button key={f} onClick={() => setFunder(f)} className={`led-chip ${funder === f ? "on" : ""}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <SectionEmpty>No programmes match your search.</SectionEmpty>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {filtered.map((p) => (
            <FundingProgramCard
              key={p.id}
              program={p}
              business={business}
              docs={docs}
              hasApp={!!appMap[p.id]}
              onOpen={() => setDetail(p)}
            />
          ))}
        </div>
      )}

      {/* My applications */}
      {apps.length > 0 && (
        <div>
          <h2 className="text-[17px] font-bold text-ink mb-2.5 flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-brand" /> My applications
          </h2>
          <div className="space-y-2">
            {apps.map((a) => {
              const p = programs.find((x) => x.id === a.program) || { name: "Programme removed" };
              return (
                <div key={a.id} className="led-box py-3">
                  <div className="flex items-center justify-between mb-1">
                    <b className="text-sm text-ink">{p.name}</b>
                    <StatusPill status={a.status} />
                  </div>
                  <span className="text-xs text-mute">Requested: {formatRand(a.requested_amount)}</span>
                  {a.purpose && <p className="text-xs text-mute mt-0.5">{a.purpose}</p>}
                  {a.decision_note && (
                    <div className="mt-1.5 rounded-lg bg-soft p-2 text-xs">
                      <b className="text-ink">Decision: </b>
                      <span className="text-mute">{a.decision_note}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <FundingDetail
        program={detail}
        business={business}
        docs={docs}
        existingApp={detail ? appMap[detail.id] : null}
        onApply={() => openApply(detail)}
        onClose={() => setDetail(null)}
      />
      <FundingApplyDialog
        program={applying}
        business={business}
        docs={docs}
        onSubmitted={() => {
          setApplying(null);
          reload();
        }}
        onClose={() => setApplying(null)}
      />
    </div>
  );
}