import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import { SectionLoading, SectionEmpty } from "@/components/SectionStates";
import { toast } from "@/components/ui/use-toast";
import { formatSAST } from "@/lib/ledUtils";
import { Loader2, Send, Megaphone } from "lucide-react";

const CHANNELS = ["SMS", "WhatsApp", "Email"];

export default function OfficerMessages() {
  const { user } = useAuth();
  const { data, loading, reload } = useLedList(() =>
    Promise.all([
      base44.entities.Broadcast.list().catch(() => []),
      base44.entities.UserProfile.list().catch(() => []),
      base44.entities.Business.list().catch(() => []),
    ])
  );

  const [form, setForm] = useState({ audience: "all", channel: "Email", body: "" });
  const [busy, setBusy] = useState(false);

  if (loading || !data) return <SectionLoading />;
  const [broadcasts, profiles, businesses] = data;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const estimateRecipients = () => {
    if (form.audience === "members") return profiles.filter((p) => p.account_type === "member").length;
    if (form.audience === "businesses") return businesses.length;
    return profiles.length + businesses.length;
  };

  const send = async (e) => {
    e.preventDefault();
    if (!form.body.trim()) return toast({ title: "Message body is required", variant: "destructive" });
    setBusy(true);
    try {
      const count = estimateRecipients();
      const stubbed = form.channel === "SMS" || form.channel === "WhatsApp";
      await base44.entities.Broadcast.create({
        audience_filter: form.audience,
        channel: form.channel,
        body: form.body.trim(),
        sent_by: user.id,
        sent_at: new Date().toISOString(),
        recipient_count: count,
      });
      if (stubbed) {
        await base44.entities.NotificationLog.create({
          channel: form.channel,
          recipient: `audience:${form.audience}`,
          template: "broadcast",
          body: form.body.trim(),
          status: "queued (stub)",
        }).catch(() => {});
      }
      toast({
        title: "Broadcast saved",
        description: stubbed ? "Recorded. SMS/WhatsApp sending is a stub pending a messaging provider." : "Email broadcast queued.",
      });
      setForm({ ...form, body: "" });
      reload();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Messages" subtitle="Send bulk SMS, WhatsApp or Email broadcasts to your audience. SMS and WhatsApp require a messaging provider." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <form onSubmit={send} className="led-box space-y-3">
          <h2 className="text-[17px] font-bold text-ink">New broadcast</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Audience</label>
              <select value={form.audience} onChange={(e) => set("audience", e.target.value)} className="led-field">
                <option value="all">All users</option>
                <option value="members">Members only</option>
                <option value="businesses">Businesses only</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Channel</label>
              <select value={form.channel} onChange={(e) => set("channel", e.target.value)} className="led-field">
                {CHANNELS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Message</label>
            <textarea value={form.body} onChange={(e) => set("body", e.target.value)} rows={4} placeholder="Type your broadcast message…" className="led-field" />
          </div>
          <div className="rounded-lg bg-soft p-2.5 text-xs text-mute">
            Estimated recipients: <b className="text-ink">{estimateRecipients()}</b>
            {(form.channel === "SMS" || form.channel === "WhatsApp") && <span className="block mt-1 text-tangerine">SMS/WhatsApp is stubbed until a messaging provider is connected.</span>}
          </div>
          <button type="submit" disabled={busy} className="led-btn flex items-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send broadcast
          </button>
        </form>

        <div>
          <h2 className="text-[17px] font-bold text-ink mb-2.5">Broadcast history</h2>
          {broadcasts.length === 0 ? (
            <SectionEmpty>No broadcasts sent yet.</SectionEmpty>
          ) : (
            <div className="space-y-2">
              {broadcasts.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at)).map((b) => (
                <div key={b.id} className="led-box py-3">
                  <div className="flex items-center justify-between mb-1">
                    <b className="text-sm text-ink flex items-center gap-1.5"><Megaphone className="w-3.5 h-3.5 text-brand" /> {b.channel}</b>
                    <span className="text-xs text-mute">{formatSAST(b.sent_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="text-sm text-ink">{b.body}</p>
                  <span className="text-xs text-mute">{b.audience_filter || "all"} · {b.recipient_count || 0} recipients</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}