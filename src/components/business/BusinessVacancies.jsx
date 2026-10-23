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
import { Loader2, Plus, Users, X } from "lucide-react";

const SECTORS = ["Retail", "Food", "Trades", "Services", "Agriculture", "Manufacturing"];
const toLocalInput = (d) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function BusinessVacancies() {
  const { user } = useAuth();
  const { business } = useLedProfile();
  const { data, loading, reload } = useLedList(() =>
    Promise.all([
      base44.entities.Opportunity.filter({}).catch(() => []),
      base44.entities.OpportunityResponse.filter({}).catch(() => []),
    ]),
    [business?.id]
  );

  const [showForm, setShowForm] = useState(false);
  const [viewApplicants, setViewApplicants] = useState(null);
  const [form, setForm] = useState({
    title: "", details: "", pay: "", sector: SECTORS[0], positions: 1, required_skills: "", closing_date: toLocalInput(new Date(Date.now() + 14 * 86400000)),
  });
  const [busy, setBusy] = useState(false);

  if (loading || !data) return <SectionLoading />;
  const [allOpps, allResponses] = data;

  const myVacancies = allOpps.filter((o) => o.business === business?.id && o.type === "job");
  const responseMap = Object.fromEntries(
    myVacancies.map((v) => [v.id, allResponses.filter((r) => r.opportunity === v.id)])
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const post = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast({ title: "Job title is required", variant: "destructive" });
    setBusy(true);
    try {
      await base44.entities.Opportunity.create({
        type: "job",
        title: form.title.trim(),
        details: form.details.trim(),
        pay: form.pay.trim(),
        sector: form.sector,
        positions: Number(form.positions) || 1,
        required_skills: form.required_skills.split(",").map((s) => s.trim()).filter(Boolean),
        closing_date: new Date(form.closing_date).toISOString(),
        posted_by_type: "business",
        business: business.id,
        status: "pending_approval",
      });
      toast({ title: "Vacancy submitted", description: "An LED officer will review and publish your vacancy." });
      setShowForm(false);
      setForm({ ...form, title: "", details: "", pay: "", required_skills: "" });
      reload();
    } catch (e) {
      toast({ title: "Failed to post vacancy", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const closeVacancy = async (v) => {
    try {
      await base44.entities.Opportunity.update(v.id, { status: "closed" });
      toast({ title: "Vacancy closed" });
      reload();
    } catch (e) {
      toast({ title: "Failed to close", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Vacancies"
        subtitle="Post job vacancies for LED approval, then review applicants."
        actions={<button onClick={() => setShowForm(true)} className="led-btn flex items-center gap-1.5"><Plus className="w-4 h-4" /> Post vacancy</button>}
      />

      {myVacancies.length === 0 ? (
        <SectionEmpty>No vacancies posted yet. Click "Post vacancy" to create your first.</SectionEmpty>
      ) : (
        <div className="space-y-2.5">
          {myVacancies.map((v) => {
            const applicants = responseMap[v.id] || [];
            return (
              <div key={v.id} className="led-box py-3 flex flex-wrap items-center gap-3">
                <Users className="w-5 h-5 text-brand flex-none" />
                <div className="min-w-0 flex-1">
                  <b className="text-sm text-ink block">{v.title}</b>
                  <span className="text-xs text-mute">
                    {v.positions} position{v.positions === 1 ? "" : "s"} · {v.pay || "Pay TBD"}
                    {v.closing_date && ` · Closes ${formatSAST(v.closing_date)}`}
                  </span>
                </div>
                <span className="text-xs text-mute">{applicants.length} applicant{applicants.length === 1 ? "" : "s"}</span>
                <StatusPill status={v.status} />
                <button onClick={() => setViewApplicants({ vacancy: v, applicants })} className="led-btn led-btn-s led-btn-l">
                  View applicants
                </button>
                {v.status === "open" && (
                  <button onClick={() => closeVacancy(v)} className="led-btn led-btn-r led-btn-s flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Close
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(o) => !o && setShowForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Post a vacancy</DialogTitle>
            <DialogDescription>Your vacancy will be reviewed by an LED officer before going live.</DialogDescription>
          </DialogHeader>
          <form onSubmit={post} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Job title</label>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Shop assistant" className="led-field" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Details</label>
              <textarea value={form.details} onChange={(e) => set("details", e.target.value)} rows={2} placeholder="Role description…" className="led-field" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Pay</label>
                <input value={form.pay} onChange={(e) => set("pay", e.target.value)} placeholder="e.g. R 4,000/mo" className="led-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Positions</label>
                <input type="number" value={form.positions} onChange={(e) => set("positions", e.target.value)} min="1" className="led-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Sector</label>
                <select value={form.sector} onChange={(e) => set("sector", e.target.value)} className="led-field">
                  {SECTORS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Closing date</label>
                <input type="datetime-local" value={form.closing_date} onChange={(e) => set("closing_date", e.target.value)} className="led-field" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Required skills (comma-separated)</label>
              <input value={form.required_skills} onChange={(e) => set("required_skills", e.target.value)} placeholder="e.g. welding, forklift" className="led-field" />
            </div>
            <button type="submit" disabled={busy} className="led-btn flex items-center gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Submit for approval
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewApplicants} onOpenChange={(o) => !o && setViewApplicants(null)}>
        <DialogContent className="max-w-md">
          {viewApplicants && (
            <>
              <DialogHeader>
                <DialogTitle>Applicants — {viewApplicants.vacancy.title}</DialogTitle>
                <DialogDescription>{viewApplicants.applicants.length} application{viewApplicants.applicants.length === 1 ? "" : "s"}</DialogDescription>
              </DialogHeader>
              {viewApplicants.applicants.length === 0 ? (
                <p className="text-mute text-sm">No applications yet.</p>
              ) : (
                <div className="space-y-2">
                  {viewApplicants.applicants.map((a) => (
                    <div key={a.id} className="led-box py-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <b className="text-sm text-ink">{a.responder === user.id ? "You" : "Applicant"}</b>
                        <StatusPill status={a.status} />
                      </div>
                      {a.quote_amount != null && <span className="text-xs text-mute">Expected pay: R {a.quote_amount}</span>}
                      {a.note && <p className="text-xs text-mute mt-0.5">{a.note}</p>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}