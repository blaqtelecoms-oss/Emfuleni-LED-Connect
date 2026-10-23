import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLedProfile } from "@/hooks/useLedProfile";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { SectionLoading, SectionEmpty } from "@/components/SectionStates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { formatSAST } from "@/lib/ledUtils";
import { Briefcase, Clock, Loader2, Check } from "lucide-react";

export default function MemberJobs() {
  const { user } = useAuth();
  const { profile } = useLedProfile();
  const { data, loading, reload } = useLedList(() =>
    Promise.all([
      base44.entities.Opportunity.filter({ status: "open", type: "job" }).catch(() => []),
      base44.entities.OpportunityResponse.filter({ responder: user?.id }).catch(() => []),
    ]),
    [user?.id, profile?.id]
  );

  const [active, setActive] = useState(null);
  const [note, setNote] = useState("");
  const [shareProfile, setShareProfile] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");

  if (loading || !data) return <SectionLoading />;
  const [jobs, responses] = data;
  const responseMap = Object.fromEntries(responses.map((r) => [r.opportunity, r]));

  const matched = profile?.skills?.length
    ? jobs.filter((j) => !j.required_skills?.length || j.required_skills.some((s) => profile.skills.includes(s)))
    : [];
  const filtered = filter === "matched" ? matched : jobs;

  const apply = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await base44.entities.OpportunityResponse.create({
        opportunity: active.id,
        responder: user.id,
        note: note.trim(),
        share_skills_profile: shareProfile,
        status: "new",
      });
      toast({ title: "Application sent", description: "The employer will review your application." });
      setActive(null);
      setNote("");
      reload();
    } catch (e) {
      toast({ title: "Application failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Jobs" subtitle="Browse local job vacancies and apply with your skills profile." />

      {matched.length > 0 && (
        <div className="flex gap-2 mb-4">
          <button onClick={() => setFilter("matched")} className={`led-chip ${filter === "matched" ? "on" : ""}`}>Matched ({matched.length})</button>
          <button onClick={() => setFilter("all")} className={`led-chip ${filter === "all" ? "on" : ""}`}>All ({jobs.length})</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <SectionEmpty>No jobs available right now{filter === "matched" ? " matching your skills. Try adding skills to your profile." : "."}</SectionEmpty>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((j) => {
            const resp = responseMap[j.id];
            return (
              <div key={j.id} className="led-box py-3 flex flex-wrap items-center gap-3">
                <Briefcase className="w-5 h-5 text-brand flex-none" />
                <div className="min-w-0 flex-1">
                  <b className="text-sm text-ink block">{j.title}</b>
                  <span className="text-xs text-mute">{j.pay || "Pay TBD"} · {j.sector || "General"} · {j.positions} position{j.positions === 1 ? "" : "s"}</span>
                  {j.closing_date && <span className="text-xs text-mute flex items-center gap-1"><Clock className="w-3 h-3" /> Closes {formatSAST(j.closing_date)}</span>}
                  {j.required_skills?.length > 0 && <span className="text-xs text-mute">Skills: {j.required_skills.join(", ")}</span>}
                </div>
                {resp ? (
                  <div className="flex items-center gap-2">
                    <StatusPill status={resp.status} />
                  </div>
                ) : (
                  <button onClick={() => setActive(j)} className="led-btn led-btn-s">Apply</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {responses.length > 0 && (
        <div className="mt-6">
          <h2 className="text-[17px] font-bold text-ink mb-2.5">My applications</h2>
          <div className="space-y-2">
            {responses.map((r) => {
              const j = jobs.find((o) => o.id === r.opportunity);
              return (
                <div key={r.id} className="led-box py-3 flex items-center justify-between">
                  <b className="text-sm text-ink">{j?.title || "Job removed"}</b>
                  <StatusPill status={r.status} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-md">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>{active.title}</DialogTitle>
                <DialogDescription>{active.pay || "Pay TBD"} · {active.sector || "General"}</DialogDescription>
              </DialogHeader>
              <form onSubmit={apply} className="space-y-3">
                {active.details && <p className="text-sm text-ink">{active.details}</p>}
                <div>
                  <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Note to employer (optional)</label>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Why you're a good fit…" className="led-field" />
                </div>
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" checked={shareProfile} onChange={(e) => setShareProfile(e.target.checked)} className="w-4 h-4 accent-[hsl(var(--green))]" />
                  Share my skills profile with the employer
                </label>
                <button type="submit" disabled={busy} className="led-btn flex items-center gap-2">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Apply
                </button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}