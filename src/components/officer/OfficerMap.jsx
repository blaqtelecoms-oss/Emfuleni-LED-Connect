import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import { SectionLoading, SectionEmpty } from "@/components/SectionStates";
import { Map as MapIcon, Store, Flag } from "lucide-react";

const HEAT = ["bg-soft", "bg-aqua/40", "bg-aqua/70", "bg-brand/60", "bg-brand/90", "bg-brand text-white"];

export default function OfficerMap() {
  const { data, loading } = useLedList(() =>
    Promise.all([
      base44.entities.Ward.list().catch(() => []),
      base44.entities.Business.list().catch(() => []),
      base44.entities.Report.list().catch(() => []),
    ])
  );

  const [metric, setMetric] = useState("businesses");

  const wards = data?.[0] || [];
  const businesses = data?.[1] || [];
  const reports = data?.[2] || [];

  const wardStats = useMemo(() => {
    if (!wards.length) return [];
    return wards.map((w) => {
      const bizCount = businesses.filter((b) => b.ward === w.area_name || b.area === w.area_name).length;
      const reportCount = reports.filter((r) => r.area === w.area_name).length;
      return { ...w, bizCount, reportCount };
    });
  }, [wards, businesses, reports]);

  if (loading) return <SectionLoading />;
  if (!wardStats.length)
    return (
      <div>
        <PageHeader title="Map" subtitle="Ward coverage across Emfuleni's wards." />
        <SectionEmpty>No ward data yet. Add wards to see coverage.</SectionEmpty>
      </div>
    );

  const values = wardStats.map((w) => (metric === "businesses" ? w.bizCount : w.reportCount));
  const max = Math.max(...values, 1);

  const heatLevel = (v) => {
    if (v === 0) return 0;
    const pct = v / max;
    if (pct > 0.8) return 5;
    if (pct > 0.6) return 4;
    if (pct > 0.4) return 3;
    if (pct > 0.2) return 2;
    return 1;
  };

  return (
    <div>
      <PageHeader title="Map" subtitle="Ward coverage heatmap across Emfuleni's wards." />

      <div className="flex gap-2 mb-4">
        <button onClick={() => setMetric("businesses")} className={`led-chip ${metric === "businesses" ? "on" : ""}`}>Businesses</button>
        <button onClick={() => setMetric("reports")} className={`led-chip ${metric === "reports" ? "on" : ""}`}>Service reports</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {wardStats.map((w) => {
          const val = metric === "businesses" ? w.bizCount : w.reportCount;
          const level = heatLevel(val);
          return (
            <div key={w.id || w.number} className={`rounded-[12px] p-3 ${HEAT[level]} transition-all`}>
              <div className="flex items-center justify-between mb-1">
                <b className="text-sm">Ward {w.number}</b>
                {metric === "businesses" ? <Store className="w-3.5 h-3.5 opacity-70" /> : <Flag className="w-3.5 h-3.5 opacity-70" />}
              </div>
              <span className="text-xs opacity-80 block">{w.area_name}</span>
              <b className="text-[20px] block mt-1">{val}</b>
            </div>
          );
        })}
      </div>

      <div className="mt-5 led-box flex items-center gap-4">
        <span className="text-xs font-semibold text-mute">Coverage</span>
        <div className="flex items-center gap-1.5">
          {HEAT.map((h, i) => (
            <div key={i} className={`w-8 h-3.5 rounded ${h}`} />
          ))}
        </div>
        <span className="text-xs text-mute">Low → High</span>
      </div>
    </div>
  );
}