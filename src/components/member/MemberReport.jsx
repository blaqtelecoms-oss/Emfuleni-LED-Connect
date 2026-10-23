import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLedProfile } from "@/hooks/useLedProfile";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { SectionLoading, SectionEmpty } from "@/components/SectionStates";
import { toast } from "@/components/ui/use-toast";
import { formatSAST } from "@/lib/ledUtils";
import { Flag, Loader2, MapPin } from "lucide-react";

const TYPES = ["Illegal dumping", "Street light out", "Water leak or drainage", "Pothole or road damage", "Safety concern"];

export default function MemberReport() {
  const { user } = useAuth();
  const { profile } = useLedProfile();
  const { data, loading, reload } = useLedList(() => base44.entities.Report.filter({}).catch(() => []), [user?.id]);

  const [form, setForm] = useState({ type: TYPES[0], area: "", description: "", location: "" });
  const [busy, setBusy] = useState(false);

  if (loading) return <SectionLoading />;
  const myReports = (data || []).filter((r) => r.reporter === user?.id || r.created_by_id === user?.id);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.area.trim()) return toast({ title: "Area is required", variant: "destructive" });
    setBusy(true);
    try {
      const ref = `NCL-${Date.now().toString(36).toUpperCase().slice(-6)}`;
      await base44.entities.Report.create({
        reference: ref,
        type: form.type,
        area: form.area.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        reporter: user.id,
        status: "received",
      });
      toast({ title: "Report submitted", description: `Your reference is ${ref}. Track its progress below.` });
      setForm({ type: TYPES[0], area: "", description: "", location: "" });
      reload();
    } catch (e) {
      toast({ title: "Failed to submit", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Report an issue" subtitle="Report service issues in your area. Get a reference to track progress." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <form onSubmit={submit} className="led-box space-y-3">
          <h2 className="text-[17px] font-bold text-ink">New report</h2>
          <div>
            <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Type of issue</label>
            <select value={form.type} onChange={(e) => set("type", e.target.value)} className="led-field">
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Area</label>
            <input value={form.area} onChange={(e) => set("area", e.target.value)} placeholder={profile?.area || "e.g. Madadeni"} className="led-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Location details (optional)</label>
            <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Street or landmark" className="led-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Describe the issue…" className="led-field" />
          </div>
          <button type="submit" disabled={busy} className="led-btn flex items-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
            Submit report
          </button>
        </form>

        <div>
          <h2 className="text-[17px] font-bold text-ink mb-2.5">My reports</h2>
          {myReports.length === 0 ? (
            <SectionEmpty>No reports submitted yet.</SectionEmpty>
          ) : (
            <div className="space-y-2">
              {myReports.map((r) => (
                <div key={r.id} className="led-box py-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <b className="text-sm text-ink">{r.reference}</b>
                      <span className="text-xs text-mute block">{r.type}</span>
                    </div>
                    <StatusPill status={r.status} />
                  </div>
                  <span className="text-xs text-mute flex items-center gap-1"><MapPin className="w-3 h-3" /> {r.area} · {formatSAST(r.created_date)}</span>
                  {r.assigned_to && <span className="text-xs text-mute block mt-0.5">Assigned: {r.assigned_to}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}