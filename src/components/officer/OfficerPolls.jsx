import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import { SectionLoading, SectionEmpty } from "@/components/SectionStates";
import { toast } from "@/components/ui/use-toast";
import { Plus, Vote, Loader2, X, Check } from "lucide-react";

export default function OfficerPolls() {
  const { data, loading, reload } = useLedList(() =>
    Promise.all([
      base44.entities.Poll.list().catch(() => []),
      base44.entities.PollOption.list().catch(() => []),
      base44.entities.PollVote.list().catch(() => []),
    ])
  );

  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [busy, setBusy] = useState(false);

  if (loading || !data) return <SectionLoading />;
  const [polls, allOptions, allVotes] = data;

  const setOption = (i, v) => setOptions((o) => o.map((x, idx) => (idx === i ? v : x)));

  const create = async (e) => {
    e.preventDefault();
    if (!question.trim()) return toast({ title: "Question is required", variant: "destructive" });
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (opts.length < 2) return toast({ title: "At least 2 options required", variant: "destructive" });
    setBusy(true);
    try {
      const poll = await base44.entities.Poll.create({ question: question.trim(), status: "open" });
      await base44.entities.PollOption.bulkCreate(opts.map((label) => ({ poll: poll.id, label })));
      toast({ title: "Poll created" });
      setShowForm(false);
      setQuestion("");
      setOptions(["", ""]);
      reload();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const closePoll = async (p) => {
    try {
      await base44.entities.Poll.update(p.id, { status: "closed" });
      toast({ title: "Poll closed" });
      reload();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Polls"
        subtitle="Create community polls and review results."
        actions={<button onClick={() => setShowForm(true)} className="led-btn flex items-center gap-1.5"><Plus className="w-4 h-4" /> New poll</button>}
      />

      {polls.length === 0 ? (
        <SectionEmpty>No polls yet.</SectionEmpty>
      ) : (
        <div className="space-y-3">
          {polls.map((p) => {
            const opts = allOptions.filter((o) => o.poll === p.id);
            const votes = allVotes.filter((v) => v.poll === p.id);
            const total = votes.length;
            return (
              <div key={p.id} className="led-box">
                <div className="flex items-center justify-between mb-3">
                  <b className="text-sm text-ink flex items-center gap-2"><Vote className="w-4 h-4 text-brand" /> {p.question}</b>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-mute">{total} vote{total === 1 ? "" : "s"}</span>
                    {p.status === "open" && <button onClick={() => closePoll(p)} className="led-btn led-btn-s led-btn-l">Close</button>}
                    {p.status === "closed" && <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-soft text-mute">closed</span>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  {opts.map((o) => {
                    const count = votes.filter((v) => v.option === o.id).length;
                    const pct = total ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={o.id} className="relative rounded-lg border border-line p-2.5 overflow-hidden">
                        <div className="absolute inset-0 bg-soft" style={{ width: `${pct}%` }} />
                        <div className="relative flex items-center justify-between">
                          <span className="text-sm text-ink">{o.label}</span>
                          <span className="text-xs text-mute">{count} ({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-shell rounded-2xl p-5 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[17px] font-bold text-ink">New poll</h2>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-mute" /></button>
            </div>
            <form onSubmit={create} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Question</label>
                <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. What should the LED office prioritise?" className="led-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Options</label>
                <div className="space-y-2">
                  {options.map((o, i) => (
                    <input key={i} value={o} onChange={(e) => setOption(i, e.target.value)} placeholder={`Option ${i + 1}`} className="led-field" />
                  ))}
                </div>
                {options.length < 6 && (
                  <button type="button" onClick={() => setOptions((o) => [...o, ""])} className="text-xs text-brand font-semibold mt-2 hover:underline">+ Add option</button>
                )}
              </div>
              <button type="submit" disabled={busy} className="led-btn flex items-center gap-2">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Create poll
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}