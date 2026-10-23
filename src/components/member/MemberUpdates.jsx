import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLedProfile } from "@/hooks/useLedProfile";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { SectionLoading, SectionEmpty } from "@/components/SectionStates";
import { toast } from "@/components/ui/use-toast";
import { formatSAST, formatSASTTime } from "@/lib/ledUtils";
import { Bell, Clock, MapPin, BellRing } from "lucide-react";

const TYPE_TONE = {
  "Electricity outage": "led-task",
  "Water outage": "led-task b",
  "Road closure": "led-task",
  "Community event": "led-task g",
  "General notice": "led-task",
};

export default function MemberUpdates() {
  const { user } = useAuth();
  const { profile } = useLedProfile();
  const { data, loading, reload } = useLedList(() =>
    Promise.all([
      base44.entities.Notice.filter({ status: "active" }).catch(() => []),
      base44.entities.NoticeReminder.filter({ user: user?.id }).catch(() => []),
    ]),
    [user?.id, profile?.area]
  );

  const [filter, setFilter] = useState("mine");

  if (loading || !data) return <SectionLoading />;
  const [notices, reminders] = data;
  const reminderMap = Object.fromEntries(reminders.map((r) => [r.notice, r]));
  const myArea = notices.filter((n) => n.all_areas || !n.areas?.length || n.areas.includes(profile?.area));
  const filtered = filter === "mine" ? myArea : notices;

  const toggleReminder = async (n) => {
    const existing = reminderMap[n.id];
    try {
      if (existing) {
        await base44.entities.NoticeReminder.delete(existing.id);
        toast({ title: "Reminder removed" });
      } else {
        await base44.entities.NoticeReminder.create({ notice: n.id, user: user.id });
        toast({ title: "Reminder set", description: "You'll get an in-app reminder for this notice." });
      }
      reload();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader title="Updates" subtitle="Outage and event notices for your area and across Emfuleni." />

      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilter("mine")} className={`led-chip ${filter === "mine" ? "on" : ""}`}>My area</button>
        <button onClick={() => setFilter("all")} className={`led-chip ${filter === "all" ? "on" : ""}`}>All notices</button>
      </div>

      {filtered.length === 0 ? (
        <SectionEmpty>No active notices{filter === "mine" ? " for your area" : ""}.</SectionEmpty>
      ) : (
        <div>
          {filtered.map((n) => (
            <div key={n.id} className={TYPE_TONE[n.type] || "led-task"}>
              <Bell className="w-4 h-4 text-brand flex-none" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink text-sm">{n.headline} <StatusPill status={n.status} /></p>
                <p className="text-xs text-mute">{n.type}</p>
                <p className="text-xs text-mute mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatSAST(n.starts_at)} → {formatSAST(n.ends_at)}
                </p>
                {n.areas?.length > 0 && !n.all_areas && (
                  <p className="text-xs text-mute flex items-center gap-1"><MapPin className="w-3 h-3" /> {n.areas.join(", ")}</p>
                )}
                {n.details && <p className="text-sm text-ink mt-1">{n.details}</p>}
              </div>
              <button
                onClick={() => toggleReminder(n)}
                className={`led-btn led-btn-s ${reminderMap[n.id] ? "led-btn-l" : ""} flex items-center gap-1 flex-none`}
              >
                {reminderMap[n.id] ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                {reminderMap[n.id] ? "On" : "Remind"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}