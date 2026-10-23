import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { SectionLoading, SectionEmpty } from "@/components/SectionStates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { MapPin, Flag, Play, Check } from "lucide-react";

export default function OfficerReports() {
  const { data, loading, reload } = useLedList(() => base44.entities.Report.list().catch(() => []));
  const [status, setStatus] = useState("");
  const [active, setActive] = useState(null);
  const [assignedTo, setAssignedTo] = useState("");
  const [busy, setBusy] = useState(false);

  const reports = (data || []).filter((r) => !status || r.status === status);

  const changeStatus = async (r, s) => {
    setBusy(true);
    try {
      await base44.entities.Report.update(r.id, { status: s });
      toast({ title: "Status updated", description: `${r.reference} → ${s.replace(/_/g, " ")}` });
      reload();
      setActive((a) => (a && a.id === r.id ? { ...a, status: s } : a));
    } catch (e) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const saveAssigned = async () => {
    if (!active) return;
    setBusy(true);
    try {
      await base44.entities.Report.update(active.id, { assigned_to: assignedTo.trim() });
      toast({ title: "Assignee saved" });
      reload();
      setActive((a) => (a && a.id === active.id ? { ...a, assigned_to: assignedTo.trim() } : a));
    } catch (e) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Service reports" subtitle="Review reports from residents and update status as work progresses." />

      <div className="flex flex-wrap gap-2 items-center mb-4">
        {["", "received", "in_progress", "fixed"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatus(s)}
            className={`led-chip ${status === s ? "on" : ""}`}
          >
            {s ? s.replace(/_/g, " ") : "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <SectionLoading />
      ) : reports.length === 0 ? (
        <SectionEmpty>No reports match this filter.</SectionEmpty>
      ) : (
        <div className="led-box overflow-x-auto">
          <table className="w-full border-collapse min-w-[560px]">
            <thead>
              <tr>
                {["Reference", "Type", "Area", "Assigned to", "Status"].map((h) => (
                  <th key={h} className="text-left text-mute font-semibold text-xs py-2 px-2 border-b border-line">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => {
                    setActive(r);
                    setAssignedTo(r.assigned_to || "");
                  }}
                  className="cursor-pointer hover:bg-soft/60"
                >
                  <td className="py-2.5 px-2 border-b border-line">
                    <b className="text-sm text-ink">{r.reference}</b>
                  </td>
                  <td className="py-2.5 px-2 border-b border-line text-sm text-ink">{r.type}</td>
                  <td className="py-2.5 px-2 border-b border-line text-sm text-ink">{r.area}</td>
                  <td className="py-2.5 px-2 border-b border-line text-sm text-mute">{r.assigned_to || "—"}</td>
                  <td className="py-2.5 px-2 border-b border-line">
                    <StatusPill status={r.status} />
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
                <DialogTitle>
                  {active.reference} · {active.type}
                </DialogTitle>
                <DialogDescription>{active.area}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p className="text-ink">{active.description || "No description provided."}</p>
                {active.location && (
                  <div className="flex items-center gap-2 text-mute">
                    <MapPin className="w-4 h-4" /> {active.location}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-mute">Status:</span>
                  <StatusPill status={active.status} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Assigned to</label>
                  <div className="flex gap-2">
                    <input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="e.g. LED Field Officer" className="led-field" />
                    <button onClick={saveAssigned} disabled={busy} className="led-btn led-btn-s led-btn-l">
                      Save
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {active.status !== "in_progress" && active.status !== "fixed" && (
                    <button
                      disabled={busy}
                      onClick={() => changeStatus(active, "in_progress")}
                      className="led-btn led-btn-s flex items-center gap-1.5"
                    >
                      <Play className="w-4 h-4" /> Start work
                    </button>
                  )}
                  {active.status !== "fixed" && (
                    <button
                      disabled={busy}
                      onClick={() => changeStatus(active, "fixed")}
                      className="led-btn led-btn-s flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Mark fixed
                    </button>
                  )}
                  {active.status === "fixed" && (
                    <button
                      disabled={busy}
                      onClick={() => changeStatus(active, "received")}
                      className="led-btn led-btn-l led-btn-s"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}