import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatSAST, formatSASTTime, todayLong } from "@/lib/ledUtils";

const RAIL = ["bg-tangerine", "bg-brand", "bg-aqua"];

export default function PortalCalendar({ portal }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [workshops, opportunities] = await Promise.all([
          base44.entities.Workshop.list().catch(() => []),
          base44.entities.Opportunity.filter({ status: "open" }).catch(() => []),
        ]);
        const evs = [];
        (workshops || []).forEach((w) => {
          if (w.starts_at)
            evs.push({ date: w.starts_at, title: w.title, kind: "Workshop" });
        });
        (opportunities || []).forEach((o) => {
          if (o.closing_date)
            evs.push({
              date: o.closing_date,
              title: o.title,
              kind: o.type === "tender" ? "Tender" : "Job closing",
            });
        });
        evs.sort((a, b) => new Date(a.date) - new Date(b.date));
        if (!cancelled) setEvents(evs.slice(0, 8));
      } catch {
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [portal]);

  // Group events by day label, matching the design's .day headers + .ev rows.
  const grouped = [];
  let lastDay = "";
  events.forEach((e, i) => {
    const dayLabel = formatSAST(e.date, { weekday: "short", day: "numeric", month: "short" });
    if (dayLabel !== lastDay) {
      grouped.push({ day: dayLabel, items: [] });
      lastDay = dayLabel;
    }
    grouped[grouped.length - 1].items.push({ ...e, idx: i });
  });

  return (
    <div className="bg-soft h-full p-[22px] px-[18px]">
      <h2 className="text-[17px] font-bold text-ink mb-1">
        {portal === "member" ? "My calendar" : "Calendar"}
      </h2>
      <p className="text-mute text-xs mb-4">{todayLong()}</p>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-4 border-soft border-t-brand rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <p className="text-mute text-sm leading-relaxed">
          No upcoming events yet. Workshops and tender closing dates appear here automatically.
        </p>
      ) : (
        <div className="space-y-4">
          {grouped.map((g) => (
            <div key={g.day}>
              <div className="text-[11px] font-bold uppercase tracking-wide text-mute mb-2">
                {g.day}
              </div>
              <div className="space-y-2.5">
                {g.items.map((e) => (
                  <div key={e.idx} className="flex items-start gap-3">
                    <time dateTime={e.date} className="w-[48px] shrink-0 whitespace-nowrap text-[13px] font-bold text-ink tabular-nums leading-snug pt-0.5">
                      {formatSASTTime(e.date)}
                    </time>
                    <span
                      className={`w-[3px] self-stretch shrink-0 rounded-full ${RAIL[e.idx % RAIL.length]}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-mute leading-tight mb-0.5">{e.kind}</p>
                      <p className="text-[13px] font-semibold text-ink leading-snug break-words">
                        {e.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}