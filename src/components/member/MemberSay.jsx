import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import { SectionLoading, SectionEmpty } from "@/components/SectionStates";
import { toast } from "@/components/ui/use-toast";
import { Vote, Lightbulb, Loader2, Check } from "lucide-react";

export default function MemberSay() {
  const { user } = useAuth();
  const { data, loading, reload } = useLedList(() =>
    Promise.all([
      base44.entities.Poll.filter({ status: "open" }).catch(() => []),
      base44.entities.PollOption.filter({}).catch(() => []),
      base44.entities.PollVote.filter({ user: user?.id }).catch(() => []),
      base44.entities.Idea.filter({}).catch(() => []),
    ]),
    [user?.id]
  );

  const [idea, setIdea] = useState("");
  const [busy, setBusy] = useState(false);
  const [voting, setVoting] = useState(null);

  if (loading || !data) return <SectionLoading />;
  const [polls, allOptions, myVotes, ideas] = data;
  const myVoteMap = Object.fromEntries(myVotes.map((v) => [v.poll, v.option]));

  const vote = async (pollId, optionId) => {
    if (myVoteMap[pollId]) return toast({ title: "Already voted", description: "You can only vote once per poll." });
    setVoting(optionId);
    try {
      await base44.entities.PollVote.create({ poll: pollId, option: optionId, user: user.id });
      toast({ title: "Vote recorded" });
      reload();
    } catch (e) {
      toast({ title: "Vote failed", description: e.message, variant: "destructive" });
    } finally {
      setVoting(null);
    }
  };

  const submitIdea = async (e) => {
    e.preventDefault();
    if (!idea.trim()) return;
    setBusy(true);
    try {
      await base44.entities.Idea.create({ user: user.id, text: idea.trim(), status: "new" });
      toast({ title: "Idea submitted", description: "Thank you for sharing your idea with the LED office." });
      setIdea("");
      reload();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const myIdeas = ideas.filter((i) => i.user === user?.id || i.created_by_id === user?.id);

  return (
    <div>
      <PageHeader title="Have your say" subtitle="Vote in community polls and share your ideas with the LED office." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <h2 className="text-[17px] font-bold text-ink mb-2.5 flex items-center gap-2"><Vote className="w-5 h-5 text-brand" /> Open polls</h2>
          {polls.length === 0 ? (
            <SectionEmpty>No open polls right now.</SectionEmpty>
          ) : (
            <div className="space-y-3">
              {polls.map((p) => {
                const opts = allOptions.filter((o) => o.poll === p.id);
                const voted = myVoteMap[p.id];
                return (
                  <div key={p.id} className="led-box">
                    <b className="text-sm text-ink block mb-2">{p.question}</b>
                    <div className="space-y-1.5">
                      {opts.map((o) => {
                        const isVoted = voted === o.id;
                        return (
                          <button
                            key={o.id}
                            onClick={() => vote(p.id, o.id)}
                            disabled={!!voted || voting === o.id}
                            className={`w-full text-left p-2.5 rounded-lg border transition-colors flex items-center justify-between ${
                              isVoted ? "border-brand bg-soft" : "border-line hover:border-brand/40"
                            } ${voted ? "cursor-default" : "cursor-pointer"}`}
                          >
                            <span className="text-sm text-ink">{o.label}</span>
                            {isVoted && <Check className="w-4 h-4 text-brand" />}
                          </button>
                        );
                      })}
                    </div>
                    {voted && <p className="text-xs text-mute mt-2">Thank you for voting.</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-[17px] font-bold text-ink mb-2.5 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-brand" /> Share an idea</h2>
          <form onSubmit={submitIdea} className="led-box space-y-3">
            <textarea value={idea} onChange={(e) => setIdea(e.target.value)} rows={4} placeholder="What would make Emfuleni better?" className="led-field" />
            <button type="submit" disabled={busy} className="led-btn flex items-center gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
              Submit idea
            </button>
          </form>

          {myIdeas.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-bold text-ink mb-2">My ideas</h3>
              <div className="space-y-2">
                {myIdeas.map((i) => (
                  <div key={i.id} className="led-box py-2.5 flex items-center justify-between">
                    <span className="text-sm text-ink">{i.text}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${i.status === "reviewed" ? "bg-[#d9efe0] text-[#14532b]" : "bg-[#fbeccb] text-[#6b4d00]"}`}>
                      {i.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}