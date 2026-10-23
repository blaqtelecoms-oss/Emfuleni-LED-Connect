import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import { SectionLoading, SectionEmpty } from "@/components/SectionStates";
import { toast } from "@/components/ui/use-toast";
import { formatSAST } from "@/lib/ledUtils";
import { Lightbulb, Check, CheckCircle2 } from "lucide-react";

export default function OfficerIdeas() {
  const { data, loading, reload } = useLedList(() => base44.entities.Idea.list().catch(() => []));
  const [filter, setFilter] = useState("new");

  if (loading) return <SectionLoading />;
  const ideas = (data || []).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const filtered = filter === "new" ? ideas.filter((i) => i.status === "new") : ideas;

  const markReviewed = async (idea) => {
    try {
      await base44.entities.Idea.update(idea.id, { status: "reviewed" });
      toast({ title: "Marked as reviewed" });
      reload();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader title="Ideas" subtitle="Review ideas submitted by community members." />

      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilter("new")} className={`led-chip ${filter === "new" ? "on" : ""}`}>New ({ideas.filter((i) => i.status === "new").length})</button>
        <button onClick={() => setFilter("all")} className={`led-chip ${filter === "all" ? "on" : ""}`}>All ({ideas.length})</button>
      </div>

      {filtered.length === 0 ? (
        <SectionEmpty><Lightbulb className="w-8 h-8 text-mute mx-auto mb-2" />No ideas{filter === "new" ? " to review" : ""}.</SectionEmpty>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((idea) => (
            <div key={idea.id} className="led-box py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">{idea.text}</p>
                  <span className="text-xs text-mute mt-1 block">{formatSAST(idea.created_date)}</span>
                </div>
                <div className="flex items-center gap-2 flex-none">
                  {idea.status === "reviewed" ? (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#d9efe0] text-[#14532b] flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> reviewed</span>
                  ) : (
                    <button onClick={() => markReviewed(idea)} className="led-btn led-btn-s led-btn-l flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Review</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}