import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import { SectionLoading, SectionEmpty } from "@/components/SectionStates";
import { toast } from "@/components/ui/use-toast";
import { Search, Phone, MapPin, Heart } from "lucide-react";

const SECTORS = ["All", "Retail", "Food", "Trades", "Services", "Agriculture", "Manufacturing"];

export default function MemberBuyLocal() {
  const { data, loading } = useLedList(() => base44.entities.Business.filter({ status: "verified" }).catch(() => []));
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("All");

  const businesses = data || [];
  const filtered = useMemo(
    () => businesses.filter((b) => {
      if (sector !== "All" && b.sector !== sector) return false;
      if (q && !`${b.name} ${b.area} ${b.description}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    }),
    [businesses, q, sector]
  );

  return (
    <div>
      <PageHeader title="Buy local" subtitle="Browse verified businesses across Emfuleni. Support your local economy." />

      <div className="flex flex-wrap gap-2 items-center mb-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, area or service" className="led-field pl-9" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center mb-4">
        {SECTORS.map((s) => (
          <button key={s} onClick={() => setSector(s)} className={`led-chip ${sector === s ? "on" : ""}`}>{s}</button>
        ))}
      </div>

      {loading ? (
        <SectionLoading />
      ) : filtered.length === 0 ? (
        <SectionEmpty>No verified businesses match your search.</SectionEmpty>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((b) => (
            <div key={b.id} className="led-box">
              <div className="flex items-start justify-between gap-2 mb-1">
                <b className="text-sm text-ink">{b.name}</b>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#d9efe0] text-[#14532b] whitespace-nowrap">{b.sector}</span>
              </div>
              {b.description && <p className="text-xs text-mute mb-2">{b.description}</p>}
              <div className="space-y-1 text-xs text-mute">
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {b.area}{b.ward ? ` · ${b.ward}` : ""}</span>
                {b.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {b.phone}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}