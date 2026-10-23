import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { SectionLoading, SectionEmpty } from "@/components/SectionStates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { formatRand, formatSAST } from "@/lib/ledUtils";
import { Loader2, Plus, Briefcase, Check, X, Users } from "lucide-react";

const toLocalInput = (d) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function OfficerOpportunities() {
  const { user } = useAuth();
  const { data, loading, reload } = useLedList(() =>
    Promise.all([
      base44.entities.Opportunity.list().catch(() => []),
      base44.entities.OpportunityResponse.list().catch(() => []),
      base44.entities.Business.list().catch(() => []),
    ])
  );

  const [showForm, setShowForm] = useState(false);
  const [viewResponses, setViewResponses] = useState(null);
  const [form, setForm] = useState({
    type: "tender", title: "", details: "", budget: "", pay: "", sector: "", positions: 1, closing_date: toLocalInput(new Date(Date.now() + 14 * 86400000)), required_skills: "",
  });
  const [busy, setBusy] = useState(false);

  if (loading || !data) return <SectionLoading />;
  const [opps, responses, businesses] = data;
  const bizMap = Object.fromEntries(businesses.map((b) => [b.id, b]));
  const responseMap = Object.fromEntries(opps.map((o) => [o.id, responses.filter((r) => r.opportunity === o.id)]));

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const create = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast({ title: "Title is required", variant: "destructive" });
    setBusy(true);
    try {
      await base44.entities.Opportunity.create({
        type: form.type,
        title: form.title.trim(),
        details: form.details.trim(),
        budget: form.budget ? Number(form.budget) : null,
        pay: form.pay.trim(),
        sector: form.sector.trim(),
        positions: Number(form.positions) || 1,
        closing_date: new Date(form.closing_date).toISOString(),
        required_skills: form.required_skills.split(",").map((s) => s.trim()).filter(Boolean),
        posted_by_type: "led",
        status: "open",
      });
      toast({ title: "Opportunity published" });
      setShowForm(false);
      setForm({ ...form, title: "", details: "", budget: "", pay: "", required_skills: "" });
      reload();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const approve = async (o) => {
    try {
      await base44.entities.Opportunity.update(o.id, { status: "open" });
      toast({ title: "Vacancy approved", description: o.title });
      reload();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const close = async (o) => {
    try {
      await base44.entities.Opportunity.update(o.id, { status: "closed" });
      toast({ title: "Opportunity closed" });
      reload();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const decideResponse = async (r, status) => {
    try {
      await base44.entities.OpportunityResponse.update(r.id, { status, decided_by: user.id });
      toast({ title: `Response ${status === "shortlisted" ? "shortlisted" : status === "hired_or_awarded" ? "awarded" : "rejected"}` });
      // refresh the responses inside the dialog too
      setViewResponses((v) => v && {
        vacancy: v.vacancy,
        applicants: v.applicants.map((a) => (a.id === r.id ? { ...a, status } : a)),
      });
      reload();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Tenders & jobs"
        subtitle="Publish LED tenders and jobs, approve business vacancies, and shortlist responders."
        actions={<button onClick={() => setShowForm(true)} className="led-btn flex items-center gap-1.5"><Plus className="w-4 h-4" /> New opportunity</button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <div className="rounded-[12px] bg-soft p-3"><b className="text-[22px] font-bold text-ink block leading-none">{opps.filter((o) => o.status === "open").length}</b><span className="text-mute text-xs">Open</span></div>
        <div className="rounded-[12px] bg-soft p-3"><b className="text-[22px] font-bold text-ink block leading-none">{opps.filter((o) => o.status === "pending_approval").length}</b><span className="text-mute text-xs">Pending approval</span></div>
        <div className="rounded-[12px] bg-soft p-3"><b className="text-[22px] font-bold text-ink block leading-none">{opps.filter((o) => o.type === "tender").length}</b><span className="text-mute text-xs">Tenders</span></div>
        <div className="rounded-[12px] bg-soft p-3"><b className="text-[22px] font-bold text-ink block leading-none">{opps.filter((o) => o.type === "job").length}</b><span className="text-mute text-xs">Jobs</span></div>
      </div>

      {opps.length === 0 ? (
        <SectionEmpty>No opportunities yet. Click "New opportunity" to create one.</SectionEmpty>
      ) : (
        <div className="space-y-2.5">
          {opps.map((o) => {
            const apps = responseMap[o.id] || [];
            return (
              <div key={o.id} className="led-box py-3 flex flex-wrap items-center gap-3">
                <Briefcase className="w-5 h-5 text-brand flex-none" />
                <div className="min-w-0 flex-1">
                  <b className="text-sm text-ink block">{o.title}</b>
                  <span className="text-xs text-mute">
                    {o.type === "tender" ? "Tender" : "Job"}
                    {o.posted_by_type === "business" && bizMap[o.business] ? ` · ${bizMap[o.business].name}` : " · LED"}
                    {o.budget ? ` · ${formatRand(o.budget)}` : o.pay ? ` · ${o.pay}` : ""}
                    {o.closing_date && ` · Closes ${formatSAST(o.closing_date)}`}
                  </span>
                </div>
                {apps.length > 0 && <span className="text-xs text-mute flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {apps.length}</span>}
                <StatusPill status={o.status} />
                {o.status === "pending_approval" ? (
                  <button onClick={() => approve(o)} className="led-btn led-btn-s flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Approve</button>
                ) : o.status === "open" ? (
                  <button onClick={() => close(o)} className="led-btn led-btn-r led-btn-s">Close</button>
                ) : null}
                {apps.length > 0 && (
                  <button onClick={() => setViewResponses({ vacancy: o, applicants: apps })} className="led-btn led-btn-s led-btn-l">Review</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showForm} onOpenChange={(o) => !o && setShowForm(false)}>
        <DialogContent className="max-w-md max-h-[88vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-line">
            <DialogTitle>New opportunity</DialogTitle>
            <DialogDescription>Publish a tender or job vacancy to the community.</DialogDescription>
          </DialogHeader>
          <form onSubmit={create} className="flex flex-col min-h-0 flex-1">
            <div className="overflow-y-auto px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Type</label>
                  <select value={form.type} onChange={(e) => set("type", e.target.value)} className="led-field">
                    <option value="tender">Tender</option>
                    <option value="job">Job</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">{form.type === "tender" ? "Budget (R)" : "Positions"}</label>
                  <input
                    type="number"
                    value={form.type === "tender" ? form.budget : form.positions}
                    onChange={(e) => set(form.type === "tender" ? "budget" : "positions", e.target.value)}
                    className="led-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Title</label>
                <input value={form.title} onChange={(e) => set("title", e.target.value)} className="led-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Details</label>
                <textarea value={form.details} onChange={(e) => set("details", e.target.value)} rows={2} className="led-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Sector</label>
                  <input value={form.sector} onChange={(e) => set("sector", e.target.value)} className="led-field" />
                </div>
                {form.type === "job" && (
                  <div>
                    <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Pay</label>
                    <input value={form.pay} onChange={(e) => set("pay", e.target.value)} placeholder="e.g. R 4,000/mo" className="led-field" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Closing date</label>
                <input type="datetime-local" value={form.closing_date} onChange={(e) => set("closing_date", e.target.value)} className="led-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Required skills (comma-separated)</label>
                <input value={form.required_skills} onChange={(e) => set("required_skills", e.target.value)} className="led-field" />
              </div>
            </div>
            <div className="px-5 py-3 border-t border-line bg-shell/60">
              <button type="submit" disabled={busy} className="led-btn w-full flex items-center justify-center gap-2">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Publish
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Review responses dialog */}
      <Dialog open={!!viewResponses} onOpenChange={(o) => !o && setViewResponses(null)}>
        <DialogContent className="max-w-lg">
          {viewResponses && (
            <>
              <DialogHeader>
                <DialogTitle>{viewResponses.vacancy.title}</DialogTitle>
                <DialogDescription>{viewResponses.applicants.length} response{viewResponses.applicants.length === 1 ? "" : "s"}</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 max-h-[60vh] overflow-auto">
                {viewResponses.applicants.map((r) => (
                  <div key={r.id} className="led-box py-3">
                    <div className="flex items-center justify-between mb-1">
                      <b className="text-sm text-ink">{bizMap[r.business]?.name || "Applicant"}</b>
                      <StatusPill status={r.status} />
                    </div>
                    {r.quote_amount != null && <span className="text-xs text-mute">Quote: {formatRand(r.quote_amount)}</span>}
                    {r.note && <p className="text-xs text-mute mt-0.5">{r.note}</p>}
                    {r.status === "new" && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => decideResponse(r, "shortlisted")} className="led-btn led-btn-s flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Shortlist</button>
                        <button onClick={() => decideResponse(r, "hired_or_awarded")} className="led-btn led-btn-s led-btn-l">Award</button>
                        <button onClick={() => decideResponse(r, "rejected")} className="led-btn led-btn-r led-btn-s flex items-center gap-1"><X className="w-3.5 h-3.5" /> Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}