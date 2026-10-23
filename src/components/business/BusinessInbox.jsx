import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import { SectionLoading, SectionEmpty } from "@/components/SectionStates";
import { toast } from "@/components/ui/use-toast";
import { formatSAST } from "@/lib/ledUtils";
import { Bell, Check, Inbox } from "lucide-react";

export default function BusinessInbox() {
  const { user } = useAuth();
  const { data, loading, reload } = useLedList(() => base44.entities.InboxItem.filter({ recipient: user?.id }).catch(() => []), [user?.id]);
  const [filter, setFilter] = useState("all");

  if (loading) return <SectionLoading />;
  const items = (data || []).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const filtered = filter === "unread" ? items.filter((i) => !i.read) : items;
  const unreadCount = items.filter((i) => !i.read).length;

  const markRead = async (item) => {
    if (item.read) return;
    try {
      await base44.entities.InboxItem.update(item.id, { read: true });
      reload();
    } catch (e) {
      toast({ title: "Failed to update", description: e.message, variant: "destructive" });
    }
  };

  const markAllRead = async () => {
    const unread = items.filter((i) => !i.read);
    for (const u of unread) {
      try { await base44.entities.InboxItem.update(u.id, { read: true }); } catch {}
    }
    reload();
  };

  return (
    <div>
      <PageHeader
        title="Inbox"
        subtitle="Notices and messages from the LED office."
        actions={unreadCount > 0 ? <button onClick={markAllRead} className="led-btn led-btn-s led-btn-l flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Mark all read</button> : null}
      />

      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilter("all")} className={`led-chip ${filter === "all" ? "on" : ""}`}>All ({items.length})</button>
        <button onClick={() => setFilter("unread")} className={`led-chip ${filter === "unread" ? "on" : ""}`}>Unread ({unreadCount})</button>
      </div>

      {filtered.length === 0 ? (
        <SectionEmpty><Inbox className="w-8 h-8 text-mute mx-auto mb-2" />No messages{filter === "unread" ? " unread" : ""}.</SectionEmpty>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => markRead(item)}
              className={`led-box py-3 cursor-pointer ${item.read ? "" : "border-l-4 border-l-brand"}`}
            >
              <div className="flex items-start gap-3">
                <Bell className={`w-4 h-4 flex-none ${item.read ? "text-mute" : "text-brand"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <b className={`text-sm ${item.read ? "text-mute" : "text-ink"}`}>{item.title}</b>
                    <span className="text-xs text-mute whitespace-nowrap">{formatSAST(item.created_date, { day: "numeric", month: "short" })}</span>
                  </div>
                  {item.body && <p className="text-xs text-mute mt-0.5">{item.body}</p>}
                  {item.sender && <span className="text-xs text-mute">From: {item.sender}</span>}
                </div>
                {!item.read && <span className="w-2 h-2 rounded-full bg-brand flex-none mt-1.5" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}