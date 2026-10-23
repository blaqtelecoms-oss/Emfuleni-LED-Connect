import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { SectionLoading, SectionEmpty } from "@/components/SectionStates";
import OfficerVerificationReview from "./OfficerVerificationReview";
import { formatSAST } from "@/lib/ledUtils";
import { ClipboardCheck } from "lucide-react";

const FILTERS = [
  { key: "queue", label: "Queue", match: (s) => s === "submitted" || s === "in_review" },
  { key: "incomplete", label: "Needs info", match: (s) => s === "incomplete" },
  { key: "verified", label: "Verified", match: (s) => s === "verified" },
  { key: "declined", label: "Declined", match: (s) => s === "declined" },
  { key: "all", label: "All", match: () => true },
];

export default function OfficerVerification() {
  const { data, loading, reload } = useLedList(() =>
    Promise.all([
      base44.entities.VerificationApplication.list("-created_date", 300).catch(() => []),
      base44.entities.Business.list().catch(() => []),
    ])
  );
  const [filter, setFilter] = useState("queue");
  const [active, setActive] = useState(null);

  const [apps, businesses] = data || [[], []];
  const bizMap = useMemo(() => {
    const m = {};
    (businesses || []).forEach((b) => (m[b.id] = b));
    return m;
  }, [businesses]);

  const counts = useMemo(() => {
    const c = { queue: 0, incomplete: 0, verified: 0, declined: 0, all: (apps || []).length };
    (apps || []).forEach((a) => {
      if (a.status === "submitted" || a.status === "in_review") c.queue++;
      else if (a.status === "incomplete") c.incomplete++;
      else if (a.status === "verified") c.verified++;
      else if (a.status === "declined") c.declined++;
    });
    return c;
  }, [apps]);

  const f = FILTERS.find((x) => x.key === filter);
  const filtered = (apps || []).filter((a) => f.match(a.status));

  return (
    <div>
      <PageHeader title="Verification queue" subtitle="Review submitted business verification applications and documents." />
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((x) => (
          <button key={x.key} onClick={() => setFilter(x.key)} className={`led-chip ${filter === x.key ? "on" : ""}`}>
            {x.label} ({counts[x.key] ?? 0})
          </button>
        ))}
      </div>

      {loading ? (
        <SectionLoading />
      ) : filtered.length === 0 ? (
        <SectionEmpty>
          <ClipboardCheck className="w-8 h-8 text-mute mx-auto mb-2" />
          No applications in this view.
        </SectionEmpty>
      ) : (
        <div className="led-box overflow-x-auto">
          <table className="w-full border-collapse min-w-[640px]">
            <thead>
              <tr>
                {["Reference", "Business", "Area", "Sector", "Submitted", "Status"].map((h) => (
                  <th key={h} className="text-left text-mute font-semibold text-xs py-2 px-2 border-b border-line">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const b = bizMap[a.business] || {};
                return (
                  <tr key={a.id} onClick={() => setActive({ app: a, business: b })} className="cursor-pointer hover:bg-soft/60">
                    <td className="py-2.5 px-2 border-b border-line text-sm text-ink font-mono">{a.reference || "—"}</td>
                    <td className="py-2.5 px-2 border-b border-line">
                      <b className="text-sm text-ink">{b.name || "Unknown"}</b>
                    </td>
                    <td className="py-2.5 px-2 border-b border-line text-sm text-ink">{b.area || "—"}</td>
                    <td className="py-2.5 px-2 border-b border-line text-sm text-ink">{b.sector || "—"}</td>
                    <td className="py-2.5 px-2 border-b border-line text-sm text-mute">
                      {a.submitted_at ? formatSAST(a.submitted_at, { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="py-2.5 px-2 border-b border-line">
                      <StatusPill status={a.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {active ? (
        <OfficerVerificationReview
          app={active.app}
          business={active.business}
          onClose={() => setActive(null)}
          onDecided={() => {
            setActive(null);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}