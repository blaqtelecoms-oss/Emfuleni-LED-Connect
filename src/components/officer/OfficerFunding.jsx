import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { SectionLoading, SectionEmpty } from "@/components/SectionStates";
import { formatRand } from "@/lib/ledUtils";
import { CHECKLIST_STATUS, CALL_STATUSES } from "@/lib/fundingUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Eye, Check, X, FileText, Loader2, Plus, Pencil, ExternalLink, Landmark, LayoutGrid, ListChecks } from "lucide-react";
import ProgrammeFormDialog from "@/components/officer/ProgrammeFormDialog";

const TABS = [
  { key: "review", label: "To review", filter: (a) => a.status === "submitted" || a.status === "under_review" },
  { key: "approved", label: "Approved", filter: (a) => a.status === "approved" },
  { key: "declined", label: "Declined", filter: (a) => a.status === "declined" },
  { key: "all", label: "All", filter: () => true },
];

const PC = ["bg-brand text-white", "bg-aqua text-ink", "bg-tangerine text-white"];

export default function OfficerFunding() {
  const { user } = useAuth();
  const { data, loading, reload } = useLedList(() =>
    Promise.all([
      base44.entities.FundingApplication.list().catch(() => []),
      base44.entities.Business.list().catch(() => []),
      base44.entities.Program.list().catch(() => []),
    ])
  );
  const [tab, setTab] = useState("review");
  const [active, setActive] = useState(null);
  const [view, setView] = useState("applications");
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [apps, businesses, programs] = data || [[], [], []];
  const bizMap = useMemo(() => Object.fromEntries(businesses.map((b) => [b.id, b])), [businesses]);
  const progMap = useMemo(() => Object.fromEntries(programs.map((p) => [p.id, p])), [programs]);
  const filtered = apps.filter(TABS.find((t) => t.key === tab).filter);

  const programProgress = programs.map((p, i) => {
    const pApps = apps.filter((a) => a.program === p.id);
    const decided = pApps.filter((a) => a.status === "approved" || a.status === "declined").length;
    const total = pApps.length || p.slots_total || 0;
    const pct = total ? Math.round((decided / total) * 100) : 0;
    return { p, decided, total, pct, color: PC[i % PC.length] };
  });

  return (
    <div>
      <PageHeader
        title="Funding"
        subtitle="Manage the programme catalogue and review applications with submitted documents."
        actions={
          view === "catalogue" ? (
            <button onClick={() => { setEditing(null); setShowForm(true); }} className="led-btn flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add programme
            </button>
          ) : null
        }
      />

      {/* View toggle */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setView("applications")} className={`led-chip ${view === "applications" ? "on" : ""}`}>
          <ListChecks className="w-3.5 h-3.5 inline -mt-0.5 mr-1" /> Applications
        </button>
        <button onClick={() => setView("catalogue")} className={`led-chip ${view === "catalogue" ? "on" : ""}`}>
          <LayoutGrid className="w-3.5 h-3.5 inline -mt-0.5 mr-1" /> Catalogue ({programs.length})
        </button>
      </div>

      {view === "catalogue" ? (
        <ProgrammeCatalog programs={programs} progress={programProgress} onEdit={(p) => { setEditing(p); setShowForm(true); }} loading={loading} />
      ) : (
        <>
          {/* Chip tabs */}
          <div className="flex flex-wrap gap-2 items-center mb-4">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`led-chip ${tab === t.key ? "on" : ""}`}>
                {t.label} ({apps.filter(t.filter).length})
              </button>
            ))}
          </div>

          {/* Program progress cards */}
          {programProgress.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 mb-5">
              {programProgress.map(({ p, decided, total, pct, color }) => (
                <div key={p.id} className={`rounded-[14px] p-4 ${color} min-h-[122px] flex flex-col justify-between`}>
                  <b className="text-[17px] leading-tight block">{p.name}</b>
                  <span className="opacity-90 text-xs mt-2 block">
                    {decided} of {total} applications decided · {pct}%
                    <span className="block h-[5px] rounded bg-white/35 mt-1.5 overflow-hidden">
                      <span className="block h-full bg-current" style={{ width: `${pct}%` }} />
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Applications table */}
          {loading ? (
            <SectionLoading />
          ) : filtered.length === 0 ? (
            <SectionEmpty>No applications in this view.</SectionEmpty>
          ) : (
            <div className="led-box overflow-x-auto">
              <table className="w-full border-collapse min-w-[560px]">
                <thead>
                  <tr>
                    {["Business", "Programme", "Request", "Decision"].map((h) => (
                      <th key={h} className="text-left text-mute font-semibold text-xs py-2 px-2 border-b border-line">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => {
                    const decided = a.status === "approved" || a.status === "declined";
                    return (
                      <tr key={a.id}>
                        <td className="py-2.5 px-2 border-b border-line">
                          <b className="text-sm text-ink">{bizMap[a.business]?.name || "Business removed"}</b>
                        </td>
                        <td className="py-2.5 px-2 border-b border-line text-sm text-ink">
                          {progMap[a.program]?.name || "Programme removed"}
                        </td>
                        <td className="py-2.5 px-2 border-b border-line text-sm text-ink">{formatRand(a.requested_amount)}</td>
                        <td className="py-2.5 px-2 border-b border-line">
                          {decided ? <StatusPill status={a.status} /> : <button onClick={() => setActive(a)} className="led-btn led-btn-s">Review</button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <FundingReviewDialog app={active} onClose={() => setActive(null)} bizMap={bizMap} progMap={progMap} user={user} onDecided={reload} />

      {showForm && (
        <ProgrammeFormDialog
          program={editing}
          onSaved={() => { setShowForm(false); setEditing(null); reload(); }}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function ProgrammeCatalog({ programs, progress, onEdit, loading }) {
  if (loading) return <SectionLoading />;
  const progMap = Object.fromEntries(progress.map((x) => [x.p.id, x]));
  if (programs.length === 0) return <SectionEmpty>No programmes yet. Click "Add programme" to create one.</SectionEmpty>;
  return (
    <div className="space-y-2.5">
      {programs.map((p) => {
        const prog = progMap[p.id] || { decided: 0, total: 0 };
        const call = CALL_STATUSES.find((c) => c.key === p.call_status)?.label || p.call_status;
        return (
          <div key={p.id} className="led-box py-3 flex flex-wrap items-center gap-3">
            <Landmark className="w-5 h-5 text-brand flex-none" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <b className="text-sm text-ink">{p.name}</b>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-soft text-mute">{p.funder}</span>
                <span className="text-[10px] text-mute">{call}</span>
              </div>
              <span className="text-xs text-mute">
                {p.funding_type ? `${p.funding_type} · ` : ""}
                {p.max_amount != null ? `Up to ${formatRand(p.max_amount)}` : ""}
                {p.source_verified_at ? ` · verified ${p.source_verified_at}` : ""}
                {` · ${prog.decided}/${prog.total} decided`}
              </span>
            </div>
            {p.source_url && (
              <a href={p.source_url} target="_blank" rel="noreferrer" className="text-brand hover:underline text-xs flex items-center gap-1">
                <ExternalLink className="w-3.5 h-3.5" /> Source
              </a>
            )}
            <button onClick={() => onEdit(p)} className="led-btn led-btn-s led-btn-l flex items-center gap-1">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          </div>
        );
      })}
    </div>
  );
}

function FundingReviewDialog({ app, onClose, bizMap, progMap, user, onDecided }) {
  const [docs, setDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!app) return;
    setNote(app.decision_note || "");
    setLoadingDocs(true);
    base44.entities.BusinessDocument
      .filter({ business: app.business })
      .then((d) => setDocs(d.items ? d.items : d))
      .catch(() => setDocs([]))
      .finally(() => setLoadingDocs(false));
  }, [app]);

  if (!app) return null;
  const program = progMap[app.program];
  const decided = app.status === "approved" || app.status === "declined";
  const attachedIds = new Set(app.attached_documents || []);
  const submittedDocs = docs.filter((d) => attachedIds.has(d.id) || (program?.requirements || []).some((r) => r.type === "document" && r.document_type === d.document_type));
  const formData = app.form_data || {};
  const checklist = app.checklist_snapshot?.items || [];

  const viewDoc = async (doc) => {
    if (!doc.file) {
      toast({ title: "No file attached", description: "This document checklist item has no uploaded file." });
      return;
    }
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: doc.file });
      window.open(signed_url, "_blank");
    } catch (e) {
      toast({ title: "Couldn't open document", description: e.message, variant: "destructive" });
    }
  };

  const decide = async (status) => {
    if (!note.trim()) {
      toast({ title: "Add a decision note", description: "A note is required to approve or decline.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await base44.entities.FundingApplication.update(app.id, {
        status,
        decision_note: note.trim(),
        decided_by: user.id,
        decided_at: new Date().toISOString(),
      });
      toast({ title: status === "approved" ? "Application approved" : "Application declined" });
      onDecided();
      onClose();
    } catch (e) {
      toast({ title: "Decision failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const reopen = async () => {
    setBusy(true);
    try {
      await base44.entities.FundingApplication.update(app.id, { status: "under_review" });
      toast({ title: "Application reopened" });
      onDecided();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!app} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[88vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-line">
          <DialogTitle className="pr-6">{bizMap[app.business]?.name || "Business"}</DialogTitle>
          <DialogDescription>
            {program?.name || "Programme"} · {formatRand(app.requested_amount)}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-5 py-4 space-y-4 text-sm">
          {/* Application form answers */}
          {Object.keys(formData).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Application answers</p>
              <div className="rounded-xl border border-line overflow-hidden">
                {(program?.application_fields || []).filter((f) => formData[f.key] != null && formData[f.key] !== false && formData[f.key] !== "").length === 0 && (
                  <p className="px-3 py-2.5 text-xs text-mute">No structured answers recorded.</p>
                )}
                {(program?.application_fields || []).map((f) => {
                  const val = formData[f.key];
                  if (val == null || val === "" || val === false) return null;
                  return (
                    <div key={f.key} className="flex items-start gap-3 px-3 py-2 border-b border-line last:border-0 bg-shell/40">
                      <b className="text-xs text-ink w-1/2 flex-none">{f.label}</b>
                      <span className="text-xs text-mute">{String(f.type === "checkbox" ? "Yes" : val)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {app.purpose && (
            <div>
              <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-1">Purpose</p>
              <p className="text-ink">{app.purpose}</p>
            </div>
          )}

          {/* Checklist snapshot */}
          {checklist.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Checklist at submission</p>
              <div className="flex flex-wrap gap-1.5">
                {checklist.map((c) => {
                  const cs = CHECKLIST_STATUS[c.status] || CHECKLIST_STATUS.needs_review;
                  return (
                    <span key={c.key} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cs.className}`}>
                      {c.label}: {cs.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-1">Current status</p>
            <StatusPill status={app.status} />
          </div>

          <div>
            <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Submitted documents</p>
            {loadingDocs ? (
              <div className="py-4 text-center"><Loader2 className="w-5 h-5 text-brand animate-spin mx-auto" /></div>
            ) : submittedDocs.length === 0 ? (
              <p className="text-mute">No documents uploaded for this application.</p>
            ) : (
              <ul className="space-y-1.5">
                {submittedDocs.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 p-2 rounded-lg border border-line">
                    <FileText className="w-4 h-4 text-brand shrink-0" />
                    <span className="min-w-0 flex-1 text-xs font-semibold text-ink truncate">{d.type || d.document_type}</span>
                    <StatusPill status={d.status} />
                    <button onClick={() => viewDoc(d)} className="text-brand hover:underline text-xs font-semibold flex items-center gap-1 shrink-0">
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-mute uppercase tracking-wide mb-1.5 block">Decision note</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Explain the decision (visible to the applicant)." className="led-field" />
          </div>

          {!decided ? (
            <div className="flex gap-2">
              <button disabled={busy} onClick={() => decide("approved")} className="led-btn led-btn-s flex items-center gap-1.5"><Check className="w-4 h-4" /> Approve</button>
              <button disabled={busy} onClick={() => decide("declined")} className="led-btn led-btn-r led-btn-s flex items-center gap-1.5"><X className="w-4 h-4" /> Decline</button>
            </div>
          ) : (
            <div className="rounded-xl bg-soft p-3 text-sm">
              <p className="text-ink font-semibold mb-0.5 capitalize">{app.status}</p>
              <p className="text-mute">{app.decision_note || "No note recorded."}</p>
              <button onClick={reopen} disabled={busy} className="text-xs text-brand font-semibold mt-1 hover:underline">Reopen decision</button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}