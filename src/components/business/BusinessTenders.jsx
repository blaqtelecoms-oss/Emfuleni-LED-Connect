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
import { formatRand, formatSAST } from "@/lib/ledUtils";
import { Loader2, Briefcase, Clock } from "lucide-react";

export default function BusinessTenders() {
  const { user } = useAuth();
  const { business } = useLedProfile();
  const { data, loading, reload } = useLedList(() =>
    Promise.all([
      base44.entities.Opportunity.filter({ status: "open", type: "tender" }).catch(() => []),
      base44.entities.OpportunityResponse.filter({ business: business?.id }).catch(() => []),
    ]),
    [business?.id]
  );

  const [active, setActive] = useState(null);
  const [quote, setQuote] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading || !data) return <SectionLoading />;
  const [tenders, responses] = data;

  const responseMap = Object.fromEntries(responses.map((r) => [r.opportunity, r]));
  const isVerified = business?.status === "verified";

  const submit = async (e) => {
    e.preventDefault();
    if (!isVerified) return toast({ title: "Not verified", description: "Your business must be verified before responding to tenders.", variant: "destructive" });
    if (!quote || isNaN(Number(quote))) return toast({ title: "Enter a valid quote amount", variant: "destructive" });
    setBusy(true);
    try {
      await base44.entities.OpportunityResponse.create({
        opportunity: active.id,
        responder: user.id,
        business: business.id,
        quote_amount: Number(quote),
        note: note.trim(),
        status: "new",
      });
      toast({ title: "Quote submitted", description: "Your response has been sent to the LED office." });
      setActive(null);
      setQuote("");
      setNote("");
      reload();
    } catch (e) {
      toast({ title: "Submission failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Tenders" subtitle="Open tenders from the LED office and municipal projects. Submit a quote to respond." />

      {!isVerified && (
        <div className="led-box border-l-4 border-l-tangerine mb-4">
          <b className="text-sm text-ink">Verification required</b>
          <p className="text-mute text-xs mt-0.5">Your business must be verified before you can respond to tenders. Upload compliance documents in your profile.</p>
        </div>
      )}

      {tenders.length === 0 ? (
        <SectionEmpty>No open tenders right now. Check back soon.</SectionEmpty>
      ) : (
        <div className="space-y-2.5">
          {tenders.map((t) => {
            const resp = responseMap[t.id];
            return (
              <div key={t.id} className="led-box flex flex-wrap items-center gap-3 py-3">
                <Briefcase className="w-5 h-5 text-brand flex-none" />
                <div className="min-w-0 flex-1">
                  <b className="text-sm text-ink block">{t.title}</b>
                  <span className="text-xs text-mute">{t.sector || "General"} · Budget {formatRand(t.budget)}</span>
                  {t.closing_date && (
                    <span className="text-xs text-mute flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> Closes {formatSAST(t.closing_date)}
                    </span>
                  )}
                </div>
                {resp ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-mute">Quote: {formatRand(resp.quote_amount)}</span>
                    <StatusPill status={resp.status} />
                  </div>
                ) : (
                  <button onClick={() => setActive(t)} disabled={!isVerified} className="led-btn led-btn-s">
                    Submit quote
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {responses.length > 0 && (
        <div className="mt-6">
          <h2 className="text-[17px] font-bold text-ink mb-2.5">My responses</h2>
          <div className="space-y-2">
            {responses.map((r) => {
              const t = tenders.find((o) => o.id === r.opportunity) || {};
              return (
                <div key={r.id} className="led-box py-3 flex items-center justify-between">
                  <div>
                    <b className="text-sm text-ink block">{t.title || "Tender removed"}</b>
                    <span className="text-xs text-mute">Quote: {formatRand(r.quote_amount)}{r.note ? ` · ${r.note}` : ""}</span>
                  </div>
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
                <DialogDescription>{active.sector} · Budget {formatRand(active.budget)}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                {active.details && <p className="text-sm text-ink">{active.details}</p>}
                <form onSubmit={submit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Your quote amount (R)</label>
                    <input type="number" value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="e.g. 45000" className="led-field" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Note (optional)</label>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Any details about your quote…" className="led-field" />
                  </div>
                  <button type="submit" disabled={busy} className="led-btn flex items-center gap-2">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Submit quote
                  </button>
                </form>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}