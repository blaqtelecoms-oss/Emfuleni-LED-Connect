import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import { SectionLoading, SectionEmpty } from "@/components/SectionStates";
import { toast } from "@/components/ui/use-toast";
import { formatSAST } from "@/lib/ledUtils";
import { Plus, GraduationCap, Calendar, MapPin, Loader2, Users, Trash2 } from "lucide-react";

const toLocalInput = (d) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function OfficerWorkshops() {
  const { data, loading, reload } = useLedList(() =>
    Promise.all([
      base44.entities.Workshop.list().catch(() => []),
      base44.entities.WorkshopBooking.list().catch(() => []),
    ])
  );

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", starts_at: toLocalInput(new Date(Date.now() + 7 * 86400000)), venue: "", capacity: 30 });
  const [busy, setBusy] = useState(false);

  if (loading || !data) return <SectionLoading />;
  const [workshops, bookings] = data;
  const bookingCount = Object.fromEntries(workshops.map((w) => [w.id, bookings.filter((b) => b.workshop === w.id).length]));

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const create = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast({ title: "Title is required", variant: "destructive" });
    setBusy(true);
    try {
      await base44.entities.Workshop.create({
        title: form.title.trim(),
        starts_at: new Date(form.starts_at).toISOString(),
        venue: form.venue.trim(),
        capacity: Number(form.capacity) || 0,
      });
      toast({ title: "Workshop created" });
      setShowForm(false);
      setForm({ ...form, title: "", venue: "" });
      reload();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (w) => {
    if (!confirm(`Delete "${w.title}"? This also removes all bookings.`)) return;
    try {
      await base44.entities.Workshop.delete(w.id);
      toast({ title: "Workshop deleted" });
      reload();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const sorted = [...workshops].sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));

  return (
    <div>
      <PageHeader
        title="Workshops"
        subtitle="Schedule skills development workshops and track bookings."
        actions={<button onClick={() => setShowForm(true)} className="led-btn flex items-center gap-1.5"><Plus className="w-4 h-4" /> New workshop</button>}
      />

      {sorted.length === 0 ? (
        <SectionEmpty>No workshops scheduled.</SectionEmpty>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((w) => {
            const count = bookingCount[w.id] || 0;
            const past = new Date(w.starts_at) < new Date();
            return (
              <div key={w.id} className="led-box py-3 flex flex-wrap items-center gap-3">
                <GraduationCap className="w-5 h-5 text-brand flex-none" />
                <div className="min-w-0 flex-1">
                  <b className="text-sm text-ink block">{w.title}</b>
                  <span className="text-xs text-mute flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatSAST(w.starts_at, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  {w.venue && <span className="text-xs text-mute flex items-center gap-1"><MapPin className="w-3 h-3" /> {w.venue}</span>}
                </div>
                <span className="text-xs text-mute flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {count}/{w.capacity || "∞"}</span>
                {past && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-soft text-mute">Past</span>}
                <button onClick={() => remove(w)} className="led-btn led-btn-r led-btn-s flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-shell rounded-2xl p-5 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[17px] font-bold text-ink mb-3">New workshop</h2>
            <form onSubmit={create} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Title</label>
                <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Business compliance workshop" className="led-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Date & time</label>
                  <input type="datetime-local" value={form.starts_at} onChange={(e) => set("starts_at", e.target.value)} className="led-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Capacity</label>
                  <input type="number" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} className="led-field" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Venue</label>
                <input value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="e.g. Vereeniging Civic Centre" className="led-field" />
              </div>
              <button type="submit" disabled={busy} className="led-btn flex items-center gap-2">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Create workshop
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}