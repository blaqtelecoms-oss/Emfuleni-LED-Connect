import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { SectionLoading, SectionEmpty } from "@/components/SectionStates";
import { formatSAST } from "@/lib/ledUtils";
import { toast } from "@/components/ui/use-toast";
import { Megaphone, Check } from "lucide-react";

const TYPES = ["Electricity outage", "Water outage", "Road closure", "Community event", "General notice"];
const CHANNELS = ["App", "SMS", "WhatsApp"];
// Left-rail colour per notice type, matching the supplied design's `upd` palette.
const TYPE_TONE = {
  "Electricity outage": "led-task",
  "Water outage": "led-task b",
  "Road closure": "led-task",
  "Community event": "led-task g",
  "General notice": "led-task",
};

const toLocalInput = (d) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const empty = {
  type: "General notice",
  headline: "",
  details: "",
  all_areas: false,
  areas: [],
  starts_at: toLocalInput(new Date(Date.now() + 3600000)),
  ends_at: toLocalInput(new Date(Date.now() + 3 * 3600000)),
  channels: ["App"],
};

export default function OfficerUpdates() {
  const { user } = useAuth();
  const { data, loading, reload } = useLedList(() => base44.entities.Notice.list().catch(() => []));
  const wards = useLedList(() => base44.entities.Ward.list().catch(() => []));
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const notices = data || [];

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleArea = (name) =>
    setForm((f) => ({ ...f, areas: f.areas.includes(name) ? f.areas.filter((a) => a !== name) : [...f.areas, name] }));
  const toggleChannel = (c) =>
    setForm((f) => ({ ...f, channels: f.channels.includes(c) ? f.channels.filter((x) => x !== c) : [...f.channels, c] }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.headline.trim()) return toast({ title: "Add a headline", variant: "destructive" });
    if (!form.all_areas && form.areas.length === 0)
      return toast({ title: "Select areas or choose all areas", variant: "destructive" });
    if (form.channels.length === 0) return toast({ title: "Select at least one channel", variant: "destructive" });

    setBusy(true);
    try {
      const start = new Date(form.starts_at);
      const end = new Date(form.ends_at);
      const status = start <= new Date() ? "active" : "scheduled";
      await base44.entities.Notice.create({
        type: form.type,
        headline: form.headline.trim(),
        details: form.details.trim(),
        all_areas: form.all_areas,
        areas: form.all_areas ? [] : form.areas,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        channels: form.channels,
        status,
        created_by: user.id,
      });

      const stubbed = form.channels.includes("SMS") || form.channels.includes("WhatsApp");
      if (stubbed) {
        await base44.entities.NotificationLog.create({
          channel: form.channels.includes("SMS") ? "SMS" : "WhatsApp",
          recipient: "audience:" + (form.all_areas ? "all" : form.areas.join(",")),
          template: "notice",
          body: form.headline.trim(),
          status: "queued (stub)",
        }).catch(() => {});
      }

      toast({
        title: status === "active" ? "Notice published" : "Notice scheduled",
        description: stubbed ? "Saved. SMS/WhatsApp sending is a stub pending a messaging provider." : undefined,
      });
      setForm((f) => ({ ...empty, starts_at: f.starts_at, ends_at: f.ends_at }));
      reload();
    } catch (e) {
      toast({ title: "Failed to save notice", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const setNoticeStatus = async (n, status) => {
    try {
      await base44.entities.Notice.update(n.id, { status });
      reload();
    } catch (e) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader title="Updates" subtitle="Publish or schedule notices to wards, by in-app, SMS or WhatsApp." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Composer */}
        <form onSubmit={submit} className="led-box space-y-3">
          <h2 className="text-[17px] font-bold text-ink">New community update</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Type</label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)} className="led-field">
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Channels</label>
              <div className="flex gap-2 h-[44px] items-center">
                {CHANNELS.map((c) => (
                  <label key={c} className="flex items-center gap-1.5 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={form.channels.includes(c)}
                      onChange={() => toggleChannel(c)}
                      className="w-4 h-4 accent-[hsl(var(--green))]"
                    />
                    {c}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Headline</label>
            <input value={form.headline} onChange={(e) => set("headline", e.target.value)} placeholder="e.g. Planned water interruption" className="led-field" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Details</label>
            <textarea value={form.details} onChange={(e) => set("details", e.target.value)} rows={3} placeholder="What residents need to know…" className="led-field" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Starts</label>
              <input type="datetime-local" value={form.starts_at} onChange={(e) => set("starts_at", e.target.value)} className="led-field" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Ends</label>
              <input type="datetime-local" value={form.ends_at} onChange={(e) => set("ends_at", e.target.value)} className="led-field" />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-ink mb-2">
              <input type="checkbox" checked={form.all_areas} onChange={(e) => set("all_areas", e.target.checked)} className="w-4 h-4 accent-[hsl(var(--green))]" />
              All areas
            </label>
            {!form.all_areas && (
              <div className="max-h-40 overflow-auto rounded-lg border border-line p-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {(wards.data || []).map((w) => (
                  <label key={w.id || w.number} className="flex items-center gap-1.5 text-xs text-ink">
                    <input
                      type="checkbox"
                      checked={form.areas.includes(w.area_name)}
                      onChange={() => toggleArea(w.area_name)}
                      className="w-3.5 h-3.5 accent-[hsl(var(--green))]"
                    />
                    W{w.number} · {w.area_name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={busy} className="led-btn flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              {new Date(form.starts_at) <= new Date() ? "Publish now" : "Schedule"}
            </button>
          </div>
        </form>

        {/* Existing notices */}
        <div>
          <h2 className="text-[17px] font-bold text-ink mb-2.5">Existing notices</h2>
          {loading ? (
            <SectionLoading />
          ) : notices.length === 0 ? (
            <SectionEmpty>No notices yet.</SectionEmpty>
          ) : (
            <div>
              {notices
                .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                .map((n) => (
                  <div key={n.id} className={TYPE_TONE[n.type] || "led-task"}>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink text-sm">
                        {n.headline} <StatusPill status={n.status} />
                      </p>
                      <p className="text-xs text-mute">
                        {n.type} · {n.all_areas ? "All areas" : (n.areas || []).join(", ") || "—"}
                      </p>
                      <p className="text-xs text-mute mt-0.5">
                        {formatSAST(n.starts_at)} → {formatSAST(n.ends_at)} · {(n.channels || []).join(", ")}
                      </p>
                      {n.details && <p className="text-sm text-ink mt-1">{n.details}</p>}
                    </div>
                    {(n.status === "active" || n.status === "scheduled") && (
                      <div className="flex flex-col gap-1.5 flex-none">
                        {n.status === "active" ? (
                          <button
                            onClick={() => setNoticeStatus(n, "resolved")}
                            className="led-btn led-btn-s flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Resolve
                          </button>
                        ) : (
                          <button
                            onClick={() => setNoticeStatus(n, "active")}
                            className="led-btn led-btn-s"
                          >
                            Publish now
                          </button>
                        )}
                        <button
                          onClick={() => setNoticeStatus(n, "cancelled")}
                          className="led-btn led-btn-r led-btn-s"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}