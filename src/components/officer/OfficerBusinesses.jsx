import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { SectionLoading, SectionEmpty } from "@/components/SectionStates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Search, Phone, MapPin, Check, X } from "lucide-react";

const SECTORS = ["Retail", "Food", "Trades", "Services", "Agriculture", "Manufacturing"];

export default function OfficerBusinesses() {
  const { user } = useAuth();
  const { data, loading, reload } = useLedList(() => base44.entities.Business.list().catch(() => []));
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("All");
  const [active, setActive] = useState(null);
  const [busy, setBusy] = useState(false);

  const businesses = data || [];
  const filtered = useMemo(
    () =>
      businesses.filter((b) => {
        if (sector !== "All" && b.sector !== sector) return false;
        if (q && !`${b.name} ${b.area} ${b.sector}`.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [businesses, q, sector]
  );

  const changeStatus = async (b, s) => {
    setBusy(true);
    try {
      await base44.entities.Business.update(b.id, {
        status: s,
        verified_by: user.id,
        verified_at: s === "verified" ? new Date().toISOString() : null,
      });
      toast({ title: s === "verified" ? "Business verified" : "Verification rejected", description: b.name });
      reload();
      setActive((a) => (a && a.id === b.id ? { ...a, status: s } : a));
    } catch (e) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Business register" subtitle="Search, inspect and verify local business registrations." />

      <div className="flex flex-wrap gap-2 items-center mb-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or area"
            className="led-field pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center mb-4">
        {["All", ...SECTORS].map((s) => (
          <button key={s} onClick={() => setSector(s)} className={`led-chip ${sector === s ? "on" : ""}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <SectionLoading />
      ) : filtered.length === 0 ? (
        <SectionEmpty>No businesses match your filters.</SectionEmpty>
      ) : (
        <div className="led-box overflow-x-auto">
          <table className="w-full border-collapse min-w-[560px]">
            <thead>
              <tr>
                {["Business", "Sector", "Area", "Jobs", "Status"].map((h) => (
                  <th key={h} className="text-left text-mute font-semibold text-xs py-2 px-2 border-b border-line">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => setActive(b)}
                  className="cursor-pointer hover:bg-soft/60"
                >
                  <td className="py-2.5 px-2 border-b border-line">
                    <b className="text-sm text-ink">{b.name}</b>
                  </td>
                  <td className="py-2.5 px-2 border-b border-line text-sm text-ink">{b.sector}</td>
                  <td className="py-2.5 px-2 border-b border-line text-sm text-ink">{b.area}</td>
                  <td className="py-2.5 px-2 border-b border-line text-sm text-ink">{b.jobs_count || 0}</td>
                  <td className="py-2.5 px-2 border-b border-line" onClick={(e) => e.stopPropagation()}>
                    {b.status === "pending" ? (
                      <button
                        disabled={busy}
                        onClick={() => changeStatus(b, "verified")}
                        className="led-btn led-btn-s"
                      >
                        Verify
                      </button>
                    ) : (
                      <StatusPill status={b.status} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>{active.name}</DialogTitle>
                <DialogDescription>
                  {active.sector} · {active.area}
                  {active.ward ? ` · ${active.ward}` : ""}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p className="text-ink">{active.description || "No description provided."}</p>
                <div className="flex items-center gap-2 text-mute">
                  <Phone className="w-4 h-4" /> {active.phone || "—"}
                </div>
                <div className="flex items-center gap-2 text-mute">
                  <MapPin className="w-4 h-4" /> {active.area}
                  {active.ward ? `, ${active.ward}` : ""}
                </div>
                <div className="flex gap-4 text-xs text-mute">
                  <span>{active.jobs_count || 0} jobs posted</span>
                  <span>{active.profile_views || 0} profile views</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-mute">Status:</span>
                  <StatusPill status={active.status} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {active.status !== "verified" && (
                  <button
                    disabled={busy}
                    onClick={() => changeStatus(active, "verified")}
                    className="led-btn led-btn-s flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Verify
                  </button>
                )}
                {active.status !== "rejected" && (
                  <button
                    disabled={busy}
                    onClick={() => changeStatus(active, "rejected")}
                    className="led-btn led-btn-r led-btn-s flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                )}
                {active.status !== "pending" && (
                  <button
                    disabled={busy}
                    onClick={() => changeStatus(active, "pending")}
                    className="led-btn led-btn-l led-btn-s"
                  >
                    Reopen
                  </button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}